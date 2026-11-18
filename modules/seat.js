// 수업운영 › 좌석 배정
//  · 원본 「모의고사 좌석배치」를 거의 그대로 옮긴 페이지(apps/seating/index.html)를 화면 안에 띄웁니다.
//  · 같은 주소라 QSA 로그인을 그대로 이어받고, 인쇄·팝업도 원본과 똑같이 동작합니다.
//  · 데이터: QSA DB seat_state / seat_snapshots / seat_logs (권한: 관리자 또는 'seating')
export async function mount(el, ctx) {
  // 이 파일의 배포 버전(?v=…)을 그대로 붙여 예전 화면이 캐시되지 않게 함
  const v = new URL(import.meta.url).searchParams.get("v") || Date.now();
  const frame = document.createElement("iframe");
  frame.src = `apps/seating/index.html?v=${v}`;
  frame.title = "좌석 배정";
  frame.style.cssText = "width:100%;border:0;border-radius:16px;background:transparent;display:block";
  frame.setAttribute("allowtransparency", "true");

  const fit = () => {
    const top = frame.getBoundingClientRect().top;
    frame.style.height = `${Math.max(560, window.innerHeight - top - 24)}px`;
  };
  el.append(frame);
  fit();
  window.addEventListener("resize", fit);
  ctx.track(() => window.removeEventListener("resize", fit));

  const note = document.createElement("p");
  note.className = "muted";
  note.style.cssText = "font-size:12px;margin-top:var(--s2)";
  note.innerHTML = '기존 데이터를 옮기려면 <a href="#seat-import">좌석 배정 데이터 가져오기</a>(관리자)를 사용하세요.';
  if (ctx.profile.role === "admin") el.append(note);
}
