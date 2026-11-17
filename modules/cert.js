// 증명서 발급 — 원본(전입신고 관리 앱)의 증명서 부분을 QSA 안에서 실행합니다.
//  · 데이터: QSA DB
//      cert_roster/current  DSA 원생 마스터에서 올린 학생 명단 (문서 1개 = 읽기 1건)
//      certificates         발급 이력
//      certConfig           과정·발급번호·메일 설정
//  · 학생 명단은 필요한 열(학번·성명·성별·반·생년월일·상태·입소일·퇴소일)만 저장. 주소·연락처·성적 등은 저장하지 않음
//  · 화면: 섀도 DOM 안에서 원본 화면 중 증명서(vCert)만 보이고, QSA 모양으로 덮어씀
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, setDoc,
  query, orderBy, writeBatch, runTransaction, serverTimestamp, onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { CSS, MARKUP, start } from "./cert/legacy.js";
import { getLink } from "./settings.js";

const LIBS = [
  ["XLSX", "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"],
  ["html2canvas", "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"],
  ["jspdf", "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"],
];
const ROSTER = ["cert_roster", "current"];
// DSA 원생 마스터 → 저장할 열 (이 외의 열은 읽고 버림)
const COLS = { studentId: "학번", name: "성명", gender: "성별", cls: "반", birthday: "생년월일", status: "상태", enterDate: "입소일", leaveDate: "퇴소일" };
const SKIP_STATUS = new Set(["등록포기"]);

function loadScript(globalName, src) {
  if (window[globalName]) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error(`도구를 불러오지 못했습니다: ${globalName}`));
    document.head.append(s);
  });
}

// ── 엑셀 값 정리 ──
const pad = (n) => String(n).padStart(2, "0");
function toDate(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const d = String(v).replace(/\.0+$/, "").replace(/[^\d]/g, "");
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  if (typeof v === "number" && v > 20000 && v < 80000) {           // 엑셀 날짜 일련번호
    const t = new Date(Math.round((v - 25569) * 86400 * 1000));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  }
  return String(v).trim();
}
const clean = (v) => (v == null ? "" : String(v).trim());

function parseDsa(arrayBuffer) {
  const wb = window.XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
  const hi = rows.findIndex((r) => r.includes("학번") && r.includes("성명"));
  if (hi < 0) throw new Error("'학번'과 '성명' 열을 찾지 못했습니다. DSA 원생 마스터 다운로드 파일인지 확인해 주세요.");
  const head = rows[hi].map((h) => clean(h));
  const idx = {};
  for (const [k, label] of Object.entries(COLS)) {
    idx[k] = head.indexOf(label);                                   // 같은 이름이 여러 개면 첫 열
    if (idx[k] < 0 && ["studentId", "name"].includes(k)) throw new Error(`'${label}' 열이 없습니다.`);
  }
  const out = [];
  let skipped = 0;
  for (const r of rows.slice(hi + 1)) {
    const sid = clean(r[idx.studentId]).replace(/\.0+$/, "");
    const status = idx.status >= 0 ? clean(r[idx.status]) : "";
    if (!sid || SKIP_STATUS.has(status)) { if (clean(r[idx.name])) skipped++; continue; }
    out.push({
      studentId: sid,
      name: clean(r[idx.name]),
      gender: idx.gender >= 0 ? clean(r[idx.gender]) : "",
      cls: idx.cls >= 0 ? clean(r[idx.cls]) : "",
      birthday: idx.birthday >= 0 ? toDate(r[idx.birthday]) : "",
      status,
      enterDate: idx.enterDate >= 0 ? toDate(r[idx.enterDate]) : "",
      leaveDate: idx.leaveDate >= 0 ? toDate(r[idx.leaveDate]) : "",
    });
  }
  const dup = out.length - new Set(out.map((s) => s.studentId)).size;
  if (dup) throw new Error(`학번이 중복된 행이 ${dup}개 있습니다. 파일을 확인해 주세요.`);
  return { students: out, skipped };
}

