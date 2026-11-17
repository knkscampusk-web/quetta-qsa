// 등록현황(QUETTA 등록보고) 이식본 — 자동 변환으로 만든 파일입니다.
// 원본: knkscampusk-web/quetta-enroll/index.html
// 계산 로직은 원본 그대로이며, 바뀐 점은 아래뿐입니다.
//  · Firestore: 익명 로그인 대신 QSA 로그인(Google·허용목록)의 Firestore 사용
//  · 팀 비밀번호 게이트·Firebase 연결 설정 화면 숨김 (QSA 로그인으로 대체)
//  · 브라우저 저장 키 접두어 quettaReg_ → qsaReg_ (기존 앱과 분리; Firestore 컬렉션 이름은 그대로)
//  · document.* → 섀도 루트($R) 안에서 동작 (QSA 화면과 스타일·ID 충돌 방지)
// 직접 고치기보다 원본을 고친 뒤 다시 변환하는 것을 권장합니다.
/* eslint-disable */

export const CSS = ":host{\n  /* QUETTA 브랜드 정값 */\n  --bg:#F8F7F7; --panel:#ffffff; --panel2:#F1EFEF; --line:#E5E2E3;\n  --ink:#231F20; --muted:#6F696B;\n  --teal:#00B2BE; --teal-d:#0497A2;            /* 600 = hover */\n  --teal-soft:#ECFAFB; --teal-ink:#115E66;     /* 50 / 800 */\n  --peri:#7E8CC6; --peri-soft:#EFF1FA; --peri-ink:#434E89;\n  --gold:#9A6F12; --gold-soft:#F8F1E2; --green:#1f9b56; --red:#CF4D4D;\n  --dark:#231F20;\n  --gradient-brand:linear-gradient(135deg,#00B2BE 0%,#7E8CC6 100%);\n  --shadow:0 1px 2px rgba(35,31,32,.05), 0 10px 28px rgba(35,31,32,.08);\n  --shadow-sm:0 1px 2px rgba(35,31,32,.06);\n  --shadow-brand:0 8px 28px rgba(0,178,190,.32);\n  --radius-md:12px; --radius-lg:16px; --radius-2xl:28px;\n}\n*{box-sizing:border-box}\n:host{margin:0;padding:0}\n:host{\n  font-family:'Pretendard',system-ui,sans-serif;\n  background:\n    radial-gradient(720px 720px at 80% 8%, rgba(0,178,190,.48), transparent 62%),\n    radial-gradient(760px 760px at 18% 92%, rgba(126,140,198,.54), transparent 64%),\n    radial-gradient(900px 620px at 45% 50%, rgba(126,140,198,.16), transparent 70%),\n    #ffffff;\n  background-attachment:fixed;\n  color:var(--ink); font-size:16px; line-height:1.5; min-height:100vh;\n  position:relative;\n}\n/* 필름 그레인 — 고운 입자가 전면에 촘촘하게. opacity로 강도 조절(.0~1) */\n:host::before{\n  content:''; position:fixed; inset:0; z-index:0; pointer-events:none;\n  opacity:.45; mix-blend-mode:multiply;\n  background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.9'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");\n}\n#app, #gate{position:relative; z-index:1}\nh1,h2,h3{margin:0}\nbutton{font-family:inherit;cursor:pointer}\n.mono{font-variant-numeric:tabular-nums}\n\n/* ===== Gate ===== */\n#gate{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;\n  background:radial-gradient(820px 460px at 50% -5%, rgba(0,178,190,.16), transparent 60%), var(--bg)}\n.gate-card{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:40px 34px;width:344px;box-shadow:var(--shadow);text-align:center}\n.gate-card .logo{font-family:'Space Grotesk',sans-serif;font-weight:700;letter-spacing:.2em;color:var(--teal);font-size:14px}\n.gate-card h2{font-size:23px;margin:12px 0 4px;letter-spacing:-.01em}\n.gate-card p{color:var(--muted);font-size:14.5px;margin:0 0 24px}\n.gate-card input{width:100%;padding:13px 14px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);font-size:17px;text-align:center;letter-spacing:.12em}\n.gate-card input:focus{outline:none;border-color:var(--teal);background:#fff;box-shadow:0 0 0 3px rgba(0,178,190,.13)}\n.gate-card button{width:100%;margin-top:14px;padding:13px;border-radius:12px;border:0;background:var(--gradient-brand);color:#fff;font-weight:700;font-size:16px;box-shadow:var(--shadow-brand);transition:.18s cubic-bezier(0.22,1,0.36,1)}\n.gate-card button:hover{transform:translateY(-1px);filter:brightness(1.04)}\n.gate-card button:active{transform:translateY(0)}\n.gate-card button:hover{background:var(--teal-d)}\n.gate-card .err{color:var(--red);font-size:14px;min-height:16px;margin-top:10px}\n.gate-card .small{font-size:13px;color:var(--muted);margin-top:20px}\n.gate-card .small a{color:var(--teal);cursor:pointer;font-weight:600}\n\n/* ===== Shell ===== */\nheader{display:flex;align-items:center;gap:18px;padding:0 26px;height:62px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.62);backdrop-filter:blur(10px);position:sticky;top:0;z-index:20}\nheader .brand{font-family:'Space Grotesk',sans-serif;font-weight:700;letter-spacing:.14em;font-size:16px}\nheader .brand b{color:var(--teal)}\nheader .sub{color:var(--muted);font-size:14px;border-left:1px solid var(--line);padding-left:16px}\nheader .spacer{flex:1}\nheader .who{font-size:14px;color:var(--muted)}\nheader .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);margin-right:6px;vertical-align:middle;box-shadow:0 0 0 3px rgba(31,155,86,.16)}\nheader .dot.off{background:var(--gold);box-shadow:0 0 0 3px rgba(169,120,27,.16)}\n\nnav{display:flex;gap:2px;padding:0 22px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.32);backdrop-filter:blur(10px);position:sticky;top:62px;z-index:19}\nnav button{display:inline-flex;align-items:center;gap:7px;background:none;border:0;color:var(--muted);padding:13px 16px;font-size:15.5px;font-weight:600;border-bottom:2px solid transparent;transition:.12s}\nnav button svg{width:18px;height:18px}\nnav button.active{color:var(--teal-ink);border-bottom:2px solid var(--teal)}\nnav button:hover:not(.active){color:var(--ink)}\n\nmain{padding:26px 26px 60px;max-width:1280px;margin:0 auto}\n.tab{display:none} .tab.active{display:block;animation:fade .25s ease}\n@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}\n\n/* ===== Cards / controls ===== */\n.card{\n  background:linear-gradient(135deg, rgba(255,255,255,.62), rgba(255,255,255,.38));\n  backdrop-filter:blur(18px) saturate(1.6);\n  -webkit-backdrop-filter:blur(18px) saturate(1.6);\n  border:1px solid rgba(255,255,255,.55);\n  border-radius:16px;padding:22px 24px;margin-bottom:18px;\n  box-shadow:0 8px 32px rgba(35,31,32,.10), inset 0 1px 0 rgba(255,255,255,.65), inset 0 0 0 1px rgba(255,255,255,.12);\n  position:relative;overflow:hidden;\n}\n.card::before{\n  content:\"\";position:absolute;inset:0;pointer-events:none;border-radius:inherit;\n  background:linear-gradient(135deg, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 42%);\n}\n.card>*{position:relative}\n.card h3{font-size:16.5px;letter-spacing:-.01em;margin-bottom:4px;display:flex;align-items:center;gap:8px}\n.pin{display:inline-block;width:3px;height:16px;border-radius:2px;background:var(--teal);vertical-align:-3px;margin-right:4px}\n.card .desc{color:var(--muted);font-size:14.5px;margin-bottom:16px}\n.row{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}\n.field{display:flex;flex-direction:column;gap:6px}\n.field label{font-size:14px;color:var(--muted);font-weight:500}\n.field input,.field select{padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:15.5px;transition:.12s}\n.field input:focus,.field select:focus{outline:none;border-color:var(--teal);box-shadow:0 0 0 3px rgba(0,178,190,.12)}\n.btn{padding:10px 16px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:15px;font-weight:600;transition:.12s;box-shadow:var(--shadow-sm)}\n.btn:hover{border-color:var(--teal);color:var(--teal-ink)}\n.btn.pri{background:var(--teal);color:#fff;border-color:var(--teal);box-shadow:0 6px 14px rgba(0,178,190,.24)}\n.btn.pri:hover{background:var(--teal-d);color:#fff}\n.btn.ghost{background:none;box-shadow:none}\n.btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}\n\n.drop{border:1.5px dashed var(--line);border-radius:13px;padding:20px;text-align:center;color:var(--muted);font-size:15px;background:var(--panel2);transition:.15s;cursor:pointer}\n.drop:hover{border-color:var(--teal)}\n.drop.ok{border-color:var(--teal);border-style:solid;color:var(--ink);background:var(--teal-soft)}\n.drop.drag{border-color:var(--teal);background:rgba(0,178,190,.09)}\n.drop b{color:var(--ink)} .drop .fn{color:var(--teal-ink);font-weight:600}\n.uploads{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}\n@media(max-width:880px){.uploads{grid-template-columns:1fr}}\n.statusrow{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}\n.stled{display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border:1px solid var(--line);border-radius:999px;font-size:13.5px;color:var(--muted);background:var(--panel2)}\n.stled i{width:9px;height:9px;border-radius:50%;background:#cfd4dd;transition:.2s;box-shadow:0 0 0 3px transparent}\n.stled.on{color:var(--ink);border-color:var(--teal);background:var(--teal-soft)}\n.stled.on i{background:var(--teal);box-shadow:0 0 0 3px rgba(0,178,190,.18)}\n\n/* ===== Hero (eyebrow + display title + gradient panel) ===== */\n.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:18px;margin-bottom:18px;align-items:stretch}\n@media(max-width:880px){.hero{grid-template-columns:1fr}}\n.hero-left{display:flex;flex-direction:column;justify-content:center;padding:8px 4px}\n.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--teal-ink);font-weight:700;margin-bottom:12px}\n.hero-title{font-size:40px;font-weight:800;letter-spacing:-.025em;line-height:1.08;color:var(--ink)}\n.hero-title .grad{background:var(--gradient-brand);-webkit-background-clip:text;background-clip:text;color:transparent}\n.hero-sub{color:var(--muted);font-size:15px;margin-top:14px}\n.hero-sub .tag{vertical-align:1px}\n.hero-panel{position:relative;overflow:hidden;border-radius:var(--radius-2xl);background:var(--gradient-brand);color:#fff;padding:28px 30px;box-shadow:var(--shadow-brand);display:flex;flex-direction:column;justify-content:center;min-height:168px}\n.hero-panel-label{font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;opacity:.9}\n.hero-panel-main{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:52px;line-height:1;margin-top:8px;letter-spacing:-.02em}\n.hero-panel-main .unit{font-family:'Pretendard',sans-serif;font-size:18px;font-weight:600;margin-left:8px;opacity:.92}\n.hero-duo{display:flex;align-items:flex-end;gap:22px;margin-top:10px;position:relative;z-index:1}\n.hero-stat{display:flex;flex-direction:column}\n.hero-num{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:48px;line-height:1;letter-spacing:-.02em}\n.hero-lab{font-size:13px;font-weight:600;opacity:.9;margin-top:6px;letter-spacing:.02em}\n.hero-div{width:1px;align-self:stretch;background:rgba(255,255,255,.28);margin:2px 0}\n.hero-panel-row{display:flex;gap:26px;margin-top:18px;position:relative;z-index:1}\n.hero-panel-row .hp{font-size:13px;opacity:.92}\n.hero-panel-row .hp b{display:block;font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;margin-top:2px;letter-spacing:-.01em}\n.hero-mark{position:absolute;right:-58px;bottom:-72px;width:210px;height:210px;border-radius:50%;border:42px solid rgba(255,255,255,.13);pointer-events:none}\n.hero-panel-label.big{font-size:19px;letter-spacing:.04em;text-transform:none;opacity:1}\n.hero-ghost{position:absolute;right:22px;top:50%;transform:translateY(-50%);font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:92px;line-height:.9;color:rgba(255,255,255,.204);letter-spacing:-.03em;pointer-events:none;z-index:0}\n@media(max-width:880px){.hero-ghost{font-size:68px;right:14px}}\n/* ===== Stat tiles ===== */\n.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px}\n@media(max-width:880px){.stats{grid-template-columns:repeat(2,1fr)}}\n.stat{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:17px 18px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden}\n.stat::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--line)}\n.stat .v{font-family:'Space Grotesk',sans-serif;font-size:31px;font-weight:700;letter-spacing:-.02em}\n.stat .l{font-size:13.5px;color:var(--muted);margin-top:2px}\n.stat.t::before{background:var(--teal)} .stat.t .v{color:var(--teal-ink)}\n.stat.g::before{background:var(--green)} .stat.g .v{color:var(--green)}\n.stat.y::before{background:var(--gold)} .stat.y .v{color:var(--gold)}\n.stat.r::before{background:var(--red)} .stat.r .v{color:var(--red)}\n\n/* ===== Table ===== */\ntable{width:100%;border-collapse:collapse;font-size:15px}\nth,td{padding:10px 12px;text-align:right;border-bottom:1px solid var(--line)}\nth:first-child,td:first-child{text-align:left}\nthead th{background:var(--teal-soft);color:var(--teal-ink);font-weight:700;font-size:13.5px;letter-spacing:.02em;position:sticky;top:0}\ntbody tr:hover{background:var(--panel2)}\ntr.sub td{background:var(--gold-soft);font-weight:700;color:var(--gold)}\ntr.tot td{background:var(--teal-soft);font-weight:700;color:var(--teal-ink)}\n.pos{color:var(--green);font-weight:600} .neg{color:var(--red);font-weight:600}\n.tag{display:inline-block;padding:3px 9px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid var(--line);color:var(--muted)}\n.tag.pre{border-color:rgba(169,120,27,.4);color:var(--gold);background:var(--gold-soft)}\n.tag.post{border-color:rgba(0,178,190,.4);color:var(--teal-ink);background:var(--teal-soft)}\n.tablewrap{overflow:auto;border:1px solid var(--line);border-radius:13px;max-height:520px;background:#fff}\n/* raw 출력 표: 21열 — 카드 폭 넓히고 글씨 축소, 셀 줄바꿈 금지 */\n#tab-raw .card{width:calc(100vw - 48px);max-width:none;margin-left:calc(50% - 50vw + 24px)}\n#rawTable{font-size:12px}\n#rawTable th,#rawTable td{white-space:nowrap;padding:8px 10px}\n#rawTable thead th{font-size:11.5px}\n@media(max-width:880px){#tab-raw .card{width:auto;margin-left:0}}\n\n/* 윈터 표 — 11열이 평평해 눈이 미끄러진다. 묶음 경계선 + 소계 강조로 끊어준다. */\ntable.winTbl tr.sum td{background:rgba(0,178,190,.045);border-top:1.5px solid rgba(0,178,190,.45);font-weight:700;color:var(--ink)}\ntable.winTbl th.grp,table.winTbl td.grp{border-left:1px solid var(--line)}\ntable.winTbl thead tr.grphead th{font-size:11.5px;letter-spacing:.06em;color:var(--muted);\n  font-weight:700;padding-top:9px;padding-bottom:5px;background:transparent}\ntable.winTbl thead tr.grphead th.grp{border-left:1px solid var(--line)}\n\n.warn{background:#fdf0f0;border:1px solid rgba(207,71,71,.32);color:#a23535;border-radius:11px;padding:12px 14px;font-size:14.5px;margin-bottom:14px}\n.note{color:var(--muted);font-size:14px;margin-top:8px}\n.pill{font-size:13px;padding:3px 9px;border-radius:20px;background:var(--panel2);border:1px solid var(--line);color:var(--muted)}\n.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--teal);color:#fff;font-weight:700;padding:12px 24px;border-radius:30px;font-size:15px;box-shadow:0 10px 30px rgba(0,178,190,.35);opacity:0;pointer-events:none;transition:.25s;z-index:60}\n.toast.show{opacity:1}\n.hl{color:var(--teal-ink)}\ncode{background:var(--teal-soft);border:1px solid rgba(0,178,190,.22);padding:1px 6px;border-radius:6px;font-size:14px;color:var(--teal-ink)}\n/* 설정 FAB (우하단 고정, 솔리드 teal) */\n.fab{position:fixed;right:24px;bottom:24px;z-index:55;width:52px;height:52px;border-radius:50%;\n  border:0;background:var(--teal);color:#fff;box-shadow:var(--shadow);cursor:pointer;\n  display:flex;align-items:center;justify-content:center;transition:.18s cubic-bezier(0.22,1,0.36,1)}\n.fab:hover{background:var(--teal-d);transform:translateY(-2px);box-shadow:0 10px 24px rgba(35,31,32,.18)}\n.fab:active{transform:translateY(0)}\n.fab svg{width:24px;height:24px}\n.backbtn{display:inline-flex;align-items:center;gap:6px;margin-bottom:16px;background:none;border:0;color:var(--muted);font-size:14px;font-weight:600;cursor:pointer}\n.backbtn:hover{color:var(--teal-ink)}";

