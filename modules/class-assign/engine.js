// 반배정 엔진 (QSA 재작성판)
// ─────────────────────────────────────────────────────────────
// 원칙
//  · 화면·저장과 분리된 "순수 계산"만 담음 → 같은 입력이면 항상 같은 결과 (몇 번 눌러도 동일)
//  · 단계별로 나눠서 각 단계 결과를 따로 확인할 수 있게 함
//  · 기준표(구간·가산값·탐구 조합·영어표)는 원본 값을 그대로 씀 (tables.js)
//
// 확정된 규칙 (2026-11 교무 확인)
//  · K/S 계열은 점수 구간으로 자동, 겹치는 구간은 인원 균형
//  · 구간 사이 빈틈 점수는 "바로 아래 반"
//  · 정원 초과는 같은 계열 사다리 안에서만 성적순 아래 반으로
//  · 맨 아래 반까지 차면 억지로 넣지 않고 "배정 대기"로 → 사람이 직접 배정
//  · 사람이 정한 학생(locked)과 이미 반이 있는 학생은 자동 배정이 건드리지 않음
//  · 개강 후 수시 배정: suggest() — 계열은 맞추고 자리 있는 반·생활반 추천
// ─────────────────────────────────────────────────────────────
import * as T from "./tables.js";
const { INQUIRY_MAP, SUBJECT_GROUP, ENG_CLASS } = T;

// ── 시즌별로 바뀌는 기준 (설정 화면에서 고침). 기본값은 원본 그대로 ──
const clone = (o) => JSON.parse(JSON.stringify(o));
let HOMEROOM_BRACKETS = clone(T.HOMEROOM_BRACKETS);
let BRACKETS = clone(T.BRACKETS);
let MATH_BONUS = clone(T.MATH_BONUS);
let KOR_BONUS = clone(T.KOR_BONUS);

// ── 반 구성 (원본 값) ──
export const HOMEROOM_KS    = { X: "K", A: "K", K: "S", M: "K", O: "K", I: "K", N: "S", D: "S", S: "S" };
export const HOMEROOM_LNC   = { A: "A", X: "B", I: "B", O: "C", M: "C", K: "D", N: "D", D: "E", S: "E" };
export let GROUP_COUNT    = { A: 2, X: 3, I: 3, O: 3, M: 3, K: 3, N: 3, D: 2, S: 2 };   // 반별 생활반(조) 수 — 한 곳에서만 정의
export let HOMEROOM_CAPS  = { A: 60, X: 84, I: 84, O: 84, M: 84, K: 84, N: 84, D: 84, S: 84 };
export let GROUP_CAPS     = { A: 30, X: 30, I: 30, O: 30, M: 30, K: 30, N: 30, D: 45, S: 45 };
const DEFAULT_RULES = clone({ homeroomBrackets: HOMEROOM_BRACKETS, brackets: BRACKETS, mathBonus: MATH_BONUS, korBonus: KOR_BONUS,
  caps: HOMEROOM_CAPS, groupCount: GROUP_COUNT, groupCaps: GROUP_CAPS });

// 원본 기본 기준 (복사본)
export function defaultRules() { return clone(DEFAULT_RULES); }
// 현재 기준 (복사본)
export function currentRules() {
  return clone({ homeroomBrackets: HOMEROOM_BRACKETS, brackets: BRACKETS, mathBonus: MATH_BONUS, korBonus: KOR_BONUS, caps: HOMEROOM_CAPS, groupCount: GROUP_COUNT, groupCaps: GROUP_CAPS });
}
// 시즌 기준 적용 (빠진 항목은 원본 기본값)
export function applyRules(r) {
  const d = defaultRules(), x = r || {};
  HOMEROOM_BRACKETS = clone(x.homeroomBrackets || d.homeroomBrackets);
  BRACKETS = clone(x.brackets || d.brackets);
  MATH_BONUS = clone(x.mathBonus || d.mathBonus);
  KOR_BONUS = clone(x.korBonus ?? d.korBonus);
  HOMEROOM_CAPS = { ...d.caps, ...(x.caps || {}) };
  GROUP_COUNT = { ...d.groupCount, ...(x.groupCount || {}) };
  GROUP_CAPS = { ...d.groupCaps, ...(x.groupCaps || {}) };
}
export const DISPLAY_ORDER  = ["A", "X", "I", "O", "M", "K", "N", "D", "S"];   // 화면 표시용 (배정 순서 아님)
export const SCHOLAR_A_ONLY = "A";                                              // 장학 0T·4T 전용 반

