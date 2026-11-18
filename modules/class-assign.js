// 인원관리 › 반배정
//  · 개강 전 대량 배정: 신규생 엑셀 → 규칙대로 "초안" 자동 생성 → 사람이 고침
//  · 개강 후 수시 배정: 점수는 참고, 계열(K/S)은 맞추고 자리 있는 반·생활반 추천
//  · 정원: 전체 → 수학반 → 생활반(조) 을 늘 보여줌
//  · 사람이 정한 학생은 "고정" → 자동 배정을 다시 눌러도 그대로
//  · 저장: QSA DB classa_state/current (문서 1개), 변경 기록 classa_log
//  · 계산 규칙은 class-assign/engine.js 한 곳에만 (화면과 분리)
import {
  doc, getDoc, setDoc, addDoc, collection, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as E from "./class-assign/engine.js";

const SEASONS = [["zero", "시즌제로"], ["regular", "정규시즌"]];   // 시즌·연도마다 명단과 배정 기준을 따로 저장
const stateRef = (db, key) => doc(db, "classa_state", key);
const XLSX_URL = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
const COL_HINTS = {   // 원본과 같은 열 이름 단서
  sid: ["수험번호"], inq1: ["탐구1"], inq2: ["탐구2"], name: ["성명", "이름"], exam: ["구분"],
  mathtype: ["수학(선택)"], math: ["백분위수학", "백분위 수학"], kortype: ["국어(선택)"], korean: ["백분위국어", "백분위 국어"],
  eng: ["등급영", "등급 영"], gender: ["성별"], mathtype_new: ["수학선택"], kortype_new: ["국어선택"], nonsul: ["논술"], hankuksa: ["한국사"], jeonhyeong: ["전형방법", "전형"],
};
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function loadXLSX() {
  if (window.XLSX) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = XLSX_URL; s.onload = res; s.onerror = () => rej(new Error("엑셀 도구를 불러오지 못했습니다")); document.head.append(s); });
}
const normExam = (v) => { const s = String(v || ""); return s.includes("9") ? "9월" : s.includes("6") ? "6월" : "수능"; };
const normMath = (v) => { const s = String(v || "").replace(/\s/g, ""); return s.includes("확률") || s.includes("확통") ? "확률과통계" : s.includes("기하") ? "기하" : "미적분"; };
const normKor = (v) => { const s = String(v || ""); return s.includes("화작") || s.includes("화법") ? "화작" : "언매"; };
const num = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Number(v));

