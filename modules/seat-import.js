// 좌석 배정 › 데이터 가져오기
// 원본(quetta-seating)의 좌석 데이터를 "읽기만" 해서
//   ① JSON 백업 파일로 내려받고  ② QSA Firestore 로 복사합니다.
// 원본에는 어떤 쓰기·삭제도 하지 않습니다 (이 파일에 원본 쓰기 코드가 없음).
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { linkSignIn } from "../core/auth.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, setDoc, writeBatch,
  getCountFromServer, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getLinkedApp } from "../core/firebase.js";

// 옮길 컬렉션. 팀 비밀번호 해시(config/gate)는 QSA 에서 쓰지 않으므로 복사하지 않습니다.
// 원본 → QSA 이름 (원본 'quetta/state' 문서는 QSA 'seat_state/current' 로)
const COLLECTIONS = ["quetta", "quetta_snapshots", "quetta_logs"];
const RENAME = { quetta: "seat_state", quetta_snapshots: "seat_snapshots", quetta_logs: "seat_logs" };
const DOC_RENAME = { quetta: { state: "current" } };
const SKIP = {};
const META = ["qsa_meta", "seat_import"];

// 배치 한도: 문서 400개 또는 약 8MB 단위로 나눠 씁니다.
const BATCH_DOCS = 400;
const BATCH_BYTES = 8 * 1024 * 1024;