// 계열별 "성적순 사다리" (위 → 아래). 구간 상한 기준으로 자동 정렬 → 구간표를 바꿔도 따라감
export function ladders(brackets) {
  brackets = brackets || HOMEROOM_BRACKETS;
  const by = { K: [], S: [] };
  for (const b of brackets) {
    if (b.label === SCHOLAR_A_ONLY) continue;              // A 는 장학 전용이라 사다리에서 제외
    by[HOMEROOM_KS[b.label]].push(b);
  }
  for (const k of ["K", "S"]) by[k].sort((p, q) => (q.to - p.to) || (q.from - p.from));
  return { K: by.K.map((b) => b.label), S: by.S.map((b) => b.label) };
}

// ── 1단계: 점수 환산 ──
export function convertPct(pct, bonus) {
  if (pct == null || pct === "" || isNaN(Number(pct))) return null;
  return Math.max(0, Math.min(100, Number(pct) + Number(bonus || 0)));
}
export function examKey(exam) {
  const e = String(exam || "");
  if (MATH_BONUS[e]) return e;
  if (e.includes("9")) return "9월";
  if (e.includes("6")) return "6월";
  return "수능";
}
export function cvMathOf(s) {
  const ex = examKey(s.exam);
  const bonus = (MATH_BONUS[ex] || {})[s.mathtype || "미적분"] ?? 0;
  return convertPct(s.math, bonus);
}
export function cvKorOf(s) {
  return convertPct(s.korean, KOR_BONUS[examKey(s.exam)] ?? 0);
}

// ── 2단계: 담임반 후보 ──
// 구간에 들어가는 반들(겹치면 여러 개). 어느 구간에도 없으면 "바로 아래 반"(상한이 점수보다 낮은 반 중 가장 높은 반)
export function homeroomCandidates(cv, { scholarAllowed = false, brackets } = {}) {
  brackets = brackets || HOMEROOM_BRACKETS;
  if (cv == null) return { cands: [], gap: false };
  const usable = brackets.filter((b) => scholarAllowed || b.label !== SCHOLAR_A_ONLY);
  const hit = usable.filter((b) => cv >= b.from && cv <= b.to).map((b) => b.label);
  if (hit.length) return { cands: hit, gap: false };
  const below = usable.filter((b) => b.to < cv).sort((p, q) => q.to - p.to);
  if (below.length) return { cands: [below[0].label], gap: true };
  const lowest = usable.slice().sort((p, q) => p.from - q.from)[0];
  return { cands: lowest ? [lowest.label] : [], gap: true };
}

export function scholarTier(s) {
  const m = String(s.jeonhyeong || "").match(/^장학퀀텀_(\d+)T/i);
  return m ? parseInt(m[1], 10) : null;
}

const fill = (counts, c, caps) => (counts[c] || 0) / (caps[c] || 84);
// 후보 중 "정원 대비 가장 덜 찬 반". 동률이면 사다리 위쪽(먼저 나온 후보)
function leastFilled(cands, counts, caps) {
  return cands.reduce((a, b) => (fill(counts, b, caps) < fill(counts, a, caps) ? b : a));
}

