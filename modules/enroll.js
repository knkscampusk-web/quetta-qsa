// 등록현황 — 원본 등록보고 앱의 계산 로직을 QSA 안에서 실행합니다.
//  · 시즌 선택은 QSA "조건검색" 카드의 드롭다운이 담당 (원본 게이트 화면은 숨김)
//  · 원본 화면은 섀도 DOM 안에 넣어 QSA 와 ID·스타일이 섞이지 않게 하고,
//    안쪽 카드·버튼·표·탭을 QSA 부품 모양으로 덮어씁니다.
import {
  doc, getDoc, setDoc, getDocs, collection, writeBatch,
  query, orderBy, startAt, endAt, documentId,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { CSS, MARKUP, start } from "./enroll/legacy.js";

const XLSX_URL = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
const SEASONS = [
  { v: "정규", label: "정규시즌" },
  { v: "반수", label: "반수시즌" },
  { v: "윈터", label: "윈터스쿨" },
];
const LAST_KEY = "qsaReg_lastSeason";

function loadXLSX() {
  if (window.XLSX) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = XLSX_URL;
    s.onload = res;
    s.onerror = () => rej(new Error("엑셀 처리 도구(SheetJS)를 불러오지 못했습니다"));
    document.head.append(s);
  });
}

// 원본 화면을 QSA 부품 모양으로 맞추는 덮어쓰기 (원본 CSS 뒤에 적용)
const QSA_SKIN = `
:host{
  display:block; min-height:auto !important; background:transparent !important;
  font-family:"Pretendard",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif !important;
  font-size:14px;
  --glass: rgba(255,255,255,.62);
  --glass-line: rgba(255,255,255,.7);
  --qline: rgba(35,31,32,.09);
}
:host::before{ display:none !important; }   /* 배경·그레인은 QSA 전체가 담당 */

/* 원본 게이트·상단 바·톱니 버튼은 QSA 가 대신하므로 숨김 */
#gate, header, .fab, #setBack{ display:none !important; }
/* 입력 탭 안의 시즌 칸은 위 조건검색 드롭다운과 겹치므로 숨김(값은 자동 동기화) */
.field:has(#season){ display:none !important; }
main{ padding:0 !important; max-width:none !important; }

/* 탭 줄 → QSA 유리 탭 바 */
nav{
  position:sticky; top:64px; z-index:10; padding:0 12px; margin-bottom:20px;
  background:var(--glass) !important; -webkit-backdrop-filter:blur(14px) saturate(140%); backdrop-filter:blur(14px) saturate(140%);
  border:1px solid var(--glass-line); border-radius:16px;
  box-shadow:0 1px 2px rgba(35,31,32,.05), 0 10px 28px rgba(35,31,32,.07);
}
nav button{ font-size:14px; padding:14px 14px 12px; }
nav button svg{ width:16px; height:16px; }

/* 카드 → QSA 유리 카드 */
.card{
  background:var(--glass) !important; border:1px solid var(--glass-line) !important; border-radius:16px !important;
  -webkit-backdrop-filter:blur(14px) saturate(140%) !important; backdrop-filter:blur(14px) saturate(140%) !important;
  box-shadow:0 1px 2px rgba(35,31,32,.05), 0 10px 28px rgba(35,31,32,.07) !important;
  padding:20px !important; margin-bottom:20px !important;
}
.card::before{ display:none; }
.card h3{ font-size:16px; font-weight:700; gap:8px; margin-bottom:6px; }
.pin{ width:4px; border-radius:2px; margin-right:0; }
.card .desc, .note{ font-size:13px; }

/* 입력 */
.field label{ font-size:13px; }
.field input, .field select{ height:38px; padding:0 12px; font-size:14px; border-radius:12px; border-color:var(--qline); background:rgba(255,255,255,.72); }

/* 버튼: 기본은 흰 유리 버튼, 주요 버튼은 단색 Teal */
.btn{
  height:38px; padding:0 16px; font-size:14px; font-weight:600; border-radius:12px;
  background:rgba(255,255,255,.78); color:var(--teal-ink); border-color:var(--qline); box-shadow:none;
}
.btn:hover{ background:#fff; border-color:var(--qline); }
.btn.pri{ background:var(--teal); color:#fff; border-color:transparent; box-shadow:none; font-weight:700; }
.btn.pri:hover{ background:var(--teal-d); }

/* 파일 놓는 칸 */
.drop{ border-radius:12px; background:rgba(255,255,255,.45); font-size:14px; }

/* 표 → QSA 표 */
.tablewrap{ border-radius:12px; border-color:var(--qline); background:rgba(255,255,255,.55); }
table{ font-size:13px; }
th, td{ padding:10px 12px; border-bottom-color:var(--qline); }
thead th{ font-size:12.5px; background:rgba(236,250,251,.92); }
tbody tr:hover{ background:rgba(255,255,255,.7); }

/* 숫자 타일·대시보드 머리말: QSA 글자 크기에 맞춤 */
.stat{ background:rgba(255,255,255,.72); border-color:var(--glass-line); border-radius:12px; }
.stat .v{ font-size:26px; }
.stat .l{ font-size:12.5px; }
.hero-title{ font-size:30px; }
.hero-panel{ border-radius:16px; box-shadow:none; }
.hero-panel-main{ font-size:44px; }
.hero-num{ font-size:40px; }
`;

export async function mount(el, ctx) {
  // ── QSA 조건검색 카드 (시즌 선택) ──
  const filter = document.createElement("section");
  filter.className = "card";
  filter.innerHTML = `
    <div class="card-head dark"><h2>조건검색</h2></div>
    <div class="card-body">
      <div class="filters">
        <select class="select" data-season aria-label="시즌"></select>
        <span class="muted" data-status style="margin-left:var(--s2)">불러오는 중…</span>
      </div>
    </div>`;
  const sel = filter.querySelector("[data-season]");
  const status = filter.querySelector("[data-status]");
  for (const s of SEASONS) {
    const o = document.createElement("option");
    o.value = s.v;
    o.textContent = s.label;
    sel.append(o);
  }
  let last = "정규";
  try { last = localStorage.getItem(LAST_KEY) || "정규"; } catch (e) { /* 저장 공간 사용 불가 */ }
  if (!SEASONS.some((s) => s.v === last)) last = "정규";
  sel.value = last;
  sel.disabled = true;
  el.append(filter);

  // ── 원본 화면 (섀도 DOM) ──
  await loadXLSX();
  const host = document.createElement("div");
  host.className = "enroll-host";
  el.append(host);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${CSS}</style><style>${QSA_SKIN}</style>${MARKUP}`;

  const api = await start(root, {
    db: ctx.db,
    fs: { doc, getDoc, setDoc, getDocs, collection, writeBatch, query, orderBy, startAt, endAt, documentId },
    gotoImport: () => { location.hash = "#enroll-import"; },
  });

  async function enter(season) {
    sel.disabled = true;
    status.textContent = `${SEASONS.find((s) => s.v === season).label} 불러오는 중…`;
    try {
      await api.enterSeason(season);
      try { localStorage.setItem(LAST_KEY, season); } catch (e) { /* 무시 */ }
      status.textContent = "QSA 연결됨";
    } catch (e) {
      console.error(e);
      status.textContent = `불러오지 못했습니다 (${e.code || e.message})`;
    } finally {
      sel.disabled = false;
    }
  }
  sel.addEventListener("change", () => enter(sel.value));
  await enter(last);
}
