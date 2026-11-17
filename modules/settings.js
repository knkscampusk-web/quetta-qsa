// 관리 › 연결 설정 (관리자만) — 연결 주소 + 증명서 직인
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

  // ── 직인 (증명서용) ──
  const SEAL_DOC = ["qsa_settings", "seal"];
  const MAX_BYTES = 600 * 1024;
  const seal = document.createElement("section");
  seal.className = "card";
  seal.innerHTML = `
    <div class="card-head"><h2>증명서 직인</h2></div>
    <div class="card-body">
      <p class="muted" style="margin-bottom:var(--s3);line-height:1.6">직인 이미지는 공개 주소에 두지 않고 QSA DB에 보관합니다. 증명서 권한이 있는 계정만 불러올 수 있습니다. 배경이 투명한 PNG를 권장합니다(600KB 이하).</p>
      <div style="display:flex;gap:var(--s5);align-items:center;flex-wrap:wrap">
        <div style="width:120px;height:120px;border:1px dashed var(--line);border-radius:var(--r-sm);display:grid;place-items:center;background:rgba(255,255,255,.7)">
          <img data-seal-img alt="직인 미리보기" style="max-width:110px;max-height:110px;display:none">
          <span class="muted" data-seal-empty style="font-size:12px">없음</span>
        </div>
        <div>
          <label style="display:block;font-size:13px;color:var(--ink-2);margin-bottom:var(--s1)">직인 이미지 파일 선택 (PNG 권장)</label>
          <input type="file" class="input" style="height:auto;padding:8px;max-width:340px" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" data-seal-file>
          <p class="muted" data-seal-meta style="font-size:13px;margin-top:var(--s2)"></p>
          <p class="muted" data-seal-msg style="font-size:13px;margin-top:var(--s1)"></p>
        </div>
      </div>
    </div>`;
  list.append(seal);
  const img = seal.querySelector("[data-seal-img]");
  const empty = seal.querySelector("[data-seal-empty]");
  const smeta = seal.querySelector("[data-seal-meta]");
  const smsg = seal.querySelector("[data-seal-msg]");
  const showSeal = (d) => {
    if (d?.dataUrl) { img.src = d.dataUrl; img.style.display = "block"; empty.style.display = "none"; }
    smeta.textContent = d?.dataUrl ? `마지막 변경 ${d.updatedAt?.toDate?.().toLocaleString("ko-KR") || "-"} · ${d.updatedBy || ""}` : "아직 등록된 직인이 없습니다.";
  };
  seal.querySelector("[data-seal-file]").addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    ev.target.value = "";
    smsg.style.color = "";
    if (!file) { smsg.textContent = "선택된 파일이 없습니다."; return; }
    smsg.textContent = `파일 확인 중… (${file.name}, ${Math.round(file.size / 1024)}KB, 형식: ${file.type || "알 수 없음"})`;
    const okType = /^image\/(png|jpeg|webp)$/.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!okType) { smsg.textContent = "PNG·JPG·WEBP 이미지만 올릴 수 있습니다."; smsg.style.color = "var(--danger)"; return; }
    if (file.size > MAX_BYTES) { smsg.textContent = "600KB 이하 이미지로 올려주세요."; smsg.style.color = "var(--danger)"; return; }
    let dataUrl = "";
    try {
      dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
    } catch (e) { smsg.textContent = `파일을 읽지 못했습니다 (${e?.message || e}).`; smsg.style.color = "var(--danger)"; return; }
    // 확장자로만 판별된 경우(형식 정보 없음) 저장 형식을 맞춰줌
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      dataUrl = `data:${mime};base64,` + dataUrl.split(",")[1];
    }
    if (!confirm("이 이미지를 증명서 직인으로 저장할까요? 기존 직인은 바뀝니다.")) { smsg.textContent = "취소했습니다."; return; }
    smsg.textContent = "저장 중… (몇 초 걸릴 수 있습니다)";
    try {
      await setDoc(doc(db, ...SEAL_DOC), { dataUrl, updatedAt: serverTimestamp(), updatedBy: profile.email });
      const s = await getDoc(doc(db, ...SEAL_DOC));
      showSeal(s.data());
      smsg.textContent = "저장했습니다. 증명서 화면을 다시 열면 적용됩니다.";
    } catch (e) {
      smsg.textContent = `저장하지 못했습니다 (${e.code || e.message}).`;
      smsg.style.color = "var(--danger)";
    }
  });
  smeta.textContent = "불러오는 중…";
  getDoc(doc(db, ...SEAL_DOC))
    .then((s) => showSeal(s.exists() ? s.data() : null))
    .catch((e) => { smeta.textContent = `불러오지 못했습니다 (${e.code || e.message}).`; });
}