// ── 담임반 배정 (기존 배정 학생은 건드리지 않음) ──
// base: 지난 결과 CSV 에서 흡수한 반별 인원 (재원생). 저장된 값에 현재 학생을 더하지 않으므로 몇 번 돌려도 같은 결과
export function assignHomerooms(students, base = {}, opts = {}) {
  const caps = opts.caps || HOMEROOM_CAPS;
  const lad = ladders(opts.brackets);
  const counts = { ...base };
  const warnings = [];
  for (const s of students) if (s.homeroom) counts[s.homeroom] = (counts[s.homeroom] || 0) + 1;

  const todo = students.filter((s) => !s.homeroom && !s.waiting);
  const tierOf = new Map(todo.map((s) => [s, scholarTier(s)]));
  const scholarA = todo.filter((s) => [0, 4].includes(tierOf.get(s)));
  const scholarXI = todo.filter((s) => tierOf.get(s) != null && ![0, 4].includes(tierOf.get(s)))
    .sort((a, b) => tierOf.get(a) - tierOf.get(b));
  const normal = todo.filter((s) => tierOf.get(s) == null);
  const placed = new Set();          // 이번에 배정한 비장학생 (연쇄 이동 대상)
  const put = (s, c, why) => { s.homeroom = c; s.hrReason = why; counts[c] = (counts[c] || 0) + 1; };

  // ① 장학 0T·4T: A → X → I
  for (const s of scholarA) {
    const c = ["A", "X", "I"].find((x) => (counts[x] || 0) < (caps[x] || 84));
    if (c) put(s, c, `장학 ${tierOf.get(s)}T`);
    else { put(s, "I", `장학 ${tierOf.get(s)}T (A·X·I 모두 정원 참)`); warnings.push({ type: "정원", cls: "I", who: s, msg: "장학 A·X·I 모두 정원 초과" }); }
  }
  // ② 그 외 장학: 티어 작은 순, X → I
  for (const s of scholarXI) {
    const c = ["X", "I"].find((x) => (counts[x] || 0) < (caps[x] || 84));
    if (c) put(s, c, `장학 ${tierOf.get(s)}T`);
    else { put(s, "I", `장학 ${tierOf.get(s)}T (X·I 정원 참)`); warnings.push({ type: "정원", cls: "I", who: s, msg: "장학 X·I 모두 정원 초과" }); }
  }
  // ③ 비장학: 변환백분위 높은 순, 구간 후보 중 가장 덜 찬 반 (겹치는 구간 = 계열 균형)
  normal
    .map((s) => ({ s, cv: cvMathOf(s) }))
    .sort((a, b) => (b.cv ?? -1) - (a.cv ?? -1))
    .forEach(({ s, cv }) => {
      const { cands, gap } = homeroomCandidates(cv, { brackets: opts.brackets });
      if (!cands.length) { warnings.push({ type: "점수없음", who: s, msg: "수학 점수가 없어 담임반을 정하지 못함" }); return; }
      const c = cands.length === 1 ? cands[0] : leastFilled(cands, counts, caps);
      put(s, c, gap ? "구간 빈틈 → 바로 아래 반" : (cands.length > 1 ? `겹침 구간(${cands.join("·")}) 중 덜 찬 반` : "점수 구간"));
      placed.add(s);
    });

  // ④ 정원 초과: 같은 계열 사다리 안에서만, 이번에 배정한 비장학생 중 점수가 가장 낮은 학생을 바로 아래 반으로
  for (const ks of ["K", "S"]) {
    const order = lad[ks];
    for (let i = 0; i < order.length; i++) {
      const c = order[i];
      const cap = caps[c] || 84;
      while ((counts[c] || 0) > cap) {
        const movable = students.filter((s) => placed.has(s) && s.homeroom === c);
        const below = order[i + 1];
        if (!below && movable.length) {
          // 계열 맨 아래 반이 넘침 → 점수가 가장 낮은 신규 비장학생을 "배정 대기"로 빼서 사람이 직접 배정
          const out = movable.reduce((a, b) => ((cvMathOf(a) ?? Infinity) <= (cvMathOf(b) ?? Infinity) ? a : b));
          out.homeroom = ""; out.hrReason = `${c}반(계열 맨 아래) 정원 초과 — 배정 대기`; out.waiting = true;
          placed.delete(out); counts[c]--;
          continue;
        }
        if (!movable.length) {
          warnings.push({ type: "정원", cls: c, msg: `${c}반 ${counts[c]}명 / 정원 ${cap}명 — 옮길 수 있는 신규 비장학생 없음(고정·장학·재원). 직접 조정 필요` });
          break;
        }
        const victim = movable.reduce((a, b) => ((cvMathOf(a) ?? Infinity) <= (cvMathOf(b) ?? Infinity) ? a : b));
        victim.homeroom = below;
        victim.hrReason = `${c}반 정원 초과 → 같은 계열 아래 반`;
        counts[c]--; counts[below] = (counts[below] || 0) + 1;
      }
    }
  }
  return { counts, warnings };
}