export const MARKUP = "<!-- ============ GATE ============ -->\n<div id=\"gate\">\n  <div class=\"gate-card\">\n    <div class=\"logo\">GOOD BETTER BEST</div>\n    <h2>일일 등록 보고</h2>\n    <p>강남대성기숙 QUETTA · 행정실</p>\n\n    <div id=\"gateRole\">\n      <button id=\"roleViewer\" style=\"background:var(--panel2);color:var(--teal-ink);box-shadow:none;border:1px solid var(--line)\">뷰어로 보기</button>\n      <button id=\"roleStaff\">실무 로그인</button>\n    </div>\n\n    <div id=\"gatePwStep\" style=\"display:none\">\n      <input id=\"gatePw\" type=\"password\" placeholder=\"팀 비밀번호\" autocomplete=\"off\" />\n      <button id=\"gateBtn\">입장</button>\n      <div class=\"small\"><a id=\"roleBack\">← 뒤로</a></div>\n    </div>\n\n    <div id=\"gateSeasonStep\" style=\"display:none\">\n      <p style=\"margin:0 0 16px\">어느 시즌으로 들어갈까요?</p>\n      <button class=\"seasonPick\" data-season=\"정규\">정규</button>\n      <button class=\"seasonPick\" data-season=\"반수\" style=\"background:var(--panel2);color:var(--teal-ink);box-shadow:none;border:1px solid var(--line)\">반수</button>\n      <button class=\"seasonPick\" data-season=\"윈터\" style=\"background:var(--panel2);color:var(--teal-ink);box-shadow:none;border:1px solid var(--line)\">윈터</button>\n    </div>\n\n    <div class=\"err\" id=\"gateErr\"></div>\n    <div class=\"small\">\n      처음이세요? <a id=\"setupLink\">초기 설정(Firebase·비번)</a>\n    </div>\n  </div>\n</div>\n\n<!-- ============ APP ============ -->\n<div id=\"app\" style=\"display:none\">\n<header>\n  <div class=\"brand\"><b>QUETTA</b> 등록보고</div>\n  <div class=\"sub\">매일 경영지원 자료 → 등록파일 raw 행 산출</div>\n  <div class=\"spacer\"></div>\n  <div class=\"who\"><span class=\"tag pre\" id=\"seasonBadge\">정규시즌</span>\n    <a id=\"seasonChange\" style=\"color:var(--teal);cursor:pointer;font-weight:600;margin:0 12px 0 8px\">시즌 변경</a>\n    <span class=\"dot\" id=\"connDot\"></span><span id=\"connTxt\">연결 확인 중…</span></div>\n</header>\n\n<nav>\n  <button data-tab=\"input\" class=\"active\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"/></svg>일일명단 입력</button>\n  <button data-tab=\"dash\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"9\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"5\"/><rect x=\"14\" y=\"12\" width=\"7\" height=\"9\"/><rect x=\"3\" y=\"16\" width=\"7\" height=\"5\"/></svg>대시보드</button>\n  <button data-tab=\"hist\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 3v5h5\"/><path d=\"M3.05 13A9 9 0 1 0 6 5.3L3 8\"/><path d=\"M12 7v5l4 2\"/></svg>지난 등록 보기</button>\n</nav>\n\n<main>\n\n<!-- ===== 입력 ===== -->\n<section class=\"tab active\" id=\"tab-input\">\n  <div class=\"card\">\n    <h3><span class=\"pin\"></span> 기준 날짜 & 시즌</h3>\n    <div class=\"desc\">개강일 설정값과 비교해 <b>개강 전(전형·계열 단위)</b> / <b>개강 후(반 단위)</b>로 자동 분기합니다.</div>\n    <div class=\"row\">\n      <div class=\"field\"><label>기준 날짜</label><input type=\"date\" id=\"baseDate\"></div>\n      <div class=\"field\"><label>시즌</label>\n        <select id=\"season\" disabled title=\"시즌은 입장 화면에서 선택합니다\"><option value=\"정규\">정규</option><option value=\"반수\">반수</option><option value=\"윈터\">윈터</option></select>\n      </div>\n      <div class=\"field\"><label>작성자</label><input id=\"writer\" placeholder=\"이름\"></div>\n      <div class=\"field\"><label>현재 구분</label><div id=\"splitTag\" style=\"padding-top:6px\"></div></div>\n    </div>\n  </div>\n\n  <div class=\"card\">\n    <h3><span class=\"pin\"></span> 자료 불러오기</h3>\n    <div class=\"desc\">아래 버튼으로 자료를 불러오면 상태등이 켜집니다. 마지막에 <b>학생명단으로 등록잡기</b>를 누르세요.</div>\n    <div class=\"statusrow\" id=\"loadStatus\">\n      <span class=\"stled\" data-k=\"sb\"><i></i> 경영지원 일일명단</span>\n      <span class=\"stled\" data-k=\"master\"><i></i> 마스터·접수현황</span>\n      <span class=\"stled\" data-k=\"roster\"><i></i> 학생명단</span>\n      <span class=\"stled\" data-k=\"refund\"><i></i> 환불</span>\n    </div>\n    <div class=\"row\" style=\"margin-top:16px\">\n      <button class=\"btn\" id=\"sbDailyBtn\">경영지원에서 일일명단 불러오기</button>\n      <button class=\"btn\" id=\"gsLoadBtn\">구글시트에서 마스터·접수현황 불러오기</button>\n      <button class=\"btn\" id=\"writebackBtn\" data-season-only=\"정규,반수\">학생명단에 재등록일 기입</button>\n      <button class=\"btn\" id=\"refundBtn\" data-season-only=\"정규,반수\">환불자 이동</button>\n      <button class=\"btn\" id=\"winRegBtn2\" data-season-only=\"윈터\">접수대장에 등록 기입</button>\n      <button class=\"btn\" id=\"winRefBtn2\" data-season-only=\"윈터\">접수대장에 환불 기입</button>\n      <button class=\"btn pri\" id=\"rosterBtn\">학생명단으로 등록잡기</button>\n      <span class=\"note\" id=\"inputNote\">권장: 자료 불러온 뒤 <b>학생명단으로 등록잡기</b> — 편성·재등록·미납을 한 번에 계산합니다.</span>\n    </div>\n    <div class=\"note\" id=\"gsNote\" style=\"margin-top:8px\"></div>\n\n    <div id=\"winWbPanel\" style=\"display:none;margin-top:16px\">\n      <div class=\"card\" style=\"margin-bottom:0\">\n        <h3 style=\"justify-content:space-between\">\n          <span><span class=\"pin\"></span> <span id=\"winWbTitle\">접수대장 기입 미리보기</span></span>\n          <span class=\"note\" id=\"winWbSummary\"></span>\n        </h3>\n        <div class=\"desc\">경영지원 그날 명단을 접수대장에서 수험번호로 찾아 기입합니다.\n          <b>선금</b>→B열, <b>완납</b>→B·C열, <b>잔금</b>→C열, <b>환불</b>→D열+E열 ‘ㅇ’.\n          이미 값이 있는 칸은 건너뜁니다 — 덮어쓰지 않습니다.</div>\n        <div class=\"tablewrap\" style=\"max-height:380px\"><table id=\"winWbTable\"></table></div>\n        <div class=\"row\" style=\"margin-top:12px\">\n          <button class=\"btn pri\" id=\"winWbApplyBtn\" disabled>접수대장에 기입 실행</button>\n          <button class=\"btn\" id=\"winWbCancelBtn\">닫기</button>\n          <span class=\"note\" id=\"winWbApplyNote\" style=\"white-space:pre-wrap\"></span>\n        </div>\n      </div>\n    </div>\n\n    <div id=\"wbPanel\" style=\"display:none;margin-top:16px\">\n      <div class=\"card\" style=\"margin-bottom:0\">\n        <h3 style=\"justify-content:space-between\">\n          <span><span class=\"pin\"></span> 재등록일 기입 미리보기</span>\n          <span class=\"note\" id=\"wbSummary\"></span>\n        </h3>\n        <div class=\"desc\">경영지원 그날 결제자를 학생명단에서 찾아, <b>정규월 칸이 빈 학생만</b> 기입합니다. 아래를 확인하고 실행하세요. (이미 값이 있으면 건너뜀 — 덮어쓰지 않음)</div>\n        <div class=\"tablewrap\" style=\"max-height:380px\"><table id=\"wbTable\"></table></div>\n        <div class=\"row\" style=\"margin-top:12px\">\n          <button class=\"btn pri\" id=\"wbApplyBtn\" disabled>학생명단에 기입 실행</button>\n          <button class=\"btn\" id=\"wbCancelBtn\">닫기</button>\n          <span class=\"note\" id=\"wbApplyNote\"></span>\n        </div>\n      </div>\n    </div>\n\n  </div>\n</section>\n\n<!-- ===== 대시보드 ===== -->\n<section class=\"tab\" id=\"tab-dash\">\n  <div class=\"card\" id=\"dashEmpty\">\n    <h3><span class=\"pin\"></span> 일일 등록 현황</h3>\n    <div class=\"desc\">아직 처리된 자료가 없어요. <b>일일명단 입력</b> 탭에서 자료를 올리고 처리하면 여기 결과가 나옵니다.</div>\n  </div>\n\n  <div id=\"winHero\" class=\"hero\" style=\"display:none\">\n    <div class=\"hero-panel\" id=\"winHero1\">\n      <div class=\"hero-panel-label\">TODAY</div>\n      <div class=\"hero-duo\">\n        <div class=\"hero-stat\"><span class=\"hero-num\" id=\"winHero1Reg\">0</span><span class=\"hero-lab\">등록</span></div>\n        <div class=\"hero-div\"></div>\n        <div class=\"hero-stat\"><span class=\"hero-num\" id=\"winHero1Ref\">0</span><span class=\"hero-lab\">환불</span></div>\n      </div>\n      <div class=\"hero-panel-row\" id=\"winHero1Mini\"></div>\n      <span class=\"hero-ghost\">고1</span>\n      <span class=\"hero-mark\"></span>\n    </div>\n    <div class=\"hero-panel\" id=\"winHero2\">\n      <div class=\"hero-panel-label\">TODAY</div>\n      <div class=\"hero-duo\">\n        <div class=\"hero-stat\"><span class=\"hero-num\" id=\"winHero2Reg\">0</span><span class=\"hero-lab\">등록</span></div>\n        <div class=\"hero-div\"></div>\n        <div class=\"hero-stat\"><span class=\"hero-num\" id=\"winHero2Ref\">0</span><span class=\"hero-lab\">환불</span></div>\n      </div>\n      <div class=\"hero-panel-row\" id=\"winHero2Mini\"></div>\n      <span class=\"hero-ghost\">고2</span>\n      <span class=\"hero-mark\"></span>\n    </div>\n  </div>\n\n  <div class=\"stats\" id=\"winTiles\" style=\"display:none\"></div>\n\n  <div class=\"card\" id=\"winDash\" style=\"display:none\">\n    <h3 style=\"justify-content:space-between\">\n      <span><span class=\"pin\"></span> 윈터 등록현황</span>\n      <span class=\"note\" id=\"winDashNote\"></span>\n    </h3>\n    <div class=\"desc\">접수는 접수대장, 등록·환불·완납은 경영지원 일일명단 기준입니다. 성별은 수험번호로 접수대장과 맞춥니다.</div>\n    <div id=\"winWarn\"></div>\n    <div id=\"winDashTable\" style=\"margin-top:12px\"></div>\n\n    <div class=\"note\" style=\"font-weight:700;color:var(--ink);margin:18px 0 6px;display:flex;justify-content:space-between;align-items:center\">\n      <span>오늘 등록·환불 요약 (일자별등록 시트용)</span>\n      <button class=\"btn\" id=\"winReportCopyBtn\">한 줄 복사</button>\n    </div>\n    <div class=\"desc\">2027일자별등록 시트에 붙여넣는 한 줄입니다. 학년 구분 없이 합계이고,\n      <b>복사는 금일등록·금일환불 2칸만</b> — 전일등록·등록인원은 시트 수식입니다.</div>\n    <div class=\"tablewrap\"><table id=\"winReportTable\"></table></div>\n\n    <div class=\"row\" style=\"margin-top:14px\">\n      <button class=\"btn pri\" id=\"winDashWriteBtn\">등록대장에 기입</button>\n      <button class=\"btn\" id=\"winSaveBtn\">현황 저장(공유)</button>\n      <button class=\"btn\" id=\"winPrevBtn\">전일 불러오기</button>\n      <span class=\"note\" id=\"winDashOut\" style=\"white-space:pre-wrap\"></span>\n    </div>\n\n    <div class=\"note\" style=\"font-weight:700;color:var(--ink);margin:18px 0 6px\">시즌제로 가용 정원</div>\n    <div class=\"desc\">총 기숙사 정원 − 윈터 등록인원. 설정에서 기숙사 정원을 넣어야 계산됩니다.</div>\n    <div class=\"tablewrap\"><table id=\"winZeroTable\"></table></div>\n  </div>\n\n  <div id=\"dashContent\" style=\"display:none\">\n    <div class=\"hero\">\n      <div class=\"hero-left\">\n        <div class=\"eyebrow\">DAILY ENROLLMENT REPORT</div>\n        <h1 class=\"hero-title\" id=\"heroTitle\"></h1>\n        <div class=\"hero-sub\" id=\"heroSub\"></div>\n      </div>\n      <div class=\"hero-panel\">\n        <div class=\"hero-panel-label\">TODAY · 금일 현황</div>\n        <div class=\"hero-duo\">\n          <div class=\"hero-stat\"><span class=\"hero-num\" id=\"heroNew\">0</span><span class=\"hero-lab\">신규</span></div>\n          <div class=\"hero-div\"></div>\n          <div class=\"hero-stat\"><span class=\"hero-num\" id=\"heroOut\">0</span><span class=\"hero-lab\">퇴소</span></div>\n        </div>\n        <div class=\"hero-panel-row\" id=\"heroMini\"></div>\n        <span class=\"hero-mark\"></span>\n      </div>\n    </div>\n    <div class=\"stats\" id=\"statTiles\"></div>\n\n    <div class=\"card\" id=\"reportCard\">\n      <h3 style=\"justify-content:space-between\">\n        <span><span class=\"pin\"></span> 오늘 신규·퇴소 요약</span>\n        <button class=\"btn\" id=\"reportCopyBtn\">한 줄 복사</button>\n      </h3>\n      <div class=\"desc\">일자별누적(원장님) 시트에 붙여넣는 한 줄입니다. 등록인원 = 전일등록 + 금일등록 + 금일환불. <b>복사는 금일등록·금일환불 2칸만</b> (전일등록·등록인원은 시트 수식).</div>\n      <div class=\"tablewrap\"><table id=\"reportTable\"></table></div>\n      <div class=\"note\" id=\"reportNote\"></div>\n    </div>\n    <div class=\"card\">\n      <h3 style=\"justify-content:space-between\">\n        <span><span class=\"pin\"></span> <span id=\"dashTitle\"></span></span>\n        <span>\n          <button class=\"btn\" id=\"enrollBtn\">개강후 시트 기입</button>\n          <button class=\"btn\" id=\"saveBtn\">현황 저장(공유)</button>\n          <button class=\"btn\" id=\"loadPrevBtn\">전일 불러오기</button>\n        </span>\n      </h3>\n      <div class=\"desc\" id=\"dashMeta\"></div>\n      <div id=\"warnBox\"></div>\n      <div class=\"note\" style=\"font-weight:700;color:var(--ink);margin-bottom:6px\">① 편성현황 (신규 − 퇴소)</div>\n      <div class=\"tablewrap\"><table id=\"dashTable\"></table></div>\n      <div class=\"note\" style=\"font-weight:700;color:var(--ink);margin:18px 0 6px\">② 재등록 (등록 − 미등록)</div>\n      <div class=\"tablewrap\"><table id=\"dashTable2\"></table></div>\n      <div class=\"note\">편성계 = 전일편성 + 신규 − 퇴소 · 등록계 = 전일등록 + 재등록 − 환불 · 미납 = 편성계 − 등록계. 전일값은 ‘현황 저장’ 시 다음날로 이어집니다.</div>\n\n      <div id=\"enPanel\" style=\"display:none;margin-top:16px;border-top:1px solid var(--line);padding-top:16px\">\n        <div class=\"note\" style=\"font-weight:700;color:var(--ink);margin-bottom:6px;display:flex;justify-content:space-between\">\n          <span>개강후 블록 기입 미리보기</span><span class=\"note\" id=\"enSummary\"></span>\n        </div>\n        <div class=\"tablewrap\" style=\"max-height:360px\"><table id=\"enTable\"></table></div>\n        <div class=\"row\" style=\"margin-top:12px;align-items:center\">\n          <label style=\"display:flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--ink)\">\n            <input type=\"checkbox\" id=\"enResetPrevReg\"> 전일등록(O열) 0으로 리셋\n          </label>\n          <span class=\"note\" style=\"margin:0\">집계월이 바뀐 첫 기입에만 켜세요. 편성 전일값은 그대로 이월됩니다.</span>\n        </div>\n        <div class=\"row\" style=\"margin-top:12px\">\n          <button class=\"btn pri\" id=\"enApplyBtn\">2026정규에 기입 실행</button>\n          <button class=\"btn\" id=\"enCancelBtn\">닫기</button>\n          <span class=\"note\" id=\"enApplyNote\"></span>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"card\" id=\"receiptCard\" style=\"display:none\">\n      <h3><span class=\"pin\"></span> 접수 현황 (개강후 간헐 접수)</h3>\n      <div class=\"desc\">접수대장에서 오늘 날짜 접수를 전형별로 집계했어요. <b>유시험 합격만 수기 입력</b> 후 대시보드의 <b>개강후 시트 기입</b>을 누르면 접수 블록까지 함께 반영됩니다.</div>\n      <div class=\"tablewrap\"><table id=\"receiptTable\"></table></div>\n      <div class=\"row\" style=\"margin-top:10px;align-items:center;gap:10px\">\n        <label class=\"note\" style=\"font-weight:700;color:var(--ink)\">유시험 합격(수기)</label>\n        <input id=\"usiHab\" type=\"number\" min=\"0\" placeholder=\"0\" style=\"width:110px\">\n        <span class=\"note\">유시험 접수=합격이 아니므로 합격 인원을 직접 입력하세요. (나머지 전형은 접수=합격 자동)</span>\n      </div>\n    </div>\n\n    <div class=\"card\" id=\"jangCard\" style=\"display:none\">\n      <h3><span class=\"pin\"></span> 장학생 현황 (오늘)</h3>\n      <div class=\"desc\">오늘 장학 접수·등록·환불을 종류별로 집계했어요. 개강후 시트 기입 시 장학 블록에 함께 반영됩니다.</div>\n      <div class=\"tablewrap\"><table id=\"jangTable\"></table></div>\n    </div>\n\n    <div class=\"card\">\n      <h3 style=\"justify-content:space-between\">\n        <span><span class=\"pin\"></span> 경영지원 현황 대조</span>\n        <button class=\"btn\" id=\"verifyBtn\">불러와 대조</button>\n      </h3>\n      <div class=\"desc\">경영지원 등록관리 앱(Supabase)의 같은 날짜 합계와 자동 비교합니다. 읽기 전용이라 그쪽 데이터는 바뀌지 않아요.</div>\n      <div id=\"verifyBox\"><div class=\"note\">‘불러와 대조’를 누르면 경영지원 앱 값을 읽어와 비교합니다.</div></div>\n    </div>\n  </div>\n</section>\n<section class=\"tab\" id=\"tab-hist\">\n  <div class=\"card\" id=\"histList\">\n    <h3><span class=\"pin\"></span> 지난 등록 보기</h3>\n    <div class=\"desc\">날짜를 골라 그날의 등록 현황을 봅니다 (선택일까지 누적 반영). <b>raw 로그 파일은 설정 탭에서 올려주세요.</b></div>\n    <div class=\"row\" style=\"margin-top:14px;align-items:center\">\n      <div class=\"field\" style=\"min-width:220px\"><label>날짜 선택</label>\n        <select id=\"histDate\" disabled><option>설정 탭에서 raw 로그를 먼저 올리세요</option></select>\n      </div>\n      <button class=\"btn pri\" id=\"histViewBtn\" disabled>이 날짜 현황 보기</button>\n      <button class=\"btn\" id=\"histReloadBtn\" title=\"다른 사람이 과거 날짜를 수정한 경우에만 사용\">전체 새로고침</button>\n      <span class=\"note\" id=\"histNote\"></span>\n    </div>\n  </div>\n  <div id=\"histView\" style=\"display:none\">\n    <button class=\"backbtn\" id=\"histBack\">← 날짜 목록으로</button>\n    <div id=\"histBody\"></div>\n  </div>\n</section>\n\n<!-- ===== 분석 ===== -->\n\n<!-- ===== 설정 ===== -->\n<section class=\"tab\" id=\"tab-set\">\n  <button class=\"backbtn\" id=\"setBack\">← 대시보드로 돌아가기</button>\n  <div class=\"card\">\n<h3><span class=\"pin\"></span> QSA 데이터 가져오기</h3>\n<p style=\"color:var(--muted);font-size:14px;margin:6px 0 14px\">기존 등록보고 앱(원본)의 데이터를 QSA로 다시 복사할 때 사용합니다. 원본은 읽기만 합니다.</p>\n<button class=\"btn pri\" id=\"qsaImportBtn\">데이터 가져오기 열기</button>\n</div>\n\n<div class=\"card\">\n    <h3><span class=\"pin\"></span> 경영지원 설정 보기</h3>\n    <div class=\"desc\">경영지원 앱(Supabase)의 설정값을 그대로 펼쳐 봅니다. 읽기만 하고 아무것도 바꾸지 않아요.</div>\n    <div class=\"row\" style=\"margin-top:12px;align-items:center\">\n      <button class=\"btn pri\" id=\"sbCfgBtn\">설정 불러오기</button>\n      <span class=\"note\" id=\"sbCfgNote\"></span>\n    </div>\n    <pre id=\"sbCfgOut\" style=\"display:none;margin-top:12px;max-height:420px;overflow:auto;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:12px;font-size:12px;white-space:pre-wrap;word-break:break-all\"></pre>\n  </div>\n  <div class=\"card\" data-season-only=\"윈터\">\n    <h3><span class=\"pin\"></span> 윈터 시트 연결 테스트</h3>\n    <div class=\"desc\">접수대장과 등록대장을 읽어오기만 합니다. 시트에 아무것도 쓰지 않아요.</div>\n    <div class=\"row\" style=\"margin-top:12px;align-items:center\">\n      <button class=\"btn pri\" id=\"winTestBtn\">연결 테스트</button>\n      <span class=\"note\" id=\"winTestOut\"></span>\n    </div>\n  </div>\n  <div class=\"card\" data-season-only=\"윈터\">\n    <h3><span class=\"pin\"></span> 윈터 등록 기입 (테스트)</h3>\n    <div class=\"desc\">수험번호를 적으면 접수등록대장에 기준일을 씁니다 —\n      <b>선금</b>→B열, <b>잔금</b>→C열, <b>완납</b>→B·C 둘 다, <b>환불</b>→D열 + E열 ‘ㅇ’,\n      <b>등록포기</b>→E열 ‘ㅇ’만(결제 내역 없이 등록 안 하겠다고 연락 온 경우).\n      값은 날짜로 들어가고 <b>10/13</b> 형태로 보입니다. 이미 값이 있는 칸은 건드리지 않아요.</div>\n    <div class=\"row\" style=\"margin-top:12px;align-items:flex-end\">\n      <div class=\"field\" style=\"max-width:190px\"><label>기준일</label>\n        <input type=\"date\" id=\"winRegDate\">\n      </div>\n      <div class=\"field\" style=\"max-width:140px\"><label>구분</label>\n        <select id=\"winRegKind\"><option>선금</option><option>잔금</option><option>완납</option><option>환불</option><option>등록포기</option></select>\n      </div>\n      <div class=\"field\" style=\"flex:1;min-width:260px\"><label>수험번호 (쉼표 · 줄바꿈 · 공백 구분)</label>\n        <input id=\"winRegSids\" autocomplete=\"off\" placeholder=\"예: 4002, 4003\">\n      </div>\n      <button class=\"btn pri\" id=\"winRegBtn\">기입</button>\n    </div>\n    <div class=\"note\" id=\"winRegOut\" style=\"white-space:pre-wrap\"></div>\n  </div>\n\n  <div class=\"card\">\n    <h3><span class=\"pin\"></span> 지난 등록 로그 업로드</h3>\n    <div class=\"desc\" id=\"histUpDesc\"></div>\n    <div class=\"uploads\" style=\"grid-template-columns:1fr\">\n      <label class=\"drop\" id=\"dropHist\">\n        <input type=\"file\" accept=\".csv,.xlsx,.xls\" hidden id=\"fileHist\">\n        <b id=\"histUpLabel\"></b><br><span class=\"fn\" id=\"nameHist\">파일 선택 / 끌어놓기</span>\n      </label>\n    </div>\n    <div class=\"note\" id=\"histNote2\"></div>\n  </div>\n  <div class=\"card\">\n    <h3><span class=\"pin\"></span> 개강일 & 코호트</h3>\n    <div class=\"row\">\n      <div class=\"field\" data-season-only=\"정규\"><label>정규 개강일</label><input type=\"date\" id=\"cfgOpenReg\"></div>\n      <div class=\"field\" data-season-only=\"반수\"><label>반수 개강일</label><input type=\"date\" id=\"cfgOpenBan\"></div>\n      <div class=\"field\" data-season-only=\"윈터\"><label>윈터 개강일</label><input type=\"date\" id=\"cfgOpenWin\"></div>\n      <div class=\"field\"><label>기본 작성자</label><input id=\"cfgWriter\" placeholder=\"이름\"></div>\n      <button class=\"btn pri\" id=\"cfgSaveBtn\">설정 저장(공유)</button>\n    </div>\n    <div class=\"note\">개강일 기준으로 보고가 개강 전/후로 갈립니다. 매년 바뀌면 여기서 바꾸세요.</div>\n    <div class=\"row\" style=\"margin-top:16px\" data-season-only=\"정규,반수\">\n      <div class=\"field\" style=\"flex:1;min-width:280px\">\n        <label>반 목록 (개강 후 · 쉼표로 구분, 이 순서대로 항상 출력)</label>\n        <input id=\"cfgBanList\" placeholder=\"A, X, I, O, M, K, N, D, S\">\n      </div>\n    </div>\n    <div class=\"row\" style=\"margin-top:10px\" data-season-only=\"정규,반수\">\n      <div class=\"field\" style=\"flex:1;min-width:280px\">\n        <label>전형 목록 (개강 전 · 쉼표로 구분, 이 순서대로 항상 출력)</label>\n        <input id=\"cfgJhList\" placeholder=\"우선선발 전형, 선착순 전형, 수학만 전형, 특별 전형, 유시험 전형, 장학퀀텀_0T, ...\">\n      </div>\n    </div>\n    <div class=\"row\" style=\"margin-top:16px\" data-season-only=\"윈터\">\n      <div class=\"field\" style=\"flex:1;min-width:280px\">\n        <label>과정 목록 (쉼표로 구분, 이 순서대로 항상 출력)</label>\n        <input id=\"cfgCourseList\" placeholder=\"고1 과정, 고2 과정\">\n      </div>\n    </div>\n    <div class=\"row\" style=\"margin-top:12px\" data-season-only=\"윈터\">\n      <div class=\"field\" style=\"max-width:140px\"><label>고1 정원 · 남</label><input type=\"number\" id=\"cfgCapM1\" min=\"0\" placeholder=\"0\"></div>\n      <div class=\"field\" style=\"max-width:140px\"><label>고1 정원 · 여</label><input type=\"number\" id=\"cfgCapF1\" min=\"0\" placeholder=\"0\"></div>\n      <div class=\"field\" style=\"max-width:140px\"><label>고2 정원 · 남</label><input type=\"number\" id=\"cfgCapM2\" min=\"0\" placeholder=\"0\"></div>\n      <div class=\"field\" style=\"max-width:140px\"><label>고2 정원 · 여</label><input type=\"number\" id=\"cfgCapF2\" min=\"0\" placeholder=\"0\"></div>\n    </div>\n    <div class=\"row\" style=\"margin-top:12px\" data-season-only=\"윈터\">\n      <div class=\"field\" style=\"max-width:170px\"><label>총 기숙사 정원 · 남</label><input type=\"number\" id=\"cfgDormM\" min=\"0\" placeholder=\"0\"></div>\n      <div class=\"field\" style=\"max-width:170px\"><label>총 기숙사 정원 · 여</label><input type=\"number\" id=\"cfgDormF\" min=\"0\" placeholder=\"0\"></div>\n    </div>\n    <div class=\"note\" data-season-only=\"윈터\">시즌제로 정원 = 총 기숙사 정원 − 윈터 등록인원 (성별 각각)</div>\n    <div class=\"note\">등록·환불이 없는 반/전형도 raw에 항상 0으로 출력됩니다. 비워두면 그날 자료에 등장한 항목만 출력해요.</div>\n  </div>\n\n  <div class=\"card\" data-season-only=\"정규,반수\">\n    <h3><span class=\"pin\"></span> 재등록 집계 & 미등록 베이스라인</h3>\n    <div class=\"desc\">매달 재등록 기간이 시작되면 <b>현재 집계월</b>을 바꾸세요. 미등록 누적은 경영지원 앱에서 자동으로 끌어오고, 못 가져올 때만 아래 베이스라인을 씁니다.</div>\n    <div class=\"row\">\n      <div class=\"field\"><label>현재 집계월 (숫자, 예: 7)</label><input type=\"number\" id=\"cfgBillMonth\" min=\"1\" max=\"12\" placeholder=\"7\"></div>\n      <div class=\"field\"><label>경영지원 기수 매핑 (자동)</label><input id=\"cfgGisuPreview\" disabled placeholder=\"집계월 입력 시 표시\"></div>\n    </div>\n    <div class=\"note\" style=\"margin-top:6px\">매핑 규칙: <b>N월분 → 정규(N−2)기(N월)</b> · 예: 7월분 → 정규5기(7월)</div>\n\n    <div class=\"note\" style=\"margin-top:14px;font-weight:700;color:var(--ink)\">베이스라인 (경영지원 연동 실패 시 폴백) — 현재 집계월 <span id=\"blMonthTag\">-</span> 기준</div>\n    <div class=\"row\" style=\"margin-top:6px\">\n      <div class=\"field\"><label>총인원</label><input type=\"number\" id=\"cfgBlTotal\" placeholder=\"740\"></div>\n      <div class=\"field\"><label>등록인원(누적)</label><input type=\"number\" id=\"cfgBlReg\" placeholder=\"653\"></div>\n      <div class=\"field\"><label>미등록인원</label><input type=\"number\" id=\"cfgBlUnreg\" placeholder=\"87\"></div>\n      <button class=\"btn pri\" id=\"cfgBaseSaveBtn\">집계설정 저장(공유)</button>\n    </div>\n    <div class=\"note\">베이스라인은 <b>집계월마다 따로</b> 저장됩니다. 7월분으로 바꾸면 7월 베이스라인을 새로 입력하세요.</div>\n  </div>\n\n  <div class=\"card\">\n    <h3><span class=\"pin\"></span> 장학 코드 매핑</h3>\n    <div class=\"desc\">일일명단 장학 칸의 코드(예: <b>Q⑥_50</b>)를 리포트 장학 줄에 연결합니다. 한 줄에 여러 코드는 쉼표로 구분. 해마다 코드가 바뀌면 여기만 고치면 됩니다.</div>\n    <div id=\"cfgJangRows\"></div>\n    <button class=\"btn pri\" id=\"cfgJangSaveBtn\" style=\"margin-top:12px\">장학 매핑 저장(공유)</button>\n    <div class=\"note\">비워두면 그 줄은 집계 안 됨. 매핑 안 된 코드는 처리 시 ‘미매핑’으로 경고합니다.</div>\n  </div>\n\n  <div class=\"card\" data-qsa-hidden style=\"display:none\">\n    <h3><span class=\"pin\"></span> 팀 비밀번호</h3>\n    <div class=\"desc\">팀원이 입장할 때 쓰는 비번입니다. 평문이 아니라 해시로만 저장돼요.</div>\n    <div class=\"row\">\n      <div class=\"field\"><label>새 비밀번호</label><input type=\"password\" id=\"cfgPw1\"></div>\n      <div class=\"field\"><label>확인</label><input type=\"password\" id=\"cfgPw2\"></div>\n      <button class=\"btn pri\" id=\"cfgPwBtn\">비번 설정/변경</button>\n    </div>\n  </div>\n\n  <div class=\"card\" data-qsa-hidden style=\"display:none\">\n    <h3><span class=\"pin\"></span> Firebase 연결</h3>\n    <div class=\"desc\">팀 공유 저장소. <b>config 객체를 붙여넣고 저장</b>하면 이 브라우저에 기억됩니다. (배포 시엔 index.html 상단 상수에 직접 넣어도 됩니다.)</div>\n    <div class=\"field\" style=\"width:100%\">\n      <label>firebaseConfig (JSON)</label>\n      <textarea id=\"cfgFb\" rows=\"8\" style=\"width:100%;padding:11px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);font-family:monospace;font-size:14.5px\"></textarea>\n    </div>\n    <div class=\"row\" style=\"margin-top:12px\">\n      <button class=\"btn pri\" id=\"cfgFbBtn\">연결 저장 & 재접속</button>\n      <span class=\"note\">⚠ API 키는 도메인 제한(HTTP referrer)을 꼭 거세요. 규칙은 <code>request.auth != null</code> 기준이며 <code>if true</code>를 쓰지 않습니다.</span>\n    </div>\n  </div>\n</section>\n\n</main>\n\n<button class=\"fab\" id=\"settingsFab\" title=\"설정\" aria-label=\"설정\">\n  <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\"/></svg>\n</button>\n</div>\n\n<div class=\"toast\" id=\"toast\"></div>\n\n";

