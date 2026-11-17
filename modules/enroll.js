// 등록현황 — 원본 등록보고 앱을 QSA 안에서 실행합니다.
// 원본 화면은 섀도 DOM 안에 넣어 QSA 화면과 스타일·ID 가 섞이지 않게 하고,
// 겉모양만 QSA 톤(그라데이션·그레인 제거, 단색 Teal 버튼 등)으로 덮어씁니다.
import {
  doc, getDoc, setDoc, getDocs, collection, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { CSS, MARKUP, start } from "./enroll/legacy.js";

const XLSX_URL = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

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

// QSA 톤으로 맞추는 덮어쓰기 (원본 CSS 뒤에 적용)
const QSA_SKIN = `
/* 배경 그라데이션·그레인은 QSA 전체에 이미 깔려 있으므로 여기서는 투명 처리(겹침 방지).
   유리 카드·버튼 등 원본 겉모양은 그대로 둡니다. */
:host{ display:block; min-height:auto !important; background:transparent !important; }
:host::before{ display:none !important; }

/* 게이트(시즌 선택)를 화면 덮개가 아닌 카드로 */
#gate{ position:static !important; inset:auto !important; min-height:420px; background:transparent !important; }
#gate .small{ display:none; }              /* 초기 설정(Firebase·비번) 링크 숨김 */

/* 원본 상단 바: 브랜드 문구는 QSA 제목과 겹치므로 숨기고 시즌·연결 상태만 */
header{ position:static !important; border-radius:16px 16px 0 0; border:1px solid rgba(255,255,255,.7); border-bottom:1px solid var(--line); }
header .brand, header .sub{ display:none; }
nav{ position:sticky; top:64px; z-index:10; border-radius:0 0 16px 16px; border:1px solid rgba(255,255,255,.7); border-top:0; margin-bottom:20px; }
main{ padding-left:0 !important; padding-right:0 !important; }
`;

export async function mount(el, ctx) {
  await loadXLSX();

  const host = document.createElement("div");
  host.className = "enroll-host";
  el.append(host);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${CSS}</style><style>${QSA_SKIN}</style>${MARKUP}`;

  await start(root, {
    db: ctx.db,
    fs: { doc, getDoc, setDoc, getDocs, collection, writeBatch },
    gotoImport: () => { location.hash = "#enroll-import"; },
  });
}