const FIELDS = ["name", "gender", "cls", "birthday", "status", "enterDate", "leaveDate"];
function diffRoster(oldList, newList) {
  const oldMap = new Map(oldList.map((s) => [s.studentId, s]));
  const newMap = new Map(newList.map((s) => [s.studentId, s]));
  const added = [], changed = [], removed = [];
  for (const n of newList) {
    const o = oldMap.get(n.studentId);
    if (!o) added.push(n);
    else if (o.missing || FIELDS.some((f) => (o[f] || "") !== (n[f] || ""))) changed.push({ o, n });
  }
  for (const o of oldList) if (!newMap.has(o.studentId) && !o.missing) removed.push(o);
  // 새 명단 + 이번에 빠진 학생은 "명단 외"로 남김 (지난 발급 이력과 어긋나지 않게)
  const merged = [...newList, ...oldList.filter((o) => !newMap.has(o.studentId)).map((o) => ({ ...o, missing: true }))];
  return { added, changed, removed, merged };
}

// 원본 화면을 QSA 모양으로 맞추는 덮어쓰기
const QSA_SKIN = `
:host{
  display:block; min-height:auto !important; background:transparent !important;
  font-family:"Pretendard",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif !important;
  font-size:14px;
  --g900:#115E66; --g700:#00B2BE; --g500:#00B2BE; --g100:#C9EEF1; --g50:#ECFAFB;
  --gold:#00B2BE; --gold2:#0497A2; --gold-bg:#ECFAFB;
  --cream:rgba(255,255,255,.55); --warm1:rgba(35,31,32,.05); --warm2:rgba(35,31,32,.10);
  --t1:#231F20; --t2:#4A4546; --t3:#7A7476;
  --red:#CF4D4D; --red-bg:#FBECEC;
  --r:16px; --r2:16px;
}
:host *{ font-family:inherit; }
#loginScreen, #pendingScreen, .sidebar, .mobile-menu-btn, .mobile-menu-overlay{ display:none !important; }
.view:not(#vCert){ display:none !important; }
.layout{ display:block !important; min-height:0 !important; }
.main{ padding:0 !important; overflow:visible !important; }
.pg-title, .pg-sub{ display:none; }
.pg-head{ margin-bottom:20px; padding:8px; justify-content:flex-start;
  background:rgba(255,255,255,.62); -webkit-backdrop-filter:blur(14px) saturate(140%); backdrop-filter:blur(14px) saturate(140%);
  border:1px solid rgba(255,255,255,.7); border-radius:16px; box-shadow:0 1px 2px rgba(35,31,32,.05), 0 10px 28px rgba(35,31,32,.07); }
.pg-head > div:first-child{ display:none; }
.pg-actions{ display:flex; gap:6px; }
.card{ background:rgba(255,255,255,.62) !important; border:1px solid rgba(255,255,255,.7) !important;
  -webkit-backdrop-filter:blur(14px) saturate(140%); backdrop-filter:blur(14px) saturate(140%);
  border-radius:16px !important; box-shadow:0 1px 2px rgba(35,31,32,.05), 0 10px 28px rgba(35,31,32,.07) !important; }
.card-head{ min-height:52px; padding:0 20px; border-bottom:1px solid rgba(35,31,32,.09); }
.card-head-title{ display:flex; align-items:center; gap:8px; font-weight:700; }
.card-head-title::before{ content:""; width:4px; height:16px; border-radius:2px; background:#00B2BE; }
.card-body{ padding:20px; }
.fg label{ font-size:13px; letter-spacing:0; text-transform:none; color:#4A4546; }
.fg input, .fg select, .fg textarea, .search-input{ border:1px solid rgba(35,31,32,.09) !important; border-radius:12px !important;
  background:rgba(255,255,255,.72); font-size:14px; }
.btn{ border-radius:12px; font-size:14px; font-weight:600; height:38px; padding:0 16px; }
.btn-sm{ height:32px; padding:0 12px; font-size:13px; }
.btn-gold, .btn-primary{ background:#00B2BE !important; color:#fff !important; }
.btn-gold:hover, .btn-primary:hover{ background:#0497A2 !important; }
.btn-ghost{ background:rgba(255,255,255,.78) !important; color:#115E66 !important; border:1px solid rgba(35,31,32,.09) !important; }
.btn-ghost:hover{ background:#fff !important; }
.btn-red{ background:#CF4D4D !important; color:#fff !important; }
.tbl-wrap{ border:1px solid rgba(35,31,32,.09); border-radius:12px; background:rgba(255,255,255,.55); }
.tbl th{ background:rgba(236,250,251,.92) !important; color:#115E66; font-size:12.5px; letter-spacing:0; text-transform:none; }
.tbl td{ font-size:13px; }
.tbl tbody tr:nth-child(odd) td, .tbl tbody tr:nth-child(even) td{ background:transparent; }
.tbl tr:hover td{ background:rgba(255,255,255,.7) !important; }
.toast-wrap{ left:50%; right:auto; transform:translateX(-50%); bottom:32px; }
.toast{ background:rgba(35,31,32,.88); border-radius:999px; font-size:14px; font-weight:600; }
.toast.err{ background:#CF4D4D; }
select option:disabled{ color:#bbb; }
`;