export async function start($R, __QSA) {
  const { doc, getDoc, setDoc, getDocs, collection, writeBatch } = __QSA.fs;


/* ===================================================================
 * 0) Firebase 설정
 *  - 배포 시 아래 BUILTIN_CONFIG 에 직접 넣거나, 설정 탭에서 붙여넣으세요.
 * =================================================================== */
const BUILTIN_CONFIG = null; // QSA: 원본 프로젝트 설정은 쓰지 않음
// ⚠ 이 키는 공개돼도 되는 종류(프로젝트 식별자)지만, 반드시 API 키에
//    HTTP 리퍼러 제한을 걸어 우리 github.io 주소에서만 쓰이게 하세요.

/* ===================================================================
 * 0-1) 네임스페이스 — 셋방살이용 접두어
 *  - 한 Firebase 프로젝트를 다른 도구와 공유할 때 충돌 방지.
 *  - Firestore 컬렉션: quettaReg_daily / quettaReg_config
 *  - 로컬/세션 저장 키도 동일 접두어로 분리.
 *  - 충돌이 발견되면 이 한 줄만 바꾸면 전체 경로가 따라 바뀝니다.
 * =================================================================== */
const NS = 'quettaReg_';
const COL = name => NS + name;          // 컬렉션 이름
const LK  = key  => 'qsaReg_' + key;   // QSA: 기존 앱과 브라우저 저장 공간 분리           // localStorage / sessionStorage 키

/* ===================================================================
 * 0-2) 경영지원 등록관리 앱 — Supabase 읽기 전용 (대조용)
 *  - 그 앱의 공개 anon 키. 우리는 SELECT(읽기)만 한다.
 * =================================================================== */
const SB_URL = 'https://elqxailuuxkzddsujlmc.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscXhhaWx1dXhremRkc3VqbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzM4OTcsImV4cCI6MjA5MDUwOTg5N30.qTip7cpCxRu2vk9-dGGbiyxjsRFc0UbwJMFziYxlljI';
let _sbState=null; // 캐시

/* ===================================================================
 * 0-3) 구글시트 웹앱(Apps Script) — 마스터/접수현황 읽기 전용
 * =================================================================== */
const GS_URL   = 'https://script.google.com/macros/s/AKfycbwGobQP8RxtaaUsenXygk4lkCFvlv2vg1RLiUUHp8Dwg-O7ZHOtpg4G9ax8D6_lor33Xw/exec';
const GS_TOKEN = 'quetta9f3k2xQ';
const GS_WRITE_TOKEN = 'quettawrite7z9';   // 쓰기 전용 토큰
// 쓰기 공통 — GET으로 보낸다.
// POST(/exec → googleusercontent 리디렉션)가 환경에 따라 404/HTML을 돌려줘
// "시트는 다 써졌는데 앱은 실패" 가 반복됐다. 읽기(GET)는 안정적이라 같은 경로를 쓴다.
// 본문은 base64(web-safe) JSON 한 덩어리로 실어 한글 URL 인코딩 폭증을 피한다.
function _b64url(str){
  const bytes=new TextEncoder().encode(str);
  let bin=''; bytes.forEach(b=>{ bin+=String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_');
}
// 수험번호가 많으면 URL 길이에 걸린다 → 자동 분할 전송 후 결과 합산.
// 재전송해도 이미 값이 있는 칸은 건너뛰므로 중복 기입은 생기지 않는다.
async function gsWriteSids(payload, sids, label, onProgress){
  const CHUNK=120;
  const parts=[]; for(let i=0;i<sids.length;i+=CHUNK) parts.push(sids.slice(i,i+CHUNK));
  const acc={ written:[], skipped:[], notFound:[], sheet:'', kind:payload.kind, date:'' };
  for(let i=0;i<parts.length;i++){
    if(onProgress) onProgress(i+1, parts.length);
    const j=await gsWrite(Object.assign({}, payload, { sids:parts[i] }), label);
    acc.sheet=j.sheet; acc.date=j.date;
    acc.written.push(...(j.written||[]));
    acc.skipped.push(...(j.skipped||[]));
    acc.notFound.push(...(j.notFound||[]));
  }
  return acc;
}

async function gsWrite(payload, label){
  const body=JSON.stringify(Object.assign({ token:GS_WRITE_TOKEN }, payload));
  const url=`${GS_URL}?token=${encodeURIComponent(GS_TOKEN)}&p=${encodeURIComponent(_b64url(body))}&_t=${Date.now()}`;
  if(url.length>7500) throw new Error(`요청이 너무 깁니다 (${url.length}자). 건수를 나눠서 보내주세요.`);
  const res=await fetch(url);
  const t=await res.text();
  let j=null;
  try{ j=JSON.parse(t); }
  catch(e){
    const head=String(t||'').replace(/\s+/g,' ').trim().slice(0,200);
    throw new Error(
      `서버가 JSON이 아닌 응답을 보냈습니다 (HTTP ${res.status})` +
      `\n응답 앞부분: ${head||'(빈 응답)'}` +
      (label ? `\n(요청: ${label} — 시트 작업은 이미 끝났을 수 있으니 시트를 먼저 확인하세요)` : ''));
  }
  if(j.error) throw new Error(j.error);
  return j;
}
// 개강후 블록 기입: 반별 오늘값 + 작성자(S1) + 서버가 이월 처리 & raw 누적
async function writeEnroll(rows, writer, receipt, jang, resetPrevReg){
  return gsWrite({ action:'enroll', rows, writer, receipt, jang, resetPrevReg:!!resetPrevReg }, '개강후 기입');
}
// 환불자 이동: 학생명단 행 → 환불 시트 이동 후 삭제 (퇴소일=기준일)
// 수험번호로 행을 특정하므로 재시도해도 중복 이동은 없다(이미 삭제됐으면 notFound로 빠짐).
async function moveRefunders(wy, wm, wd, sids){
  return gsWrite({ action:'refund', wy, wm, wd, sids }, '환불자 이동'); // {moved[], notFound[]}
}
// 학생명단 정규N월 칸(month)에 기준일(wy/wm/wd) 기입 (빈 칸만, 수험번호 매칭)
async function writeRosterDates(month, wy, wm, wd, sids){
  return gsWrite({ month, wy, wm, wd, sids }, '재등록일 기입'); // {written[], skipped[], notFound[]}
}
async function fetchSheet(which, tries){
  const max=tries||3; let last='';
  for(let i=1;i<=max;i++){
    const url=`${GS_URL}?token=${encodeURIComponent(GS_TOKEN)}&which=${which}&_t=${Date.now()}`;
    const ac=new AbortController(); const to=setTimeout(()=>ac.abort(), 60000);  // 60초 넘게 매달리지 않음
    try{
      const res=await fetch(url, {cache:'no-store', signal:ac.signal});
      const t=await res.text();
      let j=null;
      try{ j=JSON.parse(t); }catch{ throw new Error(`HTTP ${res.status} — JSON 아님: ${t.slice(0,100)}`); }
      if(j.error) throw new Error(j.error);
      if(!Array.isArray(j.rows)) throw new Error('rows 없음');
      return j; // {which, sheet, rows, count}
    }catch(e){
      last=(e.name==='AbortError') ? '60초 초과(응답 없음)' : (e.message||String(e));
      if(i<max) await new Promise(r=>setTimeout(r, 700*i));   // 간헐 404/429 재시도
    }finally{ clearTimeout(to); }
  }
  throw new Error(`[${which}] ${max}회 실패 — ${last}`);
}
// 경영지원 당월 재등록 누적 + 미납 (currTerms/prevTerms 기준)
async function sbReRegUnpaid(){
  const st=await loadSbState();
  const pays=Array.isArray(st.pays)?st.pays:[];
  const curr=(st.cfg&&st.cfg.currTerms)||[];
  const prev=(st.cfg&&st.cfg.prevTerms)||[];
  const act=p=>p.status==='active'&&(p.환불금액||0)===0;
  const currIds=new Set(pays.filter(p=>act(p)&&curr.includes(p.내역)).map(p=>p.수험번호));
  const prevIds=new Set(pays.filter(p=>act(p)&&prev.includes(p.내역)).map(p=>p.수험번호));
  let 미납=0; prevIds.forEach(id=>{ if(!currIds.has(id)) 미납++; });
  return { 재등록누적:currIds.size, 미납, currTerms:curr, prevTerms:prev };
}
// 경영지원 기준 미납을 반별로 분해. 누가 미납인지는 경영지원(Supabase),
// 어느 반인지는 학생명단의 현재 반(assign: 수험번호 → 반)으로 정한다.
// 명단에 없는 수험번호는 '미배정'으로 모으고 미매칭 건수로 보고한다(추정·배분 금지).
async function sbUnpaidByBan(assign, banList){
  const st=await loadSbState();
  const pays=Array.isArray(st.pays)?st.pays:[];
  const curr=(st.cfg&&st.cfg.currTerms)||[];
  const prev=(st.cfg&&st.cfg.prevTerms)||[];
  const nsid=v=>String(v==null?'':v).replace(/\s/g,'');
  const act=p=>p.status==='active'&&(p.환불금액||0)===0;
  // 정규 미납에 윈터·시즌제로가 섞이지 않게 거른다(경영지원이 해당 내역을 체크하면 들어온다)
  const other=t=>/윈터|시즌제로|\[\s*\d{2}\s*학년도\s*\]/.test(String(t||''));
  const currIds=new Set(pays.filter(p=>act(p)&&curr.includes(p.내역)&&!other(p.내역)).map(p=>nsid(p.수험번호)));
  const prevIds=new Set(pays.filter(p=>act(p)&&prev.includes(p.내역)&&!other(p.내역)).map(p=>nsid(p.수험번호)));
  const perBan={}; let 총계=0; const 미매칭=[];
  prevIds.forEach(id=>{
    if(currIds.has(id)) return;
    총계++;
    let ban=assign?assign[id]:null;
    if(!ban){ 미매칭.push(id); ban='미배정'; }
    else if(banList && !banList.includes(ban)) ban='미배정';
    perBan[ban]=(perBan[ban]||0)+1;
  });
  return { perBan, 총계, 미매칭, currTerms:curr, prevTerms:prev };
}
// 경영지원 Supabase에서 그날 일일명단 재구성 (그 앱 exportDailyExcel 로직 재현)
function _refDateSb(r){ return r.processedDate || (r.processedAt? (d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)(new Date(r.processedAt)) : ''); }
// 내역 문자열에서 시즌·과정·구분을 뽑는다. 예: '[고1]윈터_완납' → {course:'고1 과정', kind:'완납'}
// 윈터는 하나의 내역 문자열에 과정·시즌·구분이 다 들어 있다(정규는 '정규8기(10월)' 형태).
function winParseTerm(term){
  const t=String(term||'');
  if(!/윈터/.test(t)) return null;
  const mc=t.match(/\[\s*(고[12])\s*\]/);
  // 끝에만 있다고 보면 뒤에 뭐가 붙었을 때 못 읽는다 → 문자열 어디서든 찾는다.
  const mk=t.match(/_\s*(선금|잔금|완납)/);
  return { course: mc? mc[1]+' 과정' : '', kind: mk? mk[1] : '', raw: t };
}

async function buildDailyFromSb(date){
  if(_seasonNow()==='윈터') return buildWinterDailyFromSb(date);
  const st=await loadSbState();
  const pays=Array.isArray(st.pays)?st.pays:[];
  const refunds=Array.isArray(st.refunds)?st.refunds:[];
  const prevTerms=(st.cfg&&st.cfg.prevTerms)||[];
  const currTerms=(st.cfg&&st.cfg.currTerms)||[];
  const dateOf=p=>(p.uploadedDate||p.결제일자);
  // 정규 명단에서 다른 시즌(윈터·시즌제로)을 제외한다.
  // 그쪽 내역에는 '[27학년도]' 같은 학년도 표기가 붙고 정규에는 붙지 않는다.
  const other=t=>/윈터|시즌제로|\[\s*\d{2}\s*학년도\s*\]/.test(String(t||''));
  // 신규 판정: 이전 월 기수(prevTerms)에 이미 납부기록 있으면 신규 아님
  const prevIds=new Set(pays.filter(p=>p.status==='active'&&prevTerms.includes(p.내역)).map(p=>p.수험번호));
  // 등록: 그날 uploadedDate 이면 등록. 당일퇴소(status='퇴소', _isOut)도 '그날 등록한 사실'은 그대로 카운트.
  // 같은 수험번호가 등록·환불 양쪽에 있어도 각각 센다(한쪽에서 빼지 않음).
  // 지난 기수 결제(11월 집계 중에 들어온 10월 미납분 등)는 당월 등록이 아니다.
  // 이미 재원인 사람의 지각 납부라 신규도 아니고 편성계도 늘면 안 된다 → 등록 집계에서 제외.
  // 기준은 경영지원 cfg.currTerms 가 아니라 '설정 > 현재 집계월'이다.
  // (경영지원이 기수 체크를 늦게 바꾸면 currTerms 로는 걸러지지 않는다)
  const BM=parseInt(CFG.billMonth)||0;
  const stale=t=>{ if(!BM) return false; const m=cohortMonth(t); return m>0 && m!==BM; };
  const regsAll=pays.filter(p=>dateOf(p)===date && p.status!=='취소' && p.status!=='void' && !other(p.내역));
  const regs=regsAll.filter(p=>!stale(p.내역));
  const staleCount=regsAll.length-regs.length;
  // 환불: 그날 환불된 pays + refunds
  const refs=[
    ...pays.filter(p=>dateOf(p)===date && (p.환불금액||0)>0 && !other(p.내역)),
    ...refunds.filter(r=>_refDateSb(r)===date && !other((r.removedTerms||[]).join('/')))
      .map(r=>({반:r.반,번호:r.번호||'',수험번호:r.수험번호,이름:r.이름,내역:(r.removedTerms||[]).join('/'),장학:r.장학||''}))
  ];
  const reg=regs.map(p=>({sid:norm(p.수험번호), name:p.이름, ban:p.반, cohort:p.내역, jang:p.장학, isNew:!prevIds.has(p.수험번호)}));
  const ref=refs.map(r=>({sid:norm(r.수험번호), name:r.이름, cohort:r.내역, jang:r.장학}));
  return { reg, ref, fileDate:date, staleCount };
}


/* 윈터 접수대장 기입 — 등록/환불을 따로. 일일명단의 구분(선금·완납·잔금)에 따라 열이 갈린다.
 * 미리보기에서 수험번호·과정·구분·쓸 열·현재값을 보여주고 확인 후 실행한다. */
let WINWB=null;
async function winWbPreview(mode){
  const note=$R.getElementById('gsNote');
  const date=$R.getElementById('baseDate').value;
  if(!date){ toast('기준 날짜를 먼저 선택하세요'); return; }
  note.textContent='명단·접수대장 불러오는 중…';
  try{
    const rows = STATE.winterLedger || (await fetchSheet('winter')).rows;
    STATE.winterLedger = rows;
    const daily = (STATE.daily && STATE.daily.winter && STATE.daily.fileDate===date)
                ? STATE.daily : await buildDailyFromSb(date);
    STATE.daily = daily;

    const hdr=(rows[0]||[]).map(_wn);
    const ix=n=>hdr.indexOf(_wn(n));
    const Ix={ sid:ix('수험번호'), 예비:ix('예비 교습비'), 완납:ix('교습비 완납'),
               환불:ix('환불'), 무의사:ix('등록의사없음'), 과정:ix('시험유형'), 이름:ix('성명') };
    const cur={};
    for(let r=1;r<rows.length;r++){
      const row=rows[r]||[];
      const sid=String(row[Ix.sid]==null?'':row[Ix.sid]).replace(/\s/g,'');
      if(sid && !cur[sid]) cur[sid]={
        row:r+1, 과정:String(row[Ix.과정]||'').trim(), 이름:String(row[Ix.이름]||'').trim(),
        B:String(row[Ix.예비]==null?'':row[Ix.예비]).trim(),
        C:String(row[Ix.완납]==null?'':row[Ix.완납]).trim(),
        D:String(row[Ix.환불]==null?'':row[Ix.환불]).trim()
      };
    }

    const src = mode==='ref' ? daily.ref : daily.reg;
    const items = src.map(x=>{
      const f=cur[x.sid];
      const kind = mode==='ref' ? '환불' : (x.kind||'');     // 못 읽으면 비워둔다 — 추측해서 기입하지 않는다
      const label = mode==='ref' ? '환불' : (x.conv ? '완납전환' : kind||'');
      const cols = kind==='환불' ? ['D','E'] : kind==='완납' ? ['B','C'] : kind==='잔금' ? ['C'] : kind==='선금' ? ['B'] : [];
      const need = cols.filter(c=>c!=='E');
      const taken = !f ? [] : need.filter(c=>f[c]);
      const state = !kind ? '구분불명' : !f ? '없음' : (taken.length===need.length ? '건너뜀' : '기입');
      return { sid:x.sid, name:(f&&f.이름)||x.name||'', course:(f&&f.과정)||x.course||'',
               kind, label, cols, state, raw:x.cohort||'',
               now: f? [f.B&&'B:'+f.B, f.C&&'C:'+f.C, f.D&&'D:'+f.D].filter(Boolean).join(' ') : '' };
    });

    WINWB={ mode, date, items };
    const n=k=>items.filter(i=>i.state===k).length;
    $R.getElementById('winWbTitle').textContent = mode==='ref' ? '접수대장 환불 기입 미리보기' : '접수대장 등록 기입 미리보기';
    $R.getElementById('winWbSummary').innerHTML =
      `✅ 기입 ${n('기입')} · ⏭ 건너뜀 ${n('건너뜀')} · ⚠ 명단에 없음 ${n('없음')}`
      + (n('구분불명')?` · <span style="color:var(--red)">⚠ 구분불명 ${n('구분불명')}</span>`:'');
    $R.getElementById('winWbTable').innerHTML =
      `<thead><tr><th>상태</th><th>수험번호</th><th>이름</th><th>과정</th><th>구분</th><th>내역(원본)</th><th>쓸 열</th><th>현재값</th></tr></thead><tbody>`
      + items.map(i=>`<tr class="${i.state==='기입'?'':'muted'}">
          <td>${i.state==='기입'?'✅ 기입':i.state==='건너뜀'?'⏭ 건너뜀'
             :i.state==='없음'?'<span style="color:var(--red)">⚠ 명단에 없음</span>'
             :'<span style="color:var(--red)">⚠ 구분불명</span>'}</td>
          <td class="mono">${i.sid}</td><td>${i.name}</td><td>${i.course}</td>
          <td>${i.label||'—'}</td><td class="mono">${i.raw}</td>
          <td class="mono">${i.cols.join('·')||'—'}</td><td class="mono">${i.now}</td></tr>`).join('')
      + `</tbody>`;
    $R.getElementById('winWbApplyBtn').disabled = n('기입')===0;
    $R.getElementById('winWbApplyBtn').textContent = `접수대장에 ${n('기입')}건 기입 실행`;
    $R.getElementById('winWbApplyNote').textContent='';
    $R.getElementById('winWbPanel').style.display='block';
    note.innerHTML=`✅ ${mode==='ref'?'환불':'등록'} ${items.length}건 미리보기`;
  }catch(e){
    console.error(e);
    note.innerHTML=`<span style="color:var(--red)">⚠ ${e.message||e}</span>`;
  }
}
const _wr1=$R.getElementById('winRegBtn2'); if(_wr1) _wr1.onclick=()=>winWbPreview('reg');
const _wr2=$R.getElementById('winRefBtn2'); if(_wr2) _wr2.onclick=()=>winWbPreview('ref');
const _wwc=$R.getElementById('winWbCancelBtn');
if(_wwc) _wwc.onclick=()=>{ $R.getElementById('winWbPanel').style.display='none'; };
const _wwa=$R.getElementById('winWbApplyBtn');
if(_wwa) _wwa.onclick=async()=>{
  if(!WINWB) return;
  const out=$R.getElementById('winWbApplyNote');
  const [wy,wm,wd]=WINWB.date.split('-').map(Number);
  // 구분별로 묶어 보낸다(한 번에 한 kind 만 처리하는 서버 규약)
  const groups={};
  WINWB.items.filter(i=>i.state==='기입').forEach(i=>{ (groups[i.kind]=groups[i.kind]||[]).push(i.sid); });
  _wwa.disabled=true; out.textContent='기입 중…';
  const lines=[];
  try{
    for(const kind of Object.keys(groups)){
      const j=await gsWriteSids({ action:'winterReg', kind, wy, wm, wd },
        groups[kind], `접수대장 ${kind} 기입`,
        (n,t)=>{ out.textContent = t>1 ? `${kind} 기입 중… ${n}/${t}` : `${kind} 기입 중…`; });
      lines.push(`${kind}: 기입 ${j.written.length}${j.skipped.length?` · 건너뜀 ${j.skipped.length}`:''}${j.notFound.length?` · 없음 ${j.notFound.length}`:''}`);
    }
    out.innerHTML='✅ '+lines.join('\n');
    STATE.winterLedger=null;   // 다음 집계는 새로 읽는다
  }catch(e){
    out.innerHTML=`<span style="color:var(--red)">⚠ ${e.message||e}</span>\n`+(lines.length?lines.join('\n'):'');
  }finally{ _wwa.disabled=false; }
};

/* 윈터 등록잡기 — 접수는 접수대장(접수일), 등록·환불·완납은 경영지원 일일명단.
 * 성별은 접수대장에서 수험번호로 맞춘다(일일명단에는 성별이 없다).
 * 완납전환(잔금)은 선금 때 이미 셌으므로 등록으로 세지 않는다. */
let WINR=null;
async function winRosterRun(date, note){
  try{
    note.textContent='접수대장·일일명단 집계 중…';
    const rows = STATE.winterLedger || (await fetchSheet('winter')).rows;
    STATE.winterLedger = rows;
    const daily = STATE.daily && STATE.daily.winter && STATE.daily.fileDate===date
                ? STATE.daily : await buildDailyFromSb(date);
    STATE.daily = daily;

    // 접수대장 색인: 수험번호 → {course, sex}
    const hdr=(rows[0]||[]).map(_wn);
    const ix=n=>hdr.indexOf(_wn(n));
    const Ix={ sid:ix('수험번호'), 접수:ix('접수일'), 과정:ix('시험유형'), 성별:ix('성별') };
    const miss=Object.keys(Ix).filter(k=>Ix[k]<0);
    if(miss.length) throw new Error('접수대장 열 없음: '+miss.join(', '));
    const info={};
    const sy=+String(date).slice(0,4);
    const out={}; WIN_COURSES.forEach(c=>out[c]={course:c,jubsu:0,regM:0,regF:0,refM:0,refF:0,fullM:0,fullF:0});
    for(let r=1;r<rows.length;r++){
      const row=rows[r]||[];
      const sid=String(row[Ix.sid]==null?'':row[Ix.sid]).replace(/\s/g,'');
      const course=String(row[Ix.과정]||'').trim();
      const sex=String(row[Ix.성별]||'').trim()==='남'?'M':'F';
      if(sid) info[sid]={course,sex};
      if(WIN_COURSES.indexOf(course)>=0 && winYmd(row[Ix.접수],sy)===date) out[course].jubsu++;
    }

    const 미매칭=[];
    const bump=(sid, fallbackCourse, field)=>{
      const f=info[sid];
      const course=(f&&f.course) || fallbackCourse;
      if(!f) 미매칭.push(sid);
      if(WIN_COURSES.indexOf(course)<0) return;
      const g=(f&&f.sex)||'F';
      out[course][field+g]++;
    };
    daily.reg.forEach(x=>{
      if(x.kind==='잔금'){ bump(x.sid, x.course, 'full'); return; }   // 완납전환 — 등록 아님
      bump(x.sid, x.course, 'reg');
      if(x.kind==='완납') bump(x.sid, x.course, 'full');
    });
    daily.ref.forEach(x=>bump(x.sid, x.course, 'ref'));

    // 전일값 — 정규와 동일하게 '어제 현황 저장본'에서. 저장을 거르면 끊긴다.
    // 전일값은 '어제' 문서가 아니라 '저장된 날짜 중 기준일보다 앞선 가장 최근 날짜'에서 가져온다.
    // 주말·휴일처럼 저장을 건너뛴 날이 있으면 어제 문서가 없어 0으로 떨어지고,
    // 그 0이 그대로 저장돼 다음날로 음수가 전파된다(실제로 그렇게 깨졌음).
    // 전일값은 저장된 '등록인원/접수 계/완납계' 칸을 믿지 않는다.
    // 그 칸들은 과거에 전일값이 끊긴 채 저장돼 음수가 남아 있을 수 있다.
    // 지난 등록 보기와 동일하게 '일별 증감을 처음부터 누적'해서 구한다(그 값은 정확함).
    let noPrev=true, prevDate=null, prevAgg=null;
    try{
      if(!HIST.dates.length) await loadRawlogAll();
      const cand=HIST.dates.filter(d=>d<date).sort();
      if(cand.length){
        prevDate=cand[cand.length-1];
        prevAgg=buildWinterHist(prevDate);
        noPrev=false;
      }
    }catch(e){ noPrev=true; prevDate=null; prevAgg=null; }
    const prevOf=(course,field)=>{
      if(!prevAgg) return 0;
      const b=prevAgg.rows.find(x=>x.course===course);
      if(!b) return 0;
      if(field==='등록인원') return b.등록인원||0;
      if(field==='접수 계')  return b.jubsu||0;
      if(field==='완납계')   return b.full||0;
      if(field==='누적남')   return b.누적남||0;
      if(field==='누적여')   return b.누적여||0;
      return 0;
    };
    WIN_COURSES.forEach(c=>{
      const b=out[c];
      b.전일등록 = prevOf(c,'등록인원');
      b.전일접수 = prevOf(c,'접수 계');
      b.전일완납 = prevOf(c,'완납계');
      b.등록인원 = b.전일등록 + (b.regM+b.regF) - (b.refM+b.refF);
      b.접수계   = b.전일접수 + b.jubsu;
      b.완납계   = b.전일완납 + (b.fullM+b.fullF);
      // 성별 누적 — 시즌제로 가용 정원 계산에 쓴다
      b.누적남 = prevOf(c,'누적남') + b.regM - b.refM;
      b.누적여 = prevOf(c,'누적여') + b.regF - b.refF;
    });

    WINR={ date, rows:WIN_COURSES.map(c=>out[c]), 미매칭, noPrev, prevDate: noPrev?null:prevDate };
    winDashRender();
    note.innerHTML=`✅ 접수대장 ${rows.length-1}행 · 일일명단 등록 ${daily.reg.length} · 환불 ${daily.ref.length} 집계 완료`
      + (미매칭.length?` <span style="color:var(--red)">(접수대장에 없는 수험번호 ${미매칭.length}건: ${미매칭.join(', ')})</span>`:'');
    switchTab('dash');
  }catch(e){
    console.error(e);
    note.innerHTML=`<span style="color:var(--red)">⚠ ${e.message||e}</span>`;
  }
}

function winDashRender(){
  const panel=$R.getElementById('winDash');
  const dash=$R.getElementById('dashContent');
  const empty=$R.getElementById('dashEmpty');
  if(!WINR){ panel.style.display='none';
    const h=$R.getElementById('winHero'); if(h) h.style.display='none';
    const t=$R.getElementById('winTiles'); if(t) t.style.display='none'; return; }
  panel.style.display='block';
  if(dash) dash.style.display='none';
  if(empty) empty.style.display='none';
  const hero=$R.getElementById('winHero'); if(hero) hero.style.display='';
  WIN_COURSES.forEach((c,i)=>{
    const b=WINR.rows[i]||{}; const n=i+1;
    const reg=(b.regM||0)+(b.regF||0), ref=(b.refM||0)+(b.refF||0);
    $R.getElementById(`winHero${n}Reg`).textContent=reg;
    $R.getElementById(`winHero${n}Ref`).textContent=ref;
    $R.getElementById(`winHero${n}Mini`).innerHTML=
      `<div class="hp">등록인원<b>${b.등록인원||0}</b></div>`+
      `<div class="hp">접수 계<b>${b.접수계||0}</b></div>`+
      `<div class="hp">완납 계<b>${b.완납계||0}</b></div>`+
      `<div class="hp">남/여<b>${b.누적남||0}/${b.누적여||0}</b></div>`;
  });
  const after=!!(CFG.openWin && WINR.date>CFG.openWin);
  const CAP=CFG.winCap||{}, DORM=CFG.winDorm||{};
  const capOf=(i,g)=>{ const v=CAP[g+(i+1)]; return (v==null?0:v); };
  const T={jubsu:0,regM:0,regF:0,refM:0,refF:0,전일등록:0,등록인원:0,접수계:0,완납계:0,누적남:0,누적여:0};
  WINR.rows.forEach(b=>{ for(const k in T) T[k]+=(b[k]||0); });

  const pct=(n,d)=>d>0?Math.round(n/d*1000)/10+'%':'—';
  const neg=v=>v?`<b>${-v}</b>`:'';
  const tr=WINR.rows.map((b,i)=>{
    const cap=capOf(i,'M')+capOf(i,'F');
    return `<tr>
      <td><b>${b.course}</b></td>
      <td class="mono grp">${b.접수계}</td>
      <td class="mono grp">${WINR.noPrev?'–':b.전일등록}</td>
      <td class="mono">${(b.regM+b.regF)||''}</td>
      <td class="mono ${(b.refM+b.refF)?'neg':''}">${neg(b.refM+b.refF)}</td>
      <td class="mono grp">${b.regM||''}</td>
      <td class="mono ${b.refM?'neg':''}">${neg(b.refM)}</td>
      <td class="mono">${b.regF||''}</td>
      <td class="mono ${b.refF?'neg':''}">${neg(b.refF)}</td>
      <td class="mono grp">${b.완납계}</td>
      <td class="mono">${cap||'—'}</td>
      <td class="mono">${pct(b.등록인원,cap)}</td></tr>`;}).join('');
  const capT=['M','F'].reduce((n,g)=>n+capOf(0,g)+capOf(1,g),0);
  $R.getElementById('winDashTable').innerHTML=
    `<table class="tbl winTbl"><thead>
      <tr class="grphead"><th></th><th class="grp">접수</th>
        <th class="grp" colspan="3">당일 증감</th>
        <th class="grp" colspan="4">성별</th>
        <th class="grp" colspan="3">누적 · 정원</th></tr>
      <tr>
      <th>과정</th><th class="grp">접수 계</th><th class="grp">전일등록</th><th>금일등록</th><th>금일환불</th>
      <th class="grp">남자 등록</th><th>남자 환불</th><th>여자 등록</th><th>여자 환불</th>
      <th class="grp">완납계</th><th>정원</th><th>충원율</th>
    </tr></thead><tbody>${tr}
      <tr class="sum"><td><b>소계</b></td>
        <td class="mono grp">${T.접수계}</td>
        <td class="mono grp">${WINR.noPrev?'–':T.전일등록}</td>
        <td class="mono"><b>${T.regM+T.regF}</b></td>
        <td class="mono ${(T.refM+T.refF)?'neg':''}">${neg(T.refM+T.refF)||'<b>0</b>'}</td>
        <td class="mono grp"><b>${T.regM}</b></td>
        <td class="mono ${T.refM?'neg':''}">${neg(T.refM)||'<b>0</b>'}</td>
        <td class="mono"><b>${T.regF}</b></td>
        <td class="mono ${T.refF?'neg':''}">${neg(T.refF)||'<b>0</b>'}</td>
        <td class="mono grp">${T.완납계}</td>
        <td class="mono">${capT||'—'}</td><td class="mono">${pct(T.등록인원,capT)}</td></tr>
    </tbody></table>`;

  $R.getElementById('winWarn').innerHTML = WINR.noPrev
    ? `<div class="note" style="color:var(--red)">전일 저장본이 없어 전일등록을 0으로 잡았습니다. 매일 <b>현황 저장</b>을 눌러야 다음날로 이어집니다.</div>` : '';

  // 통계 타일
  const tile=(lab,val,sub,cls)=>`<div class="stat ${cls||''}"><div class="v">${val}</div><div class="l">${lab}${sub?` · ${sub}`:''}</div></div>`;
  const tiles=$R.getElementById('winTiles');
  tiles.style.display='';
  tiles.innerHTML =
    tile('윈터 총 등록인원', T.등록인원, `남 ${T.누적남} · 여 ${T.누적여}`, 't')
    + WINR.rows.map((b,i)=>tile(b.course+' 등록인원', b.등록인원, `정원 ${capOf(i,'M')+capOf(i,'F')||'—'} · ${pct(b.등록인원,capOf(i,'M')+capOf(i,'F'))}`, 'g')).join('')
    + tile('총 접수', T.접수계, '', 'y');

  // 시즌제로 가용 정원 = 총 기숙사 정원 − 윈터 등록인원 (성별)
  const zm=(DORM.M==null?null:DORM.M-T.누적남), zf=(DORM.F==null?null:DORM.F-T.누적여);
  $R.getElementById('winZeroTable').innerHTML=
    `<thead><tr><th>성별</th><th>총 기숙사 정원</th><th>윈터 등록인원</th><th>시즌제로 가용</th></tr></thead>
     <tbody>
      <tr><td>남</td><td class="mono">${DORM.M??'—'}</td><td class="mono">${T.누적남}</td><td class="mono"><b>${zm??'—'}</b></td></tr>
      <tr><td>여</td><td class="mono">${DORM.F??'—'}</td><td class="mono">${T.누적여}</td><td class="mono"><b>${zf??'—'}</b></td></tr>
      <tr class="sum"><td><b>합계</b></td>
        <td class="mono">${(DORM.M??0)+(DORM.F??0)||'—'}</td>
        <td class="mono">${T.등록인원}</td>
        <td class="mono"><b>${(zm==null||zf==null)?'—':zm+zf}</b></td></tr>
     </tbody>`;
  $R.getElementById('winDashNote').innerHTML=
    `${WINR.date} · 기입 대상 ${after?'개강후 등록(13·14행)':'개강전 등록(8·9행)'}`
    + (WINR.prevDate
        ? ` · <span style="${_isYday(WINR.prevDate,WINR.date)?'':'color:var(--red);font-weight:700'}">전일값 기준 ${WINR.prevDate.slice(5).replace('-','/')}</span>`
        : ` · <span style="color:var(--red);font-weight:700">전일값 없음</span>`);

  // 보고용 한 줄 — 학년 구분 없이 합계
  const reg=WINR.rows.reduce((n,b)=>n+b.regM+b.regF,0);
  const ref=WINR.rows.reduce((n,b)=>n+b.refM+b.refF,0);
  WINR.report={ 금일등록:reg, 금일환불:ref };
  const md=WINR.date.slice(5).replace('-','/').replace(/^0/,'');
  $R.getElementById('winReportTable').innerHTML=
    `<thead><tr><th>날짜</th><th>전일등록</th><th>금일등록</th><th>금일환불</th><th>등록인원</th></tr></thead>
     <tbody><tr><td class="mono">${md}</td><td class="mono muted">시트 수식</td>
       <td class="mono"><b>${reg}</b></td><td class="mono ${ref?'neg':''}"><b>${ref?-ref:0}</b></td>
       <td class="mono muted">시트 수식</td></tr></tbody>`;
}

const _winCopy=$R.getElementById('winReportCopyBtn');
if(_winCopy) _winCopy.onclick=async()=>{
  if(!WINR||!WINR.report){ toast('먼저 등록잡기를 실행하세요'); return; }
  const txt=`${WINR.report.금일등록}\t${WINR.report.금일환불? -WINR.report.금일환불 : 0}`;
  try{ await navigator.clipboard.writeText(txt); toast('✅ 금일등록·금일환불 2칸 복사됨'); }
  catch(e){ toast('⚠ 복사 실패 — 직접 입력해 주세요'); }
};
const _winSave=$R.getElementById('winSaveBtn');
if(_winSave) _winSave.onclick=async()=>{
  const out=$R.getElementById('winDashOut');
  if(!WINR){ out.textContent='먼저 등록잡기를 실행하세요.'; return; }
  // 전일값이 없거나 누적이 음수면 저장을 막는다. 한 번 저장되면 다음날로 그대로 전파된다.
  const bad=WINR.rows.find(b=>(b.등록인원||0)<0 || (b.접수계||0)<0);
  if(WINR.noPrev || bad){
    const why = WINR.noPrev ? '전일 저장본을 읽지 못했습니다'
                            : `${bad.course} 누적이 음수입니다 (등록인원 ${bad.등록인원})`;
    out.innerHTML=`<span style="color:var(--red)">⚠ 저장 중단 — ${why}.<br>`
      + `이 상태로 저장하면 다음날 전일값까지 망가집니다. ‘전일 불러오기’로 다시 읽은 뒤 등록잡기를 실행하세요.</span>`;
    return;
  }
  _winSave.disabled=true; out.textContent='저장 중…';
  try{
    // 윈터 rawlog — 시즌 네임스페이스(winter_)로 저장되어 '지난 등록 보기'에 쌓인다
    const writer=($R.getElementById('writer').value||CFG.writer||'');
    const 구분=(CFG.openWin && WINR.date>CFG.openWin)?'개강후':'개강전';
    const rows=WINR.rows.map(b=>[
      WINR.date, 구분, b.course, '-', '',
      b.jubsu, b.접수계,
      b.regM, b.refM?-b.refM:0,
      b.regF, b.refF?-b.refF:0,
      (b.fullM+b.fullF), b.완납계, b.등록인원, b.누적남, b.누적여, writer
    ]);
    await saveRawlogDay(WINR.date, rows);
    out.innerHTML='✅ 현황 저장 완료 — 지난 등록 보기에 누적됩니다';
    toast('✅ 저장 완료');
  }catch(e){
    out.innerHTML=`<span style="color:var(--red)">⚠ 저장 실패: ${e.message||e}</span>`;
  }finally{ _winSave.disabled=false; }
};
const _winPrev=$R.getElementById('winPrevBtn');
if(_winPrev) _winPrev.onclick=async()=>{
  const out=$R.getElementById('winDashOut');
  out.textContent='전일 저장본 다시 읽는 중…';
  try{ await loadRawlogAll(true);
    const d=$R.getElementById('baseDate').value;
    if(d) await winRosterRun(d, $R.getElementById('gsNote'));
    out.textContent='✅ 전일값 갱신됨';
  }catch(e){ out.innerHTML=`<span style="color:var(--red)">⚠ ${e.message||e}</span>`; }
};
const _winDashWrite=$R.getElementById('winDashWriteBtn');
if(_winDashWrite) _winDashWrite.onclick=async()=>{
  const out=$R.getElementById('winDashOut');
  if(!WINR){ out.textContent='먼저 등록잡기를 실행하세요.'; return; }
  const after=!!(CFG.openWin && WINR.date>CFG.openWin);
  _winDashWrite.disabled=true; out.textContent='기입 중…';
  try{
    const j=await gsWrite({ action:'winterEnroll', afterOpen:after, rows:WINR.rows,
                            writer:($R.getElementById('writer').value||CFG.writer||'') }, '윈터 등록현황 기입');
    const r=j.raw||{};
    out.innerHTML=`✅ ${j.sheet} 기입 완료 — ${j.written.join(', ')}` +
      (r.ok ? `<br>📄 ${r.sheet} 로 ${r.date} ${r.kind} ${r.rows}행 이관 (${r.at}행부터)`
            : `<br><span style="color:var(--red)">📄 로데이터 이관 안 됨 — ${r.msg||'사유 불명'}</span>`);
  }catch(e){
    out.innerHTML=`<span style="color:var(--red);white-space:pre-wrap">⚠ ${e.message||e}</span>`;
  }finally{ _winDashWrite.disabled=false; }
};

// 윈터 일일명단 — 내역에 '윈터'가 들어간 건만. 정규 기수는 섞이지 않는다.
// 구분(선금/완납/잔금)은 내역 문자열 끝에서 읽고, 성별은 접수대장에서 수험번호로 맞춘다.
async function buildWinterDailyFromSb(date){
  const st=await loadSbState();
  const pays=Array.isArray(st.pays)?st.pays:[];
  const refunds=Array.isArray(st.refunds)?st.refunds:[];
  const dateOf=p=>(p.uploadedDate||p.결제일자);

  const regs=pays.filter(p=>dateOf(p)===date && p.status!=='취소' && p.status!=='void' && winParseTerm(p.내역));
  const refs=[
    ...pays.filter(p=>dateOf(p)===date && (p.환불금액||0)>0 && winParseTerm(p.내역)),
    ...refunds.filter(r=>_refDateSb(r)===date && winParseTerm((r.removedTerms||[]).join('/')))
      .map(r=>({반:r.반,번호:r.번호||'',수험번호:r.수험번호,이름:r.이름,내역:(r.removedTerms||[]).join('/'),장학:r.장학||''}))
  ];

  // 같은 사람이 '_선금'과 '_완납' 두 건으로 들어오는 경우가 있다.
  // 완납 한 줄이 B·C를 모두 쓰므로 그 사람의 선금 줄은 빼야 등록이 두 번 세어지지 않는다.
  const _lumpSids=new Set(regs.filter(p=>{
    const w=winParseTerm(p.내역)||{}; return w.kind==='완납' && p._conv!==true;
  }).map(p=>norm(p.수험번호)));
  const regs2=regs.filter(p=>{
    const w=winParseTerm(p.내역)||{};
    return !(w.kind==='선금' && _lumpSids.has(norm(p.수험번호)));
  });

  const reg=regs2.map(p=>{ const w=winParseTerm(p.내역)||{};
    // 완납전환은 내역이 '_완납'으로 와서 당일 완납과 구분되지 않는다.
    // 경영지원이 보내는 _conv 플래그가 유일한 판정 근거다(true = 선금 냈던 사람의 잔금 납부).
    const conv = (p._conv===true);
    const kind = conv ? '잔금' : w.kind;
    return { sid:norm(p.수험번호), name:p.이름, ban:p.반, cohort:p.내역,
             course:w.course, kind, conv, lump:(p._lump===true), isOut:(p._isOut===true),
             jang:p.장학,
             // 완납전환은 선금 때 이미 등록으로 셌으므로 다시 세지 않는다
             countReg: !conv };
  });
  // 환불도 같은 수험번호가 여러 줄로 오면 1회만
  const _seenRef=new Set();
  const ref=refs.filter(r=>{ const k=norm(r.수험번호); if(_seenRef.has(k)) return false; _seenRef.add(k); return true; })
    .map(r=>{ const w=winParseTerm(r.내역)||{};
      return { sid:norm(r.수험번호), name:r.이름, cohort:r.내역, course:w.course, kind:w.kind, jang:r.장학 };
    });
  return { reg, ref, fileDate:date, winter:true };
}

async function loadSbState(){
  if(_sbState) return _sbState;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const sb = createClient(SB_URL, SB_ANON);
  const { data, error } = await sb.from('quetta_state').select('data').eq('id',1).single();
  if(error) throw error;
  _sbState = data?.data || null;
  return _sbState;
}
// 경영지원 앱의 같은 날짜 합계 계산 (읽기 데이터 기반)
function sbTotalsForDate(st, date){
  if(!st) return null;
  const pays=Array.isArray(st.pays)?st.pays:[];
  const refunds=Array.isArray(st.refunds)?st.refunds:[];
  const snaps=st.snapshots||{};
  const todayIn = pays.filter(p=>(p.uploadedDate||p.결제일자)===date && (p.환불금액||0)===0).length;
  const todayRef = refunds.filter(r=>(r.processedDate || (r.processedAt? new Date(r.processedAt).toISOString().slice(0,10):'') )===date).length;
  // 총인원(참고): 해당 날짜 스냅샷의 _grandTotal 우선, 없으면 내역 합
  let grand=null;
  if(snaps[date]){
    if(snaps[date]._grandTotal!=null) grand=snaps[date]._grandTotal;
    else grand=Object.entries(snaps[date]).filter(([k])=>!k.startsWith('_')).reduce((a,[,v])=>a+(v||0),0);
  }
  return { 금일등록:todayIn, 금일환불:todayRef, 총인원:grand };
}


let app=null, auth=null, db=null, fbReady=false;

function loadConfig(){
  if (BUILTIN_CONFIG) return BUILTIN_CONFIG;
  try { return JSON.parse(localStorage.getItem(LK('fb'))||'null'); } catch(e){ return null; }
}
async function initFirebase(){
  // QSA: 익명 로그인 대신, 이미 QSA(Google·허용목록)로 로그인된 Firestore 를 사용
  db = __QSA.db;
  fbReady = true; setConn(true,'QSA 연결됨');
  return true;
}
function setConn(ok,txt){
  const d=$R.getElementById('connDot'), t=$R.getElementById('connTxt');
  if(d) d.className='dot'+(ok?'':' off'); if(t) t.textContent=txt;
}

/* ===================================================================
 * 1) 게이트 (익명 로그인 + 비번 해시)
 * =================================================================== */
async function sha256(s){
  const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function getGateHash(){
  if(fbReady){ try{ const s=await getDoc(doc(db,COL('config'),'gate')); if(s.exists()) return s.data().hash; }catch(e){} }
  return localStorage.getItem(LK('gate'))||null;
}
async function setGateHash(h){
  localStorage.setItem(LK('gate'),h);
  if(fbReady){ try{ await setDoc(doc(db,COL('config'),'gate'),{hash:h},{merge:true}); }catch(e){} }
}
$R.getElementById('gateBtn').onclick = enterGate;
$R.getElementById('gatePw').addEventListener('keydown',e=>{ if(e.key==='Enter') enterGate(); });
$R.getElementById('setupLink').onclick = ()=>{ setRole('staff'); openApp(); switchTab('set'); };
$R.getElementById('roleViewer').onclick = ()=>{ setRole('viewer'); sessionStorage.setItem(LK('in'),'1'); PENDING_TAB='hist'; openApp(); };
$R.getElementById('roleStaff').onclick = ()=>{ $R.getElementById('gateRole').style.display='none'; $R.getElementById('gatePwStep').style.display='block'; $R.getElementById('gatePw').focus(); };
$R.getElementById('roleBack').onclick = ()=>{ $R.getElementById('gatePwStep').style.display='none'; $R.getElementById('gateRole').style.display='block'; $R.getElementById('gateErr').textContent=''; };

function setRole(r){ sessionStorage.setItem(LK('role'), r); applyRole(r); }
function currentRole(){ return sessionStorage.getItem(LK('role'))||'staff'; }
function applyRole(role){
  const viewer = role==='viewer';
  const viewerTabs = ['dash','hist'];
  $R.querySelectorAll('nav button').forEach(b=>{
    b.style.display = (viewer && !viewerTabs.includes(b.dataset.tab)) ? 'none' : '';
  });
  const fab=$R.getElementById('settingsFab'); if(fab) fab.style.display = viewer ? 'none' : '';
}

async function enterGate(){
  const pw=$R.getElementById('gatePw').value;
  const err=$R.getElementById('gateErr'); err.textContent='';
  const stored=await getGateHash();
  if(!stored){ err.textContent='비번이 아직 설정되지 않았어요. 아래 초기 설정에서 먼저 지정하세요.'; return; }
  if(await sha256(pw)===stored){ setRole('staff'); sessionStorage.setItem(LK('in'),'1'); openApp(); }
  else err.textContent='비밀번호가 올바르지 않아요. 다시 확인해 주세요.';
}
// 로그인 후 시즌 선택 단계. 시즌마다 rawlog·설정 네임스페이스가 달라
// 세션 시작 시 한 번 정하고, 바꿀 때도 이 화면으로 돌아온다.
let PENDING_TAB=null;
function showSeasonStep(){
  $R.getElementById('app').style.display='none';
  $R.getElementById('gate').style.display='flex';
  $R.getElementById('gateRole').style.display='none';
  $R.getElementById('gatePwStep').style.display='none';
  $R.getElementById('gateSeasonStep').style.display='block';
  $R.getElementById('gateErr').textContent='';
}
async function enterSeason(sn){
  setSeason(sn);
  $R.getElementById('gate').style.display='none';
  $R.getElementById('app').style.display='block';
  applyRole(currentRole());
  // 시즌별 설정·누적 로그를 다시 읽는다
  HIST.byDate={}; HIST.dates=[];
  try{ await loadCfg(); }catch(e){ console.error(e); }
  try{ await loadRawlogAll(); }catch(e){ console.error(e); }
  refreshHistUI(); updateSplitTag();
  if(PENDING_TAB){ const t=PENDING_TAB; PENDING_TAB=null; switchTab(t); }
}
function openApp(){ showSeasonStep(); }
$R.querySelectorAll('.seasonPick').forEach(b=>b.onclick=()=>enterSeason(b.dataset.season));
$R.getElementById('seasonChange').onclick=()=>showSeasonStep();

/* ===================================================================
 * 2) 탭
 * =================================================================== */
function switchTab(name){
  $R.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  $R.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.id==='tab-'+name));
}
$R.querySelectorAll('nav button').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
$R.getElementById('settingsFab').onclick=()=>switchTab('set');
$R.getElementById('setBack').onclick=()=>switchTab('dash');



/* ===================================================================
 * 3) 유틸 / 파서
 * =================================================================== */
const norm = v => v==null ? null : (typeof v==='number' ? String(Math.round(v)) : String(v).trim());
const SEXM={'남':'M','여':'F'};
function toast(m){ const t=$R.getElementById('toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }

function readXlsx(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=e=>{ try{ res(XLSX.read(e.target.result,{type:'array',cellDates:true})); }catch(err){rej(err);} };
    r.onerror=rej; r.readAsArrayBuffer(file);
  });
}
function sheetRows(wb, names){
  for(const n of names){ if(wb.SheetNames.includes(n)) return XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null}); }
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:null});
}

