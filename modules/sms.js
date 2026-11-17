// 유틸리티 › 연간 발송 문자
//  · 연간 발송 문자 구글시트를 Apps Script 로 읽어와 검색·필터·복사
//  · 시트 주소(Apps Script 웹 앱)는 '설정 › 연결 설정'의 smsArchive 에서 관리
//  · 시트는 읽기만 하고, QSA DB 에도 저장하지 않음 (매번 시트에서 최신으로)
import { getLink } from "./settings.js";

const pad = (n) => String(n).padStart(2, "0");
let cache = null;   // 같은 접속 동안 재사용 (메뉴 이동해도 다시 안 부름)

export async function mount(el, ctx) {
  el.innerHTML = `
    <section class="card">
      <div class="card-head dark"><h2>조건검색</h2></div>
      <div class="card-body">
        <div class="filters">
          <select class="select" data-f="year" aria-label="연도"></select>
          <select class="select" data-f="month" aria-label="월"></select>
          <select class="select" data-f="academy" aria-label="발송학원"></select>
          <select class="select" data-f="type" aria-label="문자 유형"></select>
          <select class="select" data-f="target" aria-label="대상"></select>
          <input class="input" data-f="q" placeholder="검색어 (행사·문자 내용·비고)" style="flex:1;min-width:220px">
          <button class="btn btn-line" type="button" data-reload>다시 불러오기</button>
        </div>
        <p class="muted" data-status style="margin-top:var(--s3);font-size:13px">불러오는 중…</p>
      </div>
    </section>
    <div class="sms-grid">
      <section class="card">
        <div class="card-head"><h2>발송 목록</h2><span class="muted" data-count></span></div>
        <div class="card-body" style="padding:0">
          <div class="table-wrap" style="border:0;border-radius:0;max-height:62vh;overflow:auto">
            <table class="table sms-table">
              <thead><tr><th style="width:92px">날짜</th><th class="left">발송 문자</th><th>유형</th><th>대상</th><th>채널</th></tr></thead>
              <tbody data-rows></tbody>
            </table>
          </div>
        </div>
      </section>
      <section class="card" data-detail>
        <div class="card-head"><h2>문자 내용</h2></div>
        <div class="card-body"><p class="muted">왼쪽 목록에서 문자를 고르세요.</p></div>
      </section>
    </div>
    <style>
      .sms-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: var(--s5); align-items: start; }
      .sms-table td { white-space: normal; }
      .sms-table td:first-child { white-space: nowrap; }
      .sms-title { font-weight: 600; color: var(--ink); }
      .sms-sub { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
      .sms-sub:empty { display: none; }
      .sms-table tbody tr { cursor: pointer; }
      .sms-table tbody tr.is-on td { background: var(--teal-soft) !important; }
      .sms-msg { white-space: pre-wrap; word-break: keep-all; line-height: 1.7; font-size: 14px; padding: var(--s4);
        border: 1px solid var(--line); border-radius: var(--r-sm); background: rgba(255,255,255,.75); max-height: 46vh; overflow: auto; }
      .sms-meta { display: grid; grid-template-columns: 72px 1fr; gap: var(--s1) var(--s3); font-size: 13px; margin-bottom: var(--s4); }
      .sms-meta dt { color: var(--ink-3); } .sms-meta dd { margin: 0; }
      .sms-detail-card { position: sticky; top: calc(var(--top-h) + 12px); }
      @media (max-width: 1000px) { .sms-grid { grid-template-columns: 1fr; } }
    </style>`;
  el.querySelector("[data-detail]").classList.add("sms-detail-card");

  const $ = (s) => el.querySelector(s);
  const f = (k) => el.querySelector(`[data-f="${k}"]`);
  const status = (t, err = false) => { const s = $("[data-status]"); s.textContent = t; s.style.color = err ? "var(--danger)" : ""; };

  async function load(force = false) {
    if (cache && !force) return cache;
    const url = await getLink(ctx.db, "smsArchive").catch(() => "");
    if (!url) throw new Error("연간 발송 문자 시트 주소가 없습니다. 관리자가 '설정 › 연결 설정'에서 입력해야 합니다.");
    const idToken = await ctx.auth.currentUser.getIdToken();
    const res = await fetch(url, { method: "POST", body: JSON.stringify({ idToken }) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "불러오지 못했습니다");
    cache = { rows: data.rows || [], tabs: data.tabs || [], at: new Date() };
    return cache;
  }

  function fillSelect(sel, label, values, keep) {
    const cur = keep ? sel.value : "";
    sel.replaceChildren();
    const all = document.createElement("option"); all.value = ""; all.textContent = label; sel.append(all);
    for (const v of values) { const o = document.createElement("option"); o.value = v; o.textContent = v; sel.append(o); }
    if (cur && values.includes(cur)) sel.value = cur;
  }

  function setupFilters(rows) {
    const uniq = (k) => [...new Set(rows.map((r) => r[k]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
    const years = [...new Set(rows.map((r) => (r.date || "").slice(0, 4)).filter((y) => /^\d{4}$/.test(y)))].sort().reverse();
    fillSelect(f("year"), "전체 연도", years, true);
    const months = [...Array(12)].map((_, i) => pad(i + 1));
    fillSelect(f("month"), "전체 월", months, true);
    [...f("month").options].forEach((o) => { if (o.value) o.textContent = `${Number(o.value)}월`; });
    fillSelect(f("academy"), "전체 학원", uniq("academy"), true);
    fillSelect(f("type"), "전체 유형", uniq("type"), true);
    fillSelect(f("target"), "전체 대상", uniq("target"), true);
    // 처음엔 QUETTA 문자. 연도·월은 비워 두어 "작년 같은 시기" 기본 보기가 되게 함
    if (!f("academy").value) { const q = [...f("academy").options].find((o) => /퀘타|QUETTA/i.test(o.value)); if (q) f("academy").value = q.value; }
  }

  function showDetail(r) {
    const d = $("[data-detail] .card-body");
    d.innerHTML = `
      <dl class="sms-meta"></dl>
      <div class="sms-msg" data-msg></div>
      <div class="toolbar" style="margin:var(--s4) 0 0">
        <button class="btn" type="button" data-copy>문자 복사</button>
        <span class="muted" data-copied style="font-size:13px"></span>
      </div>
      <div data-links style="margin-top:var(--s3)"></div>
      <div data-extra style="margin-top:var(--s3)"></div>`;
    const meta = d.querySelector(".sms-meta");
    for (const [k, v] of [["날짜", r.date], ["같은 날 행사", r.event], ["유형", r.type], ["학원", r.academy], ["부서", r.dept], ["대상", r.target], ["채널", r.channel], ["비고", r.note]]) {
      if (!v) continue;
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      meta.append(dt, dd);
    }
    d.querySelector("[data-msg]").textContent = r.message || "(시트에 문자 본문이 없습니다. 아래 링크로 원문을 확인하세요)";
    d.querySelector("[data-copy]").disabled = !r.message;
    d.querySelector("[data-copy]").onclick = async () => {
      try { await navigator.clipboard.writeText(r.message); d.querySelector("[data-copied]").textContent = "복사했습니다."; }
      catch (e) { d.querySelector("[data-copied]").textContent = "복사하지 못했습니다. 본문을 직접 선택해 복사해 주세요."; }
    };
    const lk = d.querySelector("[data-links]");
    for (const l of r.links || []) {
      const a = document.createElement("a");
      a.href = l.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.className = "btn btn-line btn-sm"; a.style.marginRight = "var(--s2)";
      a.textContent = `원문 열기${l.label ? ` · ${l.label}` : ""}`;
      lk.append(a);
    }
    if (r.detail) {
      const p = document.createElement("p"); p.className = "muted"; p.style.cssText = "font-size:13px;white-space:pre-wrap";
      p.textContent = `상세내용: ${r.detail}`;
      d.querySelector("[data-extra]").append(p);
    }
  }

  // 기본 보기: 조건(연도·월·유형·대상·검색어)을 안 고르면 "1년 전 오늘 ±15일"에 보낸 문자
  const WINDOW_DAYS = 15;
  function lastYearWindow() {
    const pad2 = (n) => String(n).padStart(2, "0");
    const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const t = new Date();
    const base = new Date(t.getFullYear() - 1, t.getMonth(), t.getDate());   // 2/29 는 3/1 로 넘어감
    const from = new Date(base); from.setDate(from.getDate() - WINDOW_DAYS);
    const to = new Date(base); to.setDate(to.getDate() + WINDOW_DAYS);
    return { from: iso(from), to: iso(to), center: iso(base) };
  }

  function render() {
    const rows = cache?.rows || [];
    const y = f("year").value, m = f("month").value, ac = f("academy").value, ty = f("type").value, tg = f("target").value;
    const q = f("q").value.trim().toLowerCase();
    const isDefault = !y && !m && !ty && !tg && !q;   // 학원 선택은 기본 보기에서도 적용
    const win = lastYearWindow();
    const list = rows.filter((r) =>
      (!isDefault || ((r.date || "") >= win.from && (r.date || "") <= win.to)) &&
      (!y || (r.date || "").startsWith(y)) &&
      (!m || (r.date || "").slice(5, 7) === m) &&
      (!ac || r.academy === ac) && (!ty || r.type === ty) && (!tg || r.target === tg) &&
      (!q || [r.event, r.message, r.note, r.detail, r.type, r.target].join(" ").toLowerCase().includes(q)));
    $("[data-count]").textContent = isDefault
      ? `작년 같은 시기 · ${win.from.slice(5).replace("-", "/")} ~ ${win.to.slice(5).replace("-", "/")} · ${list.length}건`
      : `${list.length}건`;
    const tb = $("[data-rows]");
    tb.replaceChildren();
    for (const r of list.slice(0, 500)) {
      const tr = document.createElement("tr");
      tr.innerHTML = "<td></td><td class='left'><div class='sms-title'></div><div class='sms-sub'></div></td><td></td><td></td><td></td>";
      // 제목은 실제 보낸 문자(첫 줄). 같은 날 학원 행사·일정은 아래 작은 글씨로
      const firstLine = (r.message || "").split(/\n/).map((x) => x.trim()).find(Boolean) || (r.links?.[0]?.label) || "(문자 본문 없음)";
      tr.children[0].textContent = r.date || "-";
      tr.querySelector(".sms-title").textContent = firstLine.length > 60 ? firstLine.slice(0, 60) + "…" : firstLine;
      tr.querySelector(".sms-sub").textContent = r.event ? `행사·일정: ${r.event}` : "";
      [r.type, r.target, r.channel].forEach((v, i) => { tr.children[i + 2].textContent = v || "-"; });
      tr.onclick = () => { tb.querySelectorAll("tr.is-on").forEach((x) => x.classList.remove("is-on")); tr.classList.add("is-on"); showDetail(r); };
      tb.append(tr);
    }
    if (!list.length) tb.innerHTML = isDefault
      ? `<tr><td colspan="5" class="muted">작년 이맘때(${win.from} ~ ${win.to}) 보낸 문자가 없습니다. 연도·월을 골라 찾아보세요.</td></tr>`
      : `<tr><td colspan="5" class="muted">조건에 맞는 문자가 없습니다.</td></tr>`;
    // 기본 보기에서는 1년 전 오늘과 가장 가까운 문자를 바로 펼쳐 보여줌
    if (isDefault && list.length) {
      const near = list.reduce((a, b) => Math.abs(Date.parse(b.date) - Date.parse(win.center)) < Math.abs(Date.parse(a.date) - Date.parse(win.center)) ? b : a);
      const i = list.indexOf(near);
      const tr = tb.children[i];
      if (tr) { tr.classList.add("is-on"); showDetail(near); }
    }
    if (list.length > 500) status(`${list.length}건 중 500건만 표시합니다. 조건을 좁혀 주세요.`);
  }

  async function run(force) {
    status("시트에서 불러오는 중…");
    $("[data-reload]").disabled = true;
    try {
      const data = await load(force);
      setupFilters(data.rows);
      status(`${data.rows.length}건 · 탭 ${data.tabs.map((t) => `${t.name}(${t.count})`).join(", ")} · ${data.at.toLocaleTimeString("ko-KR")} 기준`);
      render();
    } catch (e) {
      console.error(e);
      status(e.message, true);
    } finally {
      $("[data-reload]").disabled = false;
    }
  }

  ["year", "month", "academy", "type", "target"].forEach((k) => f(k).addEventListener("change", render));
  let t = null;
  f("q").addEventListener("input", () => { clearTimeout(t); t = setTimeout(render, 200); });
  $("[data-reload]").addEventListener("click", () => run(true));
  await run(false);
}