export async function mount(el, ctx) {
  const { db, profile } = ctx;
  let st = { students: [], base: {}, startSid: "", config: null, rules: null };
  const thisYear = new Date().getFullYear();
  let seasonKey = `${thisYear}_regular`;
  let view = "main";
  let dirty = false, saveTimer = null, loadedAt = null;
  let filter = { cls: "", q: "", only: "" };

  el.innerHTML = `
    <section class="card">
      <div class="card-head dark"><h2>시즌</h2><span class="muted" data-save style="color:rgba(255,255,255,.75)"></span></div>
      <div class="card-body">
        <div class="filters">
          <select class="select" data-season-year aria-label="연도">${[thisYear - 1, thisYear, thisYear + 1].map((y) => `<option ${y === thisYear ? "selected" : ""}>${y}</option>`).join("")}</select>
          <select class="select" data-season-kind aria-label="시즌">${SEASONS.map(([k, l]) => `<option value="${k}" ${k === "regular" ? "selected" : ""}>${l}</option>`).join("")}</select>
          <button class="btn btn-line" type="button" data-act="rules">배정 기준 설정</button>
          <span class="ca-note" data-rules-note></span>
        </div>
      </div>
    </section>

    <div data-view-rules hidden></div>
    <div data-view-main>
    <section class="card">
      <div class="card-head"><h2>반별 인원</h2></div>
      <div class="card-body" data-cap></div>
    </section>

    <section class="card">
      <div class="card-head"><h2>개강 전 대량 배정</h2></div>
      <div class="card-body">
        <div class="ca-drops">
          <div class="ca-drop" data-drop="base"><b>① 지난 결과 CSV</b><span>재원생 인원(수학반·생활반·탐구·영어)을 정원에 반영합니다. 여기에 끌어다 놓기</span><em data-base-info></em></div>
          <div class="ca-drop" data-drop="new"><b>② 신규생 엑셀</b><span>학생을 명단에 추가합니다. 여기에 끌어다 놓기</span><em data-new-info></em></div>
        </div>
        <div class="toolbar" style="margin:var(--s4) 0 0">
          <button class="btn" type="button" data-act="auto">초안 자동 배정 (고정 제외)</button>
          <button class="btn btn-line" type="button" data-act="redo">고정 안 한 학생 다시 배정</button>
          <label class="muted" style="font-size:13px;display:flex;gap:6px;align-items:center">시작 학번 <input class="input" data-sid style="width:110px"></label>
          <button class="btn btn-line" type="button" data-act="sid">학번 채우기</button>
          <button class="btn btn-line" type="button" data-act="csv">결과 CSV 내보내기</button>
          <button class="btn btn-danger" type="button" data-act="clear" style="margin-left:auto">명단 비우기</button>
        </div>
        <p class="muted" data-msg style="font-size:13px;margin-top:var(--s3)"></p>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>학생 명단</h2><span class="muted" data-count></span></div>
      <div class="card-body">
        <div class="filters" style="margin-bottom:var(--s3)">
          <select class="select" data-f="only"><option value="">전체</option><option value="wait">배정 대기</option><option value="warn">경고 있음</option><option value="lock">고정</option><option value="new">이번 신규(미고정)</option></select>
          <select class="select" data-f="cls"><option value="">모든 수학반</option></select>
          <input class="input" data-f="q" placeholder="이름·수험번호 검색" style="width:200px">
          <button class="btn btn-line btn-sm" type="button" data-act="add">수시 배정: 학생 1명 추가</button>
        </div>
        <div class="table-wrap" style="max-height:62vh;overflow:auto">
          <table class="table ca-table">
            <thead><tr><th>고정</th><th class="left">이름</th><th>전형</th><th>수학 변환</th><th>점수상 반</th><th>수학반</th><th>생활반</th><th class="left">과목반 (국어·수학·영어)</th><th>탐구</th><th class="left">메모·경고</th></tr></thead>
            <tbody data-rows></tbody>
          </table>
        </div>
      </div>
    </section>

    </div>
    <style>
      .ca-drops{ display:grid; grid-template-columns:1fr 1fr; gap:var(--s3); }
      .ca-drop{ border:1.5px dashed rgba(0,178,190,.45); border-radius:var(--r-md); padding:var(--s4); background:rgba(255,255,255,.45); display:flex; flex-direction:column; gap:4px; font-size:13px; color:var(--ink-2); }
      .ca-drop b{ color:var(--ink); font-size:14px; } .ca-drop em{ font-style:normal; color:var(--teal-strong); font-weight:600; }
      .ca-drop.is-drag{ background:var(--teal-soft); border-color:var(--teal); }
      .ca-table td{ white-space:nowrap; } .ca-table td.left{ white-space:normal; min-width:160px; }
      .ca-table td.left:nth-child(8){ min-width:240px; }
      .ca-table select{ height:30px; font-size:13px; padding:0 22px 0 8px; border-radius:8px; }
      .ca-warn{ color:var(--danger); font-size:12px; } .ca-note{ color:var(--ink-3); font-size:12px; }
      .ca-sug{ display:inline-flex; gap:4px; flex-wrap:wrap; margin-top:4px; }
      .ca-cap th, .ca-cap td{ padding:6px 8px !important; text-align:center; font-size:13px; }
      .ca-cap th.t{ font-weight:600; font-size:12px; line-height:1.35; }
      .ca-cap td.off{ background:rgba(35,31,32,.06); }
      .ca-cap td.hr{ font-weight:800; color:var(--ink); }
      .ca-cap td.tot{ font-weight:800; color:#434E89; } .ca-cap td.tot .cap{ font-weight:500; font-size:11px; color:var(--ink-3); }
      .ca-cap td.over{ color:var(--danger) !important; font-weight:800; }
      .ca-cap tr.sum td{ background:rgba(236,250,251,.9); font-weight:800; }
      .ca-cap tr.wait td{ color:var(--ink-2); }
      .ca-cap .ca-in{ height:28px; padding:0 6px; font-size:12px; text-align:center; }

      @media (max-width:900px){ .ca-drops{ grid-template-columns:1fr; } }
    </style>`;

  const $ = (q) => el.querySelector(q);
  const msg = (t, err = false) => { const m = $("[data-msg]"); m.textContent = t; m.style.color = err ? "var(--danger)" : ""; };

  // ── 저장 ──
  async function save() {
    try {
      const cur = await getDoc(stateRef(db, seasonKey));
      const remote = cur.exists() ? cur.data() : null;
      if (remote && loadedAt && remote.updatedAt?.toMillis?.() > loadedAt && remote.updatedBy !== profile.email) {
        if (!confirm(`${remote.updatedBy} 님이 그사이 반배정을 수정했습니다. 지금 화면 내용으로 덮어쓸까요?\n(취소하면 새로고침해서 최신 내용을 보세요)`)) return;
      }
      const clean = st.students.map(({ classes, ...rest }) => rest);
      await setDoc(stateRef(db, seasonKey), { students: clean, base: st.base || {}, startSid: st.startSid || "", config: st.config || null, rules: st.rules || null, updatedAt: serverTimestamp(), updatedBy: profile.email });
      const d = await getDoc(stateRef(db, seasonKey)); loadedAt = d.data().updatedAt?.toMillis?.() || Date.now();
      dirty = false;
      $("[data-save]").textContent = `저장됨 ${new Date().toLocaleTimeString("ko-KR")}`;
    } catch (e) {
      console.error(e);
      $("[data-save]").textContent = `저장 실패 (${e.code || e.message})`;
    }
  }
  const touch = () => { dirty = true; $("[data-save]").textContent = "저장 중…"; clearTimeout(saveTimer); saveTimer = setTimeout(save, 1200); };
  const log = (s, from, to, what) => addDoc(collection(db, "classa_log"), { at: serverTimestamp(), by: profile.email, sid: s.sid || "", name: s.name || "", what, from: from || "", to: to || "" }).catch(() => {});

  // ── 반 설정 (반코드·담임·강의실) — 해마다 바뀌는 값이라 화면에서 고침 ──
  const DEFAULT_CFG = {
    code: { A: "71", X: "72", I: "73", O: "74", M: "75", K: "76", N: "77", D: "78", S: "79" },
    mathT: { A: "유명환", X: "최병규", I: "임준홍", O: "안경수", M: "박유림", K: "김상훈", N: "조병화", D: "박병조", S: "김종우" },
    room: { A: "L01호", X: "101호", I: "102호", O: "201호", M: "202호", K: "203호", N: "204호", D: "301호", S: "302호" },
    // 생활반 담임: 묶음별 조 순서대로 (X·I, O·M, K·N 은 같은 담임이 두 반의 같은 조를 함께 맡음)
    groupT: { A: ["이승국", "이슬이"], XI: ["김혜경", "신의현", "허연옥"], OM: ["김대연", "김은지", "김동건"], KN: ["송병수", "박성준", "전형민"], D: ["박소영", "남관우"], S: ["정민호", "조태진"] },
    lncT: { A: "유명환", B: "전병훈", C: "김홍훈", D: "엄준용", E: "한창희" },
  };
  const GROUP_SETS = [["A", ["A"]], ["XI", ["X", "I"]], ["OM", ["O", "M"]], ["KN", ["K", "N"]], ["D", ["D"]], ["S", ["S"]]];
  const ROW_ORDER = ["A", "X", "I", "O", "M", "K", "N", "D", "S"];
  const cfg = () => ({ ...DEFAULT_CFG, ...(st.config || {}), groupT: { ...DEFAULT_CFG.groupT, ...((st.config || {}).groupT || {}) } });

  // ── 반별 인원표 (평소 보던 형태: 생활반 담임별 · L&C · 남/여 · 편성) ──
  function renderCap() {
    const c = cfg();
    const F = (key, val, w = 64) => (editing ? `<input class="input ca-in" data-k="${key}" value="${esc(val || "")}" style="width:${w}px">` : esc(val || ""));
    const { hr, grp } = E.tally(st.students, st.base);
    const gender = {};   // 반별 남/여 (재원생 base.gender + 현재 학생)
    for (const [h, v] of Object.entries(st.base.gender || {})) gender[h] = { M: v.M || 0, F: v.F || 0 };
    for (const s2 of st.students) if (s2.homeroom && (s2.gender === "M" || s2.gender === "F")) { (gender[s2.homeroom] ||= { M: 0, F: 0 })[s2.gender]++; }
    // 생활반 칸 수는 배정 기준의 "생활반 수"를 따름 (담임 이름이 모자라면 빈칸)
    const setN = Object.fromEntries(GROUP_SETS.map(([set, hrs]) => [set, Math.max(...hrs.map((h) => E.GROUP_COUNT[h] || 0))]));
    const cols = GROUP_SETS.flatMap(([set, hrs]) => Array.from({ length: setN[set] }, (_, i) => ({ set, hrs, g: i + 1, t: (c.groupT[set] || [])[i] || "" })));
    const lncKeys = ["A", "B", "C", "D", "E"];
    const colTot = cols.map(() => 0), lncTot = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    let tM = 0, tF = 0, tAll = 0;
    const body = ROW_ORDER.map((h) => {
      const cap = E.HOMEROOM_CAPS[h] || 84, now = hr[h] || 0;
      const gcap = E.GROUP_CAPS[h] || 30;
      const gc = cols.map((col, i) => {
        if (!col.hrs.includes(h)) return '<td class="off"></td>';
        const n = ((grp[h] || [])[col.g - 1]) || 0; colTot[i] += n;
        return `<td class="${n > gcap ? "over" : ""}">${n}</td>`;
      }).join("");
      const lk = E.HOMEROOM_LNC[h];
      const lc = lncKeys.map((k) => (k === lk ? `<td>${now}</td>` : '<td class="off"></td>')).join("");
      lncTot[lk] += now;
      const g = gender[h] || { M: 0, F: 0 }; tM += g.M; tF += g.F; tAll += now;
      return `<tr><td>${F(`code.${h}`, c.code[h], 44)}</td><td class="hr">${h}</td><td>${F(`mathT.${h}`, c.mathT[h])}</td>${gc}${lc}<td>${F(`room.${h}`, c.room[h], 60)}</td>
        <td>${g.M}</td><td>${g.F}</td><td class="tot ${now > cap ? "over" : ""}" title="정원 ${cap}">${now}<span class="cap">/${cap}</span></td></tr>`;
    }).join("");
    const wait = st.students.filter((s2) => !s2.homeroom);
    const wM = wait.filter((s2) => s2.gender === "M").length, wF = wait.filter((s2) => s2.gender === "F").length;
    const head1 = GROUP_SETS.filter(([set]) => setN[set] > 0).map(([set]) => `<th colspan="${setN[set]}">${set === "XI" ? "X·I" : set === "OM" ? "O·M" : set === "KN" ? "K·N" : set}</th>`).join("");
    const head2 = cols.map((col) => `<th class="t">${col.g}<br>${F(`groupT.${col.set}.${col.g - 1}`, col.t, 58)}</th>`).join("") + lncKeys.map((k) => `<th class="t">${k}<br>${F(`lncT.${k}`, c.lncT[k], 58)}</th>`).join("");
    $("[data-cap]").innerHTML = `
      <div class="table-wrap"><table class="table ca-cap">
        <thead>
          <tr><th rowspan="2">반코드</th><th rowspan="2">수학반</th><th rowspan="2">수학담임</th>${head1}<th colspan="5">L&amp;C</th><th rowspan="2">강의실</th><th rowspan="2">남</th><th rowspan="2">여</th><th rowspan="2">편성</th></tr>
          <tr>${head2}</tr>
        </thead>
        <tbody>${body}
          <tr class="wait"><td></td><td class="hr">미배정</td><td></td>${cols.map(() => "<td></td>").join("")}${lncKeys.map(() => "<td></td>").join("")}<td></td><td>${wM}</td><td>${wF}</td><td class="tot ${wait.length ? "over" : ""}">${wait.length}</td></tr>
          <tr class="sum"><td></td><td></td><td>계</td>${colTot.map((n) => `<td>${n}</td>`).join("")}${lncKeys.map((k) => `<td>${lncTot[k]}</td>`).join("")}<td>계</td><td>${tM}</td><td>${tF}</td><td class="tot">${tAll}</td></tr>
        </tbody>
      </table></div>
      <div class="toolbar" style="margin:var(--s3) 0 0">${editing
        ? '<button class="btn btn-sm" type="button" data-act="cfg-save">설정 저장</button><button class="btn btn-line btn-sm" type="button" data-act="cfg-cancel">취소</button>'
        : '<button class="btn btn-line btn-sm" type="button" data-act="cfg">반코드·담임·강의실 고치기</button>'}
      <span class="ca-note">생활반 정원 ${E.GROUP_CAPS.X}명(D·S ${E.GROUP_CAPS.D}명), 넘으면 빨간색 · 편성 칸은 현재/정원 · 성별은 엑셀에 '성별' 열이 있을 때 셉니다</span></div>`;
  }

  // 담임·강의실 고치기: 표 안의 이름 칸이 입력칸으로 바뀜
  let editing = false;
  function saveCfg() {
    const next = JSON.parse(JSON.stringify(cfg()));
    $("[data-cap]").querySelectorAll("input[data-k]").forEach((i) => {
      const [k, a, b] = i.dataset.k.split(".");
      if (b != null) { next[k][a] = next[k][a] || []; next[k][a][Number(b)] = i.value.trim(); } else next[k][a] = i.value.trim();
    });
    st.config = next; editing = false;
    log({ name: "(설정)" }, "", "", "반 설정 수정"); touch(); renderCap();
  }
  // ── 학생 명단 ──
  function inqText(s) {
    const t = s.inqTime || {};
    return [s.inq1 && `${s.inq1}${t.t1 ? `(${t.t1})` : ""}`, s.inq2 && `${s.inq2}${t.t2 ? `(${t.t2})` : ""}`].filter(Boolean).join(", ");
  }
  // 과목별 수업반 (원본과 같은 계산: 계열 + 구간표 + K계열 동시배정 조정)
  function subjOf(s) {
    if (!s.homeroom) return null;
    const c = E.classBrackets(s), ks = c.ks;
    const mt = s.mathtype_new || s.mathtype, kt = s.kortype_new || s.kortype;
    const eng = E.engClass(s.exam, s.eng, s.engKS);
    return {
      c, ks,
      kor: [c.korS && `${c.korS === "㉡(K)" ? "K" : ks}국어S(${kt})${c.korS === "㉡(K)" ? "㉡" : c.korS}`, c.korA && `${ks}독서${c.korA}`, c.korB && `${ks}문학${c.korB}`].filter(Boolean),
      math: [c.mathS && `${ks}${mt === "미적분" ? "미적" : mt === "기하" ? "기하" : "확통"}S${c.mathS}`, c.mathA && `${ks}수1${c.mathA}`, c.mathB && `${ks}수2${c.mathB}`].filter(Boolean),
      eng: eng ? `${s.engKS}영어${eng}` : (s.eng ? `${s.engKS || ks}영어 배정없음` : ""),
    };
  }
  function subjText(s) {
    const o = subjOf(s);
    if (!o) return '<span class="ca-note">수학반 배정 후 계산</span>';
    return `<div>${esc(o.kor.join(" · "))}</div><div>${esc(o.math.join(" · "))}</div><div>${esc(o.eng)}</div>` +
      (o.c.adjust.length ? `<div class="ca-note">조정: ${esc(o.c.adjust.join(" / "))}</div>` : "");
  }

  function renderRows() {
    const clsSel = $('[data-f="cls"]');
    if (clsSel.options.length <= 1) ["A", ...E.ladders().K, ...E.ladders().S].forEach((c) => clsSel.append(new Option(`${c}반`, c)));
    const list = st.students.filter((s) => {
      if (filter.cls && s.homeroom !== filter.cls) return false;
      if (filter.q && !`${s.name} ${s.sid}`.includes(filter.q)) return false;
      if (filter.only === "wait" && s.homeroom) return false;
      if (filter.only === "lock" && !s.locked) return false;
      if (filter.only === "new" && s.locked) return false;
      if (filter.only === "warn" && !(s.homeroom && E.moveWarnings(s, s.homeroom, st.students, st.base, { skipBracket: !s.locked }).length)) return false;
      return true;
    });
    $("[data-count]").textContent = `${list.length}명 / 전체 ${st.students.length}명`;
    const tb = $("[data-rows]");
    tb.replaceChildren();
    const order = ["A", ...E.ladders().K, ...E.ladders().S];
    for (const s of list.slice(0, 600)) {
      const cv = E.cvMathOf(s);
      const { cands } = E.homeroomCandidates(cv, { scholarAllowed: E.scholarTier(s) != null });
      const warns = s.homeroom ? E.moveWarnings(s, s.homeroom, st.students, st.base, { skipBracket: !s.locked }) : [];
      const tr = document.createElement("tr");
      const gN = E.GROUP_COUNT[s.homeroom] || 0;
      tr.innerHTML = `
        <td><input type="checkbox" data-lock ${s.locked ? "checked" : ""} title="고정하면 자동 배정이 바꾸지 않음"></td>
        <td class="left"><b>${esc(s.name)}</b><div class="ca-note">${esc(s.sid || "")}${s.num ? " · " + esc(s.num) : ""}</div></td>
        <td>${esc(s.jeonhyeong || "")}</td>
        <td>${cv == null ? "-" : cv}</td>
        <td>${cands.join("·") || "-"}</td>
        <td><select data-hr><option value="">대기</option>${order.map((c) => `<option ${s.homeroom === c ? "selected" : ""}>${c}</option>`).join("")}</select></td>
        <td><select data-grp ${s.homeroom ? "" : "disabled"}><option value="">-</option>${Array.from({ length: gN }, (_, i) => `<option value="${i + 1}" ${s.group === i + 1 ? "selected" : ""}>${i + 1}조</option>`).join("")}</select></td>
        <td class="left" style="font-size:12px">${subjText(s)}</td>
        <td style="font-size:12px">${esc(inqText(s))}</td>
        <td class="left"><div class="ca-note">${esc(s.hrReason || "")}</div>${warns.map((w) => `<div class="ca-warn">${esc(w)}</div>`).join("")}<div data-sug></div></td>`;
      // 대기 학생: 추천
      if (!s.homeroom) {
        const sg = E.suggest(s, st.students, st.base).list.filter((x) => x.left > 0).slice(0, 3);
        const box = tr.querySelector("[data-sug]");
        box.className = "ca-sug";
        if (!sg.length) box.innerHTML = '<span class="ca-warn">같은 계열에 남은 자리 없음</span>';
        sg.forEach((x) => {
          const b = document.createElement("button");
          b.className = "btn btn-line btn-sm"; b.type = "button";
          b.textContent = `${x.cls}반${x.bestGroup ? ` ${x.bestGroup}조` : ""} · 남은 ${x.left}${x.inBracket ? "" : " (구간 밖)"}`;
          b.onclick = () => move(s, x.cls, x.bestGroup);
          box.append(b);
        });
      }
      tr.querySelector("[data-lock]").onchange = (ev) => { s.locked = ev.target.checked; touch(); renderRows(); };
      tr.querySelector("[data-hr]").onchange = (ev) => move(s, ev.target.value, null);
      tr.querySelector("[data-grp]").onchange = (ev) => { const from = s.group; s.group = ev.target.value ? Number(ev.target.value) : null; s.locked = true; log(s, from, s.group, "생활반"); touch(); renderCap(); renderRows(); };
      tb.append(tr);
    }
    if (!list.length) tb.innerHTML = `<tr><td colspan="10" class="muted">해당하는 학생이 없습니다.</td></tr>`;
    if (list.length > 600) tb.insertAdjacentHTML("beforeend", `<tr><td colspan="10" class="muted">${list.length}명 중 600명만 표시합니다. 필터로 좁혀 주세요.</td></tr>`);
  }

  // 사람이 반을 옮김 → 경고는 보여주되 막지 않음, 자동으로 고정
  function move(s, cls, grp) {
    const from = s.homeroom;
    const warns = cls ? E.moveWarnings(s, cls, st.students, st.base) : [];
    if (warns.length && !confirm(`${s.name} → ${cls}반\n\n${warns.join("\n")}\n\n그래도 옮길까요?`)) { renderRows(); return; }
    s.homeroom = cls || ""; s.waiting = !cls; s.locked = !!cls;
    s.hrReason = cls ? `직접 배정 (${profile.name || profile.email})` : "직접 대기로 뺌";
    s.group = null; s.engKS = s.engKS || null;
    if (cls) {
      s.ks = E.HOMEROOM_KS[cls]; s.lnc = E.HOMEROOM_LNC[cls];
      if (grp) s.group = grp; else E.assignGroups(st.students, st.base.groups || {});
    }
    log(s, from, cls, "수학반");
    touch(); renderCap(); renderRows();
  }

  function renderAll() { renderCap(); renderRows(); $("[data-sid]").value = st.startSid || ""; }

  // ── 자동 배정 ──
  function runAuto(redo) {
    if (redo) {
      if (!confirm("고정하지 않은 학생의 수학반·생활반·영어·탐구 배정을 지우고 다시 만듭니다. 진행할까요?")) return;
      for (const s of st.students) if (!s.locked) { s.homeroom = ""; s.group = null; s.engKS = null; s.inqTime = null; s.waiting = false; s.hrReason = ""; }
    } else {
      for (const s of st.students) if (s.waiting && !s.locked) s.waiting = false;   // 대기 학생도 한 번 더 시도
    }
    const res = E.runAll(st.students, st.base);
    const wait = st.students.filter((s) => !s.homeroom).length;
    const agg = {};   // 같은 경고는 묶어서 "○○ ×3" 으로
    for (const w of res.warnings) agg[w.msg] = (agg[w.msg] || 0) + 1;
    const wtxt = Object.entries(agg).map(([m, n]) => (n > 1 ? `${m} ×${n}` : m)).join(" / ");
    msg(`자동 배정 완료 · 배정 대기 ${wait}명${wtxt ? ` · 경고: ${wtxt}` : ""}`, res.warnings.length > 0);
    log({ name: "(전체)" }, "", `대기 ${wait}`, redo ? "다시 배정" : "초안 배정");
    touch(); renderAll();
  }

  // ── 파일 읽기 ──
  function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
    return lines.map((l) => l.split(",").map((c) => c.replace(/^"|"$/g, "").trim()));
  }
  async function readBase(file) {
    const rows = parseCSV(await file.text());
    const h = rows[0] || [];
    const ix = (n) => h.indexOf(n);
    const iSex = ix("성별");
    const iHr = ix("수학담임반"), iG = ix("생활반"), iT1 = ix("탐구1과목"), iT1g = ix("탐구1그룹"), iT2 = ix("탐구2과목"), iT2g = ix("탐구2그룹"), iEg = ix("영어그룹"), iNum = ix("학번");
    if (iHr < 0) throw new Error("'수학담임반' 열이 없습니다. 반배정 결과 CSV 인지 확인해 주세요.");
    const homerooms = {}, groups = {}, soc = { A: 0, B: 0 }, eng = { K: 0, S: 0 }, gender = {};
    let maxNum = 0;
    for (const r of rows.slice(1)) {
      const hr = r[iHr]; if (!hr) continue;
      homerooms[hr] = (homerooms[hr] || 0) + 1;
      if (iSex >= 0) { const gg = /남/.test(r[iSex]) ? "M" : /여/.test(r[iSex]) ? "F" : ""; if (gg) (gender[hr] ||= { M: 0, F: 0 })[gg]++; }
      const g = parseInt(r[iG], 10);
      if (g && E.GROUP_COUNT[hr]) { const a = (groups[hr] ||= Array(E.GROUP_COUNT[hr]).fill(0)); if (g - 1 < a.length) a[g - 1]++; }
      // 사회문화는 '탐구1·2그룹'(탐구A/탐구B)으로 셈 — 원본은 조합(㉠/㉡)과 섞여서 반영이 안 됐음
      if (r[iT1] === "사회문화" && /탐구([AB])/.test(r[iT1g] || "")) soc[RegExp.$1]++;
      if (r[iT2] === "사회문화" && /탐구([AB])/.test(r[iT2g] || "")) soc[RegExp.$1]++;
      if (iEg >= 0 && /^([KS])영어/.test(r[iEg] || "")) eng[RegExp.$1]++;
      const n = parseInt(r[iNum], 10); if (!isNaN(n)) maxNum = Math.max(maxNum, n);
    }
    return { base: { homerooms, groups, soc, eng, gender }, maxNum, total: Object.values(homerooms).reduce((a, b) => a + b, 0) };
  }
  async function readNew(file) {
    await loadXLSX();
    const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
    const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
    let hi = rows.findIndex((r) => r.filter((c) => c !== "").length >= 3);
    if (hi < 0) throw new Error("머리글 행을 찾지 못했습니다.");
    const head = rows[hi].map((c) => String(c).replace(/\s/g, "").toLowerCase());
    const col = {};
    for (const [k, hints] of Object.entries(COL_HINTS)) col[k] = head.findIndex((h) => hints.some((x) => h.includes(x.replace(/\s/g, "").toLowerCase())));
    if (col.name < 0) throw new Error("'이름(성명)' 열이 없습니다.");
    const cell = (r, k) => (col[k] >= 0 ? r[col[k]] : "");
    const out = [];
    for (const r of rows.slice(hi + 1)) {
      const name = String(cell(r, "name") || "").trim(); if (!name) continue;
      out.push({
        sid: String(cell(r, "sid") || "").trim(), name, exam: normExam(cell(r, "exam")),
        mathtype: normMath(cell(r, "mathtype")), mathtype_new: cell(r, "mathtype_new") !== "" ? normMath(cell(r, "mathtype_new")) : null,
        kortype: normKor(cell(r, "kortype")), kortype_new: cell(r, "kortype_new") !== "" ? normKor(cell(r, "kortype_new")) : null,
        math: num(cell(r, "math")), korean: num(cell(r, "korean")), eng: cell(r, "eng") !== "" ? String(cell(r, "eng")) : null,
        inq1: String(cell(r, "inq1") || "").trim(), inq2: String(cell(r, "inq2") || "").trim(),
        gender: /남/.test(String(cell(r, "gender"))) ? "M" : /여/.test(String(cell(r, "gender"))) ? "F" : "",
        nonsul: String(cell(r, "nonsul") || "").trim(), hankuksa: String(cell(r, "hankuksa") || "").trim(), jeonhyeong: String(cell(r, "jeonhyeong") || "").trim(),
        homeroom: "", group: null, engKS: null, inqTime: null, locked: false,
      });
    }
    const missing = Object.entries(col).filter(([, i]) => i < 0).map(([k]) => k);
    return { list: out, missing };
  }

  // 끌어다 놓기 (파일 선택 창이 막힌 PC 대비)
  el.querySelectorAll("[data-drop]").forEach((zone) => {
    zone.addEventListener("dragover", (ev) => { ev.preventDefault(); zone.classList.add("is-drag"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-drag"));
    zone.addEventListener("drop", async (ev) => {
      ev.preventDefault(); zone.classList.remove("is-drag");
      const f = ev.dataTransfer?.files?.[0]; if (!f) return;
      try {
        if (zone.dataset.drop === "base") {
          const r = await readBase(f);
          if (!confirm(`재원생 ${r.total}명을 정원에 반영합니다(기존 재원생 반영값은 바뀝니다). 진행할까요?`)) return;
          st.base = r.base;
          if (r.maxNum && !st.startSid) st.startSid = String(r.maxNum + 1);
          zone.querySelector("[data-base-info]").textContent = `반영됨: 재원생 ${r.total}명 (${f.name})`;
          log({ name: "(재원생)" }, "", `${r.total}명`, "재원생 반영");
        } else {
          const r = await readNew(f);
          const dup = r.list.filter((n) => n.sid && st.students.some((s) => s.sid === n.sid)).length;
          if (!confirm(`신규생 ${r.list.length}명을 명단에 추가합니다.${dup ? `\n※ 수험번호가 이미 있는 학생 ${dup}명은 건너뜁니다.` : ""}${r.missing.length ? `\n※ 찾지 못한 열: ${r.missing.join(", ")}` : ""}\n진행할까요?`)) return;
          const add = r.list.filter((n) => !(n.sid && st.students.some((s) => s.sid === n.sid)));
          st.students.push(...add);
          zone.querySelector("[data-new-info]").textContent = `추가됨: ${add.length}명 (${f.name}) — "초안 자동 배정"을 누르세요`;
          log({ name: "(신규생)" }, "", `${add.length}명`, "신규생 추가");
        }
        touch(); renderAll();
      } catch (e) { msg(e.message, true); }
    });
  });

  // ── 버튼 ──
  el.addEventListener("click", (ev) => {
    const a = ev.target.closest("[data-act]")?.dataset.act;
    if (!a) return;
    if (a === "auto") runAuto(false);
    if (a === "redo") runAuto(true);
    if (a === "sid") {
      const start = parseInt($("[data-sid]").value, 10);
      if (isNaN(start)) return msg("시작 학번을 숫자로 넣어주세요.", true);
      st.startSid = String(start);
      let n = start;
      for (const s of st.students) if (s.homeroom && !s.num) s.num = String(n++);
      msg(`학번을 채웠습니다 (${start} ~ ${n - 1}). 이미 학번이 있는 학생은 그대로 둡니다.`);
      touch(); renderRows();
    }
    if (a === "csv") exportCSV();
    if (a === "clear") {
      if (!confirm("명단의 학생을 모두 지웁니다(재원생 반영값은 유지). 되돌릴 수 없습니다. 진행할까요?")) return;
      st.students = []; log({ name: "(전체)" }, "", "", "명단 비우기"); touch(); renderAll();
    }
    if (a === "add") addOne();
    if (a === "rules") showView("rules");
    if (a === "rules-close") showView("main");
    if (a === "rules-default") { if (confirm("원본 기본값을 화면에 불러옵니다. 저장을 눌러야 적용됩니다.")) renderRules(E.defaultRules()); }
    if (a === "rules-save") {
      const r = readRules(); const bad = checkRules(r);
      if (bad.length) return alert("숫자를 확인해 주세요: " + bad.join(", "));
      // 줄을 추가했다가 비워둔 경우 등은 저장 전에 정리됨
      st.rules = r; E.applyRules(r);
      // 생활반 수가 줄어든 반에서 범위를 벗어난 조는 비움 (다시 배정 때 채워짐)
      for (const s2 of st.students) if (s2.group && s2.group > (E.GROUP_COUNT[s2.homeroom] || 0)) s2.group = null;
      $("[data-rules-note]").textContent = "이 시즌 전용 배정 기준 사용 중";
      log({ name: "(기준)" }, "", "", "배정 기준 수정"); touch(); showView("main");
      msg("배정 기준을 저장했습니다. 새 기준으로 다시 나누려면 \"고정 안 한 학생 다시 배정\"을 누르세요.");
    }
    if (a === "cfg") { editing = true; renderCap(); }
    if (a === "cfg-save") saveCfg();
    if (a === "cfg-cancel") { editing = false; renderCap(); }
  });
  el.querySelectorAll("[data-f]").forEach((x) => x.addEventListener(x.tagName === "INPUT" ? "input" : "change", () => { filter[x.dataset.f] = x.value.trim(); renderRows(); }));

  // ── 수시 배정: 1명 추가 → 추천 ──
  function addOne() {
    const name = prompt("이름"); if (!name) return;
    const math = num(prompt("수학 백분위 (모르면 비워두기)", ""));
    const mathtype = normMath(prompt("수학 선택과목 (미적분/확률과통계/기하)", "미적분"));
    const exam = normExam(prompt("시험 구분 (수능/9월/6월)", "수능"));
    const eng = prompt("영어 등급 (모르면 비워두기)", "") || null;
    const s = { sid: "", name: name.trim(), exam, mathtype, math, korean: null, kortype: "언매", eng, inq1: "", inq2: "", homeroom: "", group: null, engKS: null, inqTime: null, locked: false, waiting: true, hrReason: "수시 추가 — 아래 추천에서 반을 고르세요" };
    st.students.unshift(s);
    filter = { cls: "", q: s.name, only: "" }; $('[data-f="q"]').value = s.name;
    log(s, "", "", "수시 추가");
    touch(); renderAll();
  }

  // ── 결과 CSV (원본 반배정 결과와 같은 열) ──
  function exportCSV() {
    const head = ["수험번호", "수학담임반", "학번", "생활반", "L&C", "이름", "전형방법", "국어S과목", "국어S그룹", "국어S조합", "수학S과목", "수학S그룹", "수학S조합", "영어과목", "영어그룹", "영어조합",
      "탐구1과목", "탐구1그룹", "탐구1조합", "탐구2과목", "탐구2그룹", "탐구2조합", "논술과목", "논술그룹", "논술조합", "국어A과목", "국어A그룹", "국어A조합", "국어B과목", "국어B그룹", "국어B조합",
      "수학A과목", "수학A그룹", "수학A조합", "수학B과목", "수학B그룹", "수학B조합", "한국사과목", "한국사그룹", "한국사조합", "K/S", "충돌"];
    const rows = [head];
    for (const s of st.students) {
      if (!s.homeroom) continue;
      const c = E.classBrackets(s), ks = c.ks;
      const mt = s.mathtype_new || s.mathtype, kt = s.kortype_new || s.kortype;
      const engCls = E.engClass(s.exam, s.eng, s.engKS);
      const t = s.inqTime || {};
      rows.push([
        s.sid || "", s.homeroom, s.num || "", s.group || "", E.HOMEROOM_LNC[s.homeroom] || "", s.name, s.jeonhyeong || "",
        kt || "", c.korS ? (c.korS === "㉡(K)" ? "K국어S" : ks + "국어S") : "", c.korS === "㉡(K)" ? "㉡" : (c.korS || ""),
        mt || "", c.mathS ? ks + (mt === "미적분" ? "미적" : "확통") + "S" : "", c.mathS || "",
        "영어", engCls ? s.engKS + "영어" : "", engCls || "",
        s.inq1 || "", t.t1 ? "탐구" + t.t1 : "", t.c1 || "", s.inq2 || "", t.t2 ? "탐구" + t.t2 : "", t.c2 || "",
        s.nonsul ? (s.nonsul.includes("자습") ? "논술 자습" : "논술") : "", s.nonsul ? ks + "논술" : "", s.nonsul ? "●" : "",
        "독서", c.korA ? ks + "국어A" : "", c.korA || "", "문학", c.korB ? ks + "국어B" : "", c.korB || "",
        "수학Ⅰ", c.mathA ? ks + "수학A" : "", c.mathA || "", "수학Ⅱ", c.mathB ? ks + "수학B" : "", c.mathB || "",
        s.hankuksa ? (s.hankuksa.includes("자습") ? "한국사 자습" : "한국사") : "", s.hankuksa ? (s.engKS || ks) + "한국사" : "", s.hankuksa ? "●" : "",
        ks, c.adjust.join(" / "),
      ]);
    }
    const csv = rows.map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `반배정결과_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    const wait = st.students.filter((s) => !s.homeroom).length;
    msg(`CSV 내보냄 (${rows.length - 1}명)${wait ? ` · 배정 대기 ${wait}명은 빠졌습니다` : ""}`);
  }

  // ── 배정 기준 설정 (원본의 구간표·가산값 편집과 같은 내용, 시즌마다 따로) ──
  function showView(v) {
    view = v;
    $("[data-view-main]").hidden = v !== "main";
    $("[data-view-rules]").hidden = v !== "rules";
    if (v === "main") { $("[data-view-rules]").innerHTML = ""; renderAll(); } else renderRules(E.currentRules());
  }
  const I = (key, val, w = 64) => `<input class="input ca-in" data-r="${key}" value="${esc(val ?? "")}" style="width:${w}px">`;
  function renderRules(r) {
    const box = $("[data-view-rules]");
    const order = ["A", "X", "I", "O", "M", "K", "N", "D", "S"];
    const hb = Object.fromEntries(r.homeroomBrackets.map((b) => [b.label, b]));
    const exams = Object.keys(r.mathBonus);
    const mtypes = [...new Set(exams.flatMap((e) => Object.keys(r.mathBonus[e])))];
    const others = SEASONS.flatMap(([k, l]) => [thisYear - 1, thisYear, thisYear + 1].map((y) => [`${y}_${k}`, `${y} ${l}`])).filter(([k]) => k !== seasonKey);
    box.innerHTML = `
      <section class="card">
        <div class="card-head"><h2>담임반 구간 · 정원</h2><span class="ca-note">수학 변환백분위 기준 · 겹치는 구간은 정원 대비 덜 찬 반으로 · A반은 장학(0T·4T) 전용</span></div>
        <div class="card-body"><div class="table-wrap"><table class="table ca-cap">
          <thead><tr><th>수학반</th><th>계열</th><th>구간 시작</th><th>구간 끝</th><th>반 정원</th><th>생활반 수</th><th>생활반 정원</th></tr></thead>
          <tbody>${order.map((h) => `<tr><td class="hr">${h}</td><td>${E.HOMEROOM_KS[h]}</td>
            <td>${I(`hb.${h}.from`, hb[h]?.from, 60)}</td><td>${I(`hb.${h}.to`, hb[h]?.to, 60)}</td>
            <td>${I(`caps.${h}`, r.caps[h], 56)}</td><td>${I(`gc.${h}`, r.groupCount[h], 44)}</td><td>${I(`gcap.${h}`, r.groupCaps[h], 56)}</td></tr>`).join("")}</tbody>
        </table></div></div>
      </section>

      <section class="card">
        <div class="card-head"><h2>가산값</h2><span class="ca-note">백분위에 더하는 값 (시험·과목별)</span></div>
        <div class="card-body"><div class="table-wrap"><table class="table ca-cap">
          <thead><tr><th>시험</th>${mtypes.map((m) => `<th>수학 ${m}</th>`).join("")}<th>국어</th></tr></thead>
          <tbody>${exams.map((e) => `<tr><td class="hr">${e}</td>${mtypes.map((m) => `<td>${I(`mb.${e}.${m}`, r.mathBonus[e][m], 56)}</td>`).join("")}<td>${I(`kb.${e}`, r.korBonus[e], 56)}</td></tr>`).join("")}</tbody>
        </table></div></div>
      </section>

      <section class="card">
        <div class="card-head"><h2>과목반 구간표</h2><span class="ca-note">변환백분위 → 수업반 (예: 미적분K = K계열 미적분 S반)</span></div>
        <div class="card-body ca-brs">${Object.entries(r.brackets).map(([key, rows]) => `
          <div class="ca-br" data-br="${esc(key)}"><b>${esc(key)}</b>
            ${rows.map((x, i) => `<div class="ca-br-row">${I(`br.${key}.${i}.label`, x.label, 46)} ${I(`br.${key}.${i}.from`, x.from, 50)} ~ ${I(`br.${key}.${i}.to`, x.to, 50)}
              <button class="btn btn-line btn-sm" type="button" data-br-del="${esc(key)}|${i}" title="이 줄 삭제">삭제</button></div>`).join("")}
            <button class="btn btn-line btn-sm" type="button" data-br-add="${esc(key)}">줄 추가</button></div>`).join("")}
        </div>
      </section>

      <section class="card"><div class="card-body">
        <div class="toolbar">
          <button class="btn" type="button" data-act="rules-save">이 시즌 기준으로 저장</button>
          <button class="btn btn-line" type="button" data-act="rules-close">닫기</button>
          <select class="select" data-rules-from style="margin-left:auto"><option value="">다른 시즌 기준 가져오기</option>${others.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
          <button class="btn btn-line" type="button" data-act="rules-default">원본 기본값으로</button>
        </div>
        <p class="ca-note" style="margin-top:var(--s2)">저장해도 이미 배정된 학생은 그대로입니다. 새 기준으로 다시 나누려면 저장 후 "고정 안 한 학생 다시 배정"을 누르세요.</p>
      </div></section>
      <style>
        .ca-brs{ display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:var(--s3); }
        .ca-br{ border:1px solid var(--line); border-radius:var(--r-sm); padding:var(--s3); background:rgba(255,255,255,.5); display:flex; flex-direction:column; gap:6px; }
        .ca-br-row{ display:flex; gap:6px; align-items:center; font-size:12px; }
      </style>`;
    box.querySelector("[data-rules-from]").onchange = async (ev) => {
      const k = ev.target.value; if (!k) return;
      const d = await getDoc(stateRef(db, k)).catch(() => null);
      const rr = d && d.exists() ? d.data().rules : null;
      if (!rr) { alert("그 시즌에는 저장된 전용 기준이 없습니다(원본 기본값 사용 중)."); ev.target.value = ""; return; }
      renderRules(JSON.parse(JSON.stringify({ ...E.defaultRules(), ...rr })));
      msg("다른 시즌 기준을 불러왔습니다. 확인 후 저장을 눌러야 적용됩니다.");
    };
  }
  function readRules() {
    const r = E.currentRules();
    const hb = Object.fromEntries(r.homeroomBrackets.map((b) => [b.label, b]));
    const brs = {};
    $("[data-view-rules]").querySelectorAll("input[data-r]").forEach((i) => {
      const parts = i.dataset.r.split("."), v = i.value.trim(), n = Number(v);
      const val = v === "" || isNaN(n) ? v : n;
      if (parts[0] === "hb") hb[parts[1]][parts[2]] = val;
      else if (parts[0] === "caps") r.caps[parts[1]] = val;
      else if (parts[0] === "gc") r.groupCount[parts[1]] = val;
      else if (parts[0] === "gcap") r.groupCaps[parts[1]] = val;
      else if (parts[0] === "mb") r.mathBonus[parts[1]][parts[2]] = val;
      else if (parts[0] === "kb") r.korBonus[parts[1]] = val;
      else if (parts[0] === "br") { const [, key, idx, f] = parts; ((brs[key] ||= [])[idx] ||= {})[f] = val; }
    });
    r.homeroomBrackets = Object.values(hb);
    r.brackets = Object.fromEntries(Object.entries(brs).map(([k, rows]) => [k, rows.filter(Boolean).filter((x) => x.label !== "")]));
    return r;
  }
  function checkRules(r) {
    const bad = [];
    for (const b of r.homeroomBrackets) if (!(typeof b.from === "number" && typeof b.to === "number" && b.from <= b.to)) bad.push(`${b.label}반 구간`);
    for (const [k, v] of Object.entries(r.caps)) if (!(v > 0)) bad.push(`${k}반 정원`);
    for (const [k, v] of Object.entries(r.groupCount)) if (!(Number.isInteger(v) && v >= 1 && v <= 6)) bad.push(`${k}반 생활반 수(1~6)`);
    for (const [k, rows] of Object.entries(r.brackets)) for (const x of rows) if (!(typeof x.from === "number" && typeof x.to === "number")) bad.push(`${k} 구간 숫자`);
    return [...new Set(bad)];
  }
  el.addEventListener("click", (ev) => {
    const add = ev.target.closest("[data-br-add]"), del = ev.target.closest("[data-br-del]");
    if (!add && !del) return;
    const r = readRules();
    if (add) (r.brackets[add.dataset.brAdd] ||= []).push({ label: "", from: "", to: "" });
    if (del) { const [k, i] = del.dataset.brDel.split("|"); r.brackets[k].splice(Number(i), 1); }
    renderRules(r);
    if (add) { const box = $(`[data-br="${CSS.escape(add.dataset.brAdd)}"]`); box && box.querySelectorAll("input")[box.querySelectorAll("input").length - 3]?.focus(); }
  });

  // ── 시즌 불러오기 ──
  async function loadSeason() {
    st = { students: [], base: {}, startSid: "", config: null, rules: null }; loadedAt = null;
    $("[data-save]").textContent = ""; $("[data-base-info]").textContent = ""; $("[data-new-info]").textContent = ""; msg("");
    try {
      const d = await getDoc(stateRef(db, seasonKey));
      if (d.exists()) { const v = d.data(); st = { students: v.students || [], base: v.base || {}, startSid: v.startSid || "", config: v.config || null, rules: v.rules || null }; loadedAt = v.updatedAt?.toMillis?.() || null;
        $("[data-save]").textContent = v.updatedAt ? `마지막 저장 ${v.updatedAt.toDate().toLocaleString("ko-KR")} · ${v.updatedBy || ""}` : "";
        if (st.base.homerooms) $("[data-base-info]").textContent = `반영됨: 재원생 ${Object.values(st.base.homerooms).reduce((a, b) => a + b, 0)}명`;
      }
    } catch (e) { msg(`불러오지 못했습니다 (${e.code || e.message}). 보안 규칙과 계정의 반배정 권한을 확인하세요.`, true); }
    E.applyRules(st.rules);
    $("[data-rules-note]").textContent = st.rules ? "이 시즌 전용 배정 기준 사용 중" : "배정 기준: 원본 기본값";
    showView("main");
  }
  async function changeSeason() {
    clearTimeout(saveTimer); if (dirty) await save();
    seasonKey = `${$("[data-season-year]").value}_${$("[data-season-kind]").value}`;
    await loadSeason();
  }
  $("[data-season-year]").addEventListener("change", changeSeason);
  $("[data-season-kind]").addEventListener("change", changeSeason);

  // ── 시작 ──
  await loadSeason();
  ctx.track(() => { clearTimeout(saveTimer); if (dirty) save(); });   // 메뉴를 떠날 때 저장 안 된 변경 저장
}
