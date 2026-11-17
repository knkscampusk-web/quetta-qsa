// 증명서 발급 — 원본(전입신고 관리 앱)의 증명서 부분을 QSA 안에서 실행합니다.
//  · 데이터: 원본 DB(quetta-2ea94)에 "연결" (복사 아님). 담임 선생님은 기존 앱에서 계속 입력
//  · 로그인: QSA 의 Google 계정으로 원본 프로젝트에도 연결 (처음 한 번 Google 창이 뜰 수 있음)
//  · 원본 쪽 권한: 원본 앱의 직원 승인(users/{uid}, role: staff)을 그대로 사용 — 원본 규칙 확인 후 확정
//  · 화면: 섀도 DOM 안에서 원본 화면 중 증명서(vCert)만 보이고, QSA 모양으로 덮어씀
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, setDoc,
  query, orderBy, writeBatch, runTransaction, serverTimestamp, onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getLinkedApp } from "../core/firebase.js";
import { linkSignIn } from "../core/auth.js";
import { CSS, MARKUP, start } from "./cert/legacy.js";

const LIBS = [
  ["XLSX", "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"],
  ["html2canvas", "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"],
  ["jspdf", "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"],
];

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

// 원본 화면을 QSA 모양으로 맞추는 덮어쓰기
const QSA_SKIN = `
:host{
  display:block; min-height:auto !important; background:transparent !important;
  font-family:"Pretendard",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif !important;
  font-size:14px;
  /* 원본 색 → QUETTA 색 */
  --g900:#115E66; --g700:#00B2BE; --g500:#00B2BE; --g100:#C9EEF1; --g50:#ECFAFB;
  --gold:#00B2BE; --gold2:#0497A2; --gold-bg:#ECFAFB;
  --cream:rgba(255,255,255,.55); --warm1:rgba(35,31,32,.05); --warm2:rgba(35,31,32,.10);
  --t1:#231F20; --t2:#4A4546; --t3:#7A7476;
  --red:#CF4D4D; --red-bg:#FBECEC;
  --r:16px; --r2:16px;
}
:host *{ font-family:inherit; }
/* QSA 가 대신하는 부분 숨김: 로그인·승인 대기·원본 사이드바·다른 화면 */
#loginScreen, #pendingScreen, .sidebar, .mobile-menu-btn, .mobile-menu-overlay{ display:none !important; }
.view:not(#vCert){ display:none !important; }
.layout{ display:block !important; min-height:0 !important; }
.main{ padding:0 !important; overflow:visible !important; }

/* 머리말: 제목은 QSA 페이지 제목과 겹치므로 숨기고, 발급/이력 버튼만 탭처럼 */
.pg-title, .pg-sub{ display:none; }
.pg-head{ margin-bottom:20px; padding:8px; justify-content:flex-start;
  background:rgba(255,255,255,.62); -webkit-backdrop-filter:blur(14px) saturate(140%); backdrop-filter:blur(14px) saturate(140%);
  border:1px solid rgba(255,255,255,.7); border-radius:16px; box-shadow:0 1px 2px rgba(35,31,32,.05), 0 10px 28px rgba(35,31,32,.07); }
.pg-head > div:first-child{ display:none; }
.pg-actions{ display:flex; gap:6px; }

/* 유리 카드 */
.card{ background:rgba(255,255,255,.62) !important; border:1px solid rgba(255,255,255,.7) !important;
  -webkit-backdrop-filter:blur(14px) saturate(140%); backdrop-filter:blur(14px) saturate(140%);
  border-radius:16px !important; box-shadow:0 1px 2px rgba(35,31,32,.05), 0 10px 28px rgba(35,31,32,.07) !important; }
.card-head{ min-height:52px; padding:0 20px; border-bottom:1px solid rgba(35,31,32,.09); }
.card-head-title{ display:flex; align-items:center; gap:8px; font-weight:700; }
.card-head-title::before{ content:""; width:4px; height:16px; border-radius:2px; background:#00B2BE; }
.card-body{ padding:20px; }

/* 입력 */
.fg label{ font-size:13px; letter-spacing:0; text-transform:none; color:#4A4546; }
.fg input, .fg select, .fg textarea, .search-input{ border:1px solid rgba(35,31,32,.09) !important; border-radius:12px !important;
  background:rgba(255,255,255,.72); font-size:14px; }

/* 버튼: 주요=단색 Teal, 보조=흰 유리 */
.btn{ border-radius:12px; font-size:14px; font-weight:600; height:38px; padding:0 16px; }
.btn-sm{ height:32px; padding:0 12px; font-size:13px; }
.btn-gold, .btn-primary{ background:#00B2BE !important; color:#fff !important; }
.btn-gold:hover, .btn-primary:hover{ background:#0497A2 !important; }
.btn-ghost{ background:rgba(255,255,255,.78) !important; color:#115E66 !important; border:1px solid rgba(35,31,32,.09) !important; }
.btn-ghost:hover{ background:#fff !important; }
.btn-red{ background:#CF4D4D !important; color:#fff !important; }

/* 표 */
.tbl-wrap{ border:1px solid rgba(35,31,32,.09); border-radius:12px; background:rgba(255,255,255,.55); }
.tbl th{ background:rgba(236,250,251,.92) !important; color:#115E66; font-size:12.5px; letter-spacing:0; text-transform:none; }
.tbl td{ font-size:13px; }
.tbl tbody tr:nth-child(odd) td, .tbl tbody tr:nth-child(even) td{ background:transparent; }
.tbl tr:hover td{ background:rgba(255,255,255,.7) !important; }

/* 알림 */
.toast-wrap{ left:50%; right:auto; transform:translateX(-50%); bottom:32px; }
.toast{ background:rgba(35,31,32,.88); border-radius:999px; font-size:14px; font-weight:600; }
.toast.err{ background:#CF4D4D; }
`;

