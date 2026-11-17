// 메뉴 이동 + 모듈 지연 로딩 + 구독 자동 해제
// 모든 모듈은 export async function mount(el, ctx) 형태로 만듭니다.
// onSnapshot 등 구독 해제 함수는 반드시 ctx.track(unsub) 으로 넘기세요.
// 메뉴를 떠나면 router 가 전부 해제합니다 → 한 모듈의 리스너가 할당량을 계속 쓰는 일을 막습니다.
import { flatMenu } from "./config.js";

let cleanups = [];
let currentId = null;

function runCleanups() {
  for (const fn of cleanups.splice(0)) {
    try { fn(); } catch (e) { console.warn("[QSA] 정리 중 오류", e); }
  }
}

export function stopRouter() {
  runCleanups();
  currentId = null;
}

export function routeId() {
  const id = location.hash.replace(/^#/, "");
  const item = flatMenu.find((m) => m.id === id && m.ready);
  return item ? id : "home";
}

export async function render(view, ctxBase, onChange) {
  const id = routeId();
  if (id === currentId) return;
  runCleanups();
  currentId = id;
  onChange?.(id);

  const item = flatMenu.find((m) => m.id === id);
  view.replaceChildren();
  view.setAttribute("aria-busy", "true");
  const ctx = { ...ctxBase, track: (fn) => cleanups.push(fn) };
  try {
    const mod = await item.loader();
    if (currentId !== id) return; // 로딩 중 다른 메뉴로 이동함
    const cleanup = await mod.mount(view, ctx);
    if (typeof cleanup === "function") cleanups.push(cleanup);
  } catch (e) {
    console.error(e);
    const box = document.createElement("div");
    box.className = "notice notice-error";
    box.textContent = `화면을 불러오지 못했습니다. 새로고침 후 다시 시도하세요. (${e.code || e.message})`;
    view.replaceChildren(box);
  } finally {
    view.removeAttribute("aria-busy");
  }
}