// ── 3단계: 반에서 따라오는 값 + 생활반 ──
// 생활반은 아직 조가 없는 학생에게만 배정. 조 인원 = 재원생(base) + 이미 조가 있는 학생 → 매번 새로 계산
export function assignGroups(students, baseGroups = {}) {
  const cnt = {};
  // 기준의 생활반 수에 맞춰 칸을 맞춤 (재원생 CSV 의 조 수와 달라도 됨)
  const fit = (hr, arr) => { const n = GROUP_COUNT[hr] || 0; const a = (arr || []).slice(0, n); while (a.length < n) a.push(0); return a; };
  for (const [hr, arr] of Object.entries(baseGroups)) cnt[hr] = fit(hr, arr);
  const ensure = (hr) => (cnt[hr] ||= fit(hr, []));
  for (const s of students) {
    if (s.homeroom && s.group) { const a = ensure(s.homeroom); const g = s.group - 1; if (g >= 0 && g < a.length) a[g]++; }
  }
  for (const s of students) {
    if (!s.homeroom || s.group) continue;
    const a = ensure(s.homeroom);
    if (!a.length) continue;
    const cap = GROUP_CAPS[s.homeroom] || 30;
    const idx = a.map((c, i) => ({ c, i }));
    const under = idx.filter((x) => x.c < cap);
    const pick = (under.length ? under : idx).reduce((p, q) => (q.c < p.c ? q : p));
    a[pick.i]++;
    s.group = pick.i + 1;
  }
  return cnt;
}

// ── 4단계: 영어 K/S (둘 다 가능하면 전체 인원 적은 쪽) ──
export function engClass(exam, eng, ks) {
  const g = parseInt(eng, 10);
  if (isNaN(g) || !ks) return null;
  return ((ENG_CLASS[examKey(exam)] || {})[g] || {})[ks] || null;
}
export function assignEnglish(students, baseEng = { K: 0, S: 0 }) {
  const cnt = { K: baseEng.K || 0, S: baseEng.S || 0 };
  for (const s of students) if (s.engKS === "K" || s.engKS === "S") cnt[s.engKS]++;
  for (const s of students) {
    if (s.engKS) continue;
    const ks = HOMEROOM_KS[s.homeroom] || "K";
    if (!s.eng) { s.engKS = ks; continue; }
    const canK = !!engClass(s.exam, s.eng, "K"), canS = !!engClass(s.exam, s.eng, "S");
    s.engKS = canK && canS ? (cnt.K <= cnt.S ? "K" : "S") : canK ? "K" : canS ? "S" : ks;
    cnt[s.engKS]++;
  }
  return cnt;
}

// ── 5단계: 탐구 타임 (사회문화는 A·B 인원 적은 쪽, 재원생 인원 포함) ──
export function isUnavailable(subj) {
  const t = (subj || "").trim();
  return !t || t.includes("자습") || t.includes("영상") || t.includes("Live") || !(t in SUBJECT_GROUP);
}
export function assignInquiry(students, baseSoc = { A: 0, B: 0 }) {
  const soc = { A: baseSoc.A || 0, B: baseSoc.B || 0 };
  const take = () => { const t = soc.A <= soc.B ? "A" : "B"; soc[t]++; return t; };
  for (const s of students) {
    if (s.inqTime) { // 이미 정해진 학생은 인원만 셈
      if ((s.inq1 || "").trim() === "사회문화" && s.inqTime.t1 in soc) soc[s.inqTime.t1]++;
      if ((s.inq2 || "").trim() === "사회문화" && s.inqTime.t2 in soc) soc[s.inqTime.t2]++;
    }
  }
  for (const s of students) {
    if (s.inqTime) continue;
    const s1 = (s.inq1 || "").trim(), s2 = (s.inq2 || "").trim();
    if (!s1 && !s2) continue;
    let e = INQUIRY_MAP[`${s1},${s2}`], rev = false;
    if (!e && INQUIRY_MAP[`${s2},${s1}`]) { e = INQUIRY_MAP[`${s2},${s1}`]; rev = true; }
    if (e) {
      let t1 = rev ? e.t2 : e.t1, t2 = rev ? e.t1 : e.t2;
      if (s1 === "사회문화" && t2 !== "C") { t1 = take(); t2 = t1 === "A" ? "B" : "A"; }
      else if (s2 === "사회문화" && t1 !== "C") { t2 = take(); t1 = t2 === "A" ? "B" : "A"; }
      s.inqTime = { t1, t2, c1: "●", c2: "●" };
      continue;
    }
    // 한쪽만 수강 가능한 경우 (원본은 없는 함수를 불러 멈추던 부분)
    const u1 = isUnavailable(s1), u2 = isUnavailable(s2);
    if (!u1 && u2) s.inqTime = { t1: s1 === "사회문화" ? take() : SUBJECT_GROUP[s1], t2: null, c1: "●", c2: null };
    else if (u1 && !u2) s.inqTime = { t1: null, t2: s2 === "사회문화" ? take() : SUBJECT_GROUP[s2], c1: null, c2: "●" };
  }
  return soc;
}

