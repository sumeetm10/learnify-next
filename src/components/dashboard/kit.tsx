import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * Shared dashboard design kit — used by both the teacher and student
 * dashboards so they render with the exact same look. Change styles
 * here and both dashboards update together.
 * ------------------------------------------------------------------ */

// Parse a raw CSS declaration string into a React style object so the
// design's exact inline styles can be reused verbatim.
export function s(str: string): CSSProperties {
  const o: Record<string, string> = {};
  for (const decl of str.split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const rawKey = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!rawKey || !val) continue;
    const key = rawKey.startsWith("--")
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
    o[key] = val;
  }
  return o as CSSProperties;
}

// Small SVG helper (24x24, rounded caps/joins by default).
export function I({
  w = 19,
  h,
  sw = 1.9,
  stroke = "currentColor",
  fill = "none",
  children,
}: {
  w?: number;
  h?: number;
  sw?: number;
  stroke?: string;
  fill?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={w}
      height={h ?? w}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/* -------------------------------- icons -------------------------------- */
export const IcDashboard = (
  <I>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </I>
);
export const IcMaterials = (
  <I>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
  </I>
);
export const IcQuizzes = (
  <I>
    <path d="M9 11l3 3 8-8" />
    <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
  </I>
);
export const IcAnalytics = (
  <I>
    <path d="M3 3v18h18" />
    <rect x="7" y="11" width="3" height="6" rx="1" />
    <rect x="12" y="7" width="3" height="10" rx="1" />
    <rect x="17" y="9" width="3" height="8" rx="1" />
  </I>
);
export const IcCourses = (
  <I>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 12l9 5 9-5" />
    <path d="M3 16l9 5 9-5" />
  </I>
);
export const IcAnnounce = (
  <I>
    <path d="M3 11l14-6v14L3 13z" />
    <path d="M3 11v2a2 2 0 0 0 2 2h1" />
    <path d="M8 15v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
  </I>
);
export const IcProfile = (
  <I>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
  </I>
);
export const IcFile = (w = 18) => (
  <I w={w}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </I>
);
export const IcPlus = (w = 15, sw = 2.4) => (
  <I w={w} sw={sw}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const IcEye = (
  <I w={15} sw={2}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </I>
);
export const IcTrash = (
  <I w={15} sw={2}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </I>
);
export const IcPaper = (
  <I w={17} sw={2}>
    <path d="M3 11l14-6v14L3 13z" />
  </I>
);
export const IcChart = (
  <I w={17} sw={2}>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-6" />
  </I>
);
export const IcBook = (
  <I w={17}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </I>
);
// extra icons used by the student dashboard
export const IcPlay = (w = 16) => (
  <I w={w} sw={2}>
    <path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" />
  </I>
);
export const IcClock = (w = 17) => (
  <I w={w} sw={2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </I>
);
export const IcCheck = (w = 17) => (
  <I w={w} sw={2}>
    <path d="M20 6L9 17l-5-5" />
  </I>
);
export const IcTarget = (w = 17) => (
  <I w={w} sw={2}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </I>
);

/* --------------------------- scoped styles --------------------------- */
export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
/* Light palette (default) — matches the site's light theme. */
.tdscope{
  --bg:#f6f7fb; --bg2:#eef1f7; --sidebar:#ffffff; --card:#ffffff; --card2:#ffffff;
  --border:rgba(15,23,42,.09); --border2:rgba(15,23,42,.16);
  --text:#1e293b; --muted:#5a6b82; --faint:#8695a9;
  --accent:#4f86c6; --accent-h:#3f6fac; --accent-soft:rgba(79,134,198,.12);
  --green:#3f9a76; --green-soft:rgba(63,154,118,.13);
  --amber:#b7902f; --amber-soft:rgba(183,144,47,.14);
  --red:#c9534d; --red-soft:rgba(201,83,77,.12);
  --topbar:rgba(255,255,255,.72);
  color:var(--text);-webkit-font-smoothing:antialiased;
  transition:background-color .3s ease,color .3s ease;
}
/* Dark palette — near-black cards on a slate-950 base, like the admin panel. */
.dark .tdscope{
  --bg:#060910; --bg2:#0d1421; --sidebar:#080c15; --card:#0f1626; --card2:#141d2e;
  --border:rgba(148,163,184,.11); --border2:rgba(148,163,184,.19);
  --text:#eef2f8; --muted:#94a3b8; --faint:#5f6d80;
  --accent:#4f86c6; --accent-h:#5f97d8; --accent-soft:rgba(79,134,198,.16);
  --green:#22c55e; --green-soft:rgba(34,197,94,.15);
  --amber:#f59e0b; --amber-soft:rgba(245,158,11,.15);
  --red:#ef4444; --red-soft:rgba(239,68,68,.15);
  --topbar:rgba(6,9,16,.72);
}
.tdscope *{box-sizing:border-box}
.tdscope a{color:var(--accent);text-decoration:none}
.tdscope a:hover{color:var(--accent-h)}
.tdscope ::-webkit-scrollbar{width:10px;height:10px}
.tdscope ::-webkit-scrollbar-thumb{background:rgba(148,163,184,.18);border-radius:8px;border:2px solid var(--bg)}
.tdscope ::-webkit-scrollbar-thumb:hover{background:rgba(148,163,184,.3)}
.tdscope input::placeholder,.tdscope textarea::placeholder{color:var(--faint)}
.tdscope .h-primary:hover{background:var(--accent-h)!important}
.tdscope .h-bell:hover{border-color:var(--border2)!important}
.tdscope .h-row:hover{background:var(--bg2)!important}
.tdscope .h-qa:hover{border-color:var(--accent)!important;background:var(--accent-soft)!important}
.tdscope .h-accent:hover{border-color:var(--accent)!important;color:var(--accent)!important}
.tdscope .h-del:hover{border-color:var(--red)!important;color:var(--red)!important}
.tdscope .h-drop:hover{border-color:var(--accent)!important}
.tdscope .h-input:focus{border-color:var(--accent)!important}
.tdscope .h-search:focus-within{border-color:var(--accent)!important}
/* subtle motion — gentle card lift + staggered entrance for the stat row */
.tdscope .h-card{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.tdscope .h-card:hover{border-color:var(--border2)!important;transform:translateY(-3px);box-shadow:0 12px 30px rgba(2,6,20,.14)}
.tdscope .h-stat{animation:fadeUp .5s cubic-bezier(.2,.7,.3,1) both;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.tdscope .h-stat:hover{transform:translateY(-3px);border-color:var(--border2)!important;box-shadow:0 12px 30px rgba(2,6,20,.14)}
.tdscope .h-stat:nth-child(1){animation-delay:.03s}
.tdscope .h-stat:nth-child(2){animation-delay:.1s}
.tdscope .h-stat:nth-child(3){animation-delay:.17s}
.tdscope .h-stat:nth-child(4){animation-delay:.24s}
.tdscope .h-row{transition:background .15s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes popIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){
  .tdscope .h-stat{animation:none}
  .tdscope .h-card:hover,.tdscope .h-stat:hover{transform:none}
}
/* ---- responsive: the sidebar becomes an off-canvas drawer; grids/tables reflow ---- */
.tdscope .td-burger{display:none}
@media (max-width: 900px){
  .tdscope{padding-top:72px!important}
  .tdscope .td-side{position:fixed;top:0;left:0;bottom:0;z-index:80;transform:translateX(-100%);transition:transform .25s ease;box-shadow:0 20px 60px rgba(0,0,0,.5)}
  .tdscope .td-side.open{transform:translateX(0)}
  .tdscope .td-burger{display:flex!important}
  .tdscope .td-top{padding:0 14px!important;gap:10px!important}
  .tdscope .h-search{display:none!important}
  .tdscope .td-main{padding:16px!important}
  /* minmax(0,1fr) lets the tracks shrink below their content so the grid
     never forces the page wider than the viewport on small screens. */
  .tdscope .td-g4{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .tdscope .td-gmain,.tdscope .td-g2,.tdscope .td-g3{grid-template-columns:minmax(0,1fr)!important}
  .tdscope .td-scroll{overflow-x:auto!important}
  .tdscope .td-trow{min-width:560px}
}
@media (min-width: 901px){
  .tdscope .td-overlay{display:none}
}
@media (max-width: 480px){
  /* keep the stat cards 2-up (not 1) so they stay compact and sections
     aren't pushed far down the page; trim their padding a little too. */
  .tdscope .h-stat{padding:15px!important}
  .tdscope .td-title{font-size:16px!important}
  .tdscope .td-sub{display:none}
  .tdscope .td-main{padding:13px!important}
}
`;
