// 홈 모듈 — 모듈 작성 예시를 겸합니다.
//  · 화면은 공통 부품(card, table, badge)으로 구성
//  · 본인 데이터만 접근: qsa_users/{uid} (규칙상 본인 문서만 읽기/쓰기 가능)
//  · 구독 해제 함수는 ctx.track 으로 넘김
import {
  doc, setDoc, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { mountForestWeek } from "./forest-week.js";

const STEPS = [
  { step: "기반",     what: "로그인, 계정·권한, 보안 규칙, 화면 틀, 연결 설정", state: "완료" },
  { step: "인원관리", what: "등록현황(병행 검증 중), 반배정, 전입신고", state: "다음" },
  { step: "수업운영", what: "좌석 배정, 장학 관리, 교재 입고, 특강 관리", state: "예정" },
  { step: "유틸리티", what: "증명서 발급 (정규 마스터 명단, 직인, 기존 이력 가져오기)", state: "완료" },
];

export async function mount(el, ctx) {
  const { db, user } = ctx;
  const name = user.displayName || user.email.split("@")[0];

  el.innerHTML = `
    <section class="card">
      <div class="card-head dark"><h2></h2></div>
      <div class="card-body">
        <p class="muted">사이드바의 메뉴는 이식이 끝나는 대로 하나씩 열립니다.</p>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>QSA 진행 상황</h2></div>
      <div class="card-body">
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th style="width:96px">단계</th><th class="left">내용</th><th style="width:96px">상태</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>내 접속 기록</h2></div>
      <div class="card-body"><p class="muted" data-last>불러오는 중…</p></div>
    </section>`;

  el.querySelector(".card-head.dark h2").textContent = `${name} 님, 반갑습니다`;

  // 이번 주 교무 일정 (노동숲, 관리자만) — 환영 카드 바로 아래
  if (ctx.profile?.role === "admin") {
    const slot = document.createElement("div");
    el.querySelector(".card").after(slot);
    mountForestWeek(slot, ctx).catch((e) => console.error("[노동숲]", e));
  }

  const tbody = el.querySelector("tbody");
  for (const s of STEPS) {
    const tr = document.createElement("tr");
    const cls = s.state === "완료" ? "done" : s.state === "다음" ? "next" : "";
    tr.innerHTML = `<td></td><td class="left"></td><td><span class="badge ${cls}"></span></td>`;
    tr.children[0].textContent = s.step;
    tr.children[1].textContent = s.what;
    tr.querySelector(".badge").textContent = s.state;
    tbody.append(tr);
  }

  // 본인 문서에 마지막 접속 시각 기록
  const ref = doc(db, "qsa_users", user.uid);
  const lastEl = el.querySelector("[data-last]");
  try {
    await setDoc(ref, { email: user.email.toLowerCase(), lastLoginAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    lastEl.textContent = `기록을 저장하지 못했습니다 (${err.code}). 보안 규칙 배포 여부를 확인하세요.`;
    return;
  }

  const unsub = onSnapshot(ref, (snap) => {
    const t = snap.data()?.lastLoginAt?.toDate?.();
    lastEl.textContent = t ? `마지막 접속 ${t.toLocaleString("ko-KR")}` : "기록 저장 중…";
  }, (err) => {
    lastEl.textContent = `기록을 읽지 못했습니다 (${err.code}). 보안 규칙 배포 여부를 확인하세요.`;
  });
  ctx.track(unsub); // 메뉴를 떠나면 자동 해제
}