// ── 6단계: 수업반 (원본 계산 그대로 + K계열 동시배정 충돌 조정) ──
function byKey(pct, key) {
  const t = BRACKETS[key];
  if (pct == null || !t) return null;
  const hit = t.find((b) => pct >= b.from && pct <= b.to);
  if (hit) return hit.label;
  return t.reduce((a, b) => (Math.min(Math.abs(pct - a.from), Math.abs(pct - a.to)) <= Math.min(Math.abs(pct - b.from), Math.abs(pct - b.to)) ? a : b)).label;
}
export function classBrackets(s) {
  const ks = HOMEROOM_KS[s.homeroom] || "K";
  const cvMath = cvMathOf(s), cvKor = cvKorOf(s);
  const mathtype = s.mathtype_new || s.mathtype || "미적분";
  const kortype = s.kortype_new || s.kortype || "언매";
  const out = {
    cvMath, cvKor, ks,
    mathS: byKey(cvMath, mathtype + ks), mathA: byKey(cvMath, "수학A" + ks), mathB: byKey(cvMath, "수학B" + ks),
    korA: byKey(cvKor, "국어A" + ks), korB: byKey(cvKor, "국어B" + ks),
    korS: (ks === "S" && kortype === "화작" && cvKor != null && cvKor < 50) ? "㉡(K)" : byKey(cvKor, "국어S" + (kortype === "화작" ? "화작" : "언매") + ks),
    adjust: [],
  };
  if (ks === "K") {
    if (out.mathB === "㉠" && ["㉡", "㉢"].includes(out.korB)) { out.adjust.push(`수2K㉠↔문학K${out.korB} → 문학K㉠`); out.korB = "㉠"; }
    if (out.mathS === "㉠" && mathtype === "미적분" && ["㉡", "㉢"].includes(out.korA)) { out.adjust.push(`미적K㉠↔독서K${out.korA} → 독서K㉠`); out.korA = "㉠"; }
    if (out.mathS === "㉠" && mathtype === "미적분" && out.mathA && out.mathA !== "㉠") { out.adjust.push(`미적K㉠→수1K${out.mathA} → 수1K㉠`); out.mathA = "㉠"; }
  }
  return out;
}

// ── 전체 실행 ──
// base: { homerooms:{반:인원}, groups:{반:[조별 인원]}, soc:{A,B}, eng:{K,S} } — 지난 결과 CSV 에서 흡수한 재원생 인원
export function runAll(students, base = {}, opts = {}) {
  const hr = assignHomerooms(students, base.homerooms || {}, opts);
  for (const s of students) if (s.homeroom) { s.ks = HOMEROOM_KS[s.homeroom]; s.lnc = HOMEROOM_LNC[s.homeroom]; }
  const groups = assignGroups(students, base.groups || {});
  const eng = assignEnglish(students, base.eng || {});
  const soc = assignInquiry(students, base.soc || {});
  for (const s of students) Object.assign(s, { classes: classBrackets(s) });
  return { counts: hr.counts, warnings: hr.warnings, groups, eng, soc };
}