// 일일등록명단: A1=날짜, 3행=헤더, 좌(등록 0~7) 우(환불 9~15)
function parseDaily(wb){
  const rows=sheetRows(wb,['일일명단','일일등록명단']);
  let hdr=rows.findIndex(r=>r&&r.some(c=>String(c).trim()==='수험번호'));
  if(hdr<0) hdr=2;
  const reg=[], ref=[];
  for(let i=hdr+1;i<rows.length;i++){
    const r=rows[i]||[];
    if(r[3]!=null) reg.push({sid:norm(r[3]),name:r[4],ban:r[1],cohort:r[5],jang:r[6],isNew:!!r[7]});
    if(r[11]!=null) ref.push({sid:norm(r[11]),name:r[12],cohort:r[13],refund:r[14],jang:r[15]});
  }
  // 상단 날짜
  let d=null; const top=rows[0]||[];
  for(const c of top){ if(c instanceof Date){d=c;break;} if(typeof c==='string'&&/\d{4}-\d{2}-\d{2}/.test(c)){d=c;break;} }
  return {reg, ref, fileDate:d};
}

// 마스터 원생마스터: 헤더명으로 컬럼 탐색 + 반별 편성인원 카운트
function parseMaster(wb){ return parseMasterRows(sheetRows(wb,['원생마스터','학생명단'])); }
function parseMasterRows(rows){
  const hdr=rows[0]||[];
  const find=(...alts)=>{ for(const a of alts){ const i=hdr.findIndex(h=>String(h).trim()===a); if(i>=0) return i; } return -1; };
  const ci={sid:find('수험번호'), sex:find('성별'), ban:find('반'), jh:find('전형방법'), gye:find('계열'), st:find('상태'), name:find('성명')};
  const map={}, banCount={};
  for(let i=1;i<rows.length;i++){
    const r=rows[i]||[]; const k=norm(r[ci.sid]); if(!k) continue;
    const ban=r[ci.ban];
    map[k]={sex:r[ci.sex], ban, jh:r[ci.jh], gye:r[ci.gye], state:r[ci.st], name:r[ci.name]};
    if(ban){ banCount[ban]=(banCount[ban]||0)+1; }  // 편성인원 = 반별 학생 수
  }
  const total = Object.values(map).filter(v=>v.state==='재원').length;
  return {map, total, banCount};
}

// 접수현황(학생전체조회/접수등록대장): 전형방법별 접수 카운트 + 합격(유시험 제외 = 접수)
function parseReceipt(wb){ return parseReceiptRows(sheetRows(wb,['학생전체조회','접수등록대장'])); }
function parseReceiptRows(rows){
  // 헤더행 탐색 (수험번호 + 전형방법 포함된 행)
  let h=rows.findIndex(r=>r&&r.some(c=>String(c).trim()==='수험번호')&&r.some(c=>String(c).trim()==='전형방법'));
  if(h<0) h=0;
  const hdr=rows[h]||[];
  const find=a=>hdr.findIndex(c=>String(c).trim()===a);
  const ci={sid:find('수험번호'), jh:find('전형방법'), gye:find('계열1'), sex:find('성별')};
  const byJh={};
  for(let i=h+1;i<rows.length;i++){
    const r=rows[i]||[]; const sid=norm(r[ci.sid]); const jh=r[ci.jh];
    if(!sid||!jh) continue;
    const key=String(jh).trim();
    if(!byJh[key]) byJh[key]={접수:0,접수남:0,접수여:0};
    byJh[key].접수++;
    if(r[ci.sex]==='남') byJh[key].접수남++; else if(r[ci.sex]==='여') byJh[key].접수여++;
  }
  return {byJh};
}

/* ===================================================================
 * 4) 결합 + 집계
 * =================================================================== */
let STATE={ daily:null, master:null, receipt:null, result:null };

// 고정 목록 (설정에서 덮어쓰기 가능)
const DEFAULT_BANS=['A','X','I','O','M','K','N','D','S'];
// 접수현황 블록 전형 순서 (2026정규 시트 4~13행)
const JH_LIST=['장학퀀텀_0T','장학퀀텀_4T','장학퀀텀_6T','장학퀀텀_10T','장학퀀텀_14T','우선선발 전형','선착순 전형','수학만 전형','특별 전형','유시험 전형'];
const DEFAULT_JH=['장학퀀텀_0T','장학퀀텀_4T','장학퀀텀_6T','장학퀀텀_10T','장학퀀텀_14T','우선선발 전형','선착순 전형','수학만 전형','특별 전형','유시험 전형'];
const JANG_LIST=['교습100+기100+교재100+콘100','교습100+독100+교재100','교습100+교재100','교습80+교재50','교습50+교재50','교습30','교습20'];
const GYE_FIXED='미적/확통';

/* ===================================================================
 * 4-R) 학생명단(등록잡기) 기반 집계 — 월별 재등록 날짜 칸으로 절대값 계산
 * =================================================================== */
// "M/D" 또는 ISO("2026-07-05T15:00:00.000Z") → 비교용 정수(월*100+일). 빈값이면 null
// ISO는 UTC라 KST(+9h)로 보정해야 날짜가 맞음 (예: 07-05T15:00Z → KST 07-06)
function mdNum(v){
  const s=String(v||'').trim(); if(!s) return null;
  let m=s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if(m) return (+m[1])*100+(+m[2]);
  // ISO 날짜/시간
  const t=Date.parse(s);
  if(!isNaN(t)){ const k=new Date(t+9*3600*1000); return (k.getUTCMonth()+1)*100+k.getUTCDate(); }
  // 'YYYY-MM-DD'만 있는 경우
  m=s.match(/^\d{4}-(\d{2})-(\d{2})/);
  if(m) return (+m[1])*100+(+m[2]);
  return null;
}
// 앱 날짜 '2026-07-06' → 706
function dateToMd(d){ const m=String(d||'').match(/^\d{4}-(\d{2})-(\d{2})$/); return m? (+m[1])*100+(+m[2]) : null; }
// 접수대장(2D): A(0)=접수일('M/D(요일)' 또는 ISO 날짜), J(9)=전형 → 오늘(baseDate) 전형별 접수 수
function countReceiptToday(rows, baseDate){
  const md=dateToMd(baseDate); if(md==null) return {};
  const out={};
  for(const r of (rows||[]).slice(1)){
    const a=String(r[0]||'').trim(); if(!a) continue;
    let am=null;
    const m=a.match(/(\d{1,2})\/(\d{1,2})/);       // '7/24(금)' 텍스트
    if(m) am=(+m[1])*100+(+m[2]);
    else am=mdNum(a);                               // ISO/날짜 서식 (KST 보정)
    if(am==null || am!==md) continue;
    const jh=String(r[9]||'').trim(); if(!jh) continue;
    out[jh]=(out[jh]||0)+1;
  }
  return out; // {전형: 오늘 접수 수}
}
// 학생명단 rows(2D배열) 파싱: 헤더 인덱스 + 학생 객체
function parseRoster(rows){
  const hdr=(rows[0]||[]).map(h=>String(h||'').trim());
  const norm=s=>String(s).replace(/\s/g,'');
  const find=names=>{ for(const n of names){ const i=hdr.findIndex(h=>norm(h)===norm(n)); if(i>=0) return i; } return -1; };
  const monthCol=N=>hdr.findIndex(h=>norm(h)===`정규${N}월`); // '정규7월'
  const idx={ ban:find(['반']), sex:find(['성별']), name:find(['성명','이름']),
    sid:find(['수험번호']), jh:find(['전형방법']), gye:find(['계열']),
    jang:find(['장학대상']), inDate:find(['입소일']), outDate:find(['퇴소일']) };
  // '신규입소예정자' 안내 행 아래는 신규 블록. 행번호 고정 대신 표식으로 탐색.
  let newFrom=-1;
  for(let i=1;i<rows.length;i++){
    const joined=norm((rows[i]||[]).join(''));
    if(joined.includes('신규입소예정자')){ newFrom=i; break; }
  }
  const students=rows.slice(1).map((r,i)=>({
    ban:String(r[idx.ban]||'').trim(), sex:String(r[idx.sex]||'').trim(),
    name:String(r[idx.name]||'').trim(), sid:norm(r[idx.sid]||''),
    jh:String(r[idx.jh]||'').trim(), gye:String(r[idx.gye]||'').trim(),
    jang:String(r[idx.jang]||'').trim(),
    out:mdNum(r[idx.outDate]), _row:r,
    _newBlock: (newFrom>=0 && (i+1)>newFrom)      // 신규 블록 여부
  }));
  return { hdr, monthCol, students, newFrom };
}
// billMonth(N) 기준 집계: 절대값(as of date). carry 불필요
function aggregateRoster(){
  const R=STATE.rosterData; const base=$R.getElementById('baseDate').value;
  const season=$R.getElementById('season').value;
  const writer=$R.getElementById('writer').value||'';
  const N=parseInt(CFG.billMonth)||0;
  const warnings=[];
  if(!R){ toast('학생명단을 먼저 불러오세요'); return; }
  if(!base){ toast('기준 날짜를 선택하세요'); return; }
  if(!N){ toast('설정에서 현재 집계월을 먼저 지정하세요'); return; }
  const banList=(CFG.banList&&CFG.banList.length?CFG.banList:DEFAULT_BANS);
  const jhList =(CFG.jhList &&CFG.jhList.length ?CFG.jhList :DEFAULT_JH);
  const Dmd=dateToMd(base);
  const currCol=R.monthCol(N), prevCol=R.monthCol(N-1);
  if(currCol<0){ toast(`학생명단에 '정규${N}월' 열이 없어요`); return; }
  // 집계월이 '다음 달'이면 이번 달 칸도 같이 본다 (예: 8/21에 집계월 9월이면 정규8월 신규도 잡아야 함)
  const thisMon = base ? (parseInt(base.slice(5,7))||0) : 0;
  const thisCol = (thisMon && thisMon!==N) ? R.monthCol(thisMon) : -1;
  // 이번 달의 '그 전달' 칸 — 지각 납부(기존 재원)와 진짜 신규를 가른다
  const thisPrevCol = (thisCol>=0) ? R.monthCol(thisMon-1) : -1;

  const zero=()=>({편성:0,신규:0,신규남:0,신규여:0,퇴소:0,퇴소남:0,퇴소여:0,
    재등록:0,재등록남:0,재등록여:0,재등록환불:0,재등록환불남:0,재등록환불여:0,
    편성계:0,편성계남:0,편성계여:0,전일편성남:0,전일편성여:0,등록계:0,미납:0,전일편성:0,전일등록:0,전일등록cnt:0,편입:0,반수:0,장학등록:0,장학환불:0,배정:0,배정남:0,배정여:0,배정등록:0});
  const perBan={}; for(const b of [...banList,'미배정']) perBan[b]=zero();
  const assignMap={};   // 수험번호 → 현재 반(미배정 포함)
  const regMap={};      // 수험번호 → 당월 등록일(mdNum). 등록 축 이동 판정에 사용
  const sexMap={};      // 수험번호 → 성별. 반이동을 남/여로 나눠 시트 G·K에 넣기 위함
  const moveCand={};    // 반 → [성별]. 신규입소예정자 블록에서 반 배정된 학생(오늘 신규 제외)
  const pb=ban=>{ const k=banList.includes(ban)?ban:'미배정'; if(!perBan[k]) perBan[k]=zero(); return perBan[k]; };
  const isReal=ban=>banList.includes(ban);

  const monthCols=[]; for(let N=2;N<=11;N++){ const c=R.monthCol(N); if(c>=0) monthCols.push(c); }
  const hasAnyReg=st=>monthCols.some(c=>mdNum(st._row[c])!=null);

  for(const st of R.students){
    if(!/^\d{4,}$/.test(String(st.sid))) continue;   // 숫자 수험번호만(헤더·안내문 등 잡동사니 제외)
    // 신규입소예정자 블록: 집계월·전월 두 칸 다 비어 있으면 아직 등록이 아니므로 편성현황에서 제외
    if(st._newBlock){
      const c1=mdNum(st._row[currCol]);
      const c0=(prevCol>=0)? mdNum(st._row[prevCol]) : null;
      if(c1==null && c0==null) continue;
    }
    const real=isReal(st.ban), unassigned=!String(st.ban).trim();
    if(!real && !unassigned) continue;               // A~S도 빈칸도 아닌 반 → 제외
    if(unassigned && !hasAnyReg(st)) continue;        // 미배정인데 등록일도 없음 = 아직 미등록 → 제외
    const b=pb(real?st.ban:'미배정'); const sex=st.sex;
    assignMap[st.sid]=real?st.ban:'미배정';
    sexMap[st.sid]=sex;
    const curr=mdNum(st._row[currCol]);        // 집계월 재등록일 — 재등록·등록계는 이 값만 사용
    // 집계월이 다음 달일 때, 이번 달 칸의 오늘 등록은 '신규 판정에만' 인정 (등록계 오염 방지)
    const currThis = (thisCol>=0)? mdNum(st._row[thisCol]) : null;
    const currIsThis = (currThis===Dmd && curr!==Dmd);
    if(curr!=null) regMap[st.sid]=curr;
    const prev=prevCol>=0? mdNum(st._row[prevCol]) : null; // 전월
    const out=st.out;                          // 퇴소일
    const enrolledD  = (out==null||out>Dmd);   // D 시점 재원
    const currByD    = (curr!=null&&curr<=Dmd);
    const currByPrev = (curr!=null&&curr<=Dmd-1); // 전일까지 (근사: Dmd-1은 같은달 가정)
    const outByD     = (out!=null&&out<=Dmd);
    // 편성계(재원, 절대): 반 배정 & 미퇴소(≤D)
    if(!outByD){ b.편성계++; if(sex==='남') b.편성계남++; else if(sex==='여') b.편성계여++; }
    // 등록계(당월 재등록 누적, ≤D)
    if(currByD) b.등록계++;
    // 전일등록(당월 재등록, ≤D-1) — 집계월 칸만 보므로 월이 바뀌면 자동으로 0부터 시작한다.
    // 시트 R열(전월 등록계 누적)을 이월하면 11월에 10월 값이 딸려와 등록계가 부푼다.
    if(currByPrev && !outByD) b.전일등록cnt++;
    // 미납: 전월 등록 & 당월 미등록(≤D) & 미퇴소(≤D)
    if(prev!=null && !currByD && !outByD) b.미납++;
    // 금일 재등록
    if(curr===Dmd || currIsThis){
      if(curr===Dmd){ b.재등록++; if(sex==='남') b.재등록남++; else if(sex==='여') b.재등록여++; }
      // 금일 신규(편입) = 전월 등록 없음, 또는 이번 달 칸에 오늘 등록(집계월이 다음 달일 때)
      // ※ _newBlock(신규입소예정자 블록)은 조건에서 제외 — 8월에 이미 신규로 잡힌 학생이
      //    블록에 남아 9월분 낼 때 또 신규로 중복 계상되는 문제가 있었음.
      // ※ 이번 달 칸에 오늘 찍혔어도 '그 전달' 등록 이력이 있으면 기존 재원의 지각 납부다.
      //   (11월 집계 중 10월 미납자가 내는 경우) → 신규/편입이 아니다.
      const prevOfThis = (thisCol>=0 && thisPrevCol>=0) ? mdNum(st._row[thisPrevCol]) : null;
      const lateCatchup = currIsThis && prevOfThis!=null;
      if((prev==null || currIsThis) && !lateCatchup){
        b.신규++; b.편입++; if(sex==='남') b.신규남++; else if(sex==='여') b.신규여++;
      }
      if(st.jang){ const L=jangCodeToLabel(st.jang); if(L) b.장학등록++; }
    }
  }

  // 금일 퇴소 = 환불시트에서 퇴소일==기준일 (학생명단에선 삭제되므로 여기서 집계)
  if(STATE.refundData && Array.isArray(STATE.refundData.students)){
    const rCurr=STATE.refundData.monthCol ? STATE.refundData.monthCol(N) : -1;  // 환불시트의 집계월 칸
    for(const st of STATE.refundData.students){
      if(!/^\d{4,}$/.test(String(st.sid))) continue;
      if(st.out===Dmd){
        const b=pb(isReal(st.ban)?st.ban:'미배정');
        // 퇴소한 사람이 '당월 등록자'였나(집계월 칸에 등록일) vs '미납자'였나(빈칸)
        const wasReg = rCurr>=0 ? (mdNum(st._row[rCurr])!=null) : false;
        b.퇴소++;                          // 편성 축 퇴소(둘 다) → 편성계·미납 자동 반영
        if(st.sex==='남') b.퇴소남++; else if(st.sex==='여') b.퇴소여++;
        if(wasReg){                        // 당월 등록자였을 때만 재등록환불
          b.재등록환불++;
          if(st.sex==='남') b.재등록환불남++; else if(st.sex==='여') b.재등록환불여++;
        }
      }
    }
  }

  // 전일값 폴백(어제 저장본이 없을 때만): 절대 − 금일delta.
  // ⚠ 반 이동은 신규/퇴소/재등록 어디에도 안 잡혀 이 역산이 이동분을 흡수함 →
  //    어제 저장본이 있으면 renderDash에서 실제 어제값으로 덮어씀.
  for(const ban in perBan){ const b=perBan[ban];
    b.전일편성 = b.편성계 - (b.신규||0) + (b.퇴소||0);
    b.전일편성남 = (b.편성계남||0) - (b.신규남||0) + (b.퇴소남||0);
    b.전일편성여 = (b.편성계여||0) - (b.신규여||0) + (b.퇴소여||0);
    b.전일등록 = b.등록계 - (b.재등록||0) + (b.재등록환불||0);
  }

  // 전형별 접수(개강전 블록) — 접수 시트에서
  const RC=STATE.receipt;
  const perJh={}; for(const jh of jhList){ const r=RC&&RC.byJh&&RC.byJh[jh]; perJh[jh]={접수:r?r.접수:'',합격:r?(jh==='유시험 전형'?'':r.접수):''}; }
  // 장학 라벨별(당월 재등록 학생의 장학대상 코드)
  const perJang={}; for(const L of JANG_LIST) perJang[L]={등록:0,환불:0,접수:0,등록남:0,등록여:0};
  const unmapped=new Set();
  for(const st of R.students){ if(!st.sid||!st.jang) continue;
    const real=isReal(st.ban), unassigned=!String(st.ban).trim();
    if(!real && !unassigned) continue;
    const curr=mdNum(st._row[currCol]);
    const prev=prevCol>=0?mdNum(st._row[prevCol]):null;
    if(curr!==Dmd || prev!=null) continue;        // 편성 개념: 오늘 신규(편입)만 등록(+)
    const L=jangCodeToLabel(st.jang); if(!L){ unmapped.add(st.jang); continue; }
    perJang[L].등록++; if(st.sex==='남') perJang[L].등록남++; else if(st.sex==='여') perJang[L].등록여++;
  }
  // 장학 환불: 오늘 환불시트로 옮긴 사람 중 장학
  if(STATE.refundData && Array.isArray(STATE.refundData.students)){
    for(const st of STATE.refundData.students){
      if(!/^\d{4,}$/.test(String(st.sid))||!st.jang) continue;
      if(st.out!==Dmd) continue;
      const L=jangCodeToLabel(st.jang); if(L) perJang[L].환불++;
    }
  }
  // 장학 접수: 접수대장 오늘(A==Dmd) F열(장학여부) → 라벨
  if(STATE.receiptRows){
    for(const row of STATE.receiptRows.slice(1)){
      const a=String(row[0]||'').trim(); if(!a) continue;
      let am=null; const m=a.match(/(\d{1,2})\/(\d{1,2})/);
      am = m ? (+m[1])*100+(+m[2]) : mdNum(a);
      if(am!==Dmd) continue;
      const code=String(row[5]||'').trim(); if(!code) continue;   // F열 장학여부
      const L=jangCodeToLabel(code); if(L) perJang[L].접수++;
    }
  }
  if(unmapped.size) warnings.push(`미매핑 장학코드: ${[...unmapped].join(', ')} → 설정 > 장학 코드 매핑`);

  const totalRoster=R.students.filter(s=>s.sid&&(isReal(s.ban)||!String(s.ban).trim())).length;
  const reg=Object.values(perBan).reduce((a,b)=>a+(b.재등록||0),0);
  const ref=Object.values(perBan).reduce((a,b)=>a+(b.퇴소||0),0);
  const newc=Object.values(perBan).reduce((a,b)=>a+(b.신규||0),0);
  STATE.result={ base, writer, season, banList, jhList, perBan, perJh, perJang,
    totalRoster, reg, ref, newc, warnings, _roster:true, _assign:assignMap, _regmap:regMap, _sexmap:sexMap, _movecand:moveCand };
  renderDash(); renderRaw();
}