export async function mount(el, ctx) {
  const { db, user } = ctx;
  let source = null;   // { name: [{id, data}] }
  let backedUp = false;
  let srcAuth = null;

  el.innerHTML = `
    <section class="card">
      <div class="card-head dark"><h2>좌석 배정 데이터 가져오기</h2></div>
      <div class="card-body">
        <p class="muted" style="color:var(--ink-2);line-height:1.7">
          기존 좌석배치 앱의 강의실·배치·지난 배치·작업 기록을 QSA로 <b>복사</b>합니다. 원본 앱에서 승인된 계정(QSA와 같은 Google 계정)으로 연결합니다. 원본은 읽기만 하며, 원본 데이터와 기존 앱은 그대로 남습니다.<br>
          순서: <b>① 원본 불러오기 → ② 백업 받기 → ③ QSA로 복사</b>. 백업을 받아야 복사 버튼이 열립니다.
        </p>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>진행</h2></div>
      <div class="card-body">
        <div class="toolbar">
          <button class="btn" data-act="load"><i data-lucide="download-cloud"></i>① 원본 불러오기</button>
          <button class="btn btn-line" data-act="backup" disabled><i data-lucide="file-down"></i>② 백업 받기 (JSON)</button>
          <button class="btn" data-act="copy" disabled><i data-lucide="copy"></i>③ QSA로 복사</button>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th class="left">컬렉션</th><th>원본 문서 수</th><th>QSA 문서 수</th><th>상태</th></tr></thead>
            <tbody data-rows></tbody>
          </table>
        </div>
        <p class="muted" data-log style="margin-top:var(--s4)"></p>
      </div>
    </section>

    <section class="card" data-users hidden>
      <div class="card-head"><h2>원본의 승인 사용자</h2></div>
      <div class="card-body">
        <p class="muted" style="margin-bottom:var(--s3)"></p>
        <div class="table-wrap"><table class="table"><thead><tr><th>소속</th><th>이름</th><th class="left">이메일</th></tr></thead><tbody></tbody></table></div>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>마지막 복사 기록</h2></div>
      <div class="card-body"><p class="muted" data-meta>불러오는 중…</p></div>
    </section>`;
  window.lucide?.createIcons();

  const $ = (s) => el.querySelector(s);
  const btn = (a) => el.querySelector(`[data-act="${a}"]`);
  const log = (msg, isErr = false) => {
    const p = $("[data-log]");
    p.textContent = msg;
    p.style.color = isErr ? "var(--danger)" : "";
  };

  function renderRows(qsaCounts = {}, states = {}) {
    const tb = $("[data-rows]");
    tb.replaceChildren();
    for (const name of COLLECTIONS) {
      const tr = document.createElement("tr");
      const srcN = source ? source[name].length : "-";
      const qsaN = qsaCounts[name] ?? "-";
      const st = states[name] || (source ? "불러옴" : "대기");
      const cls = st === "일치" ? "done" : st === "불러옴" ? "next" : "";
      tr.innerHTML = `<td class="left"></td><td></td><td></td><td><span class="badge ${cls}"></span></td>`;
      tr.children[0].textContent = name;
      tr.children[1].textContent = srcN;
      tr.children[2].textContent = qsaN;
      tr.querySelector(".badge").textContent = st;
      tb.append(tr);
    }
  }

  async function qsaCounts() {
    const out = {};
    for (const name of COLLECTIONS) {
      out[name] = (await getCountFromServer(collection(db, RENAME[name] || name))).data().count;
    }
    return out;
  }

  async function showMeta() {
    try {
      const s = await getDoc(doc(db, ...META));
      const m = s.data();
      $("[data-meta]").textContent = m?.copiedAt
        ? `${m.copiedAt.toDate().toLocaleString("ko-KR")} · ${m.by} · ${Object.entries(m.counts || {}).map(([k, v]) => `${k} ${v}건`).join(", ")}`
        : "아직 복사한 기록이 없습니다.";
    } catch (e) {
      $("[data-meta]").textContent = `기록을 읽지 못했습니다 (${e.code}). 보안 규칙에 qsa_meta 가 추가됐는지 확인하세요.`;
    }
  }

  // ① 원본 불러오기 (읽기 전용, 기존 앱과 같은 익명 접속)
  btn("load").addEventListener("click", async () => {
    btn("load").disabled = true;
    log("원본에 접속하는 중…");
    try {
      const app = getLinkedApp("seating");
      srcAuth = getAuth(app);
      await srcAuth.authStateReady();
      if (!srcAuth.currentUser || srcAuth.currentUser.email?.toLowerCase() !== ctx.profile.email) await linkSignIn(app);
      const srcDb = getFirestore(app);
      source = {};
      for (const name of COLLECTIONS) {
        log(`${name} 읽는 중…`);
        const snap = await getDocs(collection(srcDb, name));
        source[name] = snap.docs
          .filter((d) => !SKIP[name]?.has(d.id))
          .map((d) => ({ id: d.id, data: d.data() }));
      }
      try {
        const us = await getDocs(collection(srcDb, "quetta_users"));
        const approved = us.docs.map((d) => d.data()).filter((u) => u.approved);
        const box = el.querySelector("[data-users]");
        box.hidden = false;
        box.querySelector("p").textContent = `원본에서 승인된 사용자 ${approved.length}명 — QSA '설정 › 계정 관리'에서 '좌석 배정'을 체크해 등록하세요.`;
        const tb = box.querySelector("tbody"); tb.replaceChildren();
        approved.sort((a, b) => (a.affiliation || "").localeCompare(b.affiliation || "", "ko")).forEach((u) => {
          const tr = document.createElement("tr");
          tr.innerHTML = "<td></td><td></td><td class='left'></td>";
          tr.children[0].textContent = u.affiliation || "-";
          tr.children[1].textContent = u.realname || u.name || "-";
          tr.children[2].textContent = (u.email || "").toLowerCase();
          tb.append(tr);
        });
      } catch (e) { console.warn("[승인 사용자 목록]", e.code || e.message); }
      backedUp = false;
      renderRows(await qsaCounts().catch(() => ({})));
      btn("backup").disabled = false;
      btn("copy").disabled = true;
      log("원본을 불러왔습니다. 다음으로 백업을 받아주세요.");
    } catch (e) {
      console.error(e);
      log(`원본을 불러오지 못했습니다 (${e.code || e.message}).`, true);
    } finally {
      btn("load").disabled = false;
    }
  });

  // ② 백업 받기
  btn("backup").addEventListener("click", () => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    const blob = new Blob([JSON.stringify({ project: "quetta-2ea94", exportedAt: new Date().toISOString(), source }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `좌석배정_원본백업_${stamp}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    backedUp = true;
    btn("copy").disabled = false;
    log("백업 파일을 내려받았습니다. 파일이 저장됐는지 확인한 뒤 복사를 진행하세요.");
  });

  // ③ QSA로 복사 (같은 문서 ID로 덮어쓰기 = 다시 복사해도 중복이 생기지 않음)
  btn("copy").addEventListener("click", async () => {
    if (!source || !backedUp) return;
    const total = COLLECTIONS.reduce((n, c) => n + source[c].length, 0);
    if (!confirm(`QSA에 ${total}건을 복사합니다.\nQSA 쪽에 같은 문서가 있으면 원본 내용으로 덮어씁니다.\n(원본은 바뀌지 않습니다)\n\n진행할까요?`)) return;

    btn("copy").disabled = true;
    btn("load").disabled = true;
    try {
      let batch = writeBatch(db), ops = 0, bytes = 0, done = 0;
      const flush = async () => {
        if (!ops) return;
        await batch.commit();
        batch = writeBatch(db); ops = 0; bytes = 0;
      };
      for (const name of COLLECTIONS) {
        for (const { id, data } of source[name]) {
          const size = JSON.stringify(data).length;
          if (ops >= BATCH_DOCS || bytes + size > BATCH_BYTES) await flush();
          batch.set(doc(db, RENAME[name] || name, DOC_RENAME[name]?.[id] || id), data);
          ops++; bytes += size; done++;
          if (done % 50 === 0) log(`복사 중… ${done} / ${total}`);
        }
      }
      await flush();

      const counts = await qsaCounts();
      const states = {};
      for (const name of COLLECTIONS) states[name] = counts[name] >= source[name].length ? "일치" : "확인 필요";
      renderRows(counts, states);

      await setDoc(doc(db, ...META), {
        copiedAt: serverTimestamp(),
        by: user.email.toLowerCase(),
        counts: Object.fromEntries(COLLECTIONS.map((c) => [c, source[c].length])),
      });
      await showMeta();
      log(Object.values(states).every((s) => s === "일치")
        ? `복사 완료 (${total}건). 원본과 문서 수가 일치합니다.`
        : "복사는 끝났지만 문서 수가 다른 컬렉션이 있습니다. 표를 확인하세요.", Object.values(states).some((s) => s !== "일치"));
    } catch (e) {
      console.error(e);
      log(`복사 중 오류가 났습니다 (${e.code || e.message}). 이미 복사된 문서는 다시 복사하면 덮어써집니다.`, true);
      btn("copy").disabled = false;
    } finally {
      btn("load").disabled = false;
    }
  });

  renderRows();
  showMeta();

  // 메뉴를 떠나면 원본 익명 세션 종료
  ctx.track(() => { if (srcAuth?.currentUser) signOut(srcAuth); });
}
