// QSA 설정 파일
// ─────────────────────────────────────────────────────────────
// 1) Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹) 에서 받은 값을 아래에 붙여넣으세요.
//    이 값(apiKey 포함)은 브라우저에 노출되는 "웹 설정값"이라 공개돼도 되지만,
//    반드시 ① Firestore Security Rules ② API 키 HTTP referrer 제한 을 함께 걸어야 합니다.
// 2) 비밀 키(paffy API, Supabase service key, GitHub 토큰 등)는 절대 이 파일에 넣지 마세요.
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyChC7cRYAii31ac8yUEZA8Rex5CgpZECWQ",
  authDomain: "quetta-attendance.firebaseapp.com",
  databaseURL: "https://quetta-attendance-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quetta-attendance",
  storageBucket: "quetta-attendance.firebasestorage.app",
  messagingSenderId: "669499495003",
  appId: "1:669499495003:web:b4d262a6123945e45d257e"
};

// 연결하는 기존 프로젝트들 (웹 설정값만. 비밀 키는 넣지 않음)
//  · enroll: 등록현황 원본(quetta-2ea94). 지금은 "데이터 가져오기"에서 읽기 전용으로만 사용
export const linkedProjects = {
  //  · scholarship: 장학 관리 원본(grades-of-test). "장학 관리 데이터 가져오기"에서 읽기 전용으로만 사용
  scholarship: {
    apiKey: "AIzaSyBQ3V-4EYiIKShPmfuNwhPMz-WiiTzi6CM",
    authDomain: "grades-of-test.firebaseapp.com",
    projectId: "grades-of-test",
    storageBucket: "grades-of-test.firebasestorage.app",
    messagingSenderId: "607351091085",
    appId: "1:607351091085:web:19b3b42ee58bb0045f57c4",
  },
  //  · seating: 좌석 배정 원본(quetta-seating). "좌석 배정 데이터 가져오기"에서 읽기 전용으로만 사용
  seating: {
    apiKey: "AIzaSyCbHwOifJ_ajPyxr66uTUpqugDl5GW8tOY",
    authDomain: "quetta-seating.firebaseapp.com",
    projectId: "quetta-seating",
    storageBucket: "quetta-seating.firebasestorage.app",
    messagingSenderId: "804478055238",
    appId: "1:804478055238:web:1513972a9df85405f7ab47",
  },
  //  · forest: 노동숲(workers-forest). 홈의 "이번 주 교무 일정"에서 읽기 전용으로만 사용
  forest: {
    apiKey: "AIzaSyCO8sBUNHVxUWcxATzF-aH1jw2T58soMHQ",
    authDomain: "workers-forest.firebaseapp.com",
    projectId: "workers-forest",
    storageBucket: "workers-forest.firebasestorage.app",
    messagingSenderId: "939967968083",
    appId: "1:939967968083:web:1568dc80234631618827a6",
  },
  enroll: {
    apiKey: "AIzaSyAtIteJqFLAjZk-OOaj3nkkZVD77vYFZ4o",
    authDomain: "quetta-2ea94.firebaseapp.com",
    projectId: "quetta-2ea94",
    storageBucket: "quetta-2ea94.firebasestorage.app",
    messagingSenderId: "742368924282",
    appId: "1:742368924282:web:db7dabb31ff08ea97521c3"
  },
};

// 사이드바 메뉴 (DSA 처럼 그룹 제목 + 메뉴 + 펼침 하위 메뉴)
//  · { group: "제목" }                 → 작은 그룹 제목
//  · { id, label, icon, ready, loader } → 메뉴 하나
//  · { label, icon, children: [...] }   → 펼침 메뉴 (하위 항목은 id/label/ready/loader)
// ready:false 인 항목은 "준비 중"으로 비활성 표시됩니다.
// hidden:true 인 항목은 사이드바에 보이지 않고 다른 화면의 버튼으로만 들어갑니다.
// 권한: 메뉴 ID(또는 perm)가 계정의 menus 에 있어야 보입니다. adminOnly 는 관리자만.
// 새 모듈을 이식하면 loader 를 채우고 ready:true 로 바꾸면 됩니다.
export const menu = [
  { id: "home",        label: "홈",        icon: "house",              ready: true,  loader: () => import("../modules/home.js") },
  { group: "인원관리" },
  { id: "enroll",        label: "등록현황",        icon: "clipboard-list", ready: true, loader: () => import("../modules/enroll.js") },
  { id: "enroll-import", label: "등록현황 데이터 가져오기", icon: "download-cloud", ready: true, hidden: true, perm: "enroll", loader: () => import("../modules/enroll-import.js") },
  { id: "class-assign", label: "반배정",    icon: "shuffle",         ready: false },
  { id: "transfer",    label: "전입신고",  icon: "home",               ready: false },
  { group: "수업운영" },
  { id: "seating",     label: "좌석 배정", icon: "armchair",           ready: true, loader: () => import("../modules/seat.js") },
  { id: "seat-import", label: "좌석 배정 데이터 가져오기", icon: "download-cloud", ready: true, hidden: true, adminOnly: true, loader: () => import("../modules/seat-import.js") },
  { id: "scholarship", label: "장학 관리", icon: "award",              ready: true, loader: () => import("../modules/scholarship.js") },
  { id: "schol-import", label: "장학 관리 데이터 가져오기", icon: "download-cloud", ready: true, hidden: true, adminOnly: true, loader: () => import("../modules/schol-import.js") },
  { id: "textbook",    label: "교재 입고", icon: "package-check",      ready: false },
  { id: "lecture",     label: "특강 관리", icon: "presentation",       ready: false },
  { group: "유틸리티" },
  { id: "cert",        label: "증명서 발급", icon: "file-badge",       ready: true, loader: () => import("../modules/cert.js") },
  { id: "cert-import", label: "증명서 기존 이력 가져오기", icon: "download-cloud", ready: true, hidden: true, perm: "cert", loader: () => import("../modules/cert-import.js") },
  { id: "sms",         label: "연간 발송 문자", icon: "message-square", ready: true, loader: () => import("../modules/sms.js") },
  { group: "설정" },
  { id: "accounts",    label: "계정 관리", icon: "users",              ready: true, adminOnly: true, loader: () => import("../modules/accounts.js") },
  { id: "settings",    label: "연결 설정", icon: "link",               ready: true, adminOnly: true, loader: () => import("../modules/settings.js") },
];

// 라우터용: 펼침 메뉴의 하위 항목까지 한 줄로 편 목록 (상위 그룹·메뉴 이름 포함)
export const flatMenu = (() => {
  const out = [];
  let group = null;
  for (const m of menu) {
    if (m.group) { group = m.group; continue; }
    if (m.children) m.children.forEach((c) => out.push({ ...c, group, parent: m.label }));
    else out.push({ ...m, group });
  }
  return out;
})();

// ── 권한 ──
// 계정 문서(qsa_admins/이메일): { name, dept, role: "admin"|"member", menus: [메뉴 ID…] }
// 화면에서의 숨김은 안내용이고, 실제 데이터 차단은 firestore.rules 가 같은 기준으로 합니다.
export const permOf = (item) => item.perm || item.id;

export function canSee(profile, item) {
  if (!profile || !item) return false;
  if (item.id === "home") return true;
  if (profile.role === "admin") return true;
  if (item.adminOnly) return false;
  return (profile.menus || []).includes(permOf(item));
}

// 계정 관리에서 체크박스로 줄 수 있는 메뉴 (홈·숨김·관리자 전용 제외, 준비 중 포함)
export const grantableMenus = flatMenu.filter((m) => m.id !== "home" && !m.hidden && !m.adminOnly);