function aggregate(){
  const D=STATE.daily, M=STATE.master, RC=STATE.receipt;
  const base=$R.getElementById('baseDate').value;
  const season=$R.getElementById('season').value;
  const writer=$R.getElementById('writer').value||'';

  const banList=(CFG.banList&&CFG.banList.length?CFG.banList:DEFAULT_BANS);
  const jhList =(CFG.jhList &&CFG.jhList.length ?CFG.jhList :DEFAULT_JH);
  const warnings=[];

  // ── 반별 집계: 두 축(편성현황 신규-퇴소 / 재등록 전체-미등록) + 성별 ──
  const zero=()=>({
    편성:0,                         // 전일편성 (마스터 banCount = 현재 재원, 전일 없을 때 시작값)
    신규:0,신규남:0,신규여:0,         // 편성 등록 = 신규(개강후=편입)만, 일일
    퇴소:0,퇴소남:0,퇴소여:0,         // 편성 환불 = 퇴소, 일일
    재등록:0,재등록남:0,재등록여:0,    // 재등록 = 전체 등록(신규 포함), 일일
    재등록환불:0,재등록환불남:0,재등록환불여:0, // 6월환불(≈퇴소)
    편입:0,반수:0,장학등록:0,장학환불:0
  });
  const perBan={};
  for(const b of [...banList,'미배정']){ perBan[b]=zero(); perBan[b].편성=(M.banCount&&M.banCount[b])||0; }
  const pb=ban=>{ if(!perBan[ban]){ perBan[ban]=zero(); perBan[ban].편성=(M.banCount&&M.banCount[ban])||0; } return perBan[ban]; };

  for(const s of D.reg){
    const m=M.map[s.sid];
    if(!m){ warnings.push(`등록자 ${s.name||''}(${s.sid})가 마스터에 없어 매핑 누락`); continue; }
    const b=pb(m.ban||'미배정'); const sex=m.sex;
    // 재등록 축: 전체 등록 (신규 포함)
    b.재등록++;
    if(sex==='남') b.재등록남++; else if(sex==='여') b.재등록여++;
    // 편성 축: 신규(체크)만
    if(s.isNew){ b.신규++; if(sex==='남') b.신규남++; else if(sex==='여') b.신규여++; }
    const co=String(s.cohort||'');
    if(co.includes('편입')) b.편입++;
    if(co.includes('반수')) b.반수++;
    if(s.jang) b.장학등록++;
  }
  for(const s of D.ref){
    const m=M.map[s.sid];
    if(!m){ warnings.push(`퇴소자 ${s.name||''}(${s.sid})가 마스터에 없음(등록 처리 후 마스터 추정)`); continue; }
    const b=pb(m.ban||'미배정'); const sex=m.sex;
    // 편성 퇴소 = 재등록 환불 (거의 동일: 6월분 환불)
    b.퇴소++; b.재등록환불++;
    if(sex==='남'){ b.퇴소남++; b.재등록환불남++; }
    else if(sex==='여'){ b.퇴소여++; b.재등록환불여++; }
    if(s.jang) b.장학환불++;
  }

  // ── 전형별 접수 (개강전 블록용) ──
  const perJh={};
  for(const jh of jhList){
    const r=RC&&RC.byJh&&RC.byJh[jh];
    perJh[jh]={ 접수:r?r.접수:'', 합격: r ? (jh==='유시험 전형'?'':r.접수) : '' };
  }

  // ── 장학 라벨별 집계 (설정 매핑 기준) ──
  const perJang={}; for(const L of JANG_LIST) perJang[L]={등록:0,환불:0,등록남:0,등록여:0};
  const unmapped=new Set();
  for(const s of D.reg){ if(!s.jang) continue; const L=jangCodeToLabel(s.jang);
    if(!L){ unmapped.add(s.jang); continue; }
    perJang[L].등록++; const m=M.map[s.sid];
    if(m&&m.sex==='남') perJang[L].등록남++; else if(m&&m.sex==='여') perJang[L].등록여++;
  }
  for(const s of D.ref){ if(!s.jang) continue; const L=jangCodeToLabel(s.jang);
    if(!L){ unmapped.add(s.jang); continue; } perJang[L].환불++;
  }
  if(unmapped.size) warnings.push(`미매핑 장학코드: ${[...unmapped].join(', ')} → 설정 > 장학 코드 매핑에서 연결하세요`);

  const reg=D.reg.length, ref=D.ref.length;
  const newc=Object.values(perBan).reduce((a,b)=>a+(b.신규||0),0);
  const totalRoster=M.total||0;
  STATE.result={ base, writer, season, banList, jhList,
                 perBan, perJh, perJang, totalRoster, reg, ref, newc, warnings };
  renderDash(); renderRaw();
}

/* ===================================================================
 * 5) 렌더 — 대시보드
 * =================================================================== */
function num(n,signed){ if(n==null||n==='') return ''; if(signed){ if(n>0) return `<span class="pos">+${n}</span>`; if(n<0) return `<span class="neg">${n}</span>`; return '0'; } return n; }

async function renderDash(){
  const R=STATE.result; if(!R) return;
  $R.getElementById('dashEmpty').style.display='none';
  $R.getElementById('dashContent').style.display='block';
  $R.getElementById('dashTitle').textContent=`${R.season}시즌 · ${R.base||'(날짜 미정)'} · 반별 등록`;
  $R.getElementById('dashMeta').innerHTML = R._historical
    ? `<span class="tag" style="background:var(--peri-soft);color:var(--peri-ink)">과거 데이터 (raw 로그)</span> 작성자 ${R.writer||'-'}`
    : `작성자 ${R.writer||'-'} · 모든 반/전형 0 포함 출력은 raw 탭에서`;

  let pBan;
  if(R._prevBan!==undefined){ pBan = R._prevBan; }
  else { const prev=await loadDaily(prevDateKey(R.base, R.season)); pBan = prev&&prev.perBan ? prev.perBan : null;
         if(prev&&prev.regTotal!=null) R._prevRegTotal=prev.regTotal; }

  // ── 전일값 = 2026정규 시트의 어제 마감 소계 (J=남, N=여, R=등록계) ──
  // 반배정 = 편성계 − 전일 − 신규 + 퇴소. 시트가 기준이라 저장 스냅샷이 필요 없음.
  // 전일값 = 어제 저장본(rawlog)의 반별 편성계·등록계.
  // 시트(2026정규)는 기입 시점에 따라 C/F 의미가 달라져 기준으로 못 씀.
  let PREV=null;
  if(R._roster){
    // HIST.dates가 갱신 안 됐을 수 있어 byDate 키에서 직접 고른다
    const all=Object.keys(HIST.byDate||{});
    const dates=all.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d) && d<R.base).sort();
    const pd=dates[dates.length-1];
    if(pd && HIST.byDate[pd]){
      // 편성계·등록계는 buildCumulativeResult에서만 산출됨 (buildResultFromRaw엔 없음)
      try{ PREV=buildCumulativeResult(pd).perBan||null; R._prevDate=pd; }catch(e){ PREV=null; R._prevErr=(e.message||String(e)); }
    }
  }
  R._noPrev = !!(R._roster && !PREV);
  if(R._roster && PREV){
    const num=v=>{ const n=Number(v); return isNaN(n)?0:n; };
    for(const ban of [...R.banList,'미배정']){
      const b=R.perBan[ban]; if(!b) continue;
      // 반 키가 안 맞거나 편성계 필드가 없을 수 있어 폴백까지 둔다
      const p=PREV[ban]||PREV[String(ban).trim()]||{};
      const pPy = p.편성계!=null ? p.편성계 : ((p.편성||0)+(p.신규||0)-(p.퇴소||0));
      const pRg = p.등록계!=null ? p.등록계 : ((p.전일등록||0)+(p.재등록||0)-(p.재등록환불||0));
      // 전일값은 2026정규 시트 한 곳에서만 가져온다 (G=남, K=여, 합=전일편성)
      const sp0=(STATE.sheetPrev&&STATE.sheetPrev[ban])||null;
      if(sp0){
        b.전일편성남 = num(sp0.J);
        b.전일편성여 = num(sp0.N);
        b.전일편성   = b.전일편성남 + b.전일편성여;
      } else {
        // 시트 전일값이 없는 반: 어제 저장본의 편성계 남/여로 폴백(0으로 두지 않음)
        b.전일편성   = num(pPy);
        b.전일편성남 = num(p.편성계남);
        b.전일편성여 = num(p.편성계여);
      }
      // 전일등록은 시트(R열)에서 가져오지 않는다 — 그 값은 전월 등록계 누적이라
      // 월이 바뀌면 그대로 이월돼 등록계가 부푼다. 학생명단의 당월 칸을 직접 센다.
      b.전일등록 = num(b.전일등록cnt);
      // ⚠ 반배정 역산 중단(2026-09-14).
      //   편성계를 '전일편성 + 신규 − 퇴소'로 정의하면 아래 식은 항등적으로 0이 된다.
      //   기존에 잡히던 잔차는 이동이 아니라 '환불자 이동' 전이라 명단에 남아 있던 퇴소자였다.
      //   식은 기록용으로만 남기고 값은 0으로 고정한다. 되살리지 말 것.
      // b.배정   = b.편성계 - b.전일편성 - (b.신규||0) + (b.퇴소||0);
      // b.배정남 = (b.편성계남||0) - b.전일편성남 - (b.신규남||0) + (b.퇴소남||0);
      // b.배정여 = (b.편성계여||0) - b.전일편성여 - (b.신규여||0) + (b.퇴소여||0);
      // b.배정등록 = b.등록계 - b.전일등록 - (b.재등록||0) + (b.재등록환불||0);
      b.배정 = 0; b.배정남 = 0; b.배정여 = 0; b.배정등록 = 0;
    }

  }

  const S=(f)=>Object.values(R.perBan).reduce((a,b)=>a+(b[f]||0),0);

  // 전일값: 전일 저장본의 편성계/등록계 → 없으면 마스터(편성)·0(등록)에서 시작
  const prevOf=(ban,field,fallback)=>{
    const p=pBan&&pBan[ban]?pBan[ban]:null;
    if(p && p[field]!=null) return p[field];
    return fallback;
  };

  // 미납(명단 모드): 경영지원 기준 — 전월 기수 납부자 중 당월 기수 미납부자.
  // 반은 학생명단의 현재 반(R._assign)으로 붙인다.
  let SBU=null; R._unpaidErr=null; R._unpaidUnmatched=0;
  if(R._roster){
    try{ SBU=await sbUnpaidByBan(R._assign, R.banList); R._unpaidUnmatched=SBU.미매칭.length; }
    catch(e){ SBU=null; R._unpaidErr=(e.message||String(e)); }
  }

  // 반별 두 축 계산 + 전일계 stash (다음날 전일값으로 사용)
  let T={신규:0,신규남:0,신규여:0,퇴소:0,퇴소남:0,퇴소여:0,편성계:0,편성계남:0,편성계여:0,
         재등록:0,재등록남:0,재등록여:0,재등록환불:0,등록계:0,미납:0,전일편성:0,전일등록:0};
  for(const ban of [...R.banList,'미배정']){
    const b=R.perBan[ban]; if(!b) continue;
    if(!R._roster){
      b.전일편성=prevOf(ban,'편성계', b.편성||0);
      b.전일등록=prevOf(ban,'등록계', 0);
    }
    // 편성계는 명단 카운트가 아니라 전일값 누적으로 산출한다.
    // (퇴소자가 '환불자 이동' 전까지 명단에 남아 있어 카운트하면 부푼다)
    b.편성계 = (b.전일편성||0) + (b.신규||0) - (b.퇴소||0);
    // 등록계는 다르다. 재등록은 매달 새로 받으므로 집계월 칸을 직접 센 값이 정답이고,
    // 월이 바뀌면 자연히 0부터 시작한다. 전일값 누적으로 바꾸면 시트 R열(전월 등록계)이
    // 그대로 이월돼 11월에 10월 누적이 더해진다. 명단 모드에서는 카운트를 그대로 쓴다.
    if(!R._roster) b.등록계 = (b.전일등록||0) + (b.재등록||0) - (b.재등록환불||0);
    if(R._roster){
      b.편성계남 = (b.전일편성남||0) + (b.신규남||0) - (b.퇴소남||0);
      b.편성계여 = (b.전일편성여||0) + (b.신규여||0) - (b.퇴소여||0);
    }
    // 미납: 명단 모드는 경영지원(Supabase) 기준. 못 가져오면 '—'(추정하지 않음).
    b.미납 = SBU ? (SBU.perBan[ban]||0) : (R._roster ? null : b.편성계 - b.등록계);
    T.신규+=b.신규||0; T.신규남+=b.신규남||0; T.신규여+=b.신규여||0;
    T.퇴소+=b.퇴소||0; T.퇴소남+=b.퇴소남||0; T.퇴소여+=b.퇴소여||0;
    T.재등록+=b.재등록||0; T.재등록남+=b.재등록남||0; T.재등록여+=b.재등록여||0;
    T.재등록환불+=b.재등록환불||0;
    T.편성계+=b.편성계; T.등록계+=b.등록계; T.미납+=(b.미납||0);
    T.전일편성+=(b.전일편성||0); T.전일등록+=(b.전일등록||0);
  }

  // 미납 소계는 반별 합이 아니라 경영지원 총계를 그대로 쓴다(반 매칭 실패분이 소계에서 빠지지 않도록)
  if(SBU) T.미납 = SBU.총계;

  // 미납 표시: 명단 모드인데 경영지원 값을 못 가져왔으면 숫자 대신 '—'
  const _unpaidNA = !!(R._roster && !SBU);
  const _unpaidTxt = _unpaidNA ? '—' : String(T.미납<0?0:T.미납);

  // 히어로 — 두 축 요약
  $R.getElementById('heroTitle').innerHTML=`${R.base||'(날짜 미정)'} <span class="grad">${R.season}시즌</span>`;
  $R.getElementById('heroNew').textContent=T.신규;
  $R.getElementById('heroOut').textContent=T.퇴소;
  $R.getElementById('heroSub').innerHTML=
    (R._historical?`<span class="tag" style="background:var(--peri-soft);color:var(--peri-ink)">과거</span> `:``)+
    `작성자 ${R.writer||'-'} · 편입 ${S('편입')} · 반수 ${S('반수')}`
    + (R._roster ? (R._prevDate
        ? ` · <span style="${_isYday(R._prevDate,R.base)?'':'color:var(--red);font-weight:700'}">전일값 기준 ${R._prevDate.slice(5).replace('-','/')}</span>`
        : ` · <span style="color:var(--red);font-weight:700">전일값 없음</span>`) : '');
  const _live0 = !R._historical && !R._cumulative && !R._roster;
  $R.getElementById('heroMini').innerHTML=
    `<div class="hp">총인원<b>${T.편성계}</b></div>`+
    `<div class="hp">재등록<b>${T.재등록}</b></div>`+
    `<div class="hp">등록계<b>${_live0?'…':T.등록계}</b></div>`+
    `<div class="hp">미납<b>${_live0?'…':_unpaidTxt}</b></div>`;
  $R.getElementById('statTiles').innerHTML=`
    ${tile('g',T.신규,`신규 (남${T.신규남}/여${T.신규여})`)}
    ${tile('r',T.퇴소,`퇴소 (남${T.퇴소남}/여${T.퇴소여})`)}
    ${tile('t',T.편성계,'편성계')}
    ${tile('y',T.재등록,`재등록 (남${T.재등록남}/여${T.재등록여})`)}
    ${tile('',_unpaidTxt,'미납(미등록)')}`;

  // ── 원장님 보고 (일자별누적) ──
  const 금일등록=T.신규, 금일환불=T.퇴소;   // 원장님 보고: 순증 기준 = 신규(편입)
  let 전일등록;
  if(R._reportPrev!=null) 전일등록=R._reportPrev;            // 과거(지난보기): 누적 계산값
  else if(R._prevRegTotal!=null) 전일등록=R._prevRegTotal;    // 라이브: 전일 저장본
  else { const _bl=(CFG.baselines&&CFG.baselines[CFG.billMonth])||{}; 전일등록=(_bl.reg!=null&&_bl.reg!=='')?_bl.reg:null; }
  const 등록인원=(전일등록==null?0:전일등록)+금일등록-금일환불;
  R._regTotal=등록인원; // 저장 시 다음날 전일등록으로 이어짐
  const wd=['일','월','화','수','목','금','토'];
  let dLabel=R.base||'';
  if(/^\d{4}-\d{2}-\d{2}$/.test(R.base)){ const dt=new Date(R.base+'T00:00:00'); dLabel=`${dt.getMonth()+1}/${dt.getDate()}(${wd[dt.getDay()]})`; }
  $R.getElementById('reportTable').innerHTML=
    `<thead><tr><th>날짜</th><th>전일등록</th><th>금일등록</th><th>금일환불</th><th>등록인원</th></tr></thead>`+
    `<tbody><tr><td>${dLabel}</td>`+
    `<td class="mono">${전일등록==null?'—':전일등록}</td>`+
    `<td class="mono">${금일등록}</td>`+
    `<td class="mono">${금일환불?'-'+금일환불:''}</td>`+
    `<td class="mono"><b>${등록인원}</b></td></tr></tbody>`;
  R._reportRow=[dLabel, 전일등록==null?'':전일등록, 금일등록, 금일환불?(-금일환불):'', 등록인원];
  // 복사용: 금일등록·금일환불 두 칸만 (전일등록·등록인원은 시트에 수식으로 있음)
  R._reportCopy=[금일등록, 금일환불?(-금일환불):''];
  $R.getElementById('reportNote').textContent =
    전일등록==null ? '전일등록이 없어 등록인원=금일등록−금일환불로 계산됐어요. 매일 현황 저장하면 다음날 전일등록이 이어집니다.' : '';

  // 접수 현황 카드 (접수대장 오늘 접수)
  const rcCard=$R.getElementById('receiptCard');
  if(rcCard){
    const rt=STATE.receiptToday;
    if(R._roster && rt){
      const tot=Object.values(rt).reduce((a,b)=>a+b,0);
      $R.getElementById('receiptTable').innerHTML=
        `<thead><tr><th>전형</th><th>오늘 접수</th></tr></thead><tbody>`+
        JH_LIST.map(jh=>`<tr><td>${jh}</td><td class="mono">${rt[jh]||''}</td></tr>`).join('')+
        `<tr class="tot"><td>합계</td><td class="mono"><b>${tot}</b></td></tr></tbody>`;
      rcCard.style.display='';
    } else rcCard.style.display='none';
  }

  // 장학생 현황 카드 (오늘 접수·등록·환불)
  const jCard=$R.getElementById('jangCard');
  if(jCard){
    const pj=R.perJang;
    if(R._roster && pj){
      let tj=0,td=0,th=0;
      const body=JANG_LIST.map(L=>{ const g=pj[L]||{}; const jb=g.접수||0,dg=g.등록||0,hw=g.환불||0;
        tj+=jb;td+=dg;th+=hw;
        return `<tr><td>${L}</td><td class="mono">${jb||''}</td><td class="mono">${dg||''}</td><td class="mono">${hw?'-'+hw:''}</td></tr>`;}).join('');
      $R.getElementById('jangTable').innerHTML=
        `<thead><tr><th>장학 종류</th><th>접수</th><th>등록</th><th>환불</th></tr></thead><tbody>${body}`+
        `<tr class="tot"><td>소계</td><td class="mono"><b>${tj}</b></td><td class="mono"><b>${td}</b></td><td class="mono"><b>${th?'-'+th:'0'}</b></td></tr></tbody>`;
      jCard.style.display='';
    } else jCard.style.display='none';
  }

  // ① 편성현황 표 (신규−퇴소, 성별)
  const mv=v=>v>0?'+'+v:(v<0?''+v:'');
  const r1=[];
  for(const ban of [...R.banList,'미배정']){
    const b=R.perBan[ban]; if(!b) continue;
    r1.push(`<tr><td>${ban}</td>
      <td class="mono">${R._noPrev?'–':b.전일편성}</td>
      <td class="mono">${((b.신규||0)+Math.max(0,b.배정||0))||''}</td>
      <td class="mono">${((b.퇴소||0)+Math.max(0,-(b.배정||0)))?'-'+((b.퇴소||0)+Math.max(0,-(b.배정||0))):''}</td>
      <td class="mono"><b>${b.편성계}</b></td>
      <td class="mono">${((b.신규남||0)+Math.max(0,b.배정남||0))||''}</td><td class="mono">${((b.퇴소남||0)+Math.max(0,-(b.배정남||0)))?'-'+((b.퇴소남||0)+Math.max(0,-(b.배정남||0))):''}</td>
      <td class="mono">${((b.신규여||0)+Math.max(0,b.배정여||0))||''}</td><td class="mono">${((b.퇴소여||0)+Math.max(0,-(b.배정여||0)))?'-'+((b.퇴소여||0)+Math.max(0,-(b.배정여||0))):''}</td></tr>`);
  }
  const sumP=(f)=>Object.values(R.perBan).reduce((a,b)=>a+Math.max(0, b[f]||0),0);
  const sumN=(f)=>Object.values(R.perBan).reduce((a,b)=>a+Math.max(0,-(b[f]||0)),0);
  const mvIn=sumP('배정'), mvOut=sumN('배정');
  const mvInN=sumP('배정남'), mvOutN=sumN('배정남'), mvInY=sumP('배정여'), mvOutY=sumN('배정여');
  r1.push(`<tr class="tot"><td>소계</td>
    <td class="mono">${R._noPrev?'–':T.전일편성}</td><td class="mono">${T.신규+mvIn}</td><td class="mono">${(T.퇴소+mvOut)?'-'+(T.퇴소+mvOut):'0'}</td><td class="mono"><b>${T.편성계}</b></td>
    <td class="mono">${T.신규남+mvInN}</td><td class="mono">${(T.퇴소남+mvOutN)?'-'+(T.퇴소남+mvOutN):'0'}</td>
    <td class="mono">${T.신규여+mvInY}</td><td class="mono">${(T.퇴소여+mvOutY)?'-'+(T.퇴소여+mvOutY):'0'}</td></tr>`);
  $R.getElementById('dashTable').innerHTML=
    `<thead><tr><th>반</th><th>전일편성</th><th>신규</th><th>퇴소</th><th>편성계</th><th>신규-남</th><th>퇴소-남</th><th>신규-여</th><th>퇴소-여</th></tr></thead><tbody>${r1.join('')}</tbody>`;

  // ② 재등록 표 (등록−미등록)
  const isLive = !R._historical && !R._cumulative && !R._roster;
  const r2=[];
  for(const ban of [...R.banList,'미배정']){
    const b=R.perBan[ban]; if(!b) continue;
    r2.push(`<tr><td>${ban}</td>
      <td class="mono">${isLive?'':(R._noPrev?'–':b.전일등록)}</td>
      <td class="mono">${((b.재등록||0)+Math.max(0,b.배정등록||0))||''}</td>
      <td class="mono">${((b.재등록환불||0)+Math.max(0,-(b.배정등록||0)))?'-'+((b.재등록환불||0)+Math.max(0,-(b.배정등록||0))):''}</td>
      <td class="mono">${isLive?'':'<b>'+b.등록계+'</b>'}</td>
      <td class="mono ${!isLive&&b.미납>0?'neg':''}">${isLive?'':(b.미납==null?'—':'<b>'+b.미납+'</b>')}</td></tr>`);
  }
  const mvRIn =Object.values(R.perBan).reduce((a,b)=>a+Math.max(0, b.배정등록||0),0);
  const mvROut=Object.values(R.perBan).reduce((a,b)=>a+Math.max(0,-(b.배정등록||0)),0);
  const soRegTot = isLive?`<span id="sbRereg">…</span>`:`<b>${T.등록계}</b>`;
  const soUnpaid = isLive?`<span id="sbUnpaid">…</span>`:(_unpaidNA?'—':`<b>${T.미납}</b>`);
  r2.push(`<tr class="tot"><td>소계</td>
    <td class="mono">${isLive?'':(R._noPrev?'–':T.전일등록)}</td><td class="mono">${T.재등록+mvRIn}</td><td class="mono">${(T.재등록환불+mvROut)?'-'+(T.재등록환불+mvROut):'0'}</td><td class="mono">${soRegTot}</td>
    <td class="mono">${soUnpaid}</td></tr>`);
  // 대시보드가 화면에 찍는 값을 그대로 보관 → 개강후 기입이 이 값만 사용(재계산 금지)
  R._shown={};
  for(const ban of [...R.banList,'미배정']){
    const b=R.perBan[ban]; if(!b) continue;
    const P=v=>Math.max(0,v||0), Ng=v=>Math.max(0,-(v||0));
    R._shown[ban]={
      sin :(b.신규||0)+P(b.배정),      chul:(b.퇴소||0)+Ng(b.배정),
      sinN:(b.신규남||0)+P(b.배정남),   chulN:(b.퇴소남||0)+Ng(b.배정남),
      sinY:(b.신규여||0)+P(b.배정여),   chulY:(b.퇴소여||0)+Ng(b.배정여),
      reReg:(b.재등록||0)+P(b.배정등록), reRef:(b.재등록환불||0)+Ng(b.배정등록)
    };
  }
  const t2=$R.getElementById('dashTable2');
  if(t2) t2.innerHTML=`<thead><tr><th>반</th><th>전일등록</th><th>재등록</th><th>환불</th><th>등록계</th><th>미납</th></tr></thead><tbody>${r2.join('')}</tbody>`;

  // 라이브: 등록계(당월 재등록 누적)·미납은 경영지원 기준으로 (반별 아님, 총계)
  if(isLive){
    (async()=>{
      try{
        const u=await sbReRegUnpaid();
        const er=$R.getElementById('sbRereg'), eu=$R.getElementById('sbUnpaid');
        if(er) er.innerHTML=`<b>${u.재등록누적}</b>`;
        if(eu) eu.innerHTML=`<b>${u.미납}</b>`;
        // 히어로 미니도 갱신
        const hm=$R.getElementById('heroMini');
        if(hm) hm.innerHTML=
          `<div class="hp">총인원<b>${T.편성계}</b></div>`+
          `<div class="hp">재등록<b>${T.재등록}</b></div>`+
          `<div class="hp">등록계<b>${u.재등록누적}</b></div>`+
          `<div class="hp">미납<b>${u.미납}</b></div>`;
      }catch(e){ const er=$R.getElementById('sbRereg'), eu=$R.getElementById('sbUnpaid');
        if(er) er.textContent='—'; if(eu) eu.textContent='—'; }
    })();
  }

  const wb=$R.getElementById('warnBox');
  wb.innerHTML = R.warnings.length ? `<div class="warn"><b>확인 필요 ${R.warnings.length}건</b><br>${[...new Set(R.warnings)].slice(0,8).join('<br>')}${R.warnings.length>8?'<br>…':''}</div>` : '';
  if(!pBan && !R._historical){ wb.innerHTML += `<div class="note">편성현황은 현재 재원 기준입니다. 재등록 <b>등록계·미납은 경영지원 당월 기수 기준 총계</b>로 표시됩니다(반별 미납은 과거 raw 누적이 있는 ‘지난 등록 보기’에서 확인).</div>`; }
}
function tile(c,v,l){ return `<div class="stat ${c}"><div class="v mono">${v}</div><div class="l">${l}</div></div>`; }

// ── 경영지원(Supabase) 대조 ──
function cmpRow(label, ours, theirs, note){
  if(typeof ours!=='number') return `<tr><td>${label}</td><td class="mono" style="color:var(--muted)">${ours}</td><td class="mono">${theirs==null?'—':theirs}</td><td>${note||''}</td></tr>`;
  if(theirs==null) return `<tr><td>${label}</td><td class="mono">${ours}</td><td class="mono" style="color:var(--muted)">—</td><td>${note||'그쪽 값 없음'}</td></tr>`;
  const diff=ours-theirs;
  const ok=diff===0;
  const mark=ok?'<span style="color:var(--green);font-weight:700">✅ 일치</span>'
               :`<span style="color:var(--red);font-weight:700">⚠ 차이 ${diff>0?'+':''}${diff}</span>`;
  return `<tr><td>${label}</td><td class="mono">${ours}</td><td class="mono">${theirs}</td><td>${mark}</td></tr>`;
}
async function verifyInto(R, box){
  if(!R){ box.innerHTML='<div class="note">먼저 자료를 처리하세요.</div>'; return; }
  box.innerHTML='<div class="note">경영지원 앱에서 불러오는 중…</div>';
  const S2=(f)=>Object.values(R.perBan).reduce((a,b)=>a+(b[f]||0),0);
  const ourReg=S2('재등록'), ourRef=S2('퇴소');
  const ourRegTot=S2('등록계')||null;   // 재등록 총계(누적)
  const ourHead=S2('편성계')||null;      // 정규 편성계(참고)
  try{
    const st=await loadSbState();
    const t=sbTotalsForDate(st, R.base);
    const theirTotal=t&&t.총인원!=null?t.총인원:null;
    box.innerHTML=`
      <div class="tablewrap"><table>
        <thead><tr><th style="text-align:left">항목</th><th>우리 도구</th><th>경영지원 앱</th><th>대조</th></tr></thead>
        <tbody>
          <tr><td colspan="4" style="background:var(--teal-soft);font-weight:700;color:var(--teal-ink)">같은 기준 — 일치해야 함</td></tr>
          ${cmpRow('금일 등록(재등록)', ourReg, t?t.금일등록:null)}
          ${cmpRow('금일 환불(퇴소)', ourRef, t?t.금일환불:null)}
          <tr><td colspan="4" style="background:var(--peri-soft);font-weight:700;color:var(--peri-ink)">참고 — 기준이 다름</td></tr>
          <tr><td>재등록 총계(등록계)</td><td class="mono">${ourRegTot==null?'—':ourRegTot}</td><td class="mono" style="color:var(--muted)">—</td><td class="note">우리 누적</td></tr>
          <tr><td>총인원</td><td class="mono" style="color:var(--muted)">정규 ${ourHead==null?'—':ourHead}</td><td class="mono"><b>${theirTotal==null?'—':theirTotal}</b></td><td class="note">경영지원=재원+반수+편입(신뢰)</td></tr>
        </tbody>
      </table></div>
      <div class="note">날짜 ${R.base} 기준. <b>금일 등록·환불</b>은 같은 기준이라 ✅ 일치해야 하고, ⚠ 차이가 나면 그날 자료를 점검하세요. <b>총인원</b>은 경영지원이 반수·편입까지 합산한 값이라 우리 정규 편성계와 다릅니다(경영지원 값을 신뢰).</div>`;
  }catch(e){
    console.error(e);
    box.innerHTML=`<div class="warn"><b>불러오기 실패</b><br>${(e.code||e.message||e)}<br><span class="note">RLS(읽기 권한)가 막혀 있으면 담당자에게 anon 읽기 허용을 요청하세요.</span></div>`;
  }
}
async function runVerify(){ return verifyInto(STATE.result, $R.getElementById('verifyBox')); }
$R.getElementById('verifyBtn').onclick=runVerify;
$R.getElementById('reportCopyBtn').onclick=()=>{
  const R=STATE.result; if(!R||!R._reportCopy){ toast('먼저 자료를 처리하세요'); return; }
  navigator.clipboard.writeText(R._reportCopy.join('\t'))
    .then(()=>toast('✅ 금일등록·금일환불 2칸 복사됨'))
    .catch(()=>toast('복사 실패 — 표에서 직접 복사하세요'));
};

