/* test.js - the WHOLE Test tab in one file: its styles, its page and its code.
   Loaded by app.js ONLY when you press the Test tab (or when a scheduled automation is due), never on a normal page load.
   To change the Test tab, change this file only (the service worker always fetches it fresh). Server part: functions/api/automate.js. */
(() => {
  if (window.__TestTab) return;

  /* ---------- styles ---------- */
  const CSS = String.raw`
    /* ── TEST TAB = the "Automate" dashboard (whiteboard layout). One fixed page: it never scrolls, it fills the screen. ──
       Change the colours / the page margin here:  --g green (lines, fills), --k text black, --r red (only for a failed step), --pad-x / --pad-y margin to the screen edge. */
    body.test-mode, html:has(body.test-mode) { overflow: hidden; }
    body.test-mode .talk-ai-widget { display: none; }
    body.test-mode #daysGrid .day-cell { pointer-events: none; opacity: .4; }
    .au, .au-modal {
      --g: #2fa08e; --line: #c9c9d1; --glow: rgba(0,0,0,.28); --r: #d23b2c; --k: #111; --bg: #f4f4f6; --card: #fff; --box: #fff; --btn: #111; --btnt: #fff; --alt: #e9e9ee; --altt: #111; --soft: #f0f0f3; --mut: #5f5f66; --sh: rgba(0,0,0,.10); --pad-x: 3.2vw; --pad-y: 3vh;
      font: 600 clamp(13px, min(1.05vw, 2.05vh), 30px)/1.25 -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      color: var(--k); box-sizing: border-box;
    }
    .au *, .au-modal * { box-sizing: border-box; }
    .au { position: fixed; z-index: 1500; top: 52px; left: 0; right: 0; bottom: 0; padding: var(--pad-y) var(--pad-x); display: flex; flex-direction: column; overflow: hidden; overscroll-behavior: none;
      background: radial-gradient(60% 55% at 10% 6%, var(--card) 0%, transparent 70%), radial-gradient(55% 60% at 94% 94%, var(--card) 0%, transparent 70%), var(--bg);
      background-size: 150% 150%; animation: auBg 18s ease-in-out infinite alternate, auFade .35s ease both; }
    body.night-mode .au, body.night-mode .au-modal { --g: #3dbba8; --line: #3a3a3e; --glow: rgba(255,255,255,.3); --k: #f5f5f5; --bg: #0e0e10; --card: #1c1c1e; --box: #232325; --btn: #f5f5f5; --btnt: #111; --alt: #2c2c2e; --altt: #f5f5f5; --soft: #2a2a2d; --mut: #a0a0a5; --sh: rgba(0,0,0,.5); --r: #ff6b5c; }
    .au[hidden], .au-modal[hidden] { display: none; }
    @keyframes auBg { from { background-position: 0% 0%; } to { background-position: 100% 100%; } }
    @keyframes auFade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes auUp { from { opacity: 0; transform: translateY(1.1em) scale(.985); } to { opacity: 1; transform: none; } }
    @keyframes auPop { 0% { transform: scale(.4); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
    @keyframes auFlash { 0% { box-shadow: 0 0 0 0 var(--glow); background-color: var(--soft); } 100% { box-shadow: 0 0 0 1em transparent; background-color: var(--box); } }
    @keyframes auSpin { to { transform: rotate(360deg); } }
    @keyframes auWob { 0%, 100% { translate: 0 0; } 25% { translate: .06em -.05em; } 75% { translate: -.05em .06em; } }
    @keyframes auSlide { from { transform: translateX(-100%); } to { transform: translateX(260%); } }
    @keyframes auNudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(.35em); } }
    @keyframes auPulse { 0%, 100% { box-shadow: 0 0 0 0 var(--glow); } 50% { box-shadow: 0 0 0 .5em transparent; } }
    @keyframes auGlow { 0%, 100% { box-shadow: 0 1.2em 3em var(--sh), 0 0 0 0 transparent; } 50% { box-shadow: 0 1.2em 3em var(--sh), 0 0 1.6em .2em var(--glow); } }
    @keyframes auShine { from { transform: translateX(-120%) skewX(-20deg); } to { transform: translateX(260%) skewX(-20deg); } }
    @keyframes auModal { from { opacity: 0; transform: translateY(1.5em) scale(.94); } to { opacity: 1; transform: none; } }
    @keyframes auBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-.15em); } }
    .au *, .au-modal * { }
    :where(.au, .au-modal) button { font: inherit; color: var(--k); cursor: pointer; -webkit-tap-highlight-color: transparent; }

    /* every clickable thing is a real button, in the site's own look: black with white text; ".alt" = grey with black text. Lifts on hover, squeezes when pressed */
    .au-b { position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; gap: .4em; border: 0; border-radius: .8em; padding: .28em .9em; background: var(--btn); color: var(--btnt); font-weight: 700; line-height: 1.15; white-space: nowrap; box-shadow: 0 .12em .3em var(--sh); transition: transform .1s ease-out, box-shadow .1s, opacity .2s, background .1s; }
    .au-b::after { content: ''; position: absolute; top: 0; bottom: 0; width: 40%; left: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent); transform: translateX(-120%) skewX(-20deg); pointer-events: none; }
    .au-b:hover:not([disabled]) { transform: translateY(-.14em); box-shadow: 0 .35em .7em var(--sh); }
    .au-b:hover:not([disabled])::after { animation: auShine .7s .12s ease; }
    .au-b:active:not([disabled]) { transform: translateY(.05em) scale(.95); box-shadow: none; }
    .au-b:focus-visible { outline: .16em solid var(--line); outline-offset: .12em; }
    .au-b[disabled] { opacity: .5; cursor: default; }
    .au-b.alt, .au-modal .au-b:not(.pri):not(.sel) { background: var(--alt); color: var(--altt); }
    .au-b.sm { font-size: .82em; padding: .2em .7em; border-radius: .7em; }
    .au-b.dirty { animation: auPulse 1.1s ease-in-out infinite; }
    .au-b.bad { outline: .13em solid var(--r); }
    .au-b svg { width: 1.05em; height: 1.05em; flex: none; }

    /* top: [check] Automate  then  o Scan -> o Delete words -> o Run Agent -> o Paste into calendar */
    .au-head { display: flex; align-items: center; gap: 1.4em; position: relative; z-index: 2; margin-bottom: .9em; padding: 0 .3em; flex: none; }
    .au-tabwrap { display: inline-flex; align-items: center; gap: .6em; flex: none; }
    .au-tab { display: inline-flex; align-items: center; justify-content: center; gap: .5em; border: 0; border-radius: .9em; background: var(--btn); color: var(--btnt); font-size: 1.5em; font-weight: 800; line-height: 1.1; padding: .3em 1em; box-shadow: 0 .15em .5em var(--sh); position: relative; overflow: hidden; transition: transform .2s cubic-bezier(.3,1.6,.5,1), box-shadow .2s; }
    .au-tab:hover:not([disabled]) { transform: translateY(-.1em) scale(1.04); box-shadow: 0 .4em .9em var(--sh); }
    .au-tab:active:not([disabled]) { transform: scale(.94); }
    .au-tab[disabled] { cursor: default; }
    .au-tab .au-spin { color: var(--btnt); }
    .au-steps { display: flex; align-items: center; gap: .5em; font-size: 1.35em; font-weight: 800; flex-wrap: nowrap; }
    .au-step { display: inline-flex; align-items: center; gap: .4em; white-space: nowrap; padding: .12em .5em .12em .3em; border-radius: 1em; transition: background .25s, transform .25s; }
    .au.enter .au-step:nth-child(1) { animation-delay: .12s; } .au.enter .au-step:nth-child(3) { animation-delay: .2s; } .au.enter .au-step:nth-child(5) { animation-delay: .28s; } .au.enter .au-step:nth-child(7) { animation-delay: .36s; }
    .au-step b { font-weight: 800; color: var(--k); }
    .au-step[data-st=run] { background: var(--alt); transform: translateY(-.08em); }
    .au-step[data-st=bad] { background: rgba(210,59,44,.14); }
    .au-step[data-st=bad] b { color: var(--r); }
    .au-step[data-st=skip] b { color: #7a8a87; text-decoration: line-through; }
    .au-arr { display: inline-flex; align-items: center; width: 1.7em; color: var(--k); opacity: .85; }
    .au-arr svg { width: 100%; height: .8em; display: block; }
    .au-head.working .au-arr { animation: auNudge .9s ease-in-out infinite; }
    .au-head.working .au-arr:nth-of-type(2) { animation-delay: .15s; } .au-head.working .au-arr:nth-of-type(3) { animation-delay: .3s; }
    .au-dot { flex: none; width: 1.15em; height: 1.15em; border: .13em solid var(--k); border-radius: 50%; color: var(--k); background: var(--card); display: inline-flex; align-items: center; justify-content: center; font-size: .72em; line-height: 1; font-weight: 900; }
    .au-step[data-st=ok] .au-dot { background: var(--btn); color: var(--btnt); animation: auPop .45s both; }
    .au-step[data-st=bad] .au-dot { border-color: var(--r); background: var(--r); color: #fff; animation: auPop .45s both; }
    .au-step[data-st=run] .au-dot { animation: auPulse 1s ease-in-out infinite; }
    .au-step[data-st=skip] .au-dot { border-color: #b5c4c1; color: #b5c4c1; }
    .au-dot svg { width: 100%; height: 100%; }
    .au-bar { position: absolute; left: 0; right: 0; bottom: 0; height: .2em; overflow: hidden; opacity: 0; transition: opacity .3s; z-index: 3; }
    .au.working .au-bar { opacity: 1; }
    .au-bar i { display: block; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, var(--k), transparent); animation: auSlide 1.2s linear infinite; }

    /* the big frame */
    .au-frame { flex: 1; min-height: 0; border: .17em solid var(--g); border-radius: 1.7em; display: grid; grid-template-columns: 54fr 46fr; column-gap: 2.4%; padding: 1.5em 1.8em 1.2em 1.9em; position: relative; z-index: 1;
      background: var(--card); box-shadow: 0 1.2em 3em var(--sh); }
    .au.working .au-frame { animation: auGlow 1.8s ease-in-out infinite; }
    /* left column = ONE grid, so every row uses the same columns: [check] [text] [button] [button] [button] */
    .au-left { display: grid; grid-template-columns: 1.35em 11em 16em auto auto minmax(0, 1fr); grid-template-rows: repeat(5, auto) minmax(0, 1fr) auto auto; column-gap: .55em; row-gap: .75em; align-items: center; min-height: 0; min-width: 0; align-content: start; }
    .au-left > .au-r { display: grid; grid-template-columns: subgrid; grid-column: 1 / -1; align-items: center; min-width: 0; }
    .au-left > .au-r > * { min-width: 0; justify-self: start; }
    .au-left .lb { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; font-size: 1.1em; font-weight: 800; margin-right: .9em; }
    .au-left .vl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; font-size: 1.05em; font-weight: 600; }
    .au-left .grp { display: inline-flex; align-items: center; gap: .45em; font-weight: 800; overflow: visible; }
    .au-left .vl .au-hint { font-size: .8em; color: var(--mut); }
    .au-left .au-msgline { grid-column: 6; }
    .au-left .au-codebox { align-items: start; align-self: stretch; }
    .au-left .au-codebox > .au-ta { grid-column: 2 / -1; }
    .au-left .au-stat { align-self: end; }
    .au-right { display: grid; grid-template-rows: 1.25fr 1fr 1.3fr .5fr 1fr; row-gap: .6em; min-height: 0; min-width: 0; position: relative; }
    .au-right::before { content: ''; position: absolute; left: -1.25em; top: .2em; bottom: .2em; border-left: .13em dashed var(--glow); }
    .au.enter .au-head { animation: auUp .5s both; }
    .au.enter .au-step { animation: auUp .5s both; }
    .au.enter .au-frame { animation: auUp .55s .05s both; }
    .au.enter .au-left > *, .au.enter .au-right > * { animation: auUp .55s both; }
    .au.enter .au-left > :nth-child(1) { animation-delay: .1s; } .au.enter .au-left > :nth-child(2) { animation-delay: .16s; } .au.enter .au-left > :nth-child(3) { animation-delay: .22s; } .au.enter .au-left > :nth-child(4) { animation-delay: .28s; } .au.enter .au-left > :nth-child(5) { animation-delay: .34s; } .au.enter .au-left > :nth-child(6) { animation-delay: .4s; } .au.enter .au-left > :nth-child(7) { animation-delay: .46s; } .au.enter .au-left > :nth-child(8) { animation-delay: .52s; }
    .au.enter .au-right > :nth-child(1) { animation-delay: .14s; } .au.enter .au-right > :nth-child(2) { animation-delay: .22s; } .au.enter .au-right > :nth-child(3) { animation-delay: .3s; } .au.enter .au-right > :nth-child(4) { animation-delay: .38s; } .au.enter .au-right > :nth-child(5) { animation-delay: .46s; }

    /* round check marks (toggle) */
    .au-chk { flex: none; width: 1.35em; height: 1.35em; border: .15em solid var(--k); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--btnt); background: var(--card); position: relative; padding: 0; transition: background .2s, transform .2s cubic-bezier(.3,1.6,.5,1), box-shadow .2s; }
    button.au-chk:hover { transform: scale(1.15); box-shadow: 0 0 0 .3em var(--sh); }
    button.au-chk:active { transform: scale(.85); }
    .au-chk::after { content: ''; width: .55em; height: .3em; border-left: .17em solid currentColor; border-bottom: .17em solid currentColor; transform: translateY(-.08em) rotate(-45deg) scale(0); transition: transform .25s cubic-bezier(.3,1.8,.5,1); }
    .au-chk[aria-checked=true], .au-chk.ok { background: var(--btn); }
    .au-chk[aria-checked=true]::after, .au-chk.ok::after { transform: translateY(-.08em) rotate(-45deg) scale(1); }
    .au-chk.bad { border-color: var(--r); background: var(--r); color: #fff; }
    .au-chk.bad::after { content: '\00d7'; border: 0; transform: none; width: auto; height: auto; font-size: 1.15em; font-weight: 900; line-height: 1; }
    .au-chk.wait { color: var(--k); }
    .au-chk.wait::after { display: none; }
    .au-chk svg { width: 78%; height: 78%; }

    /* left rows */
    .au-row { display: flex; align-items: center; gap: .6em; flex-wrap: wrap; min-width: 0; }
    .au-lab { font-weight: 800; }
    .au-big { font-size: 1.12em; }
    .au-run { font-size: 1.12em; font-weight: 800; }
    .au-sel, .au-run input[type=time] { font: inherit; font-weight: 700; color: var(--altt); background: var(--alt); border: 0; border-radius: .8em; padding: .25em .7em; outline: none; cursor: pointer; box-shadow: 0 .12em .3em var(--sh); transition: transform .18s, box-shadow .18s; }
    .au-sel:hover, .au-run input[type=time]:hover { transform: translateY(-.1em); box-shadow: 0 .3em .6em var(--sh); }
    .au-sel { appearance: none; -webkit-appearance: none; text-align: center; }
    .au-run input[type=time] { width: 7.2em; color-scheme: light; }
    body.night-mode .au-run input[type=time] { color-scheme: dark; }
    .au-run input[type=time]::-webkit-calendar-picker-indicator { display: none; }
    .au-del { display: grid; grid-template-columns: 28% 1fr; align-items: center; column-gap: .4em; }
    .au-del > .au-lab { font-size: 1.12em; }
    .au-item { display: flex; align-items: center; gap: .55em; flex-wrap: wrap; }
    .au-item .nm { font-size: 1.08em; font-weight: 800; }
    .au-names { display: inline-block; max-width: 100%; }
    .au-allow { font-size: 1.12em; font-weight: 800; }
    .au-code { display: grid; grid-template-columns: 46% 1fr; column-gap: .6em; min-height: 0; align-items: start; }
    .au-code .au-side { display: flex; flex-direction: column; align-items: flex-start; gap: .55em; padding-top: .1em; font-size: 1.12em; }
    .au-code .au-lab { display: flex; gap: .55em; align-items: center; }
    .au-ta { width: 50ch; max-width: calc(100% - .6em); height: 19em; max-height: 100%; min-height: 0; resize: vertical; border: .17em solid var(--line); border-radius: 1.1em; background: var(--box); color: var(--k); font: 500 .82em/1.4 ui-monospace, Menlo, Consolas, monospace; padding: .7em .9em; outline: none; box-shadow: inset 0 .15em .6em var(--sh); transition: box-shadow .25s, border-color .25s; }
    .au-ta:focus { border-color: var(--k); box-shadow: 0 0 0 .3em var(--glow); }
    .au-stat .v { font-weight: 900; }
    .au-stat .v.bad { color: var(--r); }
    .au-msgline { font-size: .72em; font-weight: 700; min-height: 1.2em; }

    /* right side */
    .au-cap { font-size: 1.12em; font-weight: 800; line-height: 1.15; padding-top: .15em; }
    .au-cap small { display: block; font-size: .8em; font-weight: 700; margin-top: .15em; }
    .au-cap small b { font-weight: 900; }
    .au-line { display: grid; grid-template-columns: 24% 1fr; column-gap: .6em; min-height: 0; min-width: 0; align-items: stretch; }
    .au-box { border: .17em solid var(--line); border-radius: 1.1em; padding: .55em .8em; overflow: auto; min-height: 0; min-width: 0; font: 500 .8em/1.4 ui-monospace, Menlo, Consolas, monospace; color: var(--k); white-space: pre-wrap; word-break: break-word; margin: 0; cursor: zoom-in; background: var(--box); box-shadow: inset 0 .15em .6em var(--sh); scrollbar-width: thin; scrollbar-color: var(--line) transparent; transition: border-color .2s, transform .2s; }
    .au-box:hover { transform: translateY(-.1em); }
    .au-box.empty { color: var(--mut); font-style: italic; }
    .au-box.flash { animation: auFlash .9s ease-out; }
    .au-final { display: grid; grid-template-columns: minmax(0, 1fr) minmax(9.5em, 36%); grid-template-rows: auto minmax(0, 1fr); column-gap: .7em; min-height: 0; }
    .au-final > .au-cap { grid-column: 1 / -1; padding-top: 0; }
    .au-final .au-box { grid-column: 1; }
    .au-st { border-bottom: .14em dashed var(--line); padding-bottom: .3em; margin-bottom: .4em; font-weight: 800; }
    .au-btns { grid-column: 2; display: grid; grid-auto-rows: minmax(0, 1fr); gap: .4em; min-height: 0; }
    .au-btns .au-b { font-size: .98em; white-space: normal; text-align: center; line-height: 1.05; min-height: 0; padding: .1em .5em; }
    .au-btns .au-b .t { display: block; }
    .au-btns .au-b .sp { display: none; width: 1.5em; height: 1.5em; }
    .au-btns .au-b.run .t { display: none; } .au-btns .au-b.run .sp { display: inline-block; animation: auSpin 1.1s linear infinite, auWob 1.6s ease-in-out infinite; }
    .au-btns .au-b.dim { opacity: .4; }
    .au-spin { display: inline-block; width: 1.1em; height: 1.1em; animation: auSpin 1.1s linear infinite, auWob 1.6s ease-in-out infinite; }
    .au-spin[hidden] { display: none; }
    .au-spin svg, .au-btns .sp svg { width: 100%; height: 100%; display: block; }
    .au-strip { display: flex; gap: .6em; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; scroll-snap-type: x proximity; align-items: stretch; min-width: 0; padding: .25em .1em .35em; }
    .au-strip::-webkit-scrollbar { display: none; }
    .au-pg { flex: 0 0 31%; min-width: 0; padding: .2em .6em; flex-direction: column; align-items: flex-start; justify-content: center; text-align: left; scroll-snap-align: start; white-space: normal; animation: auUp .4s both; }
    .au-pg b { font-weight: 800; font-size: .78em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; max-width: 100%; }
    .au-pg small { font-size: .62em; font-weight: 700; }
    .au-nopages { font: italic 500 .8em ui-monospace, Menlo, Consolas, monospace; align-self: center; color: var(--mut); }

    /* pop-ups (viewer, list editor, page picker, account, agent) */
    .au-modal { position: fixed; inset: 0; z-index: 2147483000; background: rgba(0, 0, 0, .55); backdrop-filter: blur(3px); display: none; align-items: center; justify-content: center; padding: 4vh 3vw; }
    .au-modal.show { display: flex; animation: auFade .2s ease both; }
    .au-box2 { background: var(--card); border: .17em solid var(--line); border-radius: 1.5em; width: min(1200px, 100%); height: min(88vh, 900px); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 1.2em 3em rgba(0,0,0,.35); animation: auModal .35s cubic-bezier(.2,1.2,.4,1) both; }
    .au-box2.small { width: min(760px, 100%); height: auto; max-height: 88vh; }
    .au-mh { display: flex; gap: .7em; align-items: center; padding: .7em 1em; border-bottom: .12em solid var(--line); flex: none; background: var(--alt); }
    .au-mh b { flex: 1; font-size: 1.05em; font-weight: 800; word-break: break-all; }
    .au-mb { flex: 1; min-height: 0; overflow: auto; padding: .9em 1.1em; }
    pre.au-mb { margin: 0; white-space: pre-wrap; word-break: break-word; font: 500 .8em/1.45 ui-monospace, Menlo, Consolas, monospace; }
    .au-tabs { display: flex; gap: .5em; padding: .6em 1em 0; flex: none; }
    .au-tabs .au-b { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
    .au-tabs .au-b.sel { background: var(--btn); color: var(--btnt); }
    .au-tabs .au-b.del { margin-left: auto; align-self: center; border-radius: .8em; background: var(--btn); color: var(--btnt); }
    .au-two { display: grid; grid-template-columns: 38% 1fr; gap: 1em; height: 100%; min-height: 0; }
    .au-col { display: flex; flex-direction: column; gap: .5em; min-height: 0; min-width: 0; }
    .au-scroll { flex: 1; min-height: 0; overflow: auto; border: .12em solid var(--line); border-radius: .9em; padding: .3em; background: var(--box); }
    .au-li { display: flex; align-items: center; gap: .6em; padding: .3em .45em; border-radius: .6em; font-size: .92em; transition: background .15s, transform .15s; animation: auUp .3s both; }
    .au-li:hover { background: var(--soft); transform: translateX(.15em); }
    .au-li.sel { background: var(--alt); }
    .au-li .nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; background: none; text-align: left; border: 0; font-weight: 700; }
    .au-li .n { font-size: .85em; opacity: .7; }
    .au-li .x { padding: 0 .4em; font-size: 1.15em; border: 0; background: none; cursor: pointer; border-radius: .5em; transition: background .15s, transform .15s; }
    .au-li .x:hover { background: rgba(210,59,44,.18); color: var(--r); transform: scale(1.2); }
    .au-li small { display: block; font-weight: 600; word-break: break-all; font-size: .8em; opacity: .75; }
    .au-li input[type=checkbox] { width: 1.15em; height: 1.15em; accent-color: var(--k); flex: none; }
    .au-in, .au-modal textarea, .au-modal select { width: 100%; border: .13em solid var(--line); border-radius: .8em; padding: .4em .7em; font-size: .92em; font-weight: 600; line-height: 1.3; font-family: inherit; color: var(--k); background: var(--box); outline: none; transition: box-shadow .2s; }
    .au-in:focus, .au-modal textarea:focus { box-shadow: 0 0 0 .25em var(--glow); }
    .au-modal textarea { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: .82em; resize: vertical; }
    .au-hint { font-size: .78em; font-weight: 600; line-height: 1.35; }
    .au-msg { font-size: .85em; font-weight: 800; min-height: 1.2em; }
    .au-msg.bad { color: var(--r); }
    .au-fl { display: flex; gap: .5em; align-items: center; flex-wrap: wrap; }
    .au-form { display: grid; gap: .55em; max-width: 36em; }
    .au-form label { display: grid; gap: .15em; font-size: .85em; font-weight: 800; }

    @media (max-width: 900px) {
      .au { overflow: auto; --pad-x: 3vw; }
      .au-head { flex-wrap: wrap; } .au-steps { flex-wrap: wrap; font-size: 1.05em; }
      .au-frame { grid-template-columns: 1fr; height: auto; flex: none; row-gap: 1.2em; }
      .au-left { grid-template-columns: 1.35em auto minmax(0, 1fr) auto auto; grid-template-rows: none; } .au-left .au-codebox { min-height: 12em; }
      .au-right { grid-template-rows: none; } .au-right > * { min-height: 7em; } .au-right::before { display: none; }
      .au-two { grid-template-columns: 1fr; height: auto; }
    }
    /* ── Test tab opens on a READ-ONLY calendar; the "All controls" button reveals the dashboard ── */
    .au:not(.show-cal) .au-calview { display: none; }
    .au.show-cal .au-head, .au.show-cal .au-frame { display: none; }
    .au-calview { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .au-calhead { display: flex; align-items: center; gap: .7em; flex: none; margin-bottom: .7em; padding: 0 .2em; animation: auUp .45s both; }
    .au-calmonth { font-size: 1.9em; font-weight: 800; min-width: 7.5em; text-align: center; }
    .au-legend { margin-left: auto; display: inline-flex; align-items: center; gap: .5em; font-size: .9em; color: var(--mut); font-weight: 700; }
    .au-calbusy { font-weight: 800; font-size: .95em; animation: auBob .9s ease-in-out infinite; }
    .au-calbusy[hidden] { display: none; }
    .au-tag { display: inline-block; font-size: .72em; font-weight: 800; line-height: 1; padding: .25em .55em; border-radius: .6em; background: var(--alt); color: var(--altt); flex: none; }
    .au-tag.t { background: var(--btn); color: var(--btnt); }
    .au-calwd { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: .45em; flex: none; margin-bottom: .35em; font-weight: 800; color: var(--mut); text-align: center; font-size: .95em; }
    .au-calgrid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-template-rows: repeat(6, minmax(0, 1fr)); gap: .45em; pointer-events: none; user-select: none; -webkit-user-select: none; }
    .au-cd { position: relative; overflow: hidden; min-width: 0; border-radius: 1em; background: var(--card); border: .1em solid var(--line); padding: .35em .5em; display: flex; flex-direction: column; gap: .2em; }
    .au-calgrid.anim .au-cd { animation: auUp .5s calc(var(--i, 0) * 14ms) both; }
    .au-cd.out { opacity: .5; background: var(--soft); }
    .au-cd .dn { flex: none; font-weight: 800; font-size: .95em; align-self: flex-start; line-height: 1.2; }
    .au-cd.today { border-color: var(--k); box-shadow: inset 0 0 0 .12em var(--k); }
    .au-cd.today .dn { background: var(--btn); color: var(--btnt); border-radius: 1em; padding: 0 .55em; }
    .au-ev { display: flex; align-items: center; gap: .35em; flex: none; min-width: 0; font-size: .78em; font-weight: 700; line-height: 1.15; padding: .2em .4em; border-radius: .55em; background: var(--soft); border-left: .3em solid var(--evc, #111); }
    .au-ev[hidden] { display: none; }
    .au-calgrid.anim .au-ev { animation: auPop .45s both; }
    .au-ev .tm { color: var(--mut); flex: none; }
    .au-ev .tt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .au-ev.gone { animation: auGone .45s both !important; }
    .au-more { flex: none; font-size: .75em; font-weight: 800; color: var(--mut); }
    @keyframes auGone { to { opacity: 0; transform: scale(.6) translateY(-.5em); } }
    @keyframes auHop { 0%, 100% { translate: 0 0; } 50% { translate: 0 -.28em; } }
    .au-calfoot { flex: none; display: flex; justify-content: center; padding-top: .8em; }
    .au-allc { font-size: 1.2em; padding: .5em 1.7em; border-radius: 1em; font-weight: 800; animation: auUp .5s .2s both, auHop 1.8s 1s ease-in-out infinite; }
    .au-allc svg { width: 1.1em; height: 1.1em; }
    .au-tocal { margin-left: auto; align-self: center; }
    .au-head .au-b.sm { align-self: center; }
    /* bumping up and down while it works (uses "translate", so hover/press still work) */
    .au.working .au-tab { animation: auHop .9s ease-in-out infinite; }
    .au-step[data-st=run] { animation: auHop .9s ease-in-out infinite; }
    /* Clear button (top right, only on the Test tab) + its dialog */
    .au-clr-row { display: flex; gap: 1em; flex-wrap: wrap; align-items: end; }
    .au-clr-f { display: flex; flex-direction: column; gap: .3em; font-weight: 800; font-size: .9em; }
    .au-clr-count { font-size: 1.3em; font-weight: 800; min-height: 1.4em; }
    .au-clr-count.bump { animation: auPop .35s both; }
    .au-b.sel { background: var(--btn); color: var(--btnt); }
    /* instant tooltips (the browser's own title tooltip waits about a second) */
    .au-tip { position: fixed; z-index: 4000; max-width: 22em; padding: .4em .75em; border-radius: .7em; background: #111; color: #fff; font: 700 13px/1.3 -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; pointer-events: none; opacity: 0; transform: translateY(.35em) scale(.96); transition: opacity .06s, transform .1s; box-shadow: 0 .4em 1em rgba(0,0,0,.25); }
    .au-tip.show { opacity: 1; transform: none; }
    body.night-mode .au-tip { background: #f5f5f5; color: #111; }
    @media (max-width: 800px) { .au-ev .au-tag, .au-ev .tm { display: none; } .au-legend { display: none; } .au-calmonth { font-size: 1.3em; min-width: 0; } .au-calhead { flex-wrap: wrap; } }
    @media (prefers-reduced-motion: reduce) { .au, .au *, .au-modal, .au-modal * { animation: none !important; transition: none !important; } }
`;

  /* ---------- page + pop-ups ---------- */
  const HTML = String.raw`
  <!-- TEST TAB = "Automate" dashboard: one fixed page (see the CSS block "TEST TAB"). Server part: functions/api/automate.js. -->
  <div class="au show-cal" id="testPanel" hidden>
    <div class="au-calview" id="auCalView">
      <div class="au-calhead">
        <button type="button" class="au-b sm alt" id="auCalPrev" aria-label="Previous month">&#8592;</button>
        <span class="au-calmonth" id="auCalMonth"></span>
        <button type="button" class="au-b sm alt" id="auCalNext" aria-label="Next month">&#8594;</button>
        <button type="button" class="au-b sm alt" id="auCalToday">Today</button>
        <span class="au-calbusy" id="auCalBusy" hidden>Automation is running...</span>
        <span class="au-legend"><span class="au-tag t">Test</span> <span class="au-tag">Project</span> made by Automate</span>
        <button type="button" class="au-b sm alt" id="auClearCal" title="Clear events from the calendar (pick the dates)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>Clear</button>
      </div>
      <div class="au-calwd"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      <div class="au-calgrid" id="auCalGrid"></div>
      <div class="au-calfoot"><button type="button" class="au-b au-allc" id="auAllCtl">All controls<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button></div>
    </div>
    <div class="au-head" id="auHead">
      <div class="au-tabwrap">
        <button type="button" class="au-chk" role="checkbox" aria-checked="false" id="auTopChk" aria-label="Automation on" title="Automation on / off (same as Run automation)"></button>
        <button type="button" class="au-tab" id="auGo" title="Runs everything: Scan, Delete words, Run Agent, Paste into calendar"><span id="auGoT">Automate</span><span class="au-spin" id="auGoS" hidden></span></button>
      </div>
      <div class="au-steps" id="auSteps">
        <div class="au-step" data-s="scan" data-st="idle"><span class="au-dot"></span><b>Scan</b></div><span class="au-arr"><svg viewBox="0 0 28 12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h23M19.5 1.5 25 6l-5.5 4.5"/></svg></span>
        <div class="au-step" data-s="del" data-st="idle"><span class="au-dot"></span><b>Delete words</b></div><span class="au-arr"><svg viewBox="0 0 28 12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h23M19.5 1.5 25 6l-5.5 4.5"/></svg></span>
        <div class="au-step" data-s="agent" data-st="idle"><span class="au-dot"></span><b>Run Agent</b></div><span class="au-arr"><svg viewBox="0 0 28 12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h23M19.5 1.5 25 6l-5.5 4.5"/></svg></span>
        <div class="au-step" data-s="cal" data-st="idle"><span class="au-dot"></span><b>Paste into calendar</b></div>
      </div>
      <button type="button" class="au-b sm alt au-tocal" id="auClearTop" title="Clear events from the calendar (pick the dates)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>Clear</button>
      <button type="button" class="au-b sm alt" id="auToCal">Calendar</button>
      <div class="au-bar"><i></i></div>
    </div>
    <div class="au-frame">
      <div class="au-left">
        <div class="au-r au-run">
          <button type="button" class="au-chk" role="checkbox" aria-checked="false" id="auRunOn" aria-label="Run automation on a schedule"></button>
          <span class="lb">Run automation:</span>
          <span class="vl grp"><select class="au-sel" id="auEvery" aria-label="How often"><option value="daily">daily</option><option value="weekly">weekly</option></select><select class="au-sel" id="auDow" aria-label="Weekday" hidden><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option></select><span>at</span><input type="time" id="auTime" value="08:00" aria-label="Time of day"></span>
          <button type="button" class="au-b sm alt" id="auClock" title="Pick the time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Clock</button>
          <span></span><span></span>
        </div>
        <div class="au-r">
          <button type="button" class="au-chk" role="checkbox" aria-checked="true" id="auDelOn" aria-label="Delete words from the picked lists"></button>
          <span class="lb">Deletion:</span>
          <span class="vl" id="auListNames">Main keywords</span>
          <span></span>
          <button type="button" class="au-b sm alt" id="auEditDel" title="Pick the word lists, edit their words, or delete from the scanned text now">Edit</button>
          <span></span>
        </div>
        <div class="au-r">
          <button type="button" class="au-chk" role="checkbox" aria-checked="true" id="auRepOn" aria-label="Delete repeating phrases"></button>
          <span class="lb">Repeating phrases:</span>
          <span class="vl" id="auRepInfo">On 60%+ of pages</span>
          <span></span>
          <button type="button" class="au-b sm alt" id="auEditRep" title="Change how repeated menu and footer lines are found">Edit</button>
          <span></span>
        </div>
        <div class="au-r">
          <button type="button" class="au-chk" role="checkbox" aria-checked="true" id="auAllowOn" aria-label="Only scan the allowed websites"></button>
          <span class="lb">Allowed websites:</span>
          <span class="vl"><span id="auAllowName">Test 1</span> <span class="au-hint" id="auAllowInfo"></span></span>
          <span></span>
          <button type="button" class="au-b sm alt" id="auPickPages" title="Pick the pages a scan may read">Edit</button>
          <span></span>
        </div>
        <div class="au-r">
          <button type="button" class="au-chk" role="checkbox" aria-checked="true" id="auAgentOn" aria-label="Use the agent in the automation"></button>
          <span class="lb">Agent code:</span>
          <span class="vl" id="auCodeInfo">In use</span>
          <button type="button" class="au-b sm" id="auSaveCode">Save</button>
          <button type="button" class="au-b sm alt" id="auResetCode">Reset to default</button>
          <span class="au-msgline" id="auCodeMsg"></span>
        </div>
        <div class="au-r au-codebox">
          <span></span>
          <textarea class="au-ta" id="auPrompt" spellcheck="false" aria-label="Agent code: what the agent must do with the scanned text"></textarea>
        </div>
        <div class="au-r au-stat">
          <span class="au-chk" id="auDChk" aria-hidden="true"></span>
          <span class="lb">Dienynas:</span>
          <span class="vl"><span class="v" id="auDTxt">Not tested yet</span></span>
          <button type="button" class="au-b sm alt" id="auDTest">Test</button>
          <button type="button" class="au-b sm alt" id="auDEdit">Edit</button>
          <span></span>
        </div>
        <div class="au-r au-stat">
          <span class="au-chk" id="auAChk" aria-hidden="true"></span>
          <span class="lb">Agent:</span>
          <span class="vl"><span class="v" id="auATxt">Not tested yet</span></span>
          <button type="button" class="au-b sm alt" id="auATest">Test</button>
          <button type="button" class="au-b sm alt" id="auAEdit">Edit</button>
          <span></span>
        </div>
      </div>
      <div class="au-right">
        <div class="au-final">
          <div class="au-cap">Final product</div>
          <pre class="au-box" id="auFinal" tabindex="0"></pre>
          <div class="au-btns">
            <button type="button" class="au-b" data-do="scan"><span class="t">Scan</span><span class="sp"></span></button>
            <button type="button" class="au-b" data-do="del"><span class="t">Delete from list</span><span class="sp"></span></button>
            <button type="button" class="au-b" data-do="agent"><span class="t">Run agent</span><span class="sp"></span></button>
            <button type="button" class="au-b" data-do="cal"><span class="t">Paste into calendar</span><span class="sp"></span></button>
          </div>
        </div>
        <div class="au-line"><div class="au-cap">Scanned<small>(Deleted list: <b id="auDelYes">no</b>)</small></div><pre class="au-box" id="auScanned" tabindex="0"></pre></div>
        <div class="au-line"><div class="au-cap">Agent<br>Response</div><pre class="au-box" id="auAgentOut" tabindex="0"></pre></div>
        <div class="au-line"><div class="au-cap">Fetched Pages</div><div class="au-strip" id="auPages"></div></div>
        <div class="au-line"><div class="au-cap">Current work</div><pre class="au-box" id="auLog" tabindex="0"></pre></div>
      </div>
    </div>
  </div>
  <!-- big viewer: scanned text, agent answer, one fetched page, lists, log -->
  <div class="au-modal" id="testModal" hidden>
    <div class="au-box2" role="dialog" aria-modal="true" aria-labelledby="testModalTitle">
      <div class="au-mh"><b id="testModalTitle"></b><button type="button" class="au-b" id="testModalCopy">Copy</button><button type="button" class="au-b pri" id="testModalClose">Close</button></div>
      <pre class="au-mb" id="testModalBody"></pre>
    </div>
  </div>
  <!-- editors: word lists, repeating phrases, allowed pages, accounts -->
  <div class="au-modal" id="auDlg" hidden>
    <div class="au-box2" id="auDlgBox" role="dialog" aria-modal="true" aria-labelledby="auDlgTitle">
      <div class="au-mh"><b id="auDlgTitle"></b><button type="button" class="au-b pri" id="auDlgClose">Close</button></div>
      <div id="auDlgTabs" class="au-tabs" hidden></div>
      <div class="au-mb" id="auDlgBody"></div>
    </div>
  </div>
`;

  const style = document.createElement('style'); style.id = 'testTabCss'; style.textContent = CSS; document.head.appendChild(style);
  const holder = document.createElement('div'); holder.innerHTML = HTML; while (holder.firstChild) document.body.appendChild(holder.firstChild);

  /* ───────────────────────── TEST TAB = "Automate" dashboard ─────────────────────────
       One fixed page (see the CSS block "TEST TAB"). Server part: functions/api/automate.js (diary login + crawl, the AI step, and saving your settings + word lists in D1).
         Automate = Scan -> Delete words -> Run Agent -> Paste into calendar, one after the other. The four buttons on the right do one step each.
         A failed step turns red at the top and the run stops there. While it runs, the buttons turn into spinning arrows.
         Settings and word lists are kept in this browser AND in D1 (table auto_store), so the phone and the PC share them. */
    const TestMode = (() => {
      const $ = (id) => document.getElementById(id);
      const tab = $('globalTabTest'), monthTab = $('globalTabMonth'), dayTab = $('globalTabDay'), weekTab = $('globalTabWeek');
      if (!tab || !$('testPanel')) return { isOn: () => false };

      const API = (part, qs) => '/api/automate?part=' + part + (qs ? '&' + String(qs).replace(/^\?/, '') : '');   // one server file: functions/api/automate.js
      const CFG_KEY = 'auCfg.v1', LISTS_KEY = 'testDelLists.v1', WORK_KEY = 'testWork.v1', RESP_KEY = 'auAgentResp.v1', OLD_AUTO_KEY = 'testDelAuto.v1';
      const STANDARD_WORDS = ["X", "menu", "Išbandykite", "planą „Šeima“", "Užsakyti", "school", "Pažymių", "knygelė", "bar_chart", "Analitika", "Individuali pažanga", "Fizinis pajėgumas", "Mokinio reitingas", "email", "1", "Pranešimai", "notifications", "Įvykiai", "help_outline", "Parašykite", "mums", "Kalba", "Pasirinkite", "kalbą", "Kristina Martinkevičienė", "Benas Martinkevičius", "Tėvas/Mama (Globėjas/Globėja)", "Kauno Vinco Kudirkos progimnazija", "notifications_active", "Rokas Martinkevičius", "Paskyros nustatymai", "Vartotojo vadovas", "Parašykite mums", "Atsijungti", "sports_basketball", "Sporto būreliai", "Korepetitoriai", "holiday_village", "Stovyklos", "audiotrack", "Muzikos būreliai", "accessibility", "Šokių būreliai", "language", "Kalbų mokymas", "home", "Įstaigos", "volunteer_activism", "Savanorystė", "Dienos vaizdas", "„Šeimos“ paslaugos", "Švietimo rodiklių švieslentė", "Pažymių knygelė", "Pažymiai", "Lankomumas", "Tvarkaraštis", "Klasės darbai", "Namų darbai", "Pagyrimai ir pastabos", "Atsiskaitomieji darbai", "Trimestrai, pusmečiai", "Tėvų susirinkimai", "Video pamokos", "Elektroninės paslaugos", "Kurti naują paslaugą", "Užsakytos paslaugos", "Pranešimai 1", "Rašyti naują pranešimą", "Gauti pranešimai 1", "Išsiųsti pranešimai", "Juodraščiai", "Svarbūs pranešimai", "Ištrinti pranešimai", "Kontaktų grupės", "Svarbi informacija", "Atostogų grafikas", "Mokyklos failai", "Apklausos", "Dokumentai", "Visi", "Laukiantys parašo", "Archyvas", "Ištrintos sutartys", "Sąskaitos", "Visos", "Laukiančios apmokėjimo", "Vėluojančios sąskaitos", "Ištrintos sąskaitos", "Pakvieskite šeimos narį", "Nustatymai", "Mokymosi resursai", "Svetainės medis", "cancel", "Parašyti mokyklos administracijai", "Tik vartotojai", "Parašyti Manodienynas.lt pagalbos tarnybai", "attach_file", "Pridėti pdf failą", "keyboard_arrow_right", "- Visi dalykai -", "Puslapiai:", "Mokėjimo būdai", "Klientams", "DUK", "Pirkimo taisyklės ir sąlygos", "Privatumo ir slapukų politika", "Sistemos naudojimo taisyklės", "Mano dienynas", "Kam skirta sistema", "Sistemos galimybės", "Reklamos galimybės", "Kontaktai", "Užsakyti šeimos planą", "Sekite mus", "Facebook", "Ⓒ Manodienynas.lt, .", "Visos teisės saugomos.", "check", "Patvirtinti", "Atšaukti", "Toliau", "Atmesti", "Ištrinti paskyrą", "Ar sutinkate perduoti Integrra sistemai", "El. pašto adresą, mokyklos pavadinimą", "sutinku su asmens duomenų tvarkymu", "identifikavimo tikslu", "Valdykite popierinių dokumentų srautą", "Sumažinkite spausdinimo išlaidas", "Nebegaiškite laiko ieškant dokumentų", "Valdykite užduočių srautą", "Pasirašyti dokumentus užtruksite tik akimirką", "Elektroninė dokumentų ir užduočių valdymo sistema INTEGRRA yra puikus sprendimas optimizuoti įstaigų ir įmonių dokumentų srautus bei elektronizuoti informacijos perdavimą."];   // the usual menu/footer lines of manodienynas.lt
      const OLD_PROMPTS = ['You read text copied from a Lithuanian school e-diary (manodienynas.lt).\nFind every UPCOMING test or graded work (kontrolinis darbas, testas, atsiskaitymas, savarankiškas darbas, diktantas, apklausa...). Ignore homework without a test, marks, messages, payments and everything else.\nAnswer with ONLY a JSON array, no other words and no code fences. One item per test:\n{"date":"YYYY-MM-DD","title":"Subject: kind of work","description":"topic, if the text says it"}\nSkip dates that are already in the past. If there is nothing, answer [].'];
      const DEF_PROMPT = 'You read text copied from a Lithuanian school e-diary (manodienynas.lt).\nFind every UPCOMING test, project or graded work (kontrolinis darbas, testas, atsiskaitymas, savarankiškas darbas, diktantas, apklausa, projektas, projektinis darbas, referatas, pristatymas...). Ignore homework without a test or project, marks, messages, payments and everything else.\nAnswer with ONLY a JSON array, no other words and no code fences. One item per entry:\n{"date":"YYYY-MM-DD","kind":"test or project","title":"Subject: kind of work","description":"topic, if the text says it"}\nUse "project" for a project, report or presentation, and "test" for everything else. Skip dates that are already in the past. If there is nothing, answer [].';
      const SPIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 13c0-4.4 3.4-7.8 7.6-7.8 2.2 0 3.8.8 5 2.1"/><path d="M19.5 11c0 4.4-3.4 7.8-7.6 7.8-2.2 0-3.8-.8-5-2.1"/><path d="M17.6 3.4v4.2h-4.2"/><path d="M6.4 20.6v-4.2h4.2"/></svg>';
      const CAP = { maxLen: 120, maxWords: 1500, show: 40000, log: 400 };
      const STEPS = ['scan', 'del', 'agent', 'cal'];
      const WHAT = { scan: 'Scanning the diary...', del: 'Deleting words...', agent: 'Running the agent...', cal: 'Pasting into the calendar...' };

      const p2 = (n) => String(n).padStart(2, '0');
      const num = (n) => Number(n).toLocaleString();
      const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
      const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
      const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
      const flash = (e) => { e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); };
      const hhmmss = () => { const n = new Date(); return p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()); };
      const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch (e) { return iso || ''; } };

      async function jf(url, opt) {
        const r = await fetch(url, { cache: 'no-store', ...(opt || {}) });
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch (e) { j = { error: t.slice(0, 200) }; }
        if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
        return j;
      }
      const post = (url, body) => jf(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
      const scanApi = (qs) => jf(API('scan', qs));
      const scanPost = (qs, body) => post(API('scan', qs), body);

      /* ---------- state ---------- */
      let codeDirty = false;
      let on = false, settings = null, busy = '', curWhat = '', finalNote = '';
      let srvLog = '', logLines = [], lastData = null, remoteLoaded = false;
      const stepState = { scan: 'idle', del: 'idle', agent: 'idle', cal: 'idle' };
      const conn = { d: 'none', a: 'none', dWhy: '' };
      let cfg = Object.assign({ runOn: false, every: 'daily', dow: 1, time: '08:00', delOn: true, delNames: null, repeatOn: true, repeatPct: 60,
        allowName: 'Test 1', allowOn: true, allowKeep: [], agentOn: true, prompt: DEF_PROMPT, model: '', maxChars: 16000, lastAuto: '' }, lsGet(CFG_KEY, {}));
      const upgradePrompt = () => { if (OLD_PROMPTS.includes(cfg.prompt)) { cfg.prompt = DEF_PROMPT; return true; } return false; };   // an unchanged old default becomes the new default (it now also finds projects)
      if (upgradePrompt()) lsSet(CFG_KEY, cfg);
      let lists = lsGet(LISTS_KEY, {});
      if (!lists || typeof lists !== 'object' || !Object.keys(lists).length) lists = { 'Main keywords': STANDARD_WORDS.map((w) => 'L:' + w), 'Test 1': [] };
      let work = lsGet(WORK_KEY, { o: '', c: '' });
      if (work.d == null) work.d = !!work.o && work.c !== work.o;
      let resp = lsGet(RESP_KEY, { t: '' });
      if (!Array.isArray(cfg.delNames)) {
        const old = lsGet(OLD_AUTO_KEY, {});
        const guess = Object.keys(lists).filter((n) => /main keywords|^test 1$/i.test(n));
        cfg.delNames = guess.length ? guess : (old && lists[old.name] ? [old.name] : Object.keys(lists).slice(0, 1));
      }

      /* ---------- saving: this browser + D1 ---------- */
      let syncT = 0;
      function saveCfg() { lsSet(CFG_KEY, cfg); queueSync(); }
      function saveLists() { lsSet(LISTS_KEY, lists); queueSync(); }
      function queueSync() { clearTimeout(syncT); syncT = setTimeout(pushRemote, 900); }
      async function pushRemote() { try { await post(API('auto', '?key=cfg'), { value: cfg }); await post(API('auto', '?key=lists'), { value: lists }); } catch (e) { /* offline or no D1: the browser copy is still there */ } }
      async function loadRemote() {
        if (remoteLoaded) return;
        try {
          const [c, l] = await Promise.all([jf(API('auto', '?key=cfg')), jf(API('auto', '?key=lists'))]);
          remoteLoaded = true;
          let need = false;
          if (c.value && typeof c.value === 'object') { cfg = Object.assign(cfg, c.value); upgradePrompt(); } else need = true;
          if (l.value && typeof l.value === 'object' && Object.keys(l.value).length) lists = l.value; else need = true;
          if (!Array.isArray(cfg.delNames)) cfg.delNames = Object.keys(lists).slice(0, 1);
          lsSet(CFG_KEY, cfg); lsSet(LISTS_KEY, lists);
          if (need) pushRemote();
          paintCfg();
        } catch (e) { /* keep the browser copy */ }
      }
      const saveWork = () => lsSet(WORK_KEY, work);

      /* ---------- the log ("Current work") ---------- */
      function note(m) { logLines.push(hhmmss() + '  ' + m); if (logLines.length > CAP.log) logLines.splice(0, logLines.length - CAP.log); paintLog(); }
      function paintLog() {
        const b = $('auLog');
        const lines = logLines.concat(srvLog ? srvLog.split('\n') : []);
        const stick = b.scrollTop + b.clientHeight >= b.scrollHeight - 30;
        b.textContent = lines.length ? lines.join('\n') : 'Nothing yet. Press Automate.';
        b.classList.toggle('empty', !lines.length);
        if (stick) b.scrollTop = b.scrollHeight;
      }

      /* ---------- the picture: steps, buttons, boxes ---------- */
      function setStep(s, st) {
        stepState[s] = st;
        curWhat = st === 'run' ? WHAT[s] : (STEPS.some((k) => stepState[k] === 'run') ? curWhat : '');
        paintSteps(); paintFinal();
      }
      function paintSteps() {
        document.querySelectorAll('#auSteps .au-step').forEach((e) => {
          const st = stepState[e.dataset.s];
          e.dataset.st = st;
          const d = e.querySelector('.au-dot');
          d.innerHTML = st === 'run' ? '<span class="au-spin" style="width:100%;height:100%">' + SPIN + '</span>' : st === 'ok' ? '&#10003;' : st === 'bad' ? '&#10005;' : '';
        });
        paintBusy();
      }
      function paintBusy() {
        const all = busy === 'all';
        $('auGo').disabled = !!busy;
        $('testPanel').classList.toggle('working', !!busy); $('auHead').classList.toggle('working', !!busy);
        $('auCalBusy').hidden = !busy;
        $('auGoT').hidden = all; $('auGoS').hidden = !all;
        $('auGoS').innerHTML = all ? SPIN : '';
        document.querySelectorAll('.au-btns .au-b').forEach((b) => {
          const d = b.dataset.do, running = all || busy === d;
          b.disabled = !!busy;
          b.classList.toggle('run', running);
          b.classList.toggle('dim', !!busy && !running);
          const sp = b.querySelector('.sp'); if (running && !sp.innerHTML) sp.innerHTML = SPIN; if (!running) sp.innerHTML = '';
        });
      }
      function setConn(which, st, why) {
        conn[which] = st; if (which === 'd') conn.dWhy = why || '';
        const chk = $(which === 'd' ? 'auDChk' : 'auAChk'), txt = $(which === 'd' ? 'auDTxt' : 'auATxt');
        chk.className = 'au-chk' + (st === 'ok' ? ' ok' : st === 'bad' ? ' bad' : st === 'wait' ? ' wait' : '');
        chk.innerHTML = st === 'wait' ? SPIN : '';
        if (st === 'wait') chk.firstChild.classList.add('au-spin');
        const names = which === 'd' ? { none: 'Not tested yet', wait: 'Testing...', ok: 'Logged in', bad: 'Not logged in' } : { none: 'Not tested yet', wait: 'Testing...', ok: 'Connected', bad: 'Not connected' };
        txt.textContent = names[st] + (why ? ' (' + why + ')' : '');
        txt.className = 'v' + (st === 'bad' ? ' bad' : '');
        txt.parentNode.title = txt.textContent;
      }
      function paintCfg() {
        const setChk = (id, v) => $(id).setAttribute('aria-checked', v ? 'true' : 'false');
        setChk('auRunOn', cfg.runOn); setChk('auTopChk', cfg.runOn); setChk('auDelOn', cfg.delOn); setChk('auRepOn', cfg.repeatOn); setChk('auAgentOn', cfg.agentOn); setChk('auAllowOn', cfg.allowOn !== false);
        $('auEvery').value = cfg.every; $('auDow').value = String(cfg.dow); $('auDow').hidden = cfg.every !== 'weekly'; $('auTime').value = cfg.time || '08:00';
        cfg.delNames = (cfg.delNames || []).filter((n) => lists[n]);
        $('auListNames').textContent = cfg.delNames.length ? cfg.delNames.join(', ') : '(none ticked)'; $('auListNames').title = $('auListNames').textContent;
        $('auAllowName').textContent = cfg.allowName || 'Test 1';
        const n = settings && settings.allowed ? settings.allowed.length : null;
        $('auAllowInfo').textContent = cfg.allowOn === false ? '(off: all pages)' : n == null ? '' : n ? '(' + n + ' page' + (n === 1 ? '' : 's') + ')' : '(all pages)';
        $('auRepInfo').textContent = 'On ' + (cfg.repeatPct || 60) + '%+ of pages';
        $('auCodeInfo').textContent = cfg.agentOn ? 'In use' : 'Not used';
        if (document.activeElement !== $('auPrompt') && !codeDirty) $('auPrompt').value = cfg.prompt || '';
      }
      function statusLine() {
        if (busy) return curWhat || 'Working...';
        return finalNote || 'Ready. Press Automate.';
      }
      function paintFinal() {
        const box = $('auFinal'); box.textContent = '';
        box.appendChild(el('div', 'au-st', statusLine()));
        const ev = parseEvents(resp.t || '');
        let any = false;
        if (ev && ev.length) { any = true; ev.forEach((e) => box.appendChild(document.createTextNode(e.date + '  ' + e.title + (e.description ? '  -  ' + e.description : '') + '\n'))); }
        else if (ev && !ev.length) { any = true; box.appendChild(document.createTextNode('The agent found no tests.')); }
        else if (resp.t) { any = true; box.appendChild(document.createTextNode('The agent answer is not a JSON list (see Agent Response).')); }
        box.classList.toggle('empty', !any); flash(box);
        if (!any) box.appendChild(document.createTextNode('Nothing yet.'));
      }
      function paintScanned() {
        const b = $('auScanned'), c = work.c || '';
        b.textContent = c ? (c.length > CAP.show ? c.slice(0, CAP.show) + '\n\n... (' + num(c.length - CAP.show) + ' more characters, click the box to see everything)' : c) : 'Nothing scanned yet.';
        b.classList.toggle('empty', !c); flash(b);
        const y = $('auDelYes'); y.textContent = work.d ? 'yes' : 'no';
        $('auDelYes').style.color = '';
      }
      function paintAgent() { const b = $('auAgentOut'); b.textContent = resp.t || 'No answer yet.'; b.classList.toggle('empty', !resp.t); flash(b); }
      function paintPages() {
        const box = $('auPages'); box.textContent = '';
        const pages = (lastData && lastData.pages) || [];
        if (!pages.length) { box.appendChild(el('span', 'au-nopages', 'No pages yet.')); return; }
        pages.forEach((p) => {
          const b = el('button', 'au-b au-pg'); b.type = 'button';
          b.append(el('b', '', p.title || p.url), el('small', '', num(p.chars || 0) + ' chars'));
          b.title = p.url; b.addEventListener('click', () => openPage(p));
          box.appendChild(b);
        });
      }

      /* ---------- pop-up viewer ---------- */
      let modalText = '';
      function showModal(title, text) {
        modalText = text || '';
        $('testModalTitle').textContent = title;
        $('testModalBody').textContent = modalText;
        $('testModalBody').scrollTop = 0;
        $('testModal').hidden = false; $('testModal').classList.add('show');
      }
      function closeModal() { $('testModal').classList.remove('show'); $('testModal').hidden = true; }
      async function copyModal() {
        try { await navigator.clipboard.writeText(modalText); }
        catch (e) { const r = document.createRange(); r.selectNodeContents($('testModalBody')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); s.removeAllRanges(); }
        const b = $('testModalCopy'); b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1200);
      }
      async function openPage(p) {
        showModal(p.title + '  (' + p.chars + ' characters)', 'Loading...');
        try { const r = await scanApi('?resource=page&id=' + p.id); if ($('testModal').classList.contains('show')) showModal(p.title + '  (' + r.chars + ' characters)', r.body || '(empty page)'); }
        catch (e) { showModal(p.title, 'Could not load: ' + e.message); }
      }
      function openDlg(title, small) {
        $('auDlgTitle').textContent = title; $('auDlgBox').classList.toggle('small', !!small);
        $('auDlgBody').textContent = ''; $('auDlgBody').removeAttribute('style'); $('auDlgTabs').textContent = ''; $('auDlgTabs').hidden = true;
        $('auDlg').hidden = false; $('auDlg').classList.add('show');
        return $('auDlgBody');
      }
      function closeDlg() { $('auDlg').classList.remove('show'); $('auDlg').hidden = true; paintCfg(); }

      /* ---------- cleaning the scanned text (all local, in the browser) ---------- */
      const HEADER = /^=== .* ===$/;                       // the "=== address ===" line above each page is never touched
      const perLine = (t, fn) => t.split('\n').map((l) => (HEADER.test(l) ? l : fn(l))).join('\n');
      // an entry is either one character typed ("," ";" - deleted everywhere) or "L:phrase" (a line that is exactly that phrase is deleted)
      function deleteWords(t, list) {
        const chars = list.filter((c) => c.slice(0, 2) !== 'L:');
        const lines = new Set(list.filter((c) => c.slice(0, 2) === 'L:').map((c) => c.slice(2).trim().toLowerCase()));
        let out = perLine(t, (l) => { if (lines.size && lines.has(l.trim().toLowerCase())) return ''; for (const c of chars) l = l.split(c).join(''); return l; });
        if (lines.size) out = out.replace(/\n{3,}/g, '\n\n');
        return out;
      }
      function cleanSpaces(t) {
        t = perLine(t, (l) => l
          .replace(/\.{2,}/g, ' ')
          .replace(/([,\/\\\-_*~|;])\1+/g, '$1')
          .replace(/(?:[ \t]*\|[ \t]*){2,}/g, ' | ')
          .replace(/^[ \t]*\|[ \t]*/, '').replace(/[ \t]*\|[ \t]*$/, '')
          .replace(/[ \t  ]{2,}/g, ' ').trim());
        t = perLine(t, (l) => (/[\p{L}\p{N}]/u.test(l) ? l : ''));
        t = t.replace(/\n{2,}/g, '\n');
        const out = []; let prev = null;
        for (const l of t.split('\n')) { if (l !== prev) out.push(l); prev = l; }
        return out.join('\n').trim();
      }
      function dropRepeated(t, pct) {                      // the menu that every page repeats
        const blocks = t.split(/\n(?==== [^\n]* ===(?:\n|$))/);
        if (blocks.length < 3) return { text: t, removed: 0, few: true };
        const count = new Map();
        blocks.forEach((b) => { new Set(b.split('\n').slice(1).map((l) => l.trim()).filter(Boolean)).forEach((l) => count.set(l, (count.get(l) || 0) + 1)); });
        const need = Math.max(3, Math.ceil(blocks.length * (Math.min(100, Math.max(10, pct || 60)) / 100)));
        let removed = 0;
        const out = blocks.map((b) => {
          const ls = b.split('\n');
          return [ls[0]].concat(ls.slice(1).filter((l) => { const k = l.trim(); if (k && count.get(k) >= need) { removed++; return false; } return true; })).join('\n');
        });
        return { text: out.join('\n'), removed };
      }
      function activeWords() {
        const s = new Set();
        (cfg.delNames || []).forEach((n) => (lists[n] || []).forEach((w) => s.add(w)));
        return [...s];
      }

      /* ---------- the four steps ---------- */
      async function loadWork() {
        const r = await scanApi('?resource=results');
        work = { o: r.text || '', c: r.text || '', d: false };
        saveWork(); paintScanned();
        return r;
      }
      async function stepScan() {
        setStep('scan', 'run'); note('SCAN: started');
        srvLog = ''; paintLog();
        const poll = setInterval(async () => { try { const d = await scanApi('?resource=latest'); lastData = d; srvLog = (d.run && d.run.log) || ''; paintLog(); paintPages(); } catch (e) {} }, 1000);
        let ok = false, msg = '', login = true;
        try {
          const r = await scanPost('?resource=run');
          ok = r.status === 'ok';
          if (r.status === 'login-failed') login = false;
          msg = ok ? r.pages + ' page(s), ' + num(r.chars) + ' characters' : (r.status === 'login-failed' ? 'login failed' : 'scan failed (see the lines above)');
        } catch (e) { msg = e.message; }
        clearInterval(poll);
        try { lastData = await scanApi('?resource=latest'); settings = await scanApi('?resource=settings'); } catch (e) {}
        if (lastData && lastData.run && lastData.run.log) logLines.push(...lastData.run.log.split('\n'));
        srvLog = ''; paintLog(); paintPages(); paintCfg();
        if (ok) {
          try { await loadWork(); } catch (e) { note('SCAN: finished but the text could not be loaded: ' + e.message); setStep('scan', 'bad'); return false; }
          setConn('d', 'ok'); note('SCAN: done - ' + msg); setStep('scan', 'ok'); return true;
        }
        if (!login) setConn('d', 'bad', 'wrong username/password?');
        note('SCAN: FAILED - ' + msg); setStep('scan', 'bad'); return false;
      }
      async function stepDelete() {
        setStep('del', 'run');
        if (!work.o) { try { await loadWork(); } catch (e) {} }
        if (!work.o) { note('DELETE: nothing scanned yet. Press Scan first.'); setStep('del', 'bad'); return false; }
        const b = work.o.length, parts = [];
        let t = cleanSpaces(work.o); parts.push(num(b - t.length) + ' characters of spaces/junk');
        if (cfg.repeatOn) {
          const d = dropRepeated(t, cfg.repeatPct);
          if (d.few) parts.push('repeating phrases skipped (fewer than 3 pages)'); else { t = d.text; parts.push(num(d.removed) + ' repeating lines'); }
        }
        if (cfg.delOn) {
          const w = activeWords();
          if (w.length) { const before = t.length; t = deleteWords(t, w); parts.push(num(before - t.length) + ' characters from your lists (' + w.length + ' words)'); }
          else parts.push('no words in the ticked lists');
        }
        t = t.replace(/\n{3,}/g, '\n\n').trim();
        work.c = t; work.d = true; saveWork(); paintScanned();
        note('DELETE: ' + num(b) + ' -> ' + num(t.length) + ' characters (' + parts.join(', ') + ')');
        if (!t) { note('DELETE: nothing is left after deleting.'); setStep('del', 'bad'); return false; }
        setStep('del', 'ok'); return true;
      }
      async function stepAgent() {
        setStep('agent', 'run');
        if (!work.c) { note('AGENT: there is no scanned text. Press Scan first.'); setStep('agent', 'bad'); return false; }
        if (!(cfg.prompt || '').trim()) { note('AGENT: the Agent code box is empty.'); setStep('agent', 'bad'); return false; }
        note('AGENT: sending ' + num(Math.min(work.c.length, cfg.maxChars || 16000)) + ' characters to the AI...');
        try {
          const r = await post(API('agent', '?resource=run'), { prompt: cfg.prompt, text: work.c, model: cfg.model, maxChars: cfg.maxChars });
          resp = { t: r.text || '', at: Date.now() }; lsSet(RESP_KEY, resp); paintAgent(); paintFinal();
          if (!resp.t.trim()) { note('AGENT: the AI answered with nothing.'); setStep('agent', 'bad'); return false; }
          note('AGENT: answered (' + num(resp.t.length) + ' characters)' + (r.truncated ? '. The text was cut to ' + num(r.usedChars) + ' characters to fit the AI limit - delete more words to send everything.' : ''));
          setConn('a', 'ok'); setStep('agent', 'ok'); return true;
        } catch (e) { note('AGENT: FAILED - ' + e.message); setConn('a', 'bad'); setStep('agent', 'bad'); return false; }
      }
      // the agent must answer with a JSON list: [{ "date": "2026-11-20", "title": "...", "description": "..." }]
      function parseEvents(text) {
        let t = String(text || '').trim();
        if (!t) return null;
        const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fence) t = fence[1].trim();
        const a = t.indexOf('['), z = t.lastIndexOf(']');
        if (a < 0 || z <= a) return null;
        let arr; try { arr = JSON.parse(t.slice(a, z + 1)); } catch (e) { return null; }
        if (!Array.isArray(arr)) return null;
        return arr.filter((e) => e && /^\d{4}-\d{2}-\d{2}$/.test(String(e.date || '')) && String(e.title || '').trim())
          .map((e) => ({ date: String(e.date), title: String(e.title).trim().slice(0, 120), description: String(e.description || '').trim().slice(0, 400), kind: /proj/i.test(String(e.kind || '')) || /projekt|project|referat|prezentac/i.test(String(e.title || '')) ? 'project' : 'test' }));
      }
      const hashOf = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
      async function stepPaste() {
        setStep('cal', 'run');
        const ev = parseEvents(resp.t);
        if (ev == null) { note('CALENDAR: the agent answer is not a JSON list, so nothing was pasted.'); setStep('cal', 'bad'); return false; }
        if (typeof EventStore === 'undefined') { note('CALENDAR: the calendar is not ready.'); setStep('cal', 'bad'); return false; }
        try {
          await EventStore.whenReady();
          let added = 0, updated = 0;
          ev.forEach((e) => {
            const id = (e.kind === 'project' ? 'mdproj-' : 'mdtest-') + e.date + '-' + hashOf(e.title.toLowerCase());
            let rec = EventStore.getForDate(e.date).find((r) => r.id === id);
            if (rec) { if (rec.type !== e.title || (rec.description || '') !== e.description) { rec.type = e.title; rec.description = e.description; EventStore.save(rec); updated++; } }
            else { rec = EventStore.create(e.date, 8 * 60, 45); rec.id = id; rec.type = e.title; rec.color = e.kind === 'project' ? '#f59e0b' : '#ef4444'; rec.description = e.description; EventStore.save(rec); added++; }
          });
          await EventStore.flushNow();
          finalNote = 'Last run ' + hhmmss() + ': ' + ev.length + ' test(s), ' + added + ' new, ' + updated + ' changed.';
          note('CALENDAR: ' + ev.length + ' test(s) found, ' + added + ' added, ' + updated + ' updated, ' + (ev.length - added - updated) + ' already there.');
          setStep('cal', 'ok'); return true;
        } catch (e) { note('CALENDAR: FAILED - ' + e.message); setStep('cal', 'bad'); return false; }
      }
      const RUN = { scan: stepScan, del: stepDelete, agent: stepAgent, cal: stepPaste };

      async function runAll(auto) {
        if (busy) return;
        busy = 'all'; STEPS.forEach((s) => { stepState[s] = 'idle'; }); paintSteps(); paintFinal();
        note('=== Automate started' + (auto ? ' (scheduled)' : '') + ' ===');
        let fine = false;
        try {
          if (!(await stepScan())) return;
          if (!(await stepDelete())) return;
          if (cfg.agentOn) { if (!(await stepAgent())) return; if (!(await stepPaste())) return; }
          else { stepState.agent = 'skip'; stepState.cal = 'skip'; paintSteps(); note('Agent code is switched off, so Run Agent and Paste into calendar were skipped.'); finalNote = 'Last run ' + hhmmss() + ': scanned and cleaned (agent is off).'; }
          fine = true; note('=== Automate finished ===');
        } finally {
          if (!fine) { finalNote = 'Stopped at ' + hhmmss() + ': a red step failed (see Current work).'; note('=== Automate stopped ==='); }
          busy = ''; curWhat = ''; cfg.lastAuto = new Date().toISOString(); saveCfg(); paintSteps(); paintFinal(); refreshCal();
        }
      }
      async function runOne(s) {
        if (busy) return;
        busy = s; stepState[s] = 'idle'; paintSteps(); paintFinal();
        try { const ok = await RUN[s](); if (s === 'del' && ok) finalNote = 'Deleted from the list at ' + hhmmss() + '.'; } finally { busy = ''; curWhat = ''; paintSteps(); paintFinal(); refreshCal(); }
      }

      /* ---------- the schedule (only while the site is open: Cloudflare Pages has no cron) ---------- */
      function lastSlot() {
        const m = /^(\d{1,2}):(\d{2})$/.exec(cfg.time || ''); if (!m) return null;
        const n = new Date();
        const s = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +m[1], +m[2], 0, 0);
        if (cfg.every === 'weekly') s.setDate(s.getDate() - ((n.getDay() - (+cfg.dow) + 7) % 7));
        if (s > n) s.setDate(s.getDate() - (cfg.every === 'weekly' ? 7 : 1));
        return s;
      }
      async function schedTick() {
        if (!cfg.runOn || busy) return;
        const slot = lastSlot(); if (!slot) return;
        if (cfg.lastAuto && new Date(cfg.lastAuto) >= slot) return;
        try { const c = await jf(API('auto', '?key=cfg')); if (c.value && c.value.lastAuto) { if (c.value.lastAuto > (cfg.lastAuto || '')) cfg.lastAuto = c.value.lastAuto; if (new Date(cfg.lastAuto) >= slot) { lsSet(CFG_KEY, cfg); return; } } } catch (e) {}
        if (!busy) runAll(true);
      }

      /* ---------- connection tests ---------- */
      async function testDienynas() {
        if (busy) return;
        setConn('d', 'wait'); note('DIENYNAS: testing the login...');
        try {
          const r = await scanPost('?resource=logintest');
          const d = await scanApi('?resource=latest').catch(() => null);
          if (d && d.run && d.run.log) logLines.push(...d.run.log.split('\n').slice(-12));
          if (r.loggedIn) { setConn('d', 'ok'); note('DIENYNAS: logged in.'); }
          else { setConn('d', 'bad', r.status === 'login-failed' ? 'wrong username/password?' : 'see Current work'); note('DIENYNAS: NOT logged in (' + r.status + ').'); }
        } catch (e) { setConn('d', 'bad', e.message); note('DIENYNAS: test failed - ' + e.message); }
        paintLog();
      }
      async function testAgent() {
        if (busy) return;
        setConn('a', 'wait'); note('AGENT: testing the connection...');
        try {
          const r = await post(API('agent', '?resource=test'), { model: cfg.model });
          if (!r.ok) { setConn('a', 'bad', r.error || 'no answer'); note('AGENT: NOT connected - ' + (r.error || '')); }
          else if (!r.found) { setConn('a', 'bad', 'key works, model "' + (cfg.model || 'openai/gpt-oss-120b') + '" not found'); note('AGENT: the key works but the model name was not found. Press edit and fix the model.'); }
          else { setConn('a', 'ok'); note('AGENT: connected (' + (r.model) + ').'); }
        } catch (e) { setConn('a', 'bad', e.message); note('AGENT: test failed - ' + e.message); }
      }

      /* ---------- editor: word lists + repeating phrases ---------- */
      let edSel = '', edTab = 'lists';
      const entryText = (w) => (w.slice(0, 2) === 'L:' ? w.slice(2) : 'character  ' + w);
      function parseWords(v) {
        const quoted = [...v.matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'").trim()).filter(Boolean);
        return (quoted.length ? quoted : v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean));
      }
      function openLists(tab) { edTab = tab || 'lists'; if (!lists[edSel]) edSel = cfg.delNames[0] || Object.keys(lists)[0] || ''; openDlg('Deletion'); renderEditor(); }
      function renderEditor() {
        const body = $('auDlgBody'); body.textContent = '';
        const tabs = $('auDlgTabs'); tabs.textContent = ''; tabs.hidden = false;
        [['lists', 'Word lists'], ['rep', 'Repeating phrases']].forEach(([k, t]) => {
          const b = el('button', 'au-b' + (edTab === k ? ' sel' : ''), t); b.type = 'button';
          b.addEventListener('click', () => { edTab = k; renderEditor(); }); tabs.appendChild(b);
        });
        const dn = el('button', 'au-b pri del', 'Delete from list now'); dn.type = 'button'; dn.title = 'Delete the words from the scanned text now';
        dn.addEventListener('click', () => { closeDlg(); runOne('del'); }); tabs.appendChild(dn);
        if (edTab === 'rep') return renderRepTab(body);
        const two = el('div', 'au-two'); body.appendChild(two);
        const L = el('div', 'au-col'), R = el('div', 'au-col'); two.append(L, R);
        L.appendChild(el('div', 'au-hint', 'Tick the lists that Delete words should use. Press a name to edit its words.'));
        const sc = el('div', 'au-scroll'); L.appendChild(sc);
        const names = Object.keys(lists);
        if (!names.length) sc.appendChild(el('div', 'au-hint', 'No lists yet. Make one below.'));
        names.forEach((n) => {
          const row = el('div', 'au-li' + (n === edSel ? ' sel' : ''));
          const cb = el('input'); cb.type = 'checkbox'; cb.checked = cfg.delNames.includes(n); cb.title = 'Use this list';
          cb.addEventListener('change', () => { cfg.delNames = cb.checked ? [...new Set(cfg.delNames.concat(n))] : cfg.delNames.filter((x) => x !== n); saveCfg(); });
          const nm = el('button', 'nm', n); nm.type = 'button'; nm.addEventListener('click', () => { edSel = n; renderEditor(); });
          const c = el('span', 'n', String(lists[n].length));
          const x = el('button', 'x', '−'); x.type = 'button'; x.title = 'Delete this list';
          x.addEventListener('click', () => { if (!confirm('Delete the list "' + n + '" and all its words?')) return; delete lists[n]; cfg.delNames = cfg.delNames.filter((k) => k !== n); if (edSel === n) edSel = ''; saveLists(); saveCfg(); renderEditor(); });
          row.append(cb, nm, c, x); sc.appendChild(row);
        });
        const nf = el('div', 'au-fl'); const ni = el('input', 'au-in'); ni.placeholder = 'New list name'; ni.style.flex = '1';
        const nb = el('button', 'au-b', 'Add list'); nb.type = 'button';
        const addList = () => { const n = ni.value.trim(); if (!n) return; if (!lists[n]) lists[n] = []; edSel = n; saveLists(); renderEditor(); };
        nb.addEventListener('click', addList); ni.addEventListener('keydown', (e) => { if (e.key === 'Enter') addList(); });
        nf.append(ni, nb); L.appendChild(nf);

        if (!edSel || !lists[edSel]) { R.appendChild(el('div', 'au-hint', 'Pick a list on the left, or make a new one.')); return; }
        const arr = lists[edSel];
        R.appendChild(el('b', '', 'Words in: ' + edSel + '  (' + arr.length + ')'));
        R.appendChild(el('div', 'au-hint', 'Paste one word or phrase per line (a list copied from SQL like \'a\',\'b\' also works). A line is deleted only when the WHOLE line is exactly that text (capital letters do not matter). Saved in your D1 database (shared by PC and phone) and in this browser.'));
        const ta = el('textarea'); ta.rows = 4; ta.placeholder = 'Type or paste words here, one per line'; R.appendChild(ta);
        const msg = el('div', 'au-msg');
        const f1 = el('div', 'au-fl');
        const add = el('button', 'au-b pri', 'Add words'); add.type = 'button';
        const std = el('button', 'au-b', 'Add the standard menu words'); std.type = 'button';
        const addMany = (ws) => {
          let added = 0, skip = 0, long = 0;
          ws.forEach((w) => { if (w.length > CAP.maxLen) { long++; return; } const e = 'L:' + w; if (arr.includes(e) || arr.length >= CAP.maxWords) { skip++; return; } arr.push(e); added++; });
          saveLists(); return { added, skip, long };
        };
        add.addEventListener('click', () => {
          const r = addMany(parseWords(ta.value));
          if (!r.added && r.long) { msg.className = 'au-msg bad'; msg.textContent = 'That line is too long for one entry (limit ' + CAP.maxLen + ' characters). Put each word on its own line.'; return; }
          renderEditor(); const m = $('auDlgBody').querySelector('.au-msg'); if (m) m.textContent = 'Added ' + r.added + (r.skip ? ' (' + r.skip + ' already there)' : '') + (r.long ? ', ' + r.long + ' too long and skipped' : '') + '.';
        });
        std.addEventListener('click', () => { const r = addMany(STANDARD_WORDS); renderEditor(); const m = $('auDlgBody').querySelector('.au-msg'); if (m) m.textContent = r.added ? 'Added ' + r.added + ' standard words.' : 'They are all in the list already.'; });
        f1.append(add, std); R.append(f1);
        const f2 = el('div', 'au-fl'); const ci = el('input', 'au-in'); ci.placeholder = 'Characters to delete everywhere, for example ,;|'; ci.style.flex = '1';
        const cb2 = el('button', 'au-b', 'Add characters'); cb2.type = 'button';
        cb2.addEventListener('click', () => { let a = 0; for (const c of [...ci.value]) { if (/\s/.test(c) || arr.includes(c)) continue; arr.push(c); a++; } saveLists(); renderEditor(); const m = $('auDlgBody').querySelector('.au-msg'); if (m) m.textContent = 'Added ' + a + ' character(s).'; });
        f2.append(ci, cb2); R.append(f2, msg);
        const sc2 = el('div', 'au-scroll'); R.appendChild(sc2);
        if (!arr.length) sc2.appendChild(el('div', 'au-hint', 'This list is empty.'));
        arr.forEach((w) => {
          const row = el('div', 'au-li'); const t = el('span', 'nm', entryText(w)); t.style.cursor = 'default';
          const x = el('button', 'x', '✕'); x.type = 'button'; x.title = 'Remove from the list';
          x.addEventListener('click', () => { lists[edSel] = lists[edSel].filter((k) => k !== w); saveLists(); renderEditor(); });
          row.append(t, x); sc2.appendChild(row);
        });
      }
      function renderRepTab(body) {
        const f = el('div', 'au-form');
        const row = el('div', 'au-fl'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!cfg.repeatOn; cb.style.cssText = 'width:1.2em;height:1.2em;accent-color:var(--k)';
        cb.addEventListener('change', () => { cfg.repeatOn = cb.checked; saveCfg(); });
        row.append(cb, el('span', '', 'Delete repeating phrases'));
        const lab = el('label', '', 'A line counts as repeating when it is on at least this many percent of the scanned pages');
        const pi = el('input', 'au-in'); pi.type = 'number'; pi.min = '10'; pi.max = '100'; pi.value = String(cfg.repeatPct || 60); pi.style.maxWidth = '8em';
        pi.addEventListener('change', () => { cfg.repeatPct = Math.min(100, Math.max(10, parseInt(pi.value, 10) || 60)); pi.value = String(cfg.repeatPct); saveCfg(); });
        lab.appendChild(pi);
        f.append(row, lab,
          el('div', 'au-hint', 'This removes the menu and footer lines that the school site repeats on every page. It needs at least 3 pages. Lower the percent to delete more, raise it to delete less.'),
          el('div', 'au-hint', 'Delete words always removes extra spaces, dot lines (.....), empty table cells, blank lines and lines without any letter or number, whatever is ticked.'));
        body.appendChild(f);
      }

      /* ---------- editor: allowed websites (which pages a scan may visit) ---------- */
      let pickItems = [], pickChecked = new Set();
      async function openPicker() {
        const body = openDlg('Allowed websites');
        const flt = el('input', 'au-in'); flt.placeholder = 'Filter pages...';
        const f1 = el('div', 'au-fl'); const all = el('button', 'au-b', 'Tick all shown'), none = el('button', 'au-b', 'Untick all shown'); all.type = none.type = 'button';
        const sc = el('div', 'au-scroll'); sc.style.height = '52vh';
        const nm = el('input', 'au-in'); nm.value = cfg.allowName || 'Test 1'; nm.style.maxWidth = '14em'; nm.setAttribute('aria-label', 'Name of this selection');
        const sv = el('button', 'au-b pri', 'Save allowed pages'); sv.type = 'button';
        const msg = el('div', 'au-msg', 'Loading...');
        const f2 = el('div', 'au-fl'); f2.append(el('span', '', 'Name:'), nm, sv);
        f1.append(all, none);
        body.append(el('div', 'au-hint', 'Tick the pages a scan may read (for example the tests page and the homework page). Nothing ticked = scan everything. Run Scan once first so this list has pages in it.'), flt, f1, sc, f2, msg);
        const shown = () => { const q = flt.value.trim().toLowerCase(); return pickItems.filter((i) => !q || i.path.toLowerCase().includes(q) || (i.text || '').toLowerCase().includes(q)); };
        const draw = () => {
          sc.textContent = '';
          shown().forEach((i) => {
            const row = el('label', 'au-li'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = pickChecked.has(i.path);
            cb.addEventListener('change', () => { if (cb.checked) pickChecked.add(i.path); else pickChecked.delete(i.path); });
            const t = el('span'); t.style.flex = '1'; t.append(el('b', '', i.text || '(no label)'), el('small', '', i.path));
            row.append(cb, t); sc.appendChild(row);
          });
        };
        flt.addEventListener('input', draw);
        all.addEventListener('click', () => { shown().forEach((i) => pickChecked.add(i.path)); draw(); });
        none.addEventListener('click', () => { shown().forEach((i) => pickChecked.delete(i.path)); draw(); });
        sv.addEventListener('click', async () => {
          msg.className = 'au-msg'; msg.textContent = 'Saving...';
          try {
            const r = await scanPost('?resource=allowed', { allowed: [...pickChecked] });
            if (settings) settings.allowed = r.allowed;
            cfg.allowName = nm.value.trim() || 'Test 1'; cfg.allowOn = true; cfg.allowKeep = []; saveCfg(); paintCfg();
            msg.textContent = r.allowed.length ? 'Saved. The next scan reads only these ' + r.allowed.length + ' page(s).' : 'Saved. Nothing ticked, so the next scan reads everything.';
          } catch (e) { msg.className = 'au-msg bad'; msg.textContent = 'Could not save: ' + e.message; }
        });
        try {
          const r = await scanApi('?resource=found');
          pickItems = r.found || []; pickChecked = new Set(r.allowed || []);
          (r.allowed || []).forEach((a) => { if (!pickItems.some((i) => i.path === a)) pickItems.unshift({ path: a, text: '' }); });
          draw(); msg.textContent = pickItems.length ? '' : 'No pages known yet. Press Scan once, then come back here.';
        } catch (e) { msg.className = 'au-msg bad'; msg.textContent = 'Could not load: ' + e.message; }
      }

      /* ---------- editor: accounts ---------- */
      async function openDienynasEdit() {
        const body = openDlg('Dienynas account', true);
        try { if (!settings) settings = await scanApi('?resource=settings'); } catch (e) {}
        const s = settings || {};
        const f = el('div', 'au-form');
        const mk = (label, type, val, ph) => { const l = el('label', '', label); const i = el('input', 'au-in'); i.type = type; i.value = val || ''; if (ph) i.placeholder = ph; i.autocomplete = type === 'password' ? 'new-password' : 'off'; l.appendChild(i); f.appendChild(l); return i; };
        const url = mk('Start page', 'text', s.start_url, 'https://www.manodienynas.lt/');
        const user = mk('Username', 'text', s.username);
        const pw = mk('Password', 'password', '', s.hasPassword ? 'Password saved (type to change it)' : 'Password');
        const lab = el('label'); lab.style.cssText = 'display:flex;gap:.5em;align-items:center;font-weight:600;color:var(--k)';
        const ig = el('input'); ig.type = 'checkbox'; ig.checked = !!s.ignore_on; ig.style.accentColor = 'var(--k)';
        lab.append(ig, document.createTextNode('Also cut out the words of the D1 list "scan_ignore" while scanning'));
        const row = el('div', 'au-fl'); const sv = el('button', 'au-b pri', 'Save'), ts = el('button', 'au-b', 'Save and test'); sv.type = ts.type = 'button';
        const msg = el('div', 'au-msg'); row.append(sv, ts);
        f.append(lab, row, msg, el('div', 'au-hint', 'The password is saved encrypted on the server and is never shown again. Leave it empty to keep the saved one.'));
        body.appendChild(f);
        const save = async () => {
          msg.className = 'au-msg'; msg.textContent = 'Saving...';
          const b = { start_url: url.value.trim(), username: user.value.trim(), every: (settings && settings.every) || 'off', hour: settings && settings.hour != null ? settings.hour : 7, ignore_on: ig.checked };
          if (pw.value) b.password = pw.value;
          try { settings = await scanPost('?resource=settings', b); pw.value = ''; pw.placeholder = settings.hasPassword ? 'Password saved (type to change it)' : 'Password'; msg.textContent = 'Saved' + (b.password ? ' (password stored encrypted).' : '.'); setConn('d', 'none'); return true; }
          catch (e) { msg.className = 'au-msg bad'; msg.textContent = 'Could not save: ' + e.message; return false; }
        };
        sv.addEventListener('click', save);
        ts.addEventListener('click', async () => { if (await save()) { closeDlg(); testDienynas(); } });
      }
      function openAgentEdit() {
        const body = openDlg('Agent', true);
        const f = el('div', 'au-form');
        const l1 = el('label', '', 'Model (leave empty for openai/gpt-oss-120b)'); const mi = el('input', 'au-in'); mi.value = cfg.model || ''; mi.placeholder = 'openai/gpt-oss-120b'; l1.appendChild(mi);
        const l2 = el('label', '', 'Most characters sent to the AI at once'); const ci = el('input', 'au-in'); ci.type = 'number'; ci.min = '2000'; ci.max = '60000'; ci.value = String(cfg.maxChars || 16000); l2.appendChild(ci);
        const row = el('div', 'au-fl'); const sv = el('button', 'au-b pri', 'Save'), ts = el('button', 'au-b', 'Save and test'); sv.type = ts.type = 'button'; row.append(sv, ts);
        const msg = el('div', 'au-msg');
        f.append(l1, l2, row, msg, el('div', 'au-hint', 'The AI key is the Cloudflare variable GROQ_API_KEY (Settings, Variables and Secrets). It is never shown here. The free Groq plan allows only a few thousand words per minute, so a smaller text works better.'));
        body.appendChild(f);
        const save = () => { cfg.model = mi.value.trim(); cfg.maxChars = Math.min(60000, Math.max(2000, parseInt(ci.value, 10) || 16000)); saveCfg(); msg.className = 'au-msg'; msg.textContent = 'Saved.'; setConn('a', 'none'); };
        sv.addEventListener('click', save);
        ts.addEventListener('click', () => { save(); closeDlg(); testAgent(); });
      }

      /* ---------- the calendar view (read-only: nothing in it can be clicked) ---------- */
      const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      let calY = null, calM = null, enterT = 0, calSig = '';
      const dkey = (y, m, d) => y + '-' + p2(m + 1) + '-' + p2(d);
      const autoKind = (r) => { const id = String(r && r.id || ''); return id.indexOf('mdtest-') === 0 ? 'Test' : id.indexOf('mdproj-') === 0 ? 'Project' : ''; };
      const isTestEv = (r) => !!autoKind(r);          // made by the Automate button (a test or a project); your normal events are never shown here
      const hm = (min) => p2(Math.floor((min || 0) / 60) % 24) + ':' + p2((min || 0) % 60);
      const evSnap = () => { try { return typeof EventStore !== 'undefined' ? EventStore.getAllSnapshot() : {}; } catch (e) { return {}; } };
      const calVisible = () => !$('testPanel').hidden && $('testPanel').classList.contains('show-cal');
      function paintCal(animate) {
        const grid = $('auCalGrid'); if (!grid) return;
        const now = new Date(); if (calY == null) { calY = now.getFullYear(); calM = now.getMonth(); }
        $('auCalMonth').textContent = MONTHS[calM] + ' ' + calY;
        const lead = (new Date(calY, calM, 1).getDay() + 6) % 7;        // weeks start on Monday
        const snap = evSnap(); calSig = JSON.stringify(snap);
        const todayKey = dkey(now.getFullYear(), now.getMonth(), now.getDate());
        grid.textContent = ''; grid.classList.toggle('anim', !!animate);
        for (let i = 0; i < 42; i++) {
          const d = new Date(calY, calM, 1 - lead + i), key = dkey(d.getFullYear(), d.getMonth(), d.getDate());
          const cell = el('div', 'au-cd' + (d.getMonth() !== calM ? ' out' : '') + (key === todayKey ? ' today' : '')); cell.style.setProperty('--i', i);
          cell.appendChild(el('span', 'dn', String(d.getDate())));
          (snap[key] || []).filter(isTestEv).sort((a, b) => (a.startMinutes || 0) - (b.startMinutes || 0)).forEach((r) => {
            const k = autoKind(r), e = el('div', 'au-ev'); e.style.setProperty('--evc', r.color || '#111'); e.dataset.id = r.id || '';
            e.title = k + ': ' + (r.type || '') + (r.description ? ' - ' + r.description : '');
            e.append(el('span', 'tm', hm(r.startMinutes)), el('span', 'tt', r.type || '(no title)'), el('span', 'au-tag' + (k === 'Test' ? ' t' : ''), k));
            cell.appendChild(e);
          });
          grid.appendChild(cell);
        }
        requestAnimationFrame(fitChips);
      }
      function fitChips() {
        if (!calVisible()) return;
        document.querySelectorAll('#auCalGrid .au-cd').forEach((c) => {
          const chips = Array.from(c.querySelectorAll('.au-ev')); let more = c.querySelector('.au-more'); if (more) more.remove();
          chips.forEach((x) => { x.hidden = false; });
          const over = () => c.scrollHeight > c.clientHeight + 1;
          let hid = 0;
          while (over() && hid < chips.length) { chips[chips.length - 1 - hid].hidden = true; hid++; }
          if (hid) {
            more = el('div', 'au-more', '+' + hid + ' more'); c.appendChild(more);
            while (over() && hid < chips.length) { chips[chips.length - 1 - hid].hidden = true; hid++; more.textContent = '+' + hid + ' more'; }
          }
        });
      }
      function refreshCal() { if (calVisible()) paintCal(false); }
      function setCalMode(v) {
        const p = $('testPanel'); p.classList.toggle('show-cal', v);
        if (v) paintCal(true);
        else { p.classList.add('enter'); clearTimeout(enterT); enterT = setTimeout(() => p.classList.remove('enter'), 1500); paintAll(); }
      }
      function calStep(dm) { if (dm === 0) { calY = calM = null; } else { calM += dm; if (calM < 0) { calM = 11; calY--; } if (calM > 11) { calM = 0; calY++; } } paintCal(true); }

      /* ---------- Clear: remove events between two dates ---------- */
      function openClear() {
        const body = openDlg('Clear the calendar', true); body.style.cssText = 'display:flex;flex-direction:column;gap:.9em';
        const lastDay = new Date(calY == null ? new Date().getFullYear() : calY, (calM == null ? new Date().getMonth() : calM) + 1, 0);
        const y0 = calY == null ? new Date().getFullYear() : calY, m0 = calM == null ? new Date().getMonth() : calM;
        const mk = (label, input) => { const l = el('label', 'au-clr-f', label); l.appendChild(input); return l; };
        const fi = el('input', 'au-in'), ti = el('input', 'au-in'); fi.type = ti.type = 'date';
        fi.value = dkey(y0, m0, 1); ti.value = dkey(y0, m0, lastDay.getDate());
        fi.setAttribute('aria-label', 'From date'); ti.setAttribute('aria-label', 'To date');
        const row = el('div', 'au-clr-row'); row.append(mk('From', fi), mk('To', ti));
        const quick = el('div', 'au-fl');
        const setRange = (a, b) => { fi.value = a; ti.value = b; upd(); };
        const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dkey(d.getFullYear(), d.getMonth(), d.getDate()); };
        const tdy = new Date(), tdk = dkey(tdy.getFullYear(), tdy.getMonth(), tdy.getDate());
        [['This month', () => setRange(dkey(y0, m0, 1), dkey(y0, m0, lastDay.getDate()))],
         ['Next 30 days', () => setRange(tdk, addDays(30))],
         ['Everything', () => setRange('0000-01-01', '9999-12-31')]].forEach(([t, fn]) => { const b = el('button', 'au-b sm alt', t); b.type = 'button'; b.addEventListener('click', fn); quick.appendChild(b); });
        let only = true;
        const seg = el('div', 'au-fl'); const b1 = el('button', 'au-b sm sel', 'Only Automate events'), b2 = el('button', 'au-b sm', 'All events (also my normal ones)'); b1.type = b2.type = 'button';
        const setOnly = (v) => { only = v; b1.classList.toggle('sel', v); b2.classList.toggle('sel', !v); upd(); };
        b1.addEventListener('click', () => setOnly(true)); b2.addEventListener('click', () => setOnly(false)); seg.append(b1, b2);
        const count = el('div', 'au-clr-count');
        const go = el('button', 'au-b pri', 'Clear'), cancel = el('button', 'au-b', 'Cancel'); go.type = cancel.type = 'button';
        const bt = el('div', 'au-fl'); bt.append(go, cancel);
        body.append(el('div', 'au-hint', 'Pick the dates. Every event inside them is taken off the calendar. "Only Automate events" keeps your normal events (sleep, reading and so on); "All events" removes those too.'), row, quick, seg, count, bt);
        let items = [];
        function upd() {
          const snap = evSnap(); items = [];
          Object.keys(snap).forEach((k) => { if (k >= fi.value && k <= ti.value) (snap[k] || []).forEach((r) => { if (!only || isTestEv(r)) items.push({ k, id: r.id }); }); });
          count.textContent = items.length === 0 ? 'Nothing to clear in these dates' : items.length + ' event' + (items.length === 1 ? '' : 's') + ' will be cleared';
          go.disabled = !items.length || !fi.value || !ti.value || fi.value > ti.value; go.textContent = items.length ? 'Clear ' + items.length : 'Clear';
          count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump');
        }
        fi.addEventListener('change', upd); ti.addEventListener('change', upd);
        cancel.addEventListener('click', closeDlg);
        go.addEventListener('click', async () => {
          const todo = items.slice(); closeDlg(); if (!todo.length) return;
          const ids = new Set(todo.map((i) => i.id));
          if (calVisible()) document.querySelectorAll('#auCalGrid .au-ev').forEach((e) => { if (ids.has(e.dataset.id)) e.classList.add('gone'); });
          await new Promise((r) => setTimeout(r, calVisible() ? 480 : 0));
          try {
            await EventStore.whenReady();
            const by = {}; todo.forEach((i) => { (by[i.k] = by[i.k] || new Set()).add(i.id); });
            Object.keys(by).forEach((k) => EventStore.getForDate(k).slice().forEach((rec) => {
              if (by[k].has(rec.id)) { if (typeof detachRecordBox === 'function') detachRecordBox(rec); EventStore.remove(rec); }
            }));
            await EventStore.flushNow();
            finalNote = 'Cleared ' + todo.length + ' event(s) at ' + hhmmss() + '.'; note('CLEAR: ' + todo.length + ' event(s) removed from the calendar (' + fi.value + ' to ' + ti.value + ').');
            if (typeof toast === 'function') toast('Cleared ' + todo.length + ' event' + (todo.length === 1 ? '' : 's'));
          } catch (e) { note('CLEAR: FAILED - ' + e.message); }
          paintFinal(); refreshCal();
        });
        upd();
      }

      /* ---------- turning the dashboard on / off ---------- */
      // the Allowed websites check: off = a scan reads every page (the ticked pages are remembered and come back when you switch it on again)
      async function syncAllowed() {
        try {
          if (!settings) settings = await scanApi('?resource=settings');
          if (cfg.allowOn === false) { if (settings.allowed && settings.allowed.length) cfg.allowKeep = settings.allowed.slice(); }
          const r = await scanPost('?resource=allowed', { allowed: cfg.allowOn === false ? [] : (cfg.allowKeep || []) });
          settings.allowed = r.allowed; saveCfg(); paintCfg();
          note('ALLOWED: ' + (cfg.allowOn === false ? 'switched off, a scan reads every page.' : r.allowed.length ? 'switched on, a scan reads only ' + r.allowed.length + ' page(s).' : 'switched on, but no pages are picked yet (a scan reads every page).'));
        } catch (e) { note('ALLOWED: could not change it - ' + e.message); }
      }
      async function loadSettings() { try { settings = await scanApi('?resource=settings'); paintCfg(); } catch (e) { note('Could not load the diary settings: ' + e.message); } }
      function setOn(v, o) {
        o = o || {};
        if (v === on) return;
        if (v) {
          if (typeof MoneyMode !== 'undefined' && MoneyMode.isOn()) MoneyMode.toggle();
          if (document.body.classList.contains('ads-mode')) monthTab.click();   // turns Ads off
        }
        on = v;
        document.body.classList.toggle('test-mode', on);
        $('testPanel').hidden = !on;
        tab.classList.toggle('active', on);
        if (on) monthTab.classList.remove('active');
        else if (o.tabs !== false && typeof GlobalTopBar !== 'undefined' && GlobalTopBar.currentView() === 'month') monthTab.classList.add('active');
        if (on) {
          loadRemote(); loadSettings();
          scanApi('?resource=latest').then((d) => {
            lastData = d; paintPages();
            if (!logLines.length && d.run && d.run.log) { logLines = d.run.log.split('\n'); logLines.unshift('(log of the last scan)'); paintLog(); }
          }).catch(() => {});
          paintAll();
          $('testPanel').classList.add('show-cal'); calY = calM = null;
          Promise.race([typeof EventStore !== 'undefined' ? EventStore.whenReady() : null, new Promise((r) => setTimeout(r, 700))]).then(() => { if (on) paintCal(true); })
            .then(() => (typeof EventStore !== 'undefined' ? EventStore.whenReady() : null)).then(() => { if (on && calVisible() && JSON.stringify(evSnap()) !== calSig) paintCal(false); }).catch(() => {});
        }
      }
      function paintAll() { paintCfg(); paintSteps(); paintFinal(); paintScanned(); paintAgent(); paintPages(); paintLog(); setConn('d', conn.d, conn.dWhy); setConn('a', conn.a); }

      function link(id, fn) { $(id).addEventListener('click', fn); }
      function bigBox(id, title, getText) {
        $(id).addEventListener('click', () => { if (String(getSelection()).length) return; const t = getText(); if (t) showModal(title, t); });
      }

      // called by the loader in app.js whenever the Test tab is pressed
      function open() {
        if (on) return;
        if (typeof GlobalTopBar !== 'undefined' && GlobalTopBar.currentView() !== 'month') { GlobalTopBar.goToMonthView(); setTimeout(() => setOn(true), 60); }
        else setOn(true);
      }
      function init() {
        tab.style.touchAction = 'manipulation';
        monthTab.addEventListener('click', () => { if (on) setOn(false); });
        dayTab.addEventListener('click', () => { if (on) setOn(false, { tabs: false }); });
        weekTab.addEventListener('click', () => { if (on) setOn(false, { tabs: false }); });
        new MutationObserver(() => { if (on && monthTab.classList.contains('active')) monthTab.classList.remove('active'); }).observe(monthTab, { attributes: true, attributeFilter: ['class'] });
        new MutationObserver(() => { if (on && (document.body.classList.contains('ads-mode') || document.body.classList.contains('money-mode'))) setOn(false, { tabs: false }); })
          .observe(document.body, { attributes: true, attributeFilter: ['class'] });
        $('daysGrid').addEventListener('click', (e) => { if (!on) return; if (e.target.closest('.day-cell')) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

        // calendar view, All controls, Clear
        $('auAllCtl').addEventListener('click', () => setCalMode(false));
        $('auToCal').addEventListener('click', () => setCalMode(true));
        $('auCalPrev').addEventListener('click', () => calStep(-1));
        $('auCalNext').addEventListener('click', () => calStep(1));
        $('auCalToday').addEventListener('click', () => calStep(0));
        $('auClearTop').addEventListener('click', () => { if (on) openClear(); });
        $('auClearCal').addEventListener('click', () => { if (on) openClear(); });
        window.addEventListener('resize', () => { if (calVisible()) fitChips(); });
        // top: Automate + the four buttons
        $('auGo').addEventListener('click', () => runAll(false));
        document.querySelectorAll('.au-btns .au-b').forEach((b) => b.addEventListener('click', () => runOne(b.dataset.do)));

        // check marks
        const tog = { auRunOn: 'runOn', auTopChk: 'runOn', auDelOn: 'delOn', auRepOn: 'repeatOn', auAgentOn: 'agentOn', auAllowOn: 'allowOn' };
        Object.keys(tog).forEach((id) => $(id).addEventListener('click', () => {
          const k = tog[id]; cfg[k] = !cfg[k];
          if ((id === 'auRunOn' || id === 'auTopChk') && cfg.runOn) { const s = lastSlot(); if (s && (!cfg.lastAuto || new Date(cfg.lastAuto) < s)) cfg.lastAuto = new Date().toISOString(); }   // starts at the NEXT slot
          saveCfg(); paintCfg(); if (id === 'auAllowOn') syncAllowed();
        }));
        $('auEvery').addEventListener('change', () => { cfg.every = $('auEvery').value; saveCfg(); paintCfg(); });
        $('auDow').addEventListener('change', () => { cfg.dow = parseInt($('auDow').value, 10); saveCfg(); });
        $('auTime').addEventListener('change', () => { if ($('auTime').value) { cfg.time = $('auTime').value; saveCfg(); } });
        const codeMsg = (m, bad) => { const e = $('auCodeMsg'); e.textContent = m; e.style.color = bad ? 'var(--r)' : ''; };
        const setDirty = (d) => { codeDirty = d; $('auSaveCode').classList.toggle('dirty', d); codeMsg(d ? 'Not saved yet - press Save' : ''); };
        $('auPrompt').addEventListener('input', () => { cfg.prompt = $('auPrompt').value; setDirty(true); });
        $('auSaveCode').addEventListener('click', () => { cfg.prompt = $('auPrompt').value; saveCfg(); setDirty(false); codeMsg('Saved \u2713'); setTimeout(() => { if (!codeDirty) codeMsg(''); }, 2200); });
        $('auResetCode').addEventListener('click', () => { if (!confirm('Put the default agent code back? (Press Save afterwards to keep it.)')) return; $('auPrompt').value = DEF_PROMPT; cfg.prompt = DEF_PROMPT; setDirty(true); });
        $('auClock').addEventListener('click', () => { const t = $('auTime'); try { if (t.showPicker) t.showPicker(); else t.focus(); } catch (e) { t.focus(); } });

        // links
        link('auEditDel', () => openLists('lists'));
        link('auEditRep', () => openLists('rep'));
        link('auPickPages', openPicker);
        link('auDTest', testDienynas); link('auDEdit', openDienynasEdit);
        link('auATest', testAgent); link('auAEdit', openAgentEdit);

        // click a box = see everything in a big pop-up
        bigBox('auScanned', 'Scanned text (' + 'working copy)', () => work.c);
        bigBox('auAgentOut', 'Agent response', () => resp.t);
        bigBox('auFinal', 'Final product', () => $('auFinal').textContent);
        bigBox('auLog', 'Current work', () => logLines.concat(srvLog ? srvLog.split('\n') : []).join('\n'));

        // Fetched Pages: the mouse wheel moves the row sideways
        $('auPages').addEventListener('wheel', (e) => {
          const s = e.currentTarget; if (s.scrollWidth <= s.clientWidth) return;
          e.preventDefault(); s.scrollLeft += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        }, { passive: false });

        // pop-ups
        $('testModalClose').addEventListener('click', closeModal);
        $('testModalCopy').addEventListener('click', copyModal);
        $('testModal').addEventListener('click', (e) => { if (e.target === $('testModal')) closeModal(); });
        $('auDlgClose').addEventListener('click', closeDlg);
        $('auDlg').addEventListener('click', (e) => { if (e.target === $('auDlg')) closeDlg(); });
        document.addEventListener('keydown', (e) => {
          if (e.key !== 'Escape') return;
          if ($('testModal').classList.contains('show')) closeModal(); else if ($('auDlg').classList.contains('show')) closeDlg();
        });

        // instant tooltips: the browser's own title tooltip waits about a second, this one shows at once
        const tip = el('div', 'au-tip'); document.body.appendChild(tip); let tipEl = null;
        const tipHide = () => { tipEl = null; tip.classList.remove('show'); };
        document.addEventListener('pointerover', (e) => {
          if (e.pointerType === 'touch') return;
          const t = e.target.closest ? e.target.closest('#testPanel [title], #testPanel [data-tip], .au-modal [title], .au-modal [data-tip]') : null;
          if (!t || t === tipEl) return;
          if (t.hasAttribute('title')) { t.dataset.tip = t.getAttribute('title'); t.removeAttribute('title'); }
          if (!t.dataset.tip) return;
          tipEl = t; tip.textContent = t.dataset.tip; tip.classList.add('show');
          const r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
          tip.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px';
          tip.style.top = (r.top - h - 8 < 6 ? r.bottom + 8 : r.top - h - 8) + 'px';
        });
        document.addEventListener('pointerout', (e) => { if (tipEl && !(e.relatedTarget && tipEl.contains(e.relatedTarget))) tipHide(); });
        document.addEventListener('pointerdown', tipHide);
        paintAll();
        setTimeout(loadRemote, 2500);
        setTimeout(schedTick, 6000);
        setInterval(schedTick, 30000);
      }
      init();
      return { isOn: () => on, open };
    })();

  window.__TestTab = TestMode;
})();
