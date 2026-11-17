// 홈 › 이번 주 교무 일정 — 노동숲(workers-forest) 데이터를 읽기만 해서 보여줍니다.
//  · 관리자(교무)만 표시
//  · 노동숲 쪽에는 아무것도 쓰지 않음 (수정·완료 체크는 노동숲에서)
//  · 노동숲 저장 구조: board/tasks { data: JSON("멤버ID_YYYY-MM-DD" → [{ text, done, … }]) }, board/config { members, emailMap }
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getLinkedApp } from "../core/firebase.js";
import { linkSignIn } from "../core/auth.js";

const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F\u200D]/gu;

function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const k = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - k);
  return x;
}

export async function mountForestWeek(host, ctx) {
  const card = document.createElement("section");
  card.className = "card";
  card.innerHTML = `
    <div class="card-head"><h2>이번 주 교무 일정</h2>
      <div class="toolbar" style="margin:0">
        <button class="btn btn-line btn-sm" type="button" data-prev>지난주</button>
        <button class="btn btn-line btn-sm" type="button" data-this>이번 주</button>
        <button class="btn btn-line btn-sm" type="button" data-next>다음 주</button>
      </div>
    </div>
    <div class="card-body" data-body><p class="muted">노동숲 일정을 불러오는 중…</p></div>`;
  host.append(card);
  const body = card.querySelector("[data-body]");

  const app = getLinkedApp("forest");
  const fAuth = getAuth(app);
  await fAuth.authStateReady();
  let user = fAuth.currentUser;
  if (user && user.email?.toLowerCase() !== ctx.profile.email) { await fAuth.signOut(); user = null; }

  if (!user) {
    body.innerHTML = `<p class="muted" style="margin-bottom:var(--s3)">노동숲 일정을 보려면 QSA와 같은 Google 계정으로 노동숲에 한 번 연결해 주세요. 다음부터는 자동으로 연결됩니다.</p>
      <button class="btn" type="button" data-link>노동숲 연결</button>
      <p class="muted" data-err style="margin-top:var(--s2);color:var(--danger)"></p>`;
    await new Promise((resolve) => {
      body.querySelector("[data-link]").onclick = async (ev) => {
        ev.currentTarget.disabled = true;
        try {
          const u = await linkSignIn(app);
          if (u.email?.toLowerCase() !== ctx.profile.email) {
            await fAuth.signOut();
            throw new Error(`QSA 로그인 계정(${ctx.profile.email})과 같은 계정을 골라주세요`);
          }
          resolve();
        } catch (e) {
          body.querySelector("[data-err]").textContent = `연결하지 못했습니다 (${e.code || e.message})`;
          ev.currentTarget.disabled = false;
        }
      };
    });
  }

  // ── 노동숲 읽기 (문서 2건) ──
  let tasks = {}, members = [], emailMap = {}, cfg = {};
  try {
    const db = getFirestore(app);
    const [td, cd] = await Promise.all([getDoc(doc(db, "board", "tasks")), getDoc(doc(db, "board", "config"))]);
    tasks = td.exists() && td.data().data ? JSON.parse(td.data().data) : {};
    cfg = cd.exists() ? cd.data() : {};
    members = Array.isArray(cfg.members) ? cfg.members : [];
    emailMap = cfg.emailMap || {};
  } catch (e) {
    console.error(e);
    body.innerHTML = "";
    const p = document.createElement("p");
    p.style.color = "var(--danger)";
    p.textContent = `노동숲 일정을 읽지 못했습니다 (${e.code || e.message}). 이 계정이 노동숲을 쓸 수 있는 계정인지 확인해 주세요.`;
    body.append(p);
    return;
  }
  if (!members.length) {
    // 멤버 정보가 없으면 업무 키(멤버ID_날짜)에서 멤버 ID 를 모음
    members = [...new Set(Object.keys(tasks).map((k) => k.split("_")[0]))].map((id) => ({ id, name: id }));
  }

  // ── 본인을 맨 위로 (노동숲 emailMap: 이메일 → 멤버 ID) ──
  const myMid = emailMap[ctx.profile.email] || Object.entries(emailMap).find(([e]) => e.toLowerCase() === ctx.profile.email)?.[1] || null;
  if (myMid) members = [...members.filter((m) => m.id === myMid), ...members.filter((m) => m.id !== myMid)];

  // ── 연차·반차 ──
  // 노동숲 leaveData: { 'YYYY-MM-DD': [멤버ID, …] } (연차). 반차는 버전에 따라 형태가 달라서 넓게 해석:
  //  · 항목이 객체면 {mid|id|memberId, type|kind|half}, 문자열이면 'm1' / 'm1_half' / 'm1:오전' 등
  //  · config 안에 'half' 가 들어간 이름의 같은 구조 데이터가 있으면 반차로 봄
  const HALF_RE = /half|반차|am|pm|오전|오후/i;
  const leaveMap = {};   // 'mid_ds' → { kind: '연차' | '반차', part: '오전' | '오후' | '' }
  function addLeave(ds, entry, forceHalf) {
    let mid = "", hint = "";
    if (entry && typeof entry === "object") { mid = entry.mid || entry.id || entry.memberId || ""; hint = String(entry.type || entry.kind || entry.half || entry.part || ""); }
    else { const str = String(entry); mid = str.split(/[_:|\-\s]/)[0]; hint = str.slice(mid.length); }
    if (!mid) return;
    const half = forceHalf || HALF_RE.test(hint) || (entry && entry.half === true);
    const part = /am|오전/i.test(hint) ? "오전" : /pm|오후/i.test(hint) ? "오후" : "";
    leaveMap[`${mid}_${ds}`] = { kind: half ? "반차" : "연차", part };
  }
  for (const [key, val] of Object.entries(cfg)) {
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    const isLeave = key === "leaveData" || /half/i.test(key);
    if (!isLeave) continue;
    for (const [ds, list] of Object.entries(val)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) continue;
      (Array.isArray(list) ? list : [list]).forEach((e) => addLeave(ds, e, /half/i.test(key)));
    }
  }

  let offset = 0; // 0 = 이번 주
  function render() {
    const today = fmt(new Date());
    const start = mondayOf(new Date());
    start.setDate(start.getDate() + offset * 7);
    const days = [...Array(7)].map((_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });

    const wrap = document.createElement("div");
    const label = `${fmt(days[0]).slice(5)} ~ ${fmt(days[6]).slice(5)}`;
    wrap.innerHTML = `<p class="muted" style="margin-bottom:var(--s3)">${offset === 0 ? "이번 주" : offset > 0 ? "다음 주" : "지난주"} · ${label} · 수정과 완료 체크는 노동숲에서 합니다.</p>`;

    const tw = document.createElement("div");
    tw.className = "table-wrap";
    const head = days.map((d) => {
      const ds = fmt(d);
      return `<th${ds === today ? ' style="color:var(--teal-strong)"' : ""}>${DOW[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}</th>`;
    }).join("");
    tw.innerHTML = `<table class="table" style="table-layout:fixed;min-width:860px"><thead><tr><th style="width:96px">담당</th>${head}</tr></thead><tbody></tbody></table>`;
    const tb = tw.querySelector("tbody");
    for (const m of members) {
      const tr = document.createElement("tr");
      const nameTd = document.createElement("td");
      nameTd.style.fontWeight = "700";
      nameTd.textContent = (m.name || m.id).replace(EMOJI, "").trim();
      if (m.id === myMid) {
        const me = document.createElement("span");
        me.className = "badge done"; me.style.cssText = "margin-left:6px;height:20px;font-size:11px";
        me.textContent = "나";
        nameTd.append(me);
        tr.style.background = "rgba(236,250,251,.55)";
      }
      if (m.color) nameTd.style.borderLeft = `3px solid ${m.color}`;
      tr.append(nameTd);
      let any = false;
      for (const d of days) {
        const td = document.createElement("td");
        td.style.cssText = "vertical-align:top;text-align:left;white-space:normal;font-size:12.5px;line-height:1.5";
        const lv = leaveMap[`${m.id}_${fmt(d)}`];
        if (lv) {
          any = true;
          const b = document.createElement("span");
          b.className = lv.kind === "연차" ? "badge next" : "badge";
          b.style.cssText = "height:20px;font-size:11px;margin-bottom:4px";
          b.textContent = lv.part ? `${lv.kind}·${lv.part}` : lv.kind;
          td.append(b);
          if (lv.kind === "연차") td.style.background = "rgba(239,241,250,.7)";
        }
        const list = tasks[`${m.id}_${fmt(d)}`] || [];
        for (const t of list) {
          any = true;
          const div = document.createElement("div");
          div.textContent = (t.done ? "✓ " : "· ") + (t.text || "");
          if (t.done) { div.style.color = "var(--ink-3)"; div.style.textDecoration = "line-through"; }
          td.append(div);
        }
        tr.append(td);
      }
      if (any || offset === 0) tb.append(tr);
    }
    if (!tb.children.length) tb.innerHTML = `<tr><td colspan="8" class="muted">이 주에는 등록된 업무가 없습니다.</td></tr>`;
    wrap.append(tw);
    body.replaceChildren(wrap);
  }
  card.querySelector("[data-prev]").onclick = () => { offset = -1; render(); };
  card.querySelector("[data-this]").onclick = () => { offset = 0; render(); };
  card.querySelector("[data-next]").onclick = () => { offset = 1; render(); };
  render();
}