/* ===================================================================
 * 6) 렌더 — raw 출력
 * =================================================================== */
const RAW_COLS=['날짜','구분','전형','계열','반','편성인원','접수','접수 계','등록','환불','합격',
  '등록-남','환불-남','등록-여','환불-여','작성자','장학접수','장학등록','장학환불','편입','반수'];

// 로데이터 6블록: 개강전(전형별) · 장학 · 개강후(반별) · 6월 재등록(반별) · 편입(반별) · 반수(반별)
function rawRows(){
  const R=STATE.result; if(!R) return [];
  const D=R.base, W=R.writer;
  const bans=[...R.banList,'미배정'];
  const E=''; // 빈칸
  const row=o=>[ o.날짜??D, o.구분??E, o.전형??E, o.계열??E, o.반??E, o.편성인원??E, o.접수??E, o['접수 계']??E,
    o.등록??E, o.환불??E, o.합격??E, o['등록-남']??E, o['환불-남']??E, o['등록-여']??E, o['환불-여']??E,
    W, o.장학접수??E, o.장학등록??E, o.장학환불??E, o.편입??E, o.반수??E ];
  const out=[];

  // ① 개강전 — 전형별 접수/합격
  for(const jh of R.jhList){
    const p=R.perJh[jh]||{};
    out.push(row({구분:'개강전', 전형:jh, 계열:GYE_FIXED, 반:'7월 편입', '접수 계':p.접수, 합격:p.합격}));
  }
  // ② 장학 — 고정 목록 (설정 매핑 집계값 채움)
  for(const j of JANG_LIST){ const g=(R.perJang&&R.perJang[j])||{};
    out.push(row({구분:'장학', 전형:j, 등록:g.등록||E, 환불:g.환불?-(g.환불):E, '등록-남':g.등록남||E, '등록-여':g.등록여||E})); }
  // ③ 개강후 — 편성현황 축: 등록=신규(일일), 환불=퇴소(일일), 성별 포함
  for(const ban of bans){ const b=R.perBan[ban]||{};
    // 반이동은 신규·퇴소에 합산해서 저장한다. 안 그러면 다음날 전일편성이 안 맞음.
    const iP=v=>Math.max(0,v||0), oP=v=>Math.max(0,-(v||0));
    const sin=(b.신규||0)+iP(b.배정),     chul=(b.퇴소||0)+oP(b.배정);
    const sinN=(b.신규남||0)+iP(b.배정남), chulN=(b.퇴소남||0)+oP(b.배정남);
    const sinY=(b.신규여||0)+iP(b.배정여), chulY=(b.퇴소여||0)+oP(b.배정여);
    out.push(row({구분:'개강후', 반:ban, 편성인원:b.전일편성??b.편성??E,
      등록:sin||E, 환불:chul?-(chul):E,
      '등록-남':sinN||E, '환불-남':chulN?-(chulN):E,
      '등록-여':sinY||E, '환불-여':chulY?-(chulY):E})); }
  // ④ 6월 재등록 — 재등록 축: 등록=전체 등록(신규 포함), 환불=재등록환불
  for(const ban of bans){ const b=R.perBan[ban]||{};
    const reg=(b.재등록||0)+Math.max(0,b.배정등록||0), ref=(b.재등록환불||0)+Math.max(0,-(b.배정등록||0));
    out.push(row({구분:(CFG.billMonth||new Date().getMonth()+1)+'월', 전형:'재등록', 반:ban, 등록:reg||E, 환불:ref?-(ref):E})); }
  // ⑤ 편입(포함) — 반별 편입 수
  for(const ban of bans){ const b=R.perBan[ban]||{};
    out.push(row({구분:'편입(포함)', 전형:'편입', 반:ban, 등록:b.편입||E})); }
  // ⑥ 반수 — 반별 반수 수
  for(const ban of bans){ const b=R.perBan[ban]||{};
    out.push(row({구분:'반수', 전형:'반수', 반:ban, 등록:b.반수||E})); }

  return out;
}
function renderRaw(){
  const rs=$R.getElementById('rawSheet'); if(rs) rs.textContent = rawSheetName(STATE.result?.season);
  const tbl=$R.getElementById('rawTable'); if(!tbl) return;   // raw 탭 제거됨 → 화면 갱신 생략(내부 로직은 유지)
  const rows=rawRows();
  const h=`<thead><tr>${RAW_COLS.map(c=>`<th>${c}</th>`).join('')}</tr></thead>`;
  const b=`<tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${i===0||i===1||i===2||i===3||i===15?' style="text-align:left"':''}>${c===''||c==null?'':c}</td>`).join('')}</tr>`).join('')}</tbody>`;
  tbl.innerHTML=h+b;
}
const _copyBtn=$R.getElementById('copyBtn');
if(_copyBtn) _copyBtn.onclick=()=>{
  const rows=rawRows(); if(!rows.length){toast('출력할 행이 없어요');return;}
  const tsv=rows.map(r=>r.map(c=>c===null?'':c).join('\t')).join('\n');
  navigator.clipboard.writeText(tsv).then(()=>toast('복사됨 — raw 시트에 붙여넣기'));
};
const _xlsxBtn=$R.getElementById('xlsxBtn');
if(_xlsxBtn) _xlsxBtn.onclick=()=>{
  const rows=rawRows(); if(!rows.length){toast('출력할 행이 없어요');return;}
  const ws=XLSX.utils.aoa_to_sheet([RAW_COLS,...rows]);
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'raw');
  XLSX.writeFile(wb,`QUETTA_raw_${STATE.result.season}_${STATE.result.base||''}.xlsx`);
};

/* ===================================================================
 * 7) 공유 저장 / 전일
 * =================================================================== */
const dayKey=(d,s)=> `${d}_${s}`;
// 전일값 기준일이 실제 '어제'인지 (아니면 저장을 건너뛴 날이 있다는 뜻)
function _isYday(prev, base){
  if(!prev||!base) return false;
  const t=new Date(base); t.setDate(t.getDate()-1);
  return t.toISOString().slice(0,10)===prev;
}
function prevDateKey(d,s,back){ if(!d) return ''; const t=new Date(d); t.setDate(t.getDate()-(back||1)); return dayKey(t.toISOString().slice(0,10),s); }

async function saveDaily(){
  const R=STATE.result; if(!R||!R.base){toast('기준 날짜가 필요해요');return;}
  const payload={ base:R.base, season:R.season, writer:R.writer,
    totalRoster:R.totalRoster, reg:R.reg, ref:R.ref, newc:R.newc,
    regTotal:(R._regTotal!=null?R._regTotal:null),
    assignMap:(R._assign||null),
    perBan:R.perBan, perJh:R.perJh, savedAt:Date.now() };
  // 로컬은 항상 보조 저장
  localStorage.setItem(LK('daily_')+dayKey(R.base,R.season),JSON.stringify(payload));
  if(!fbReady){ toast('⚠ Firebase 미연결 — 로컬에만 저장됨'); return; }
  try{
    await setDoc(doc(db,COL('daily'),dayKey(R.base,R.season)),payload);
    // 그날 raw 6블록도 누적 로그에 저장(지난 등록 보기 자동 누적)
    // ⚠ 윈터는 접수대장 기반 파서가 아직 없어 rawRows()(정규 6블록)를 쓰면 안 된다. 연결 전까지 저장 보류.
    const _skipRaw = (R.season==='반수' || R.season==='윈터');
    if(!_skipRaw){ await saveRawlogDay(R.base, rawRows()); }
    toast(R.season==='윈터' ? '✅ 저장 완료 — 윈터는 누적 로그 미연결(집계만 저장됨)' : '✅ Firebase 저장 완료(공유)');
  }catch(e){
    console.error(e);
    toast('⚠ Firebase 저장 실패: '+(e.code||e.message)+' (로컬엔 저장됨)');
  }
}
async function loadDaily(key){
  if(!key) return null;
  if(fbReady){ try{ const s=await getDoc(doc(db,COL('daily'),key)); if(s.exists()) return s.data(); }catch(e){} }
  try{ return JSON.parse(localStorage.getItem(LK('daily_')+key)||'null'); }catch(e){ return null; }
}

/* ── 누적 raw 로그 (quettaReg_rawlog/{날짜} = 그날 raw 6블록 행들) ── */
// Firestore는 중첩 배열 불가 → 각 행을 JSON 문자열로 저장/복원
const packRows = rows => rows.map(r => JSON.stringify(r.map(c=>c===undefined?null:c)));
const unpackRows = arr => Array.isArray(arr) ? arr.map(x => typeof x==='string' ? JSON.parse(x) : x) : [];
// 그날 raw 행들을 누적 로그에 저장(덮어쓰기)
async function saveRawlogDay(date, rows){
  if(!date||!fbReady) return;
  try{ await setDoc(doc(db,COL('rawlog'),RLID(date)), { date, rows:packRows(rows), savedAt:Date.now() });
    HIST.byDate=HIST.byDate||{}; HIST.byDate[date]={rows, writer:''};
    HIST.dates=Object.keys(HIST.byDate).sort();
    _rlcSave(HIST.byDate, _dstr(new Date()), true);
    try{ refreshHistUI(); }catch(e){}
  }catch(e){ console.error('rawlog 저장 실패', e); }
}
// 전체 누적 로그 읽어 HIST 구성
// Firestore 읽기 절약: 확정된 과거 날짜는 localStorage 캐시에서, 최근 며칠만 새로 조회.
// (저장은 그대로 Firestore → 팀 공유 유지)
// 시즌별 rawlog 분리 — 정규는 기존 그대로(날짜), 윈터만 'winter_' 접두어.
// 반수는 rawlog를 저장하지 않으므로 대상 아님. 마이그레이션 없음.
let SEASON = sessionStorage.getItem(LK('season')) || '정규';
function _seasonNow(){ return SEASON; }
// 시즌별 raw 시트 이름 (업로드 안내 문구에 사용)
function rawSheetName(season, year){
  const s=season||SEASON, y=year||(new Date().getFullYear());
  if(s==='반수') return y+'raw반수';
  if(s==='윈터') return y+'raw';      // 윈터 등록시트의 raw 탭
  return y+'raw정규';
}
function syncSeasonTexts(s){
  const now=new Date().getFullYear();
  const cur=rawSheetName(s, now);
  const d1=$R.getElementById('histUpDesc');
  if(d1) d1.textContent = `${cur} 시트를 CSV/엑셀로 올리면, ‘지난 등록 보기’ 탭에서 날짜를 골라 그날 현황을 볼 수 있어요.`;
  const l1=$R.getElementById('histUpLabel');
  if(l1) l1.textContent = `raw 로그 업로드 (${cur} CSV/엑셀)`;
}
function setSeason(s){
  SEASON = s;
  sessionStorage.setItem(LK('season'), s);
  const sel=$R.getElementById('season'); if(sel) sel.value=s;
  const bd=$R.getElementById('seasonBadge'); if(bd) bd.textContent=s+'시즌';
  // 시즌 전용 항목만 보이게 (data-season-only)
  $R.querySelectorAll('[data-season-only]').forEach(el=>{
    el.style.display = el.dataset.seasonOnly.split(',').indexOf(s)>=0 ? '' : 'none';
  });
  // 윈터는 마스터·학생명단 개념이 없다. 접수대장이 그 역할을 한다.
  const w = (s==='윈터');
  const gb=$R.getElementById('gsLoadBtn');
  if(gb) gb.textContent = w ? '구글시트에서 접수대장 불러오기' : '구글시트에서 마스터·접수현황 불러오기';
  const rb=$R.getElementById('rosterBtn');
  if(rb) rb.textContent = w ? '접수대장으로 등록잡기' : '학생명단으로 등록잡기';
  const inote=$R.getElementById('inputNote');
  if(inote) inote.innerHTML = w
    ? '윈터: <b>일일명단</b> + <b>접수대장</b>을 불러온 뒤 <b>접수대장으로 등록잡기</b>를 누르세요.'
    : '권장: 자료 불러온 뒤 <b>학생명단으로 등록잡기</b> — 편성·재등록·미납을 한 번에 계산합니다.';
  $R.querySelectorAll('#loadStatus .stled').forEach(el=>{
    const k=el.dataset.k;
    el.style.display = (w && (k==='roster'||k==='refund')) ? 'none' : '';
    if(w && k==='master') el.lastChild.textContent=' 접수대장';
    if(!w && k==='master') el.lastChild.textContent=' 마스터·접수현황';
  });
  const wd=$R.getElementById('winDash');
  if(wd && s!=='윈터') wd.style.display='none';
  const wh=$R.getElementById('winHero');
  if(wh && s!=='윈터') wh.style.display='none';
  const wt=$R.getElementById('winTiles');
  if(wt && s!=='윈터') wt.style.display='none';
  syncSeasonTexts(s);
}
function RLPFX(season){ return (season||_seasonNow())==='윈터' ? 'winter_' : ''; }
function RLID(date, season){ return RLPFX(season)+date; }
// analysis·config 문서도 같은 규칙. 정규·반수는 기존 ID 그대로(마이그레이션 없음).
function NSID(id, season){ return RLPFX(season)+id; }
const RLC=()=>LK('rawlogcache'+(RLPFX()?'_winter':''));
function _rlcLoad(){ try{ const j=JSON.parse(localStorage.getItem(RLC())||'null');
  return (j&&j.byDate)?j:null; }catch(e){ return null; } }
// full: 전량 조회로 만들어진 캐시인지. false/없음이면 다음 로드에서 전량 재조회한다.
// (과거분이 비어 있는 캐시가 'through=오늘'로 굳어 과거를 영영 못 보던 문제 방지)
function _rlcSave(byDate, through, full){ try{
  if(!byDate || !Object.keys(byDate).length) return;
  localStorage.setItem(RLC(), JSON.stringify({byDate, through, full:!!full})); }catch(e){} }
function _dstr(d){ return d.toISOString().slice(0,10); }

async function loadRawlogAll(force){
  if(!fbReady) return false;
  let cache=force?null:_rlcLoad();
  if(cache && cache.full!==true) cache=null;   // 불완전한 캐시는 버리고 전량 재조회
  try{
    let byDate;
    if(cache){
      byDate=cache.byDate;
      // 캐시 이후 날짜 + 최근 2일(변경 가능)만 개별 조회
      const today=new Date(); const need=[];
      let cur=new Date((cache.through||_dstr(today))+'T00:00:00');
      for(let i=0;i<45 && cur<=today;i++){ need.push(_dstr(cur)); cur.setDate(cur.getDate()+1); }
      const y=new Date(today); y.setDate(y.getDate()-1);
      [_dstr(y), _dstr(today)].forEach(d=>{ if(need.indexOf(d)<0) need.push(d); });
      for(const d of need){
        try{ const sn=await getDoc(doc(db,COL('rawlog'),RLID(d)));
          if(sn.exists()){ const v=sn.data();
            if(v&&Array.isArray(v.rows)) byDate[d]={rows:unpackRows(v.rows), writer:''}; }
        }catch(e){}
      }
    } else {
      // 캐시 없음 → 최초 1회 전량 조회
      const snap=await getDocs(collection(db,COL('rawlog')));
      byDate={};
      const pfx=RLPFX();
      snap.forEach(sn=>{ const id=sn.id;
        if(pfx){ if(id.indexOf(pfx)!==0) return; }        // 윈터: 접두어 있는 것만
        else if(id.indexOf('_')>=0) return;                // 정규: 다른 시즌 문서 제외
        const v=sn.data(); if(!v||!Array.isArray(v.rows)) return;
        const key = pfx ? id.slice(pfx.length) : (v.date||id);
        byDate[key]={rows:unpackRows(v.rows), writer:''}; });
    }
    if(Object.keys(byDate).length){
      HIST.byDate=byDate; HIST.dates=Object.keys(byDate).sort();
      _rlcSave(byDate, _dstr(new Date()), true);   // 여기까지 왔으면 전량 조회분이거나 전량 기반 캐시
      refreshHistUI(); return true;
    }
  }catch(e){ console.error('rawlog 로드 실패', e); }
  return false;
}
// 최초 업로드분을 날짜별 문서로 일괄 저장(배치)
async function importRawlogToFirebase(byDate){
  if(!fbReady){ toast('⚠ Firebase 미연결 — 누적 저장 불가'); return false; }
  const dates=Object.keys(byDate);
  try{
    let batch=writeBatch(db), n=0;
    for(const d of dates){
      batch.set(doc(db,COL('rawlog'),RLID(d)), { date:d, rows:packRows(byDate[d].rows), savedAt:Date.now() });
      if(++n%400===0){ await batch.commit(); batch=writeBatch(db); }
    }
    await batch.commit();
    return true;
  }catch(e){ console.error(e); toast('⚠ 누적 저장 실패: '+(e.code||e.message)); return false; }
}
// 드롭다운/안내 갱신 (지난 등록 보기 탭 + 설정 탭)
function refreshHistUI(){
  const sel=$R.getElementById('histDate'); const btn=$R.getElementById('histViewBtn');
  if(!HIST.dates.length){
    // 시즌을 바꿨는데 그 시즌 로그가 없으면 이전 시즌 목록이 남아 섞여 보인다. 반드시 비운다.
    sel.innerHTML='<option value="">— 없음 —</option>';
    sel.disabled=true; btn.disabled=true;
    const hn=$R.getElementById('histNote'); if(hn) hn.textContent=`${SEASON} 누적 로그 없음`;
    const hn2=$R.getElementById('histNote2'); if(hn2) hn2.textContent='';
    const hv=$R.getElementById('histView'); if(hv) hv.style.display='none';
    const hb=$R.getElementById('histBody'); if(hb) hb.innerHTML='';
    const hl=$R.getElementById('histList'); if(hl) hl.style.display='';
    return;
  }
  sel.innerHTML=HIST.dates.map(d=>`<option value="${d}">${d}</option>`).join('');
  sel.value=HIST.dates[HIST.dates.length-1];
  sel.disabled=false; btn.disabled=false;
  const msg=`${HIST.dates.length}개 날짜 (${HIST.dates[0]} ~ ${HIST.dates[HIST.dates.length-1]})`;
  const hn=$R.getElementById('histNote'); if(hn) hn.textContent=msg;
  const hn2=$R.getElementById('histNote2'); if(hn2) hn2.textContent='✅ 누적 로그 '+msg;
}
$R.getElementById('saveBtn').onclick=saveDaily;
$R.getElementById('loadPrevBtn').onclick=()=>renderDash();

/* ===================================================================
 * 8) 설정 / config
 * =================================================================== */
let CFG={openReg:'',openBan:'',openWin:'',writer:'',banList:[],jhList:[],billMonth:null,baselines:{}};
const parseList = s => (s||'').split(/[,\n]/).map(x=>x.trim()).filter(Boolean);
const CFG_DEFAULT={openReg:'',openBan:'',openWin:'',writer:'',banList:[],jhList:[],courseList:[],billMonth:null,baselines:{},jangMap:{},winCap:{},winDorm:{}};
async function loadCfg(){
  // 시즌을 바꾸면 이전 시즌 값이 남지 않도록 먼저 초기화한다.
  // (없으면 윈터에 정규 설정이 그대로 보인다)
  CFG=JSON.parse(JSON.stringify(CFG_DEFAULT));
  let c=null;
  if(fbReady){ try{ const s=await getDoc(doc(db,COL('config'),NSID('app'))); if(s.exists()) c=s.data(); }catch(e){} }
  if(!c){ try{ c=JSON.parse(localStorage.getItem(LK('cfg')+(RLPFX()?'_winter':''))||'null'); }catch(e){} }
  if(c){ CFG={...CFG,...c}; }
  if(!Array.isArray(CFG.banList)) CFG.banList=[];
  if(!Array.isArray(CFG.jhList)) CFG.jhList=[];
  if(!Array.isArray(CFG.courseList)) CFG.courseList=[];
  if(typeof CFG.winCap!=='object'||!CFG.winCap) CFG.winCap={};
  if(typeof CFG.winDorm!=='object'||!CFG.winDorm) CFG.winDorm={};
  if(typeof CFG.baselines!=='object'||!CFG.baselines) CFG.baselines={};
  if(typeof CFG.jangMap!=='object'||!CFG.jangMap) CFG.jangMap={};
  $R.getElementById('cfgOpenReg').value=CFG.openReg||'';
  $R.getElementById('cfgOpenBan').value=CFG.openBan||'';
  $R.getElementById('cfgOpenWin').value=CFG.openWin||'';
  $R.getElementById('cfgWriter').value=CFG.writer||'';
  $R.getElementById('cfgBanList').value=(CFG.banList||[]).join(', ');
  $R.getElementById('cfgJhList').value=(CFG.jhList||[]).join(', ');
  $R.getElementById('cfgCourseList').value=(CFG.courseList||[]).join(', ');
  const _wc=CFG.winCap||{}, _wdm=CFG.winDorm||{};
  $R.getElementById('cfgCapM1').value=_wc.M1??'';
  $R.getElementById('cfgCapF1').value=_wc.F1??'';
  $R.getElementById('cfgCapM2').value=_wc.M2??'';
  $R.getElementById('cfgCapF2').value=_wc.F2??'';
  $R.getElementById('cfgDormM').value=_wdm.M??'';
  $R.getElementById('cfgDormF').value=_wdm.F??'';
  $R.getElementById('cfgBillMonth').value=CFG.billMonth||'';
  syncBaselineFields();
  renderJangRows();
  if(CFG.writer) $R.getElementById('writer').value=CFG.writer;
  $R.getElementById('cfgFb').value = localStorage.getItem(LK('fb'))||'';
}
// 기수 매핑: N월분 → 정규(N-2)기(N월)
function gisuName(m){ m=parseInt(m); if(!m) return ''; return `정규${m-2}기(${m}월)`; }
// 현재 집계월의 베이스라인을 입력칸에 반영
function syncBaselineFields(){
  const m=parseInt($R.getElementById('cfgBillMonth').value)||CFG.billMonth||0;
  $R.getElementById('cfgGisuPreview').value = m?gisuName(m):'';
  $R.getElementById('blMonthTag').textContent = m?`${m}월분`:'-';
  const bl=(CFG.baselines&&CFG.baselines[m])||{};
  $R.getElementById('cfgBlTotal').value = bl.total??'';
  $R.getElementById('cfgBlReg').value   = bl.reg??'';
  $R.getElementById('cfgBlUnreg').value = bl.unreg??'';
}
$R.getElementById('cfgBillMonth').addEventListener('input',syncBaselineFields);
/* 윈터 집계 — 접수대장(접수등록대장) → 기준일 하루치, 과정 × 성별
 * 규칙(작년 703행으로 검증): 접수=접수일, 등록=예비교습비 납부일, 환불=환불일, 완납=교습비 완납일.
 * 날짜 표기가 열마다 달라('10월 13일(월)' / '10/13(월)' / Date / 'YYYY. M. D') 전부 받는다.
 * 시즌이 해를 넘기므로(10월~이듬해 1월) 개강일 연도를 기준으로 연도를 정한다. */
const WIN_COURSES=['고1 과정','고2 과정'];
// 윈터 rawlog 열 — packRows/unpackRows 가 배열만 다루므로 순서가 곧 스키마다.
const WIN_RAW_COLS=['날짜','구분','학년','계열','반','접수','접수 계',
  '등록-남','환불-남','등록-여','환불-여','완납','완납계','등록인원','누적남','누적여','작성자'];
const WIN_IX=(()=>{ const o={}; WIN_RAW_COLS.forEach((c,i)=>o[c]=i); return o; })();
// 예전 저장분은 일별 '완납' 열이 없는 16열이었다. 두 스키마 외에는 존재하지 않는다.
const WIN_RAW_COLS_V1=['날짜','구분','학년','계열','반','접수','접수 계',
  '등록-남','환불-남','등록-여','환불-여','완납계','등록인원','누적남','누적여','작성자'];
// 값은 반드시 '열 이름'으로 꺼낸다. 인덱스를 직접 쓰면 스키마가 바뀔 때 조용히 어긋난다.
function winGet(row, name){
  if(!Array.isArray(row)) return 0;
  const cols = (row.length===WIN_RAW_COLS_V1.length) ? WIN_RAW_COLS_V1 : WIN_RAW_COLS;
  const i = cols.indexOf(name);
  if(i<0) return 0;
  const n = parseInt(row[i]);
  return isNaN(n) ? (row[i]==null?0:row[i]) : n;
}
function winCourseOf(row){
  if(!Array.isArray(row)) return '';
  const cols = (row.length===WIN_RAW_COLS_V1.length) ? WIN_RAW_COLS_V1 : WIN_RAW_COLS;
  return String(row[cols.indexOf('학년')]||'').trim();
}
const _wn = x => String(x==null?'':x).replace(/\s/g,'');
const _p2 = n => String(n).padStart(2,'0');