function notice(el, title, body) {
  const c = document.createElement("section");
  c.className = "card";
  c.innerHTML = `<div class="card-head"><h2></h2></div><div class="card-body"><p class="muted" style="color:var(--ink-2);line-height:1.7;white-space:pre-line"></p></div>`;
  c.querySelector("h2").textContent = title;
  c.querySelector("p").textContent = body;
  el.replaceChildren(c);
}

export async function mount(el, ctx) {
  // ── 원본 프로젝트 연결 ──
  // 이미 연결된 적이 있으면(브라우저에 저장됨) 바로 진행, 아니면 버튼을 눌러 연결
  // (Google 창은 클릭으로 열어야 팝업 차단에 걸리지 않음)
  const app = getLinkedApp("enroll");            // quetta-2ea94 (등록현황과 같은 원본 프로젝트)
  const linkedAuth = getAuth(app);
  await linkedAuth.authStateReady();
  let srcUser = linkedAuth.currentUser;
  if (srcUser && srcUser.email?.toLowerCase() !== ctx.profile.email) {
    await linkedAuth.signOut();                  // 다른 계정으로 연결돼 있으면 끊고 다시
    srcUser = null;
  }
  if (!srcUser) {
    srcUser = await new Promise((resolve) => {
      const c = document.createElement("section");
      c.className = "card";
      c.innerHTML = `<div class="card-head"><h2>원본(전입신고 관리) 연결</h2></div>
        <div class="card-body">
          <p class="muted" style="color:var(--ink-2);line-height:1.7;margin-bottom:var(--s4)">증명서 데이터는 기존 전입신고 관리 앱과 같은 곳에 있습니다.<br>지금 로그인한 Google 계정으로 한 번 연결하면, 다음부터는 자동으로 연결됩니다.</p>
          <button class="btn" type="button">Google 계정으로 연결</button>
          <p class="muted" data-err style="margin-top:var(--s3);color:var(--danger)"></p>
        </div>`;
      const btn = c.querySelector("button");
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          const u = await linkSignIn(app);
          if (u.email?.toLowerCase() !== ctx.profile.email) {
            await linkedAuth.signOut();
            throw new Error(`QSA에 로그인한 계정(${ctx.profile.email})과 같은 계정을 골라주세요`);
          }
          resolve(u);
        } catch (e) {
          c.querySelector("[data-err]").textContent = `연결하지 못했습니다 (${e.code || e.message})`;
          btn.disabled = false;
        }
      };
      el.replaceChildren(c);
    });
    el.replaceChildren();
  }
  const srcDb = getFirestore(app);

  // 원본 앱의 직원 승인 확인 (users/{uid}.role === 'staff')
  try {
    const u = await getDoc(doc(srcDb, "users", srcUser.uid));
    if (!u.exists() || u.data().role !== "staff") {
      return notice(el, "원본 앱에서 직원 승인이 필요합니다",
        `증명서 데이터는 기존 전입신고 관리 앱의 직원 권한으로 접근합니다.\n기존 앱의 직원 계정으로 "사용자 관리"에서 아래 UID를 직원(staff)으로 승인해 주세요.\n\nUID: ${srcUser.uid}\n이메일: ${srcUser.email}`);
    }
  } catch (e) {
    console.error(e);
    return notice(el, "원본 권한을 확인하지 못했습니다", `원본 프로젝트의 보안 규칙을 확인해 주세요. (${e.code || e.message})`);
  }

  // ── 도구 로드 ──
  await Promise.all(LIBS.map(([g, src]) => loadScript(g, src)));

  // ── 원본 화면 (섀도 DOM) ──
  const host = document.createElement("div");
  host.className = "cert-host";
  el.append(host);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${CSS}</style><style>${QSA_SKIN}</style>${MARKUP}`;

  // PDF 생성용 컨테이너는 문서 쪽으로 옮김 (html2canvas 가 섀도 DOM 을 그리지 못함)
  const pdfBox = root.getElementById("certPdfContainer");
  if (pdfBox) {
    document.body.append(pdfBox);
    ctx.track(() => pdfBox.remove());
  }

  const api = await start(root, {
    db: srcDb,
    fs: { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, setDoc,
          query, orderBy, writeBatch, runTransaction, serverTimestamp, onSnapshot },
  });
  await api.boot(ctx.profile);
}
