// 증명서 발급 › 기존 이력 가져오기
// 원본(quetta-2ea94, 전입신고 관리 앱)의 증명서 발급 이력·설정을 "읽기만" 해서
//   ① JSON 백업 파일로 내려받고  ② QSA Firestore 로 복사합니다.
// 원본에는 어떤 쓰기·삭제도 하지 않습니다 (이 파일에 원본 쓰기 코드가 없음).
// 원본 규칙상 증명서 이력은 직원 계정만 읽을 수 있어서, 원본 앱의 직원 계정으로 잠깐 로그인해 읽고 바로 로그아웃합니다.
// 입력한 비밀번호는 Firebase 로그인에만 쓰고 어디에도 저장하지 않습니다.
import {
  getAuth, signInWithEmailAndPassword, signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, setDoc, writeBatch,
  getCountFromServer, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getLinkedApp } from "../core/firebase.js";

// 옮길 컬렉션. 팀 비밀번호 해시(config/gate)는 QSA 에서 쓰지 않으므로 복사하지 않습니다.
const COLLECTIONS = ["certificates", "certConfig"];
const SKIP = {};
const META = ["qsa_meta", "cert_import"];

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
      <div class="card-head dark"><h2>증명서 기존 이력 가져오기</h2></div>
      <div class="card-body">
        <p class="muted" style="color:var(--ink-2);line-height:1.7">
          기존 전입신고 관리 앱의 <b>증명서 발급 이력과 설정(과정·발급번호·메일)</b>을 QSA로 <b>복사</b>합니다. 발급번호가 이어지도록 실제 발급 전에 한 번 실행하세요. 원본은 읽기만 하며, 원본 데이터와 기존 앱은 그대로 남습니다.<br>
          순서: <b>직원 계정 입력 → ① 원본 불러오기 → ② 백업 받기 → ③ QSA로 복사</b>. 비밀번호는 로그인에만 쓰고 저장하지 않으며, 읽기가 끝나면 바로 로그아웃합니다. 백업을 받아야 복사 버튼이 열립니다.
        </p>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>진행</h2></div>
      <div class="card-body">
        <div class="toolbar">
          <input class="input" data-src-email type="email" placeholder="원본 앱 직원 이메일 (공용 계정 권장)" autocomplete="off" style="width:260px">
          <input class="input" data-src-pw type="password" placeholder="비밀번호" autocomplete="off" style="width:180px">
        </div>
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
      out[name] = (await getCountFromServer(collection(db, name))).data().count;
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
      const email = el.querySelector("[data-src-email]").value.trim();
      const pwEl = el.querySelector("[data-src-pw]");
      if (!email || !pwEl.value) throw Object.assign(new Error("원본 앱 직원 이메일과 비밀번호를 입력해 주세요"), { code: "입력 필요" });
      const app = getLinkedApp("enroll");
      srcAuth = getAuth(app);
      if (srcAuth.currentUser) await signOut(srcAuth);          // 다른 세션(익명 등)이 있으면 정리
      await signInWithEmailAndPassword(srcAuth, email, pwEl.value);
      pwEl.value = "";                                           // 화면에서도 바로 지움
      const srcDb = getFirestore(app);
      source = {};
      for (const name of COLLECTIONS) {
        log(`${name} 읽는 중…`);
        const snap = await getDocs(collection(srcDb, name));
        source[name] = snap.docs
          .filter((d) => !SKIP[name]?.has(d.id))
          .map((d) => ({ id: d.id, data: d.data() }));
      }
      await signOut(srcAuth);                                    // 다 읽었으면 원본 접속 종료
      backedUp = false;
      renderRows(await qsaCounts().catch(() => ({})));
      btn("backup").disabled = false;
      btn("copy").disabled = true;
      log("원본을 불러왔습니다. 다음으로 백업을 받아주세요.");
    } catch (e) {
      console.error(e);
      if (srcAuth?.currentUser) signOut(srcAuth);
      const hint = /invalid-credential|wrong-password|user-not-found|invalid-email/.test(e.code || "")
        ? " 이메일·비밀번호를 확인해 주세요."
        : (e.code === "permission-denied" ? " 이 계정이 원본 앱에서 직원(staff)으로 승인돼 있는지 확인해 주세요." : "");
      log(`원본을 불러오지 못했습니다 (${e.code || e.message}).${hint}`, true);
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
    a.download = `증명서_원본백업_${stamp}.json`;
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
          batch.set(doc(db, name, id), data);
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
