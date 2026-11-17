// 관리 › 계정 관리 (관리자만)
//  · 계정 = qsa_admins/{이메일 소문자}  { name, dept, role, menus, updatedAt, updatedBy }
//  · 관리자(admin): 전체 메뉴 + 계정 관리 / 일반(member): 체크한 메뉴만
//  · 본인 계정은 여기서 수정·삭제할 수 없음 (실수로 관리자 권한을 잃는 것 방지, 콘솔에서만)
//  · 실제 권한 검사는 firestore.rules 가 같은 기준으로 합니다
import {
  collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { grantableMenus, permOf } from "../core/config.js";

const DEPT_SUGGEST = ["교무", "행정", "경영지원", "상담", "생활관리"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function mount(el, ctx) {
  const { db, profile } = ctx;
  const me = profile.email;
  const menuOpts = grantableMenus.map((m) => ({ key: permOf(m), label: m.label, ready: m.ready }))
    .filter((m, i, arr) => arr.findIndex((x) => x.key === m.key) === i);
  const labelOf = (key) => menuOpts.find((m) => m.key === key)?.label || key;
  let accounts = [];
  let editing = null; // 수정 중인 이메일

  el.innerHTML = `
    <section class="card">
      <div class="card-head dark"><h2 data-form-title>계정 추가</h2></div>
      <div class="card-body">
        <div class="acc-grid">
          <label class="acc-field"><span>Google 이메일</span>
            <input class="input" data-f="email" type="email" placeholder="name@gmail.com" autocomplete="off"></label>
          <label class="acc-field"><span>이름 (또는 대표 계정명)</span>
            <input class="input" data-f="name" maxlength="50" placeholder="예: 홍길동 / 상담팀 대표"></label>
          <label class="acc-field"><span>부서</span>
            <input class="input" data-f="dept" maxlength="30" list="acc-depts" placeholder="예: 경영지원"></label>
          <label class="acc-field"><span>역할</span>
            <select class="select" data-f="role">
              <option value="member">일반 (지정 메뉴만)</option>
              <option value="admin">관리자 (전체 메뉴 + 계정 관리)</option>
            </select></label>
        </div>
        <datalist id="acc-depts"></datalist>

        <div class="acc-menus">
          <div class="acc-menus-head"><b>허용 메뉴</b><span class="muted" data-menus-hint>체크한 메뉴만 보이고 사용할 수 있습니다.</span></div>
          <div class="acc-checks" data-checks></div>
        </div>

        <div class="toolbar" style="margin:var(--s5) 0 0">
          <button class="btn" data-act="save" type="button"><i data-lucide="user-plus"></i><span>계정 추가</span></button>
          <button class="btn btn-line" data-act="cancel" type="button" hidden>수정 취소</button>
          <span class="muted" data-msg></span>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>계정 목록</h2><span class="muted" data-count></span></div>
      <div class="card-body">
        <div class="table-wrap">
          <table class="table">
            <thead><tr>
              <th>부서</th><th>이름</th><th class="left">이메일</th><th>역할</th><th class="left">허용 메뉴</th><th>관리</th>
            </tr></thead>
            <tbody data-rows><tr><td colspan="6" class="muted">불러오는 중…</td></tr></tbody>
          </table>
        </div>
        <p class="muted" style="margin-top:var(--s3);font-size:13px">본인 계정은 여기서 바꿀 수 없습니다. 퇴사·부서 이동 시에는 해당 계정을 삭제하면 바로 접근이 막힙니다.</p>
      </div>
    </section>

    <style>
      .acc-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s3); }
      .acc-field { display: flex; flex-direction: column; gap: var(--s1); font-size: 13px; color: var(--ink-2); }
      .acc-field .input, .acc-field .select { width: 100%; }
      .acc-menus { margin-top: var(--s5); padding: var(--s4); border: 1px solid var(--line); border-radius: var(--r-sm); background: rgba(255,255,255,.5); }
      .acc-menus-head { display: flex; gap: var(--s3); align-items: baseline; margin-bottom: var(--s3); font-size: 14px; }
      .acc-checks { display: flex; flex-wrap: wrap; gap: var(--s2); }
      .acc-check { display: inline-flex; align-items: center; gap: var(--s2); height: 34px; padding: 0 var(--s3);
        border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,.75); font-size: 13px; cursor: pointer; }
      .acc-check:has(input:checked) { border-color: var(--teal); background: var(--teal-soft); color: var(--teal-ink); font-weight: 600; }
      .acc-check small { color: var(--ink-3); font-weight: 400; }
      .acc-menus.is-admin { opacity: .5; pointer-events: none; }
      .acc-tags { display: flex; flex-wrap: wrap; gap: var(--s1); white-space: normal; }
      .acc-row-me td { background: rgba(255,255,255,.6); font-weight: 600; }
      .acc-actions { display: inline-flex; gap: var(--s1); }
      @media (max-width: 900px) { .acc-grid { grid-template-columns: 1fr 1fr; } }
    </style>`;
  window.lucide?.createIcons();

  const $ = (s) => el.querySelector(s);
  const f = (k) => el.querySelector(`[data-f="${k}"]`);
  const msg = (t, err = false) => { const m = $("[data-msg]"); m.textContent = t; m.style.color = err ? "var(--danger)" : ""; };

  // 메뉴 체크박스
  const checks = $("[data-checks]");
  for (const m of menuOpts) {
    const lab = document.createElement("label");
    lab.className = "acc-check";
    lab.innerHTML = `<input type="checkbox"><span></span>${m.ready ? "" : "<small>준비 중</small>"}`;
    lab.querySelector("input").value = m.key;
    lab.querySelector("span").textContent = m.label;
    checks.append(lab);
  }
  const syncRole = () => {
    const admin = f("role").value === "admin";
    $(".acc-menus").classList.toggle("is-admin", admin);
    $("[data-menus-hint]").textContent = admin ? "관리자는 모든 메뉴를 볼 수 있어 따로 고르지 않습니다." : "체크한 메뉴만 보이고 사용할 수 있습니다.";
  };
  f("role").addEventListener("change", syncRole);

  function resetForm() {
    editing = null;
    f("email").value = ""; f("email").disabled = false;
    f("name").value = ""; f("dept").value = ""; f("role").value = "member";
    checks.querySelectorAll("input").forEach((c) => { c.checked = false; });
    $("[data-form-title]").textContent = "계정 추가";
    $('[data-act="save"] span').textContent = "계정 추가";
    $('[data-act="cancel"]').hidden = true;
    syncRole();
  }

  function fillForm(a) {
    msg("");
    editing = a.id;
    f("email").value = a.id; f("email").disabled = true;
    f("name").value = a.name || ""; f("dept").value = a.dept || "";
    f("role").value = a.role === "admin" ? "admin" : "member";
    const set = new Set(a.menus || []);
    checks.querySelectorAll("input").forEach((c) => { c.checked = set.has(c.value); });
    $("[data-form-title]").textContent = `계정 수정 · ${a.id}`;
    $('[data-act="save"] span').textContent = "변경 저장";
    $('[data-act="cancel"]').hidden = false;
    syncRole();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderList() {
    const tb = $("[data-rows]");
    tb.replaceChildren();
    $("[data-count]").textContent = `${accounts.length}개`;
    // 부서 제안 목록 갱신
    const dl = el.querySelector("#acc-depts");
    dl.replaceChildren();
    [...new Set([...DEPT_SUGGEST, ...accounts.map((a) => a.dept).filter(Boolean)])].forEach((d) => {
      const o = document.createElement("option"); o.value = d; dl.append(o);
    });

    for (const a of accounts) {
      const isMe = a.id === me;
      const tr = document.createElement("tr");
      if (isMe) tr.className = "acc-row-me";
      tr.innerHTML = `<td></td><td></td><td class="left"></td><td></td><td class="left"><div class="acc-tags"></div></td>
        <td><span class="acc-actions"></span></td>`;
      tr.children[0].textContent = a.dept || "-";
      tr.children[1].textContent = a.name || "-";
      tr.children[2].textContent = a.id;
      const roleB = document.createElement("span");
      roleB.className = `badge ${a.role === "admin" ? "done" : "next"}`;
      roleB.textContent = a.role === "admin" ? "관리자" : "일반";
      tr.children[3].append(roleB);
      const tags = tr.querySelector(".acc-tags");
      if (a.role === "admin") {
        tags.textContent = "전체";
      } else if (!(a.menus || []).length) {
        tags.innerHTML = '<span class="muted">없음</span>';
      } else {
        for (const k of a.menus) {
          const t = document.createElement("span"); t.className = "badge"; t.textContent = labelOf(k); tags.append(t);
        }
      }
      const act = tr.querySelector(".acc-actions");
      if (isMe) {
        act.innerHTML = '<span class="badge done">본인</span>';
      } else {
        const ed = document.createElement("button");
        ed.className = "btn btn-line btn-sm"; ed.textContent = "수정";
        ed.onclick = () => fillForm(a);
        const del = document.createElement("button");
        del.className = "btn btn-danger btn-sm"; del.textContent = "삭제";
        del.onclick = () => remove(a);
        act.append(ed, del);
      }
      tb.append(tr);
    }
  }

  async function load() {
    try {
      const snap = await getDocs(collection(db, "qsa_admins"));
      accounts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((x, y) => (x.dept || "힣").localeCompare(y.dept || "힣", "ko") || (x.name || "").localeCompare(y.name || "", "ko"));
      renderList();
    } catch (e) {
      console.error(e);
      $("[data-rows]").innerHTML = `<tr><td colspan="6" style="color:var(--danger)">목록을 불러오지 못했습니다 (${e.code || e.message}). 보안 규칙 게시와 본인 계정의 role(admin)을 확인하세요.</td></tr>`;
    }
  }

  async function save() {
    const email = (editing || f("email").value).trim().toLowerCase();
    const name = f("name").value.trim();
    const dept = f("dept").value.trim();
    const role = f("role").value === "admin" ? "admin" : "member";
    const menus = role === "admin" ? [] : [...checks.querySelectorAll("input:checked")].map((c) => c.value);

    if (!EMAIL_RE.test(email)) return msg("이메일 형식을 확인해 주세요.", true);
    if (email === me) return msg("본인 계정은 여기서 바꿀 수 없습니다.", true);
    if (!name) return msg("이름(또는 대표 계정명)을 입력해 주세요.", true);
    if (!dept) return msg("부서를 입력해 주세요.", true);
    if (!editing && accounts.some((a) => a.id === email)) return msg("이미 등록된 이메일입니다. 목록에서 수정을 눌러주세요.", true);
    if (role === "member" && !menus.length && !confirm("허용 메뉴가 하나도 없습니다. 이 계정은 홈 화면만 보게 됩니다. 저장할까요?")) return;
    if (role === "admin" && !confirm(`${email} 계정을 관리자로 지정합니다.\n관리자는 모든 메뉴와 계정 관리를 사용할 수 있습니다. 진행할까요?`)) return;

    const btn = $('[data-act="save"]');
    btn.disabled = true;
    try {
      await setDoc(doc(db, "qsa_admins", email), {
        name, dept, role, menus, updatedAt: serverTimestamp(), updatedBy: me,
      });
      msg(editing ? "변경했습니다." : "추가했습니다. 이제 이 계정으로 로그인할 수 있습니다.");
      resetForm();
      await load();
    } catch (e) {
      console.error(e);
      msg(`저장하지 못했습니다 (${e.code || e.message}).`, true);
    } finally {
      btn.disabled = false;
    }
  }

  async function remove(a) {
    if (!confirm(`${a.name || a.id} (${a.id}) 계정을 삭제합니다.\n삭제하면 바로 QSA에 로그인할 수 없습니다. 진행할까요?`)) return;
    try {
      await deleteDoc(doc(db, "qsa_admins", a.id));
      if (editing === a.id) resetForm();
      msg("삭제했습니다.");
      await load();
    } catch (e) {
      console.error(e);
      msg(`삭제하지 못했습니다 (${e.code || e.message}).`, true);
    }
  }

  $('[data-act="save"]').addEventListener("click", save);
  $('[data-act="cancel"]').addEventListener("click", () => { resetForm(); msg(""); });
  resetForm();
  await load();
}