export async function mount(el, ctx) {
  const { db, profile } = ctx;
  await Promise.all(LIBS.map(([g, src]) => loadScript(g, src)));

  // ── DSA 명단 카드 (QSA 화면) ──
  const card = document.createElement("section");
  card.className = "card";
  card.innerHTML = `
    <div class="card-head dark"><h2>DSA 학생 명단</h2></div>
    <div class="card-body">
      <div class="toolbar" style="margin-bottom:0">
        <span class="muted" data-roster-info style="flex:1">불러오는 중…</span>
        <a class="btn btn-line" href="#cert-import">기존 발급 이력 가져오기</a>
        <button class="btn" type="button" data-pull>정규 마스터에서 불러오기</button>
        <label class="btn btn-line" style="cursor:pointer"><span>엑셀 올리기(예비)</span>
          <input type="file" accept=".xlsx,.xls,.csv" data-file hidden></label>
      </div>
      <p class="notice notice-error" data-counter-warn hidden>발급번호 설정이 아직 없습니다. 기존 앱과 번호가 겹치지 않도록, 실제 발급 전에 "기존 발급 이력 가져오기"를 먼저 실행해 주세요.</p>
      <div data-preview hidden style="margin-top:var(--s4)"></div>
    </div>`;
  el.append(card);
  const info = card.querySelector("[data-roster-info]");
  const preview = card.querySelector("[data-preview]");

  let current = [];
  async function loadRosterInfo() {
    const s = await getDoc(doc(db, ...ROSTER));
    const d = s.exists() ? s.data() : null;
    current = d?.students || [];
    if (!d) { info.textContent = "아직 올린 명단이 없습니다. DSA에서 '원생 마스터 다운'을 받아 올려주세요."; return; }
    const active = current.filter((x) => x.status === "재원" && !x.missing).length;
    const when = d.updatedAt?.toDate?.().toLocaleString("ko-KR") || "-";
    info.textContent = `마지막 반영 ${when} · ${d.updatedBy || ""} · 학생 ${current.length}명 (재원 ${active}명)`;
  }

  // ── 원본 화면 (섀도 DOM) ──
  const host = document.createElement("div");
  host.className = "cert-host";
  el.append(host);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${CSS}</style><style>${QSA_SKIN}</style>${MARKUP}`;
  const pdfBox = root.getElementById("certPdfContainer");     // html2canvas 는 섀도 DOM 을 못 그려서 문서 쪽으로
  if (pdfBox) { document.body.append(pdfBox); ctx.track(() => pdfBox.remove()); }

  const api = await start(root, {
    db,
    fs: { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, setDoc,
          query, orderBy, writeBatch, runTransaction, serverTimestamp, onSnapshot },
  });
  try {
    await api.boot(profile);
    await loadRosterInfo();
  } catch (e) {
    console.error(e);
    info.textContent = `불러오지 못했습니다 (${e.code || e.message}). 보안 규칙 게시 여부와 계정의 증명서 권한을 확인하세요.`;
    info.style.color = "var(--danger)";
  }
  // 발급번호(certConfig/counter)가 없으면 경고 — 기존 앱 번호와 겹치는 것 방지
  try {
    const c = await getDoc(doc(db, "certConfig", "counter"));
    card.querySelector("[data-counter-warn]").hidden = c.exists();
  } catch (e) { /* 권한 오류는 원본 화면에서 안내 */ }

  // ── 명단 반영: 미리보기 → 반영 (마스터 불러오기·엑셀 올리기 공통) ──
  function showPreview(students, skipped, sourceLabel) {
    const { added, changed, removed, merged } = diffRoster(current, students);
    const size = JSON.stringify(merged).length;
    preview.hidden = false;
    preview.innerHTML = `
      <p class="muted" data-src style="margin-bottom:var(--s3)"></p>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>읽은 학생</th><th>새로 추가</th><th>정보 변경</th><th>이번 명단에 없음</th><th>제외(등록포기·학번 없음)</th></tr></thead>
        <tbody><tr><td></td><td></td><td></td><td></td><td></td></tr></tbody></table></div>
      <p class="muted" data-note style="margin:var(--s3) 0"></p>
      <div class="toolbar" style="margin:0"><button class="btn" data-ok type="button">명단 반영</button><button class="btn btn-line" data-cancel type="button">취소</button></div>`;
    preview.querySelector("[data-src]").textContent = `불러온 곳: ${sourceLabel}`;
    const tds = preview.querySelectorAll("tbody td");
    [students.length, added.length, changed.length, removed.length, skipped].forEach((n, i) => { tds[i].textContent = `${n}명`; });
    const note = preview.querySelector("[data-note]");
    note.textContent = "저장 항목: 학번·성명·성별·반·생년월일·상태·입소일·퇴소일 (주소·연락처·성적 등은 저장하지 않음). 이번 명단에 없는 학생은 지우지 않고 '명단 외'로 남깁니다.";
    if (size > 900000) {
      note.textContent = "명단이 너무 커서 한 번에 저장할 수 없습니다(약 900KB 초과). 관리자에게 알려주세요.";
      note.style.color = "var(--danger)";
      preview.querySelector("[data-ok]").disabled = true;
    }
    preview.querySelector("[data-cancel]").onclick = () => { preview.hidden = true; preview.replaceChildren(); };
    preview.querySelector("[data-ok]").onclick = async (ev) => {
      const btn = ev.currentTarget;
      btn.disabled = true;
      try {
        await setDoc(doc(db, ...ROSTER), {
          students: merged,
          updatedAt: serverTimestamp(),
          updatedBy: profile.email,
          fileName: sourceLabel.slice(0, 120),
        });
        await loadRosterInfo();
        await api.refresh();
        preview.hidden = true; preview.replaceChildren();
      } catch (e) {
        console.error(e);
        note.textContent = `저장하지 못했습니다 (${e.code || e.message}).`;
        note.style.color = "var(--danger)";
        btn.disabled = false;
      }
    };
  }
  function showError(msg) {
    preview.hidden = false;
    preview.replaceChildren();
    const p = document.createElement("p"); p.style.color = "var(--danger)"; p.textContent = msg;
    preview.append(p);
  }

  // 정규 마스터에서 불러오기 (Apps Script, QSA 로그인 토큰으로 권한 확인)
  card.querySelector("[data-pull]").addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    let certRosterUrl = "";
    try { certRosterUrl = await getLink(db, "certRoster"); } catch (e) { /* 아래에서 안내 */ }
    if (!certRosterUrl) { btn.disabled = false; return showError("명단 불러오기 주소가 아직 없습니다. 관리자가 '관리 › 연결 설정'에서 정규 마스터 Apps Script 주소를 입력해야 합니다."); }
    preview.hidden = false;
    preview.textContent = "정규 마스터에서 불러오는 중…";
    try {
      const idToken = await ctx.auth.currentUser.getIdToken();
      const res = await fetch(certRosterUrl, { method: "POST", body: JSON.stringify({ idToken }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "불러오지 못했습니다");
      showPreview(data.students || [], data.skipped || 0, `정규 마스터 (${data.tab || "시트"})`);
    } catch (e) {
      console.error(e);
      showError(`불러오지 못했습니다: ${e.message}`);
    } finally {
      btn.disabled = false;
    }
  });

  // 엑셀 올리기 (예비)
  card.querySelector("[data-file]").addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    ev.target.value = "";
    if (!file) return;
    preview.hidden = false;
    preview.textContent = `파일을 읽는 중… (${file.name})`;
    try {
      const parsed = parseDsa(await file.arrayBuffer());
      showPreview(parsed.students, parsed.skipped, file.name);
    } catch (e) {
      showError(e.message);
    }
  });
}