// ── 현황: 반별·생활반별 인원 (재원생 base + 현재 학생) ──
export function tally(students, base = {}) {
  const hr = { ...(base.homerooms || {}) };
  const grp = {};
  for (const [k, v] of Object.entries(base.groups || {})) { const n = GROUP_COUNT[k] || 0; const a = v.slice(0, n); while (a.length < n) a.push(0); grp[k] = a; }
  for (const s of students) {
    if (!s.homeroom) continue;
    hr[s.homeroom] = (hr[s.homeroom] || 0) + 1;
    if (s.group) { const a = (grp[s.homeroom] ||= Array(GROUP_COUNT[s.homeroom] || 0).fill(0)); if (s.group - 1 < a.length) a[s.group - 1]++; }
  }
  return { hr, grp };
}

// ── 수시 배정 추천: 점수로 계열을 정하고(겹치면 두 계열 모두), 그 계열에서 남은 자리 많은 반 + 자리 있는 생활반 ──
export function suggest(s, students, base = {}, opts = {}) {
  const caps = opts.caps || HOMEROOM_CAPS;
  const { hr, grp } = tally(students.filter((x) => x !== s), base);
  const cv = cvMathOf(s);
  const { cands } = homeroomCandidates(cv);
  const tracks = [...new Set(cands.map((c) => HOMEROOM_KS[c]))];
  const lad = ladders(opts.brackets);
  const list = [];
  for (const t of (tracks.length ? tracks : ["K", "S"])) {
    for (const c of lad[t]) {
      const left = (caps[c] || 84) - (hr[c] || 0);
      const g = (grp[c] || Array(GROUP_COUNT[c] || 0).fill(0)).map((n, i) => ({ g: i + 1, left: (GROUP_CAPS[c] || 30) - n }));
      const bestGroup = g.filter((x) => x.left > 0).sort((a, b) => b.left - a.left)[0] || null;
      // 점수 구간 반과의 거리(사다리 칸 수) — 가까운 반을 먼저 추천
      const pos = lad[t].indexOf(c);
      const cpos = cands.filter((x) => HOMEROOM_KS[x] === t).map((x) => lad[t].indexOf(x)).filter((i) => i >= 0);
      const dist = cpos.length ? Math.min(...cpos.map((i) => Math.abs(i - pos))) : 9;
      list.push({ cls: c, ks: t, left, dist, inBracket: cands.includes(c), bestGroup: left > 0 && bestGroup ? bestGroup.g : null });
    }
  }
  // 자리 있는 반 먼저 → 점수 구간에 가까운 반 → 남은 자리 많은 순
  list.sort((a, b) => (b.left > 0) - (a.left > 0) || (a.dist - b.dist) || (b.left - a.left));
  return { cv, tracks, list };
}

// 사람이 반을 바꿀 때 경고 (막지는 않음)
export function moveWarnings(s, cls, students, base = {}, opts = {}) {
  const caps = opts.caps || HOMEROOM_CAPS;
  const w = [];
  if (!cls) return w;
  const { hr } = tally(students.filter((x) => x !== s), base);
  if ((hr[cls] || 0) + 1 > (caps[cls] || 84)) w.push(`${cls}반 정원 초과(${(hr[cls] || 0) + 1}/${caps[cls] || 84})`);
  // 장학생의 A·X·I 배정은 규칙대로이므로 점수 구간 경고를 띄우지 않음
  const scholarOk = scholarTier(s) != null && ["A", "X", "I"].includes(cls);
  const { cands } = homeroomCandidates(cvMathOf(s), { scholarAllowed: true });
  if (!opts.skipBracket && !scholarOk && cands.length && !cands.includes(cls)) {
    const sameTrack = cands.some((c) => HOMEROOM_KS[c] === HOMEROOM_KS[cls]);
    w.push(sameTrack ? `점수 구간 밖(${cands.join("·")})` : `계열 다름(점수상 ${[...new Set(cands.map((c) => HOMEROOM_KS[c]))].join("/")}계열)`);
  }
  if (cls === "A" && scholarTier(s) == null) w.push("A반은 장학 전용");
  return w;
}
