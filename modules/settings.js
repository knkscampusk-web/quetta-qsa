// 관리 › 연결 설정 (관리자만)
//  · 매년 개강 때 바뀌는 외부 연결 주소(Apps Script 웹 앱 등)를 코드 수정 없이 여기서 바꿉니다.
//  · 저장 위치: qsa_settings/links  { <key>: { url, updatedAt, updatedBy } }
//  · 쓰기는 관리자만, 읽기는 그 주소를 쓰는 메뉴 권한이 있는 계정만 (firestore.rules)
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LINKS_DOC = ["qsa_settings", "links"];
const APPS_SCRIPT_RE = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

// 여기에 항목을 추가하면 화면에 칸이 생깁니다 (규칙의 허용 키도 함께 추가)
export const LINKS = [
  {
    key: "certRoster",
    label: "증명서 명단 · 정규 마스터 Apps Script",
    hint: "정규 마스터 시트 안의 Apps Script(cert_roster.gs)를 웹 앱으로 배포한 주소. 매년 새 마스터 사본에서 다시 배포한 뒤 여기 주소를 바꿉니다.",
    test: true,
  },
];

export async function getLink(db, key) {
  const s = await getDoc(doc(db, ...LINKS_DOC));
  return s.exists() ? (s.data()[key]?.url || "") : "";
}

export async function mount(el, ctx) {
  const { db, profile, auth } = ctx;
  el.innerHTML = `
    <section class="card">
      <div class="card-head dark"><h2>연결 설정</h2></div>
      <div class="card-body">
        <p class="muted" style="color:var(--ink-2);line-height:1.7">매년 개강 때 바뀌는 연결 주소를 관리합니다. 새 마스터 사본에서 Apps Script를 다시 배포한 뒤, 새 주소를 붙여넣고 저장하세요. 코드 수정이나 GitHub 업로드는 필요 없습니다.</p>
      </div>
    </section>
    <div data-list></div>`;
  const list = el.querySelector("[data-list]");

  let data = {};
  try {
    const s = await getDoc(doc(db, ...LINKS_DOC));
    data = s.exists() ? s.data() : {};
  } catch (e) {
    list.innerHTML = `<p class="notice notice-error">설정을 불러오지 못했습니다 (${e.code || e.message}). 보안 규칙 게시 여부를 확인하세요.</p>`;
    return;
  }

  for (const item of LINKS) {
    const cur = data[item.key] || {};
    const card = document.createElement("section");
    card.className = "card";
    card.innerHTML = `
      <div class="card-head"><h2></h2></div>
      <div class="card-body">
        <p class="muted" data-hint style="margin-bottom:var(--s3);line-height:1.6"></p>
        <div class="toolbar" style="margin-bottom:var(--s2)">
          <input class="input" data-url style="flex:1;min-width:280px" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off">
          <button class="btn" data-save type="button">저장</button>
          ${item.test ? '<button class="btn btn-line" data-test type="button">연결 확인</button>' : ""}
        </div>
        <p class="muted" data-meta style="font-size:13px"></p>
        <p class="muted" data-msg style="font-size:13px;margin-top:var(--s1)"></p>
      </div>`;
    card.querySelector("h2").textContent = item.label;
    card.querySelector("[data-hint]").textContent = item.hint;
    const input = card.querySelector("[data-url]");
    input.value = cur.url || "";
    const meta = card.querySelector("[data-meta]");
    const msg = card.querySelector("[data-msg]");
    const say = (t, err = false) => { msg.textContent = t; msg.style.color = err ? "var(--danger)" : ""; };
    const showMeta = (c) => {
      meta.textContent = c?.url ? `마지막 변경 ${c.updatedAt?.toDate?.().toLocaleString("ko-KR") || "-"} · ${c.updatedBy || ""}` : "아직 저장된 주소가 없습니다.";
    };
    showMeta(cur);

    card.querySelector("[data-save]").onclick = async (ev) => {
      const url = input.value.trim();
      if (!APPS_SCRIPT_RE.test(url)) return say("Apps Script 웹 앱 주소 형식이 아닙니다. 'https://script.google.com/macros/s/…/exec' 형태인지 확인해 주세요.", true);
      if (cur.url && cur.url !== url && !confirm("주소를 바꾸면 이 주소를 쓰는 화면이 바로 새 시트를 읽습니다. 저장할까요?")) return;
      ev.currentTarget.disabled = true;
      try {
        const next = { url, updatedAt: serverTimestamp(), updatedBy: profile.email };
        await setDoc(doc(db, ...LINKS_DOC), { [item.key]: next }, { merge: true });
        const s = await getDoc(doc(db, ...LINKS_DOC));
        Object.assign(cur, s.data()[item.key]);
        showMeta(cur);
        say("저장했습니다.");
      } catch (e) {
        say(`저장하지 못했습니다 (${e.code || e.message}).`, true);
      } finally {
        ev.currentTarget.disabled = false;
      }
    };

    const testBtn = card.querySelector("[data-test]");
    if (testBtn) testBtn.onclick = async () => {
      const url = input.value.trim();
      if (!APPS_SCRIPT_RE.test(url)) return say("주소 형식을 먼저 확인해 주세요.", true);
      testBtn.disabled = true;
      say("연결 확인 중…");
      try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch(url, { method: "POST", body: JSON.stringify({ idToken }) });
        const d = await res.json();
        if (!d.ok) throw new Error(d.error || "응답 오류");
        const active = (d.students || []).filter((x) => x.status === "재원").length;
        say(`연결 성공 · 탭 '${d.tab}' · 학생 ${(d.students || []).length}명 (재원 ${active}명). 저장은 따로 눌러야 합니다.`);
      } catch (e) {
        say(`연결 실패: ${e.message}`, true);
      } finally {
        testBtn.disabled = false;
      }
    };
    list.append(card);
  }
}