function winYmd(v, sy){
  if(v==null||v==='') return '';
  if(v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${_p2(v.getMonth()+1)}-${_p2(v.getDate())}`;
  const t=String(v).trim(); if(!t) return '';
  let m;
  // '2026-10-07T15:00:00.000Z' 같은 UTC ISO 는 그대로 자르면 하루 밀린다 → 현지시각으로 환산
  if(/^\d{4}-\d{2}-\d{2}T.*Z$/.test(t)){
    const d=new Date(t);
    if(!isNaN(d)) return `${d.getFullYear()}-${_p2(d.getMonth()+1)}-${_p2(d.getDate())}`;
  }
  if((m=t.match(/^(\d{4})[-.\s]+(\d{1,2})[-.\s]+(\d{1,2})/))) return `${m[1]}-${_p2(m[2])}-${_p2(m[3])}`;
  if((m=t.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/))) return _winY(+m[1],+m[2],sy);
  if((m=t.match(/^(\d{1,2})\/(\d{1,2})/)))          return _winY(+m[1],+m[2],sy);
  return '';
}
function _winY(mo,dy,sy){ return `${sy}-${_p2(mo)}-${_p2(dy)}`; }


// 경영지원 설정 확인 — Supabase quetta_state 의 cfg 를 그대로 보여준다(읽기 전용).
// 윈터 기수·과정 구분 같은 값이 거기 있으면 앱 설정에 중복 입력할 필요가 없다.
const _sbCfgBtn=$R.getElementById('sbCfgBtn');
if(_sbCfgBtn) _sbCfgBtn.onclick=async()=>{
  const note=$R.getElementById('sbCfgNote');
  const out=$R.getElementById('sbCfgOut');
  _sbCfgBtn.disabled=true; note.textContent='불러오는 중…';
  try{
    const st=await loadSbState();
    if(!st){ note.innerHTML='<span style="color:var(--red)">데이터가 비어 있습니다.</span>'; return; }
    const topKeys=Object.keys(st).map(k=>{
      const v=st[k];
      const n=Array.isArray(v)?`배열 ${v.length}`:(v&&typeof v==='object')?`객체 ${Object.keys(v).length}키`:typeof v;
      return `${k}(${n})`;
    }).join(' · ');
    note.innerHTML=`✅ 최상위 키 — ${topKeys}`;
    out.style.display='block';
    // pays 의 '내역' 값 분포 — 윈터 결제가 어떤 문자열로 들어오는지 확인용.
    // cfg 에는 체크된 기수만 저장되므로, 실제 내역값은 pays 를 봐야 알 수 있다.
    const pays=Array.isArray(st.pays)?st.pays:[];
    const cnt={};
    pays.forEach(p=>{ const k=String(p.내역||'(빈값)'); cnt[k]=(cnt[k]||0)+1; });
    const list=Object.entries(cnt).sort((a,b)=>b[1]-a[1])
      .map(([k,v])=>`  ${String(v).padStart(5)}건  ${k}`).join('\n');
    const win=Object.keys(cnt).filter(k=>/윈터|시즌제로|고1|고2|선금|잔금|완납/.test(k));
    // 윈터로 보이는 결제 한 건의 필드 구조를 그대로 보여준다(이름·연락처는 가림).
    const sample=pays.filter(p=>/윈터/.test(String(p.내역||'')));
    const mask=o=>{
      const c={};
      Object.keys(o).forEach(k=>{
        const v=o[k];
        if(/성명|이름|연락처|전화|휴대|주소|보호자|email|메일/i.test(k)) c[k]='***';
        else c[k]=v;
      });
      return c;
    };
    const sampleTxt = sample.length
      ? `[윈터 결제 샘플 ${Math.min(3,sample.length)}건 / 총 ${sample.length}건]\n` +
        sample.slice(0,3).map(p=>JSON.stringify(mask(p),null,2)).join('\n') + '\n\n'
      : `[윈터 결제 샘플] 내역에 '윈터'가 들어간 건이 없습니다.\n` +
        (pays.length ? `참고 — 아무 결제 1건의 필드 구조:\n${JSON.stringify(mask(pays[0]),null,2)}\n\n` : '');
    out.textContent =
      `[pays 내역 분포] 총 ${pays.length}건 / 서로 다른 값 ${Object.keys(cnt).length}개\n${list}\n\n` +
      `[윈터로 보이는 값] ${win.length?win.join(' · '):'없음 — 아직 윈터 결제가 들어오지 않았습니다'}\n\n` +
      sampleTxt +
      (st.cfg ? 'cfg =\n' + JSON.stringify(st.cfg, null, 2)
              : 'cfg 키 없음. 최상위 구조:\n' + JSON.stringify(Object.keys(st), null, 2));
  }catch(e){
    note.innerHTML=`<span style="color:var(--red)">⚠ 실패: ${e.message||e}</span>`;
  }finally{ _sbCfgBtn.disabled=false; }
};

// 윈터 등록 기입 — 접수대장 B열('예비 교습비')에 기준일을 쓴다. 빈 칸에만.
const _winRegDate=$R.getElementById('winRegDate');
if(_winRegDate) _winRegDate.value=_dstr(new Date());
const _winRegBtn=$R.getElementById('winRegBtn');
if(_winRegBtn) _winRegBtn.onclick=async()=>{
  const out=$R.getElementById('winRegOut');
  const raw=$R.getElementById('winRegSids').value||'';
  const sids=raw.split(/[\s,]+/).map(x=>x.trim()).filter(Boolean);
  if(!sids.length){ out.innerHTML='<span style="color:var(--red)">수험번호를 입력하세요.</span>'; return; }
  const d=$R.getElementById('winRegDate').value;
  if(!d){ out.innerHTML='<span style="color:var(--red)">기준일을 선택하세요.</span>'; return; }
  const [wy,wm,wd]=d.split('-').map(Number);
  _winRegBtn.disabled=true; out.textContent='기입 중…';
  try{
    const kind=$R.getElementById('winRegKind').value;
    const j=await gsWriteSids({ action:'winterReg', kind, wy, wm, wd }, sids, '윈터 등록 기입',
      (n,t)=>{ if(t>1) out.textContent=`기입 중… ${n}/${t}`; });
    const part=[];
    if(j.written.length)  part.push(`기입 <b>${j.written.length}</b>건 (${j.written.join(', ')})`);
    if(j.skipped.length)  part.push(`쓸 칸 없음(이미 값 있음) ${j.skipped.length}건 (${j.skipped.join(', ')})`);
    if(j.notFound.length) part.push(`<span style="color:var(--red)">명단에 없음 ${j.notFound.length}건 (${j.notFound.join(', ')})</span>`);
    out.innerHTML = `✅ ${j.sheet} · <b>${j.kind}</b>${j.noIntent?' (E열 ‘ㅇ’ 포함)':''} · 기입값 <b>${j.date}</b><br>` + part.join('<br>');
  }catch(e){
    out.innerHTML = `<span style="color:var(--red);white-space:pre-wrap">⚠ 실패: ${e.message||e}</span>`;
  }finally{ _winRegBtn.disabled=false; }
};

// 윈터 접수대장 연결 확인 — 읽기만 한다(쓰기 없음)
const _winBtn=$R.getElementById('winTestBtn');
if(_winBtn) _winBtn.onclick=async()=>{
  const out=$R.getElementById('winTestOut');
  _winBtn.disabled=true; out.textContent='확인 중…';
  const lines=[];
  for(const [which,label] of [['winter','접수대장'],['winterReport','등록대장']]){
    try{
      const j=await fetchSheet(which);
      const hdr=(j.rows&&j.rows[0])?j.rows[0].filter(x=>String(x||'').trim()).length:0;
      lines.push(`✅ ${label} — 시트 <b>${j.sheet||'?'}</b> · 데이터 <b>${j.count||0}</b>행 · 열 ${hdr}개`);
    }catch(e){
      lines.push(`<span style="color:var(--red)">⚠ ${label} 실패 — ${(e.message||String(e)).slice(0,140)}</span>`);
    }
  }
  out.innerHTML=lines.join('<br>');
  _winBtn.disabled=false;
};
$R.getElementById('cfgSaveBtn').onclick=async()=>{
  CFG.openReg=$R.getElementById('cfgOpenReg').value;
  CFG.openBan=$R.getElementById('cfgOpenBan').value;
  CFG.openWin=$R.getElementById('cfgOpenWin').value;
  CFG.writer=$R.getElementById('cfgWriter').value;
  CFG.banList=parseList($R.getElementById('cfgBanList').value);
  CFG.jhList=parseList($R.getElementById('cfgJhList').value);
  CFG.courseList=parseList($R.getElementById('cfgCourseList').value);
  const _n=id=>{ const v=$R.getElementById(id).value; return v===''?null:(parseInt(v)||0); };
  CFG.winCap={ M1:_n('cfgCapM1'), F1:_n('cfgCapF1'), M2:_n('cfgCapM2'), F2:_n('cfgCapF2') };
  CFG.winDorm={ M:_n('cfgDormM'), F:_n('cfgDormF') };
  localStorage.setItem(LK('cfg')+(RLPFX()?'_winter':''),JSON.stringify(CFG));
  if(CFG.writer) $R.getElementById('writer').value=CFG.writer;
  updateSplitTag();
  if(!fbReady){ toast('⚠ Firebase 미연결 — 로컬에만 저장됨'); return; }
  try{ await setDoc(doc(db,COL('config'),NSID('app')),CFG,{merge:true}); toast('✅ 설정 저장됨(공유)'); }
  catch(e){ console.error(e); toast('⚠ 설정 저장 실패: '+(e.code||e.message)); }
};
$R.getElementById('cfgBaseSaveBtn').onclick=async()=>{
  const m=parseInt($R.getElementById('cfgBillMonth').value)||0;
  if(!m){ toast('현재 집계월을 먼저 입력하세요'); return; }
  CFG.billMonth=m;
  if(!CFG.baselines) CFG.baselines={};
  CFG.baselines[m]={
    total:parseInt($R.getElementById('cfgBlTotal').value)||0,
    reg:parseInt($R.getElementById('cfgBlReg').value)||0,
    unreg:parseInt($R.getElementById('cfgBlUnreg').value)||0
  };
  localStorage.setItem(LK('cfg')+(RLPFX()?'_winter':''),JSON.stringify(CFG));
  syncBaselineFields();
  if(STATE.result) renderDash();
  if(!fbReady){ toast('⚠ Firebase 미연결 — 로컬에만 저장됨'); return; }
  try{ await setDoc(doc(db,COL('config'),NSID('app')),CFG,{merge:true}); toast(`✅ ${m}월분 집계설정 저장됨(공유)`); }
  catch(e){ console.error(e); toast('⚠ 저장 실패: '+(e.code||e.message)); }
};
// 장학 매핑 렌더 (JANG_LIST 7줄 + 코드 입력칸)
function renderJangRows(){
  const wrap=$R.getElementById('cfgJangRows'); if(!wrap) return;
  wrap.innerHTML=JANG_LIST.map((label,i)=>
    `<div class="row" style="margin-bottom:8px;align-items:center">
      <div class="field" style="flex:1.2"><label>${i+1}. ${label}</label>
        <input class="jangCode" data-label="${label}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" name="jang_${i}" placeholder="예: Q⑥_50 (여러 개는 쉼표)" value="${(CFG.jangMap[label]||[]).join(', ')}">
      </div>
    </div>`).join('');
}
$R.getElementById('cfgJangSaveBtn').onclick=async()=>{
  const map={};
  $R.querySelectorAll('.jangCode').forEach(inp=>{
    const label=inp.dataset.label;
    const codes=inp.value.split(',').map(s=>s.trim()).filter(Boolean);
    if(codes.length) map[label]=codes;
  });
  CFG.jangMap=map;
  localStorage.setItem(LK('cfg')+(RLPFX()?'_winter':''),JSON.stringify(CFG));
  if(STATE.result) renderDash();
  if(!fbReady){ toast('⚠ Firebase 미연결 — 로컬에만 저장됨'); return; }
  try{ await setDoc(doc(db,COL('config'),NSID('app')),CFG,{merge:true}); toast('✅ 장학 매핑 저장됨(공유)'); }
  catch(e){ console.error(e); toast('⚠ 저장 실패: '+(e.code||e.message)); }
};
// 코드 → 장학 라벨 역매핑
function jangCodeToLabel(code){
  if(!code) return null;
  const c=String(code).trim();
  for(const label in CFG.jangMap){ if((CFG.jangMap[label]||[]).includes(c)) return label; }
  return null;
}
$R.getElementById('cfgPwBtn').onclick=async()=>{
  const a=$R.getElementById('cfgPw1').value, b=$R.getElementById('cfgPw2').value;
  if(!a||a!==b){ toast('비번 확인이 일치하지 않아요'); return; }
  const h=await sha256(a);
  localStorage.setItem(LK('gate'),h);
  $R.getElementById('cfgPw1').value=''; $R.getElementById('cfgPw2').value='';
  if(!fbReady){ toast('⚠ Firebase 미연결 — 비번 로컬에만 저장됨'); return; }
  try{ await setDoc(doc(db,COL('config'),'gate'),{hash:h},{merge:true}); toast('✅ 비밀번호 설정됨(공유)'); }
  catch(e){ console.error(e); toast('⚠ 비번 저장 실패: '+(e.code||e.message)); }
};
// 콘솔 원문(JS 객체)도, 순수 JSON도 모두 받아서 정규화
function normalizeConfig(raw){
  let t=raw.trim();
  // const/var/let firebaseConfig = ... 또는 그냥 firebaseConfig = ... 벗기기
  t=t.replace(/^\s*(?:(?:const|var|let)\s+)?[A-Za-z_]\w*\s*=\s*/,'').replace(/;\s*$/,'').trim();
  // 이미 JSON이면 그대로
  try{ return JSON.parse(t); }catch(e){}
  // 키에 따옴표 없을 때 → 키만 큰따옴표 (값 속 https:// 는 안 건드림)
  let q=t.replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g,'$1"$2":');
  // 값/키의 작은따옴표 → 큰따옴표
  q=q.replace(/'/g,'"');
  // 트레일링 콤마 제거
  q=q.replace(/,(\s*[}\]])/g,'$1');
  return JSON.parse(q); // 실패하면 throw → 아래 catch
}
$R.getElementById('cfgFbBtn').onclick=async()=>{
  const raw=$R.getElementById('cfgFb').value;
  let cfg;
  try{ cfg=normalizeConfig(raw); }
  catch(e){ toast('설정 형식을 못 읽었어요 — 콘솔 원문 그대로 붙여보세요'); return; }
  if(!cfg.apiKey || String(cfg.apiKey).trim()===''){ toast('apiKey가 비어 있어요'); return; }
  localStorage.setItem(LK('fb'),JSON.stringify(cfg)); toast('저장됨 — 재접속합니다');
  setTimeout(()=>location.reload(),700);
};

// 시즌별 개강일. 윈터가 반수 개강일을 잘못 쓰던 문제 수정.
function openDateOf(season){
  const s=season||$R.getElementById('season').value;
  if(s==='정규') return CFG.openReg||'';
  if(s==='윈터') return CFG.openWin||'';
  return CFG.openBan||'';
}
function updateSplitTag(){
  const base=$R.getElementById('baseDate').value;
  const season=$R.getElementById('season').value;
  const open=openDateOf(season);
  const post = open && base && base>=open;
  $R.getElementById('splitTag').innerHTML = base ?
    `<span class="tag ${post?'post':'pre'}">${post?'개강 후 · 반별':'개강 전 · 전형별'}</span>` :
    `<span class="pill">날짜 선택</span>`;
}

/* ===================================================================
 * 9) 업로드 배선
 * =================================================================== */
function wireDrop(dropId,inputId,nameId,kind){
  const drop=$R.getElementById(dropId), input=$R.getElementById(inputId), name=$R.getElementById(nameId);
  const handle=async(file)=>{
    if(!file) return;
    name.textContent=file.name; drop.classList.add('ok');
    try{
      const wb=await readXlsx(file);
      if(kind==='daily'){ STATE.daily=parseDaily(wb);
        if(STATE.daily.fileDate && !$R.getElementById('baseDate').value){
          const d=STATE.daily.fileDate; const iso = d instanceof Date ? d.toISOString().slice(0,10) : String(d).slice(0,10);
          $R.getElementById('baseDate').value=iso; updateSplitTag();
        }
        $R.getElementById('inputNote').textContent=`일일명단: 등록 ${STATE.daily.reg.length} · 환불 ${STATE.daily.ref.length}`;
      }
      else if(kind==='master'){ STATE.master=parseMaster(wb);
        const bans=Object.keys(STATE.master.banCount||{}).join('·');
        $R.getElementById('inputNote').textContent=`마스터: 재원 ${STATE.master.total}명 · 반 ${bans}`;
      }
      else { STATE.receipt=parseReceipt(wb);
        const n=Object.values(STATE.receipt.byJh).reduce((a,b)=>a+b.접수,0);
        $R.getElementById('inputNote').textContent=`접수현황: 전형 ${Object.keys(STATE.receipt.byJh).length}종 · 접수 ${n}명`;
      }
    }catch(e){ console.error(e); toast('파일 읽기 실패: '+name.textContent); drop.classList.remove('ok'); }
    checkReady();
  };
  input.addEventListener('change',e=>handle(e.target.files[0]));
  ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag');}));
  drop.addEventListener('drop',e=>{ if(e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); });
}
function checkReady(){ const b=$R.getElementById('processBtn'); if(b) b.disabled = !(STATE.daily && STATE.master); }

// 상태등 켜기
function setLed(key){ const el=$R.querySelector(`.stled[data-k="${key}"]`); if(el) el.classList.add('on'); }

// 학생명단(등록잡기) 기반 처리 — 구글시트에서 학생명단 + 접수현황 로드 후 집계
$R.getElementById('rosterBtn').onclick=async()=>{
  const note=$R.getElementById('gsNote');
  const date=$R.getElementById('baseDate').value;
  if(!date){ toast('기준 날짜를 먼저 선택하세요'); return; }
  if(_seasonNow()==='윈터'){ return winRosterRun(date, note); }
  if(!(parseInt(CFG.billMonth)||0)){ toast('설정에서 현재 집계월을 먼저 지정하세요'); switchTab('settings'); return; }
  note.textContent='구글시트에서 학생명단·접수현황 불러오는 중…';
  try{
    // 완전 동시요청은 Apps Script가 404를 냄 → 0.25초 간격으로 띄워 발사(대부분 겹쳐 돌아감)
    const stagger=async(tasks,gap)=>{ const ps=[];
      for(const t of tasks){ ps.push(t()); await new Promise(r=>setTimeout(r, gap)); }
      return Promise.all(ps); };
    const [ro,rc,rf,rl,rp]=await stagger([
      ()=>fetchSheet('roster'),
      ()=>fetchSheet('receipt').catch(()=>null),
      ()=>fetchSheet('refund').catch(()=>null),
      ()=>fetchSheet('receiptlog').catch(()=>null),
      ()=>fetchSheet('report').catch(e=>{ STATE.reportErr=e.message||String(e); return null; }),
    ], 250);
    STATE.rosterData=parseRoster(ro.rows); setLed('roster');
    if(rc){ STATE.receipt=parseReceiptRows(rc.rows); setLed('master'); }
    if(rf){ STATE.refundData=parseRoster(rf.rows); setLed('refund'); }
    if(rl){ STATE.receiptToday=countReceiptToday(rl.rows, date); STATE.receiptRows=rl.rows; }
    // 2026정규 시트의 어제 마감 소계 = 전일값의 진짜 출처
    STATE.sheetPrev=null; STATE.reportErr=STATE.reportErr||'';
    STATE.reportRows = (rp && rp.rows) ? rp.rows : null;   // 개강후 미리보기에서 재사용(중복 호출 제거)
    if(rp && rp.rows){ const m={};
      for(const row of rp.rows){ if(String(row[0]).trim()==='정규시즌'){
        // 등록잡기는 '오늘 기입 전'에 하므로 어제 마감 = 소계 열.
        // J=소계-남, N=소계-여, R=등록계. (G/K/O는 그저께 마감이라 쓰지 않음)
        m[String(row[1]).trim()]={J:row[9], N:row[13], R:row[17]}; } }
      STATE.sheetPrev=m; }
    const n=STATE.rosterData.students.filter(s=>s.sid).length;
    note.innerHTML=`✅ 학생명단 ${n}명 불러옴 — 집계월 정규${CFG.billMonth}월 기준 계산합니다`
      + (STATE.result&&STATE.result._noPrev ? `<br><span style="color:var(--red)">⚠ 어제 저장본이 없어 전일값을 표시할 수 없습니다</span>` : '');
    aggregateRoster();
    switchTab('dash');
  }catch(e){ console.error(e);
    note.innerHTML=`<span style="color:var(--red)">⚠ 불러오기 실패: ${e.message||e}</span> — 웹앱에 roster 소스가 배포됐는지 확인하세요.`;
  }
};
// ── 학생명단 재등록일 기입 (미리보기 → 실행) ──
// 내역에서 월 추출 (경영지원 extractMonth 재현: 마지막 'N월')
function cohortMonth(t){ const ms=String(t||'').match(/(\d+)월/g); if(ms&&ms.length) return parseInt(ms[ms.length-1]); if(String(t).includes('윈터')) return 1; return 0; }
let WB=null; // 미리보기 상태
$R.getElementById('writebackBtn').onclick=async()=>{
  const note=$R.getElementById('gsNote');
  const date=$R.getElementById('baseDate').value;
  if(!date){ toast('기준 날짜를 먼저 선택하세요'); return; }
  note.textContent='경영지원 결제자 + 학생명단 대조 중…';
  try{
    const ro=await fetchSheet('roster'); STATE.rosterData=parseRoster(ro.rows);
    const daily=await buildDailyFromSb(date);
    const payers=daily.reg; // {sid,name,ban,cohort,jang,isNew}
    const R=STATE.rosterData;
    const bySid={}; for(const st of R.students){ if(st.sid) bySid[st.sid]=st; }
    const [yy,mm,dd]=[+date.slice(0,4), +date.slice(5,7), +date.slice(8,10)];
    const rows=[]; const groups={}; let toWrite=0, skip=0, nf=0, nomonth=0;
    for(const p of payers){
      const M=cohortMonth(p.cohort);                 // 이 학생이 들어갈 달
      const st=bySid[p.sid];
      if(!M){ rows.push({state:'nomonth', sid:p.sid, name:p.name, ban:p.ban, col:'-', cur:'', cohort:p.cohort}); nomonth++; continue; }
      if(!st){ rows.push({state:'nf', sid:p.sid, name:p.name, ban:p.ban, col:`정규${M}월`, cur:'', cohort:p.cohort}); nf++; continue; }
      const col=R.monthCol(M);
      const cur = col>=0 ? st._row[col] : '';
      const curStr=String(cur||'').trim();
      const curShow = mdNum(cur)!=null ? `${Math.floor(mdNum(cur)/100)}/${mdNum(cur)%100}` : curStr;
      if(col<0){ rows.push({state:'nf', sid:p.sid, name:st.name||p.name, ban:st.ban, col:`정규${M}월(열없음)`, cur:'', cohort:p.cohort}); nf++; continue; }
      if(curStr){ rows.push({state:'skip', sid:p.sid, name:st.name||p.name, ban:st.ban, col:`정규${M}월`, cur:curShow, cohort:p.cohort}); skip++; }
      else { rows.push({state:'write', sid:p.sid, name:st.name||p.name, ban:st.ban, col:`정규${M}월`, cur:'', month:M, cohort:p.cohort});
             (groups[M]=groups[M]||[]).push(p.sid); toWrite++; }
    }
    WB={ year:yy, mm, day:dd, date, groups };
    const badge={write:'<span style="color:var(--teal-ink)">✅ 기입</span>',
                 skip:'<span style="color:var(--muted)">⏭ 건너뜀</span>',
                 nf:'<span style="color:var(--red)">⚠ 못찾음</span>',
                 nomonth:'<span style="color:var(--red)">⚠ 월없음</span>'};
    $R.getElementById('wbTable').innerHTML=
      `<thead><tr><th>상태</th><th>수험번호</th><th>이름</th><th>반</th><th>기입 열</th><th>현재값</th><th>쓸 값</th><th>내역</th></tr></thead><tbody>`+
      rows.map(r=>`<tr><td>${badge[r.state]}</td><td class="mono">${r.sid}</td><td>${r.name||''}</td><td>${r.ban||''}</td><td>${r.col}</td><td class="mono">${r.cur||'<span style=\"color:var(--muted)\">(빈칸)</span>'}</td><td class="mono">${r.state==='write'?`${mm}/${dd}`:'—'}</td><td class="note">${r.cohort||''}</td></tr>`).join('')+
      `</tbody>`;
    const gsum=Object.keys(groups).sort((a,b)=>a-b).map(M=>`정규${M}월 ${groups[M].length}명`).join(' · ')||'없음';
    $R.getElementById('wbSummary').innerHTML=`✅ 기입 ${toWrite} (${gsum}) · ⏭ 건너뜀 ${skip} · ⚠ 못찾음 ${nf} · 월없음 ${nomonth}`;
    const applyBtn=$R.getElementById('wbApplyBtn');
    applyBtn.disabled = toWrite===0;
    applyBtn.textContent = `학생명단에 ${toWrite}명 기입 실행`;
    applyBtn.dataset.mode='write';
    const warns=[]; if(nf) warns.push(`못찾음 ${nf}명`); if(nomonth) warns.push(`월 판정 실패 ${nomonth}명`);
    $R.getElementById('wbApplyNote').innerHTML = warns.length
      ? `<span style="color:var(--red)">⚠ ${warns.join(', ')} — 기입엔 포함 안 됨. 확인하세요.</span>` : '';
    $R.getElementById('wbPanel').style.display='block';
    note.textContent='';
    $R.getElementById('wbPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(e){ console.error(e);
    note.innerHTML=`<span style="color:var(--red)">⚠ 미리보기 실패: ${e.message||e}</span>`;
  }
};
$R.getElementById('wbCancelBtn').onclick=()=>{ $R.getElementById('wbPanel').style.display='none'; WB=null; };

// ── 개강후 시트 기입 (대시보드, 미리보기 → 실행) ──
let EN=null;
// 재등록 전일(O열) 리셋 체크 시 미리보기 표시를 0으로 바꿔 눈으로 확인하게 한다.
function _enPaint(){
  const rs=$R.getElementById('enResetPrevReg');
  const on=!!(rs&&rs.checked);
  $R.querySelectorAll('#enTable tbody tr').forEach((tr,i)=>{
    const td=tr.children[7]; if(!td) return;          // 재등록 전일↩ 칸
    const r=(EN&&EN.rows&&EN.rows[i])||null; if(!r) return;
    td.textContent = on ? '0' : ((r.cR===0||r.cR==null||r.cR==='') ? '' : String(r.cR));
    td.style.color = on ? 'var(--red)' : 'var(--muted)';
  });
}
$R.getElementById('enrollBtn').onclick=async()=>{
  const note=$R.getElementById('enApplyNote');
  const R=STATE.result;
  if(!R||!R._roster||!R.perBan){ toast('먼저 "학생명단으로 등록잡기"를 실행하세요'); return; }
  note.textContent = STATE.reportRows ? '2026정규 시트 값 계산 중…' : '2026정규 시트 현재값(어제 마감) 읽는 중…';
  $R.getElementById('enPanel').style.display='block';
  try{
    const repRows = STATE.reportRows || (await fetchSheet('report')).rows;
    const carry={};
    for(const row of repRows){ if(String(row[0]).trim()==='정규시즌'){ const ban=String(row[1]).trim();
      carry[ban]={J:row[9],N:row[13],R:row[17]}; } }
    const bans=[...R.banList,'미배정'];
    const rows=[]; const payload=[];
    for(const ban of bans){
      const b=R.perBan[ban]; if(!b) continue;
      const c=carry[ban]||{J:'',N:'',R:''};
      // 시트에는 센 값만 넣는다. 잔차로 추정한 반이동은 섞지 않음(대시보드 표시와 동일).
      // 대시보드 편성현황에 표시되는 값을 그대로 기입한다 (별도 계산·합산 없음)
      // 대시보드가 화면에 찍은 값을 그대로 사용 (재계산 없음)
      const sv=(R._shown&&R._shown[ban])||null;
      const rec = sv
        ? {ban, sinN:sv.sinN, chulN:sv.chulN, sinY:sv.sinY, chulY:sv.chulY, reReg:sv.reReg, reRef:sv.reRef}
        : {ban, sinN:b.신규남||0, chulN:b.퇴소남||0, sinY:b.신규여||0, chulY:b.퇴소여||0,
           reReg:b.재등록||0, reRef:b.재등록환불||0};
      payload.push(rec);
      rows.push({ban, cJ:c.J, cN:c.N, cR:c.R, ...rec, inN:0,outN:0,inY:0,outY:0,inR:0,outR:0});
    }
    EN={ payload, rows };
    const dash=v=>(v===0||v==null||v==='')?'':v;
    const neg=v=>v?('-'+v):'';
    const mvt=v=>v?`<span style="color:var(--teal-ink);font-size:11px"> (이동 ${v})</span>`:'';
    $R.getElementById('enTable').innerHTML=
      `<thead><tr><th rowspan="2">반</th><th colspan="3">편성 남 (G/H/I)</th><th colspan="3">편성 여 (K/L/M)</th><th colspan="3">재등록 (O/P/Q)</th></tr>`+
      `<tr><th>전일↩</th><th>신규</th><th>퇴소</th><th>전일↩</th><th>신규</th><th>퇴소</th><th>전일↩</th><th>재등록</th><th>환불</th></tr></thead><tbody>`+
      rows.map(r=>`<tr><td>${r.ban}</td>`+
        `<td class="mono" style="color:var(--muted)">${dash(r.cJ)}</td><td class="mono">${dash(r.sinN)}${mvt(r.inN)}</td><td class="mono">${neg(r.chulN)}${mvt(r.outN)}</td>`+
        `<td class="mono" style="color:var(--muted)">${dash(r.cN)}</td><td class="mono">${dash(r.sinY)}${mvt(r.inY)}</td><td class="mono">${neg(r.chulY)}${mvt(r.outY)}</td>`+
        `<td class="mono" style="color:var(--muted)">${dash(r.cR)}</td><td class="mono">${dash(r.reReg)}${mvt(r.inR)}</td><td class="mono">${neg(r.reRef)}${mvt(r.outR)}</td></tr>`).join('')+
      `</tbody>`;
    $R.getElementById('enSummary').innerHTML=`반 ${rows.length}개 · 회색=이월(어제 소계→전일등록) · 값은 대시보드와 동일`;
    const _rs=$R.getElementById('enResetPrevReg');
    if(_rs && !_rs._wired){ _rs._wired=true; _rs.onchange=()=>_enPaint(); }
    _enPaint();
    note.innerHTML='';
    $R.getElementById('enPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(e){ console.error(e);
    note.innerHTML=`<span style="color:var(--red)">⚠ 미리보기 실패: ${e.message||e}</span> — 웹앱에 report 소스가 배포됐는지 확인하세요.`;
  }
};
$R.getElementById('enCancelBtn').onclick=()=>{ $R.getElementById('enPanel').style.display='none'; EN=null; };
$R.getElementById('enApplyBtn').onclick=async()=>{
  if(!EN||!EN.payload.length) return;
  if(!confirm(`2026정규 개강후 블록에 오늘 내역을 기입하고,\n작성자(S1)와 raw 누적(A52:U108→2026raw정규)까지 진행합니다.\n소계·등록계 수식은 안 건드려요. 진행할까요?`)) return;
  const btn=$R.getElementById('enApplyBtn'); btn.disabled=true; btn.textContent='기입 중…';
  const note=$R.getElementById('enApplyNote');
  try{
    const writer=(STATE.result&&STATE.result.writer)||$R.getElementById('writer').value||'';
    // 접수 payload: 전형별 오늘 접수 + 유시험 합격(수기)
    const rt=STATE.receiptToday||{};
    const usi=parseInt($R.getElementById('usiHab').value);
    const receipt=JH_LIST.map(jh=>({ jh, jubsu:rt[jh]||0, hab:(jh==='유시험 전형'&&!isNaN(usi))?usi:'' }));
    // 장학 블록: 라벨별 접수/등록/환불
    const pj=(STATE.result&&STATE.result.perJang)||{};
    const jang=JANG_LIST.map(L=>({ label:L, jubsu:(pj[L]&&pj[L].접수)||0, deung:(pj[L]&&pj[L].등록)||0, hwan:(pj[L]&&pj[L].환불)||0 }));
    const r=await writeEnroll(EN.payload, writer, receipt, jang,
      $R.getElementById('enResetPrevReg').checked);
    let msg=`✅ 기입 ${r.written.length}개 반${r.notFound.length?` · 못찾음 ${r.notFound.join(',')}`:''}`;
    if(r.raw&&r.raw.appended) msg+=` · raw 누적 ${r.raw.appended}행(${r.raw.atRow}행부터)`;
    else if(r.raw&&r.raw.error) msg+=` · ⚠ raw: ${r.raw.error}`;
    note.innerHTML=msg;
    toast('✅ 개강후 기입 + raw 누적 완료'); btn.textContent='완료됨';
  }catch(e){ console.error(e);
    note.innerHTML=`<span style="color:var(--red);white-space:pre-wrap">⚠ 기입 실패: ${e.message||e}</span>`;
    btn.disabled=false; btn.textContent='다시 시도';
  }
};
$R.getElementById('wbApplyBtn').onclick=async()=>{
  const btn=$R.getElementById('wbApplyBtn');
  const note=$R.getElementById('wbApplyNote');
  // 환불 모드
  if(btn.dataset.mode==='refund'){
    if(!RF||!RF.sids.length) return;
    if(!confirm(`환불자 ${RF.sids.length}명을 '환불' 시트로 옮기고 학생명단에서 삭제합니다.\n(환불 시트에 먼저 복사 후 삭제 — 되돌릴 수 없습니다.)\n진행할까요?`)) return;
    btn.disabled=true; btn.textContent='이동 중…';
    try{
      const r=await moveRefunders(RF.year, RF.mm, RF.day, RF.sids);
      note.innerHTML=`✅ 이동·삭제 ${r.moved.length} · 명단에 없음 ${r.notFound.length}`;
      toast(`✅ ${r.moved.length}명 환불 이동 완료`);
      btn.textContent='완료됨';
    }catch(e){ console.error(e);
      note.innerHTML=`<span style="color:var(--red);white-space:pre-wrap">⚠ 이동 실패: ${e.message||e}</span>`;
      btn.disabled=false; btn.textContent='다시 시도';
    }
    return;
  }
  // 재등록일 기입 모드
  if(!WB||!Object.keys(WB.groups).length) return;
  const months=Object.keys(WB.groups).sort((a,b)=>a-b);
  const desc=months.map(M=>`정규${M}월 ${WB.groups[M].length}명`).join(', ');
  if(!confirm(`학생명단에 ${WB.mm}/${WB.day}를 기입합니다.\n${desc}\n빈 칸에만 기입되며 기존 값은 안 건드립니다. 진행할까요?`)) return;
  btn.disabled=true; btn.textContent='기입 중…';
  try{
    let W=0,S=0,NF=0;
    for(const M of months){
      const r=await writeRosterDates(+M, WB.year, WB.mm, WB.day, WB.groups[M]);
      W+=r.written.length; S+=r.skipped.length; NF+=r.notFound.length;
    }
    note.innerHTML=`✅ 기입 ${W} · 건너뜀 ${S} · 못찾음 ${NF}`;
    toast(`✅ ${W}명 기입 완료`);
    btn.textContent='완료됨';
  }catch(e){ console.error(e);
    note.innerHTML=`<span style="color:var(--red);white-space:pre-wrap">⚠ 기입 실패: ${e.message||e}</span>`;
    btn.disabled=false; btn.textContent='다시 시도';
  }
};

// ── 환불자 이동 (미리보기 → 실행): 학생명단 → 환불 시트, 원본 삭제 ──
let RF=null;
$R.getElementById('refundBtn').onclick=async()=>{
  const note=$R.getElementById('gsNote');
  const date=$R.getElementById('baseDate').value;
  if(!date){ toast('기준 날짜를 먼저 선택하세요'); return; }
  note.textContent='경영지원 환불자 + 학생명단 대조 중…';
  try{
    const ro=await fetchSheet('roster'); STATE.rosterData=parseRoster(ro.rows);
    const daily=await buildDailyFromSb(date);
    const refunders=daily.ref; // {sid,name,cohort,jang}
    const R=STATE.rosterData;
    const bySid={}; for(const st of R.students){ if(st.sid) bySid[st.sid]=st; }
    const [yy,mm,dd]=[+date.slice(0,4), +date.slice(5,7), +date.slice(8,10)];
    const rows=[]; const sids=[]; let move=0, nf=0;
    for(const p of refunders){
      const st=bySid[p.sid];
      if(!st){ rows.push({state:'nf', sid:p.sid, name:p.name, ban:'', cohort:p.cohort}); nf++; continue; }
      rows.push({state:'move', sid:p.sid, name:st.name||p.name, ban:st.ban, cohort:p.cohort}); sids.push(p.sid); move++;
    }
    RF={ year:yy, mm, day:dd, sids };
    const badge={move:'<span style="color:var(--red)">➡ 이동·삭제</span>', nf:'<span style="color:var(--muted)">⚠ 명단에 없음</span>'};
    $R.getElementById('wbTable').innerHTML=
      `<thead><tr><th>상태</th><th>수험번호</th><th>이름</th><th>반</th><th>퇴소일</th><th>내역</th></tr></thead><tbody>`+
      rows.map(r=>`<tr><td>${badge[r.state]}</td><td class="mono">${r.sid}</td><td>${r.name||''}</td><td>${r.ban||''}</td><td class="mono">${r.state==='move'?`${mm}/${dd}`:'—'}</td><td class="note">${r.cohort||''}</td></tr>`).join('')+
      `</tbody>`;
    $R.getElementById('wbSummary').innerHTML=`➡ 이동·삭제 ${move} · ⚠ 명단에 없음 ${nf}`;
    const applyBtn=$R.getElementById('wbApplyBtn');
    applyBtn.disabled = move===0;
    applyBtn.textContent = `환불 시트로 ${move}명 이동 + 학생명단에서 삭제`;
    applyBtn.dataset.mode='refund';
    $R.getElementById('wbApplyNote').innerHTML = nf>0
      ? `<span style="color:var(--red)">⚠ 명단에 없는 ${nf}명은 이동 안 함(이미 이동됐거나 수험번호 확인).</span>`
      : `<span style="color:var(--red)">⚠ 실행하면 학생명단에서 행이 삭제됩니다. 환불 시트로 옮긴 뒤 삭제해요.</span>`;
    $R.getElementById('wbPanel').style.display='block';
    note.textContent='';
    $R.getElementById('wbPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(e){ console.error(e);
    note.innerHTML=`<span style="color:var(--red)">⚠ 미리보기 실패: ${e.message||e}</span>`;
  }
};

// 경영지원(Supabase)에서 그날 일일명단 자동 로드
$R.getElementById('sbDailyBtn').onclick=async()=>{
  const note=$R.getElementById('gsNote');
  const date=$R.getElementById('baseDate').value;
  if(!date){ toast('기준 날짜를 먼저 선택하세요'); return; }
  note.textContent=`경영지원에서 ${date} 일일명단 불러오는 중…`;
  try{
    STATE.daily=await buildDailyFromSb(date);
    setLed('sb');
    note.innerHTML=`✅ ${date} 일일명단: 등록 ${STATE.daily.reg.length} · 환불 ${STATE.daily.ref.length} (신규 ${STATE.daily.reg.filter(r=>r.isNew).length}) 불러옴`
      + (STATE.daily.staleCount ? ` <span style="color:var(--muted)">· 지난 기수 납부 ${STATE.daily.staleCount}건 제외</span>` : '');
    toast('✅ 경영지원 일일명단 불러오기 완료');
    checkReady();
  }catch(e){
    console.error(e);
    note.innerHTML=`<span style="color:var(--red)">⚠ 일일명단 불러오기 실패: ${e.message||e}</span>`;
  }
};
// 구글시트(Apps Script)에서 마스터·접수현황 자동 로드
$R.getElementById('gsLoadBtn').onclick=async()=>{
  const note=$R.getElementById('gsNote');
  note.textContent='구글시트에서 불러오는 중…';
  if(_seasonNow()==='윈터'){
    // 윈터는 마스터가 없다. 접수대장이 명단이자 접수현황 소스.
    try{
      const j=await fetchSheet('winter');
      STATE.winterLedger=j.rows;
      setLed('master');
      note.innerHTML=`✅ 접수대장 ${j.sheet} ${j.count}행 불러옴`;
      toast('✅ 접수대장 불러오기 완료');
    }catch(e){
      console.error(e);
      note.innerHTML=`<span style="color:var(--red)">⚠ 접수대장 불러오기 실패: ${e.message||e}</span>`;
    }
    return;
  }
  try{
    const m=await fetchSheet('master');
    const r=await fetchSheet('receipt');
    STATE.master=parseMasterRows(m.rows);
    STATE.receipt=parseReceiptRows(r.rows);
    setLed('master');
    const bans=Object.keys(STATE.master.banCount||{}).join('·');
    const rn=Object.values(STATE.receipt.byJh).reduce((a,b)=>a+b.접수,0);
    note.innerHTML=`✅ 마스터 재원 ${STATE.master.total}명 (반 ${bans}) · 접수현황 전형 ${Object.keys(STATE.receipt.byJh).length}종/접수 ${rn}명 불러옴`;
    toast('✅ 구글시트 불러오기 완료');
    checkReady();
  }catch(e){
    console.error(e);
    note.innerHTML=`<span style="color:var(--red)">⚠ 불러오기 실패: ${e.message||e}</span> — 토큰/배포/시트 접근 권한을 확인하세요.`;
  }
};
$R.getElementById('baseDate').addEventListener('change',updateSplitTag);
// 시즌 전환은 입장 화면(게이트)에서만 — 작업 중 섞이는 것을 막는다.

/* ===================================================================
 * 9-1) 지난 등록 보기 — raw 로그(2026raw정규) CSV/엑셀에서 날짜별 재구성
 * =================================================================== */
let HIST={ byDate:{}, dates:[] };
const RAW_IDX={날짜:0,구분:1,전형:2,계열:3,반:4,편성:5,접수:6,접수계:7,등록:8,환불:9,합격:10,등록남:11,환불남:12,등록여:13,환불여:14,작성자:15,장학접수:16,장학등록:17,장학환불:18,편입:19,반수:20};
function normDate(v){
  if(v==null||v==='') return '';
  if(v instanceof Date) return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;
  // 엑셀 시리얼 날짜 숫자 (예: 46189.0006 → 2026-06-16)
  const nv=(typeof v==='number')?v:(/^\d+(\.\d+)?$/.test(String(v).trim())?parseFloat(v):NaN);
  if(!isNaN(nv) && nv>30000 && nv<80000){
    const d=new Date(Math.round((nv-25569)*86400000));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  }
  let s=String(v).trim();
  // "2026. 6. 16" / "2026-06-16" / "2026/6/16"
  const m=s.match(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/);
  if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  return s;
}
const numOr0=v=>{ const n=parseInt(v); return isNaN(n)?0:n; };
// 윈터 raw 업로드 — 등록대장 raw 탭은 열 구성이 정규와 다르다.
// (날짜/구분/학년/계열/반/전일등록/접수/접수 계/등록/환불/완납계/등록-남/환불-남/등록-여/환불-여/작성자)
// 위치로 읽으면 값이 엉뚱한 칸으로 들어가므로 반드시 헤더 이름으로 매핑한다.
function parseWinterRawLog(rows){
  // 헤더 이름으로만 읽는다. 위치 추측 금지 — 시트 열이 바뀌어도 안전하다.
  let h=rows.findIndex(r=>r&&r.some(c=>String(c).trim()==='날짜')&&r.some(c=>String(c).trim()==='구분'));
  if(h<0) h=0;
  const hdr=(rows[h]||[]).map(x=>String(x==null?'':x).replace(/\s/g,''));
  const ix=n=>hdr.indexOf(String(n).replace(/\s/g,''));
  const need=['날짜','구분','학년','등록-남','환불-남','등록-여','환불-여'];
  const miss=need.filter(n=>ix(n)<0);
  if(miss.length) throw new Error('윈터 raw 열 없음: '+miss.join(', '));
  const num=v=>{ const n=parseInt(String(v==null?'':v).replace(/,/g,'')); return isNaN(n)?0:n; };
  const get=(r,n)=>{ const i=ix(n); return i<0?'':r[i]; };

  // 1) 행 수집
  const items=[];
  for(let i=h+1;i<rows.length;i++){
    const r=rows[i]; if(!r) continue;
    const date=normDate(get(r,'날짜'));
    const gubun=String(get(r,'구분')||'').trim();
    const course=String(get(r,'학년')||'').trim();
    if(!date||!gubun||!course) continue;
    items.push({ date, gubun, course,
      계열:String(get(r,'계열')||'-'), 반:String(get(r,'반')||''),
      접수:num(get(r,'접수')), 접수계:num(get(r,'접수 계')),
      regM:num(get(r,'등록-남')), refM:Math.abs(num(get(r,'환불-남'))),
      regF:num(get(r,'등록-여')), refF:Math.abs(num(get(r,'환불-여'))),
      완납계:num(get(r,'완납계')),
      writer:String(get(r,'작성자')||'') });
  }
  items.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);

  // 2) 과정별 누적 — 일별 완납은 시트에 없으므로 완납계 차분으로 복원한다
  const acc={};
  const byDate={};
  for(const it of items){
    const a=acc[it.course] || (acc[it.course]={m:0,f:0,jub:0,full:0});
    a.m += it.regM - it.refM;
    a.f += it.regF - it.refF;
    a.jub = it.접수계 || (a.jub + it.접수);
    const fullCum = it.완납계 || a.full;          // 빈칸이면 직전 누적 유지
    const fullDay = Math.max(0, fullCum - a.full);
    a.full = fullCum;
    const row=[ it.date, it.gubun, it.course, it.계열, it.반,
                it.접수, a.jub,
                it.regM, it.refM?-it.refM:0,
                it.regF, it.refF?-it.refF:0,
                fullDay, a.full,
                a.m + a.f, a.m, a.f, it.writer ];
    if(!byDate[it.date]) byDate[it.date]={rows:[], writer:it.writer};
    byDate[it.date].rows.push(row);
  }
  return byDate;
}

function parseRawLog(rows){
  // 헤더 행 찾기
  let h=rows.findIndex(r=>r&&r.some(c=>String(c).trim()==='날짜')&&r.some(c=>String(c).trim()==='구분'));
  if(h<0) h=0;
  const byDate={};
  for(let i=h+1;i<rows.length;i++){
    const r=rows[i]; if(!r) continue;
    const date=normDate(r[RAW_IDX.날짜]); const gubun=r[RAW_IDX.구분];
    if(!date||!gubun) continue;
    if(!byDate[date]) byDate[date]={rows:[], writer:r[RAW_IDX.작성자]||''};
    byDate[date].rows.push(r);
  }
  return byDate;
}
// raw 행들 → STATE.result 형태로 재구성
function buildResultFromRaw(date, rowsForDate, prevBan){
  const banSet=[];
  const perBan={};
  const ensure=ban=>{ if(!perBan[ban]){ perBan[ban]={편성:0,신규:0,신규남:0,신규여:0,퇴소:0,퇴소남:0,퇴소여:0,재등록:0,재등록남:0,재등록여:0,재등록환불:0,편입:0,반수:0,장학등록:0,장학환불:0}; banSet.push(ban);} return perBan[ban]; };
  const perJh={}; let writer='';
  for(const r of rowsForDate){
    const g=r[RAW_IDX.구분]; writer=writer||r[RAW_IDX.작성자]||'';
    if(g==='개강후'){
      // 편성현황 축: raw 등록=신규(일일), 환불=퇴소(일일), 성별
      const ban=r[RAW_IDX.반]; if(!ban) continue; const b=ensure(ban);
      b.편성=numOr0(r[RAW_IDX.편성]);
      b.신규=numOr0(r[RAW_IDX.등록]); b.퇴소=Math.abs(numOr0(r[RAW_IDX.환불]));
      b.신규남=numOr0(r[RAW_IDX.등록남]); b.퇴소남=Math.abs(numOr0(r[RAW_IDX.환불남]));
      b.신규여=numOr0(r[RAW_IDX.등록여]); b.퇴소여=Math.abs(numOr0(r[RAW_IDX.환불여]));
    } else if(/^\d{1,2}월$/.test(String(g).trim())||String(g).includes('재등록')){
      const ban=r[RAW_IDX.반]; if(!ban) continue; const b=ensure(ban);
      b.재등록=numOr0(r[RAW_IDX.등록]); b.재등록환불=Math.abs(numOr0(r[RAW_IDX.환불]));
    } else if(g==='편입'||g==='편입(포함)'){
      const ban=r[RAW_IDX.반]; if(!ban) continue; ensure(ban).편입=numOr0(r[RAW_IDX.편입])||numOr0(r[RAW_IDX.등록]);
    } else if(g==='반수'){
      const ban=r[RAW_IDX.반]; if(!ban) continue; ensure(ban).반수=numOr0(r[RAW_IDX.반수])||numOr0(r[RAW_IDX.등록]);
    } else if(g==='개강전'){
      const jh=r[RAW_IDX.전형]; if(!jh) continue;
      perJh[jh]={접수:numOr0(r[RAW_IDX.접수계])||numOr0(r[RAW_IDX.접수]), 합격:numOr0(r[RAW_IDX.합격])||''};
    }
  }
  const banList=banSet.filter(b=>b!=='미배정');
  const reg=banSet.reduce((a,b)=>a+(perBan[b].재등록||0),0);
  const ref=banSet.reduce((a,b)=>a+(perBan[b].퇴소||0),0);
  const newc=banSet.reduce((a,b)=>a+(perBan[b].신규||0),0);
  return { base:date, writer, season:'정규', banList, jhList:Object.keys(perJh),
           perBan, perJh, totalRoster:0, reg, ref, newc, warnings:[],
           _historical:true, _prevBan: prevBan||null };
}
// 선택일까지 누적 반영한 결과 (편성계·등록계·미납)
function buildCumulativeResult(date){
  const day=buildResultFromRaw(date, HIST.byDate[date].rows, null);
  const dates=HIST.dates.filter(d=>d<=date);
  // 재등록은 매달 새로 받으므로 누적하면 안 됨. raw의 구분('5월' 등)이 바뀌면 리셋.
  // 안내가 전월 중순에 시작되므로 날짜가 아니라 '구분' 값이 기준.
  const monOf=rows=>{ for(const r of rows){ const g=String(r[RAW_IDX.구분]||'').trim();
    if(/^\d{1,2}월$/.test(g)) return g; } return null; };
  let cumReg={}, curMon=null;
  for(const d of dates){
    const rows=HIST.byDate[d].rows;
    const m=monOf(rows);
    if(m && m!==curMon){ cumReg={}; curMon=m; }   // 대상 월이 바뀌면 초기화
    const r=buildResultFromRaw(d, rows, null);
    for(const ban in r.perBan){
      cumReg[ban]=(cumReg[ban]||0)+(r.perBan[ban].재등록||0)-(r.perBan[ban].재등록환불||0);
    }
  }
  day.regMonth=curMon;
  for(const ban in day.perBan){
    const b=day.perBan[ban];
    b.전일편성=b.편성||0;
    b.편성계=(b.편성||0)+(b.신규||0)-(b.퇴소||0);   // raw 편성은 전일편성(누적 carried)
    b.등록계=cumReg[ban]||0;                          // 재등록 누적
    b.전일등록=b.등록계-(b.재등록||0)+(b.재등록환불||0);
    b.미납=b.편성계-b.등록계;
  }
  day._cumulative=true;
  // 원장님 보고용: 선택일 '이전'까지 누적 (재등록 − 퇴소)
  let repPrev=0;
  for(const d of HIST.dates.filter(x=>x<date)){
    const r=buildResultFromRaw(d, HIST.byDate[d].rows, null);
    for(const ban in r.perBan){ repPrev += (r.perBan[ban].신규||0) - (r.perBan[ban].퇴소||0); }
  }
  day._reportPrev=repPrev;
  return day;
}
// 지난 등록 보기 — 탭 내부 자체 렌더 (두 축 표 + 대조)
// 윈터 지난 등록 보기 — 정규와 같은 방식. 선택일까지 일별 증감을 처음부터 누적한다.
function buildWinterHist(date){
  const out={}; WIN_COURSES.forEach(c=>out[c]={course:c,jubsu:0,regM:0,refM:0,regF:0,refF:0,full:0,
    dJubsu:0,dRegM:0,dRefM:0,dRegF:0,dRefF:0,dFull:0});
  const n=v=>parseInt(v)||0;
  for(const d of HIST.dates.filter(x=>x<=date)){
    const rows=(HIST.byDate[d]&&HIST.byDate[d].rows)||[];
    for(const r of rows){
      if(!Array.isArray(r)) continue;
      const c=winCourseOf(r);
      const b=out[c]; if(!b) continue;
      const jb=n(winGet(r,'접수')), rm=n(winGet(r,'등록-남')), fm=Math.abs(n(winGet(r,'환불-남')));
      const rf=n(winGet(r,'등록-여')), ff=Math.abs(n(winGet(r,'환불-여'))), fl=n(winGet(r,'완납'));
      b.jubsu+=jb; b.regM+=rm; b.refM+=fm; b.regF+=rf; b.refF+=ff; b.full+=fl;
      if(d===date){ b.dJubsu=jb; b.dRegM=rm; b.dRefM=fm; b.dRegF=rf; b.dRefF=ff; b.dFull=fl; }
    }
  }
  WIN_COURSES.forEach(c=>{ const b=out[c];
    b.등록인원=b.regM+b.regF-b.refM-b.refF; b.누적남=b.regM-b.refM; b.누적여=b.regF-b.refF; });
  return { date, rows:WIN_COURSES.map(c=>out[c]) };
}
function renderWinterHist(H){
  const T={jubsu:0,full:0,등록인원:0,누적남:0,누적여:0,dRegM:0,dRefM:0,dRegF:0,dRefF:0,dJubsu:0,dFull:0};
  H.rows.forEach(b=>{ for(const k in T) T[k]+=(b[k]||0); });
  const dReg=T.dRegM+T.dRegF, dRef=T.dRefM+T.dRefF;
  const cell=v=>`<td class="mono">${v||''}</td>`;
  const gcell=v=>`<td class="mono grp">${v||''}</td>`;
  const tr=H.rows.map(b=>`<tr><td><b>${b.course}</b></td>
    ${gcell(b.jubsu)}${gcell(b.dRegM+b.dRegF)}
    <td class="mono ${(b.dRefM+b.dRefF)?'neg':''}">${(b.dRefM+b.dRefF)?-(b.dRefM+b.dRefF):''}</td>
    ${gcell(b.dRegM)}<td class="mono ${b.dRefM?'neg':''}">${b.dRefM?-b.dRefM:''}</td>
    ${cell(b.dRegF)}<td class="mono ${b.dRefF?'neg':''}">${b.dRefF?-b.dRefF:''}</td>
    ${gcell(b.full)}<td class="mono"><b>${b.등록인원}</b></td>
    <td class="mono">${b.누적남}/${b.누적여}</td></tr>`).join('');
  const st=(cls,v,l)=>`<div class="stat ${cls}"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  $R.getElementById('histBody').innerHTML=`
    <div class="card">
      <h3><span class="pin"></span> ${H.date} 현황 <span class="tag pre">윈터 · 누적</span></h3>
      <div class="desc">선택일까지 누적 반영 · 큰 숫자는 그날 증감입니다.</div>
      <div class="stats" style="margin:14px 0 18px">
        ${st('g',dReg,'그날 등록')}${st('r',dRef,'그날 환불')}
        ${st('t',T.등록인원,'등록인원(누적)')}${st('y',T.jubsu,'접수 계(누적)')}
        ${st('',T.full,'완납 계(누적)')}
      </div>
      <div class="tablewrap"><table class="tbl winTbl"><thead>
        <tr class="grphead"><th></th><th class="grp">접수</th>
          <th class="grp" colspan="2">당일 증감</th>
          <th class="grp" colspan="4">성별</th>
          <th class="grp" colspan="3">누적</th></tr>
        <tr>
        <th>과정</th><th class="grp">접수 계</th><th class="grp">금일등록</th><th>금일환불</th>
        <th class="grp">남자 등록</th><th>남자 환불</th><th>여자 등록</th><th>여자 환불</th>
        <th class="grp">완납계</th><th>등록인원</th><th>남/여</th>
      </tr></thead><tbody>${tr}
        <tr class="sum"><td><b>소계</b></td>${gcell(T.jubsu)}<td class="mono grp"><b>${dReg}</b></td>
          <td class="mono ${dRef?'neg':''}"><b>${dRef?-dRef:0}</b></td>
          <td class="mono grp"><b>${T.dRegM}</b></td><td class="mono ${T.dRefM?'neg':''}"><b>${T.dRefM?-T.dRefM:0}</b></td>
          <td class="mono"><b>${T.dRegF}</b></td><td class="mono ${T.dRefF?'neg':''}"><b>${T.dRefF?-T.dRefF:0}</b></td>
          ${gcell(T.full)}<td class="mono"><b>${T.등록인원}</b></td>
          <td class="mono">${T.누적남}/${T.누적여}</td></tr>
      </tbody></table></div>
    </div>`;
}
function renderHist(R){
  const banAll=[...R.banList,'미배정'];
  const sum=f=>banAll.reduce((a,b)=>a+((R.perBan[b]&&R.perBan[b][f])||0),0);
  const cell=v=>`<td class="mono">${v||''}</td>`, neg=v=>`<td class="mono">${v?'-'+v:''}</td>`;
  // 표1 편성현황
  let t1=banAll.map(ban=>{const b=R.perBan[ban];if(!b)return'';return `<tr><td>${ban}</td>
    <td class="mono">${b.전일편성}</td>${cell(b.신규)}${neg(b.퇴소)}<td class="mono"><b>${b.편성계}</b></td>
    ${cell(b.신규남)}${neg(b.퇴소남)}${cell(b.신규여)}${neg(b.퇴소여)}</tr>`;}).join('');
  t1+=`<tr class="tot"><td>소계</td><td class="mono">${sum('전일편성')}</td><td class="mono">${sum('신규')}</td><td class="mono">${sum('퇴소')?'-'+sum('퇴소'):'0'}</td><td class="mono"><b>${sum('편성계')}</b></td><td class="mono">${sum('신규남')}</td><td class="mono">${sum('퇴소남')?'-'+sum('퇴소남'):'0'}</td><td class="mono">${sum('신규여')}</td><td class="mono">${sum('퇴소여')?'-'+sum('퇴소여'):'0'}</td></tr>`;
  // 표2 재등록
  let t2=banAll.map(ban=>{const b=R.perBan[ban];if(!b)return'';return `<tr><td>${ban}</td>
    <td class="mono">${b.전일등록}</td>${cell(b.재등록)}${neg(b.재등록환불)}<td class="mono"><b>${b.등록계}</b></td>
    ${cell(b.재등록남)}${cell(b.재등록여)}<td class="mono ${b.미납>0?'neg':''}"><b>${b.미납}</b></td></tr>`;}).join('');
  t2+=`<tr class="tot"><td>소계</td><td class="mono">${sum('전일등록')}</td><td class="mono">${sum('재등록')}</td><td class="mono">${sum('재등록환불')?'-'+sum('재등록환불'):'0'}</td><td class="mono"><b>${sum('등록계')}</b></td><td class="mono">${sum('재등록남')}</td><td class="mono">${sum('재등록여')}</td><td class="mono"><b>${sum('미납')}</b></td></tr>`;

  $R.getElementById('histBody').innerHTML=`
    <div class="card">
      <h3><span class="pin"></span> ${R.base} 현황 <span class="tag" style="background:var(--peri-soft);color:var(--peri-ink)">과거 · 누적</span></h3>
      <div class="desc">작성자 ${R.writer||'-'} · 선택일까지 누적 반영 · 편입 ${sum('편입')} · 반수 ${sum('반수')}</div>
      <div class="stats">
        ${tile('g',sum('신규'),`그날 신규 (남${sum('신규남')}/여${sum('신규여')})`)}
        ${tile('r',sum('퇴소'),`그날 퇴소 (남${sum('퇴소남')}/여${sum('퇴소여')})`)}
        ${tile('t',sum('편성계'),'편성계(누적)')}
        ${tile('y',sum('등록계'),'등록계(누적)')}
        ${tile('',sum('미납')<0?0:sum('미납'),'미납(미등록)')}
      </div>
      <div class="note" style="font-weight:700;color:var(--ink);margin:14px 0 6px">① 편성현황 (신규 − 퇴소)</div>
      <div class="tablewrap"><table><thead><tr><th>반</th><th>전일편성</th><th>신규</th><th>퇴소</th><th>편성계</th><th>신규-남</th><th>퇴소-남</th><th>신규-여</th><th>퇴소-여</th></tr></thead><tbody>${t1}</tbody></table></div>
      <div class="note" style="font-weight:700;color:var(--ink);margin:18px 0 6px">② 재등록 (등록 − 미등록)</div>
      <div class="tablewrap"><table><thead><tr><th>반</th><th>전일등록</th><th>재등록</th><th>환불</th><th>등록계</th><th>재등록-남</th><th>재등록-여</th><th>미납</th></tr></thead><tbody>${t2}</tbody></table></div>
    </div>
    <div class="card">
      <h3 style="justify-content:space-between"><span><span class="pin"></span> 경영지원 현황 대조</span><button class="btn" id="histVerifyBtn">불러와 대조</button></h3>
      <div class="desc">완료된 과거 작업이라 경영지원과 맞아야 해요. 등록계(누적) 기준으로 비교합니다.</div>
      <div id="histVerifyBox"><div class="note">‘불러와 대조’를 누르면 그날 경영지원 값과 비교합니다.</div></div>
    </div>`;
  const hv=$R.getElementById('histVerifyBtn');
  if(hv) hv.onclick=()=>verifyInto(R, $R.getElementById('histVerifyBox'));
}
// 업로드 핸들러
(function wireHist(){
  const input=$R.getElementById('fileHist');
  const name=$R.getElementById('nameHist');
  const drop=$R.getElementById('dropHist');
  const sel=$R.getElementById('histDate');
  const btn=$R.getElementById('histViewBtn');
  async function handle(file){
    if(!file) return; name.textContent=file.name; drop.classList.add('ok');
    try{
      let rows;
      if(/\.csv$/i.test(file.name)){
        const text=await file.text();
        const wb=XLSX.read(text,{type:'string'});
        rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:true});
      } else {
        const buf=await file.arrayBuffer();
        const wb=XLSX.read(buf,{type:'array',cellDates:true});
        // 2026raw정규 시트 우선
        const sn=wb.SheetNames.find(n=>n.includes('raw정규'))||wb.SheetNames[0];
        rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:'',raw:false,cellDates:true});
      }
      HIST.byDate = _seasonNow()==='윈터' ? parseWinterRawLog(rows) : parseRawLog(rows);
      HIST.dates=Object.keys(HIST.byDate).sort();
      if(!HIST.dates.length){ toast('raw 로그에서 날짜를 못 찾았어요'); return; }
      refreshHistUI();
      // Firebase 누적 로그에 저장 (이후엔 업로드 없이 자동 복원)
      if(fbReady){
        const ok=confirm(`최초 raw 로그 ${HIST.dates.length}일치를 팀 공유(Firebase)에 저장할까요?\n이후엔 매일 ‘현황 저장’만 누르면 자동 누적되고, 다시 올릴 필요 없어요.`);
        if(ok){
          const hn2=$R.getElementById('histNote2'); if(hn2) hn2.textContent='Firebase에 저장 중…';
          const done=await importRawlogToFirebase(HIST.byDate);
          if(done){ toast(`✅ 누적 로그 ${HIST.dates.length}일치 저장됨(공유)`); refreshHistUI(); }
        }
      } else {
        toast('⚠ Firebase 미연결 — 이번 세션에서만 보기 가능');
      }
    }catch(e){ console.error(e); toast('raw 로그 읽기 실패'); drop.classList.remove('ok'); }
  }
  input.addEventListener('change',e=>handle(e.target.files[0]));
  ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag');}));
  drop.addEventListener('drop',e=>{ if(e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); });
  btn.onclick=()=>{
    const d=sel.value; if(!d||!HIST.byDate[d]) return;
    if(_seasonNow()==='윈터'){ renderWinterHist(buildWinterHist(d)); }
    else { renderHist(buildCumulativeResult(d)); }
    $R.getElementById('histList').style.display='none';
    $R.getElementById('histView').style.display='block';
  };
  const back=$R.getElementById('histBack');
  if(back) back.onclick=()=>{
    $R.getElementById('histView').style.display='none';
    $R.getElementById('histList').style.display='block';
  };
})();

/* ===================================================================
 * 10) 부트
 * =================================================================== */
(async function(){
  await initFirebase();
  // 설정·누적 로그는 시즌이 정해진 뒤(enterSeason) 읽는다 — 시즌별 네임스페이스라서.
  const _hr=$R.getElementById('histReloadBtn');
  if(_hr) _hr.onclick=async()=>{ _hr.disabled=true; _hr.textContent='불러오는 중…';
    try{ await loadRawlogAll(true); toast('✅ 전체 새로고침 완료'); }
    finally{ _hr.disabled=false; _hr.textContent='전체 새로고침'; } };
  setSeason(SEASON);
  updateSplitTag();
  // 이미 이번 세션에 들어왔다면 로그인은 건너뛰고 시즌 선택부터
  // QSA: 로그인은 QSA 가 담당. 실무 권한으로 시즌 선택부터 시작
  setRole('staff'); sessionStorage.setItem(LK('in'),'1'); showSeasonStep();
  const _qi=$R.getElementById('qsaImportBtn'); if(_qi) _qi.onclick=()=>__QSA.gotoImport();
})();

}
