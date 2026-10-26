// KREA · prototipo navegable. Sin build: se sirve desde la raíz del repo
// (`bunx serve .` → http://localhost:3000/design/prototype/).
// Datos: data/seed/*.json (de Notas.xlsx). Estado del prototipo: localStorage + BroadcastChannel
// para que un cambio del profesor en una pestaña anime el ranking en otra (D011).

const SEED = "../../data/seed/";
const STORE_KEY = "krea-proto-v1";
const TEACHER = { cedula: "12345678", nombres: "Profesor", apellidos: "Demo", rol: "profe" };
const STYLES = [
  ["adventurer-neutral", "Aventurero"],
  ["fun-emoji", "Emoji"],
  ["bottts-neutral", "Robot"],
  ["notionists-neutral", "Boceto"],
];
const ACCENTS = [
  ["azul", "Azul", "#295ac3"],
  ["rojo", "Rojo", "#ee0400"],
  ["verde", "Verde", "#115445"],
  ["morado", "Morado", "#734ad1"],
];
const REASONS = [
  ["inasistencia", "No estuvo en clase", -2],
  ["atencion", "No prestó atención", -1],
  ["respeto", "Falta de respeto", -3],
  ["celular", "Uso del celular en clase", -1],
  ["participacion", "Participación destacada", 2],
  ["ayuda", "Ayudó a un compañero", 1],
  ["extra", "Trabajo extra", 2],
  ["otro", "Otro (explicar)", 0],
];
const TEAM_COLORS = ["#ee0400", "#115445", "#734ad1", "#295ac3", "#c2410c", "#0e7490"];

// ---------- utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (n) => (n == null ? "—" : new Intl.NumberFormat("es-VE", { maximumFractionDigits: 1 }).format(n));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** D004: degradado continuo 1 rojo intenso → 10 amarillo intenso → 20 verde intenso. */
export function gradeColor(n) {
  const v = Math.max(1, Math.min(20, n));
  if (v <= 10) {
    const t = (v - 1) / 9;
    return `hsl(${t * 52} 100% ${52 - t * 4}%)`;
  }
  const t = (v - 10) / 10;
  return `hsl(${52 + t * 88} ${100 - t * 30}% ${48 - t * 14}%)`;
}
/** D006: nota final = puntaje sobre 20 × base / 20. */
const applyBase = (raw, base) => (raw == null ? null : Math.round(((raw * base) / 20) * 2) / 2);
/** D007: una nota aporta puntos solo si es ≥ 10. */
const gradePoints = (g) => (g != null && g >= 10 ? g : 0);

function gradePill(g, { lg = false, base } = {}) {
  if (g == null) return `<span class="grade pending${lg ? " lg" : ""}">Pendiente</span>`;
  const fail = g < 10 ? ` <small>Raspado</small>` : "";
  const b = base && base < 20 ? ` <small>/ ${fmt(base)}</small>` : "";
  return `<span class="grade${lg ? " lg" : ""}" style="--g:${gradeColor(g)}" aria-label="Nota ${fmt(g)}${g < 10 ? ", raspado" : ""}">${fmt(g)}${b}${fail}</span>`;
}
const avatarUrl = (a) => `https://api.dicebear.com/9.x/${a.style}/svg?seed=${encodeURIComponent(a.seed)}&radius=50`;
const initials = (s) => s.split(" ").map((w) => w[0]).slice(0, 2).join("");

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.hidden = true), 2600);
}
const announce = (msg) => ($("#live").textContent = msg);

// ---------- estado ----------
let DB; // seed
let S = loadState();
const channel = "BroadcastChannel" in window ? new BroadcastChannel("krea-proto") : null;

function loadState() {
  try {
    return { prefs: {}, avatars: {}, overrides: {}, adjustments: [], tasks: [], grades: {}, submissions: {}, teamLogos: {}, captains: {}, session: null, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { prefs: {}, avatars: {}, overrides: {}, adjustments: [], tasks: [], grades: {}, submissions: {}, teamLogos: {}, captains: {}, session: null };
  }
}
function save(broadcast = true) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch {}
  if (broadcast) channel?.postMessage("change");
}
channel?.addEventListener("message", () => {
  const prevRanking = location.hash.startsWith("#/ranking") ? snapshotRanks() : null;
  S = loadState();
  render(prevRanking);
});

async function loadSeed() {
  const [alumnos, grupos, tarea] = await Promise.all(
    ["alumnos", "grupos", "tarea-identidad-marca"].map((f) => fetch(SEED + f + ".json").then((r) => r.json())),
  );
  return { alumnos, grupos, tarea };
}

// Tareas del prototipo: la individual real del Excel + ejemplos (marcados como ejemplo).
function allTasks() {
  const t = DB.tarea;
  const base = [
    { id: t.id, titulo: t.titulo, tipo: "individual", estado: "evaluada", fecha: "2026-10-10", preguntas: t.preguntas },
    { id: "logo-y-paleta", titulo: "Logo y paleta de la marca", tipo: "grupal", estado: "evaluada", fecha: "2026-10-17", premio: "Cuenta Canva Pro por 3 meses para todo el equipo", preguntas: null },
    {
      id: "presentacion-producto", titulo: "Presentación del producto", tipo: "grupal", estado: "abierta", fecha: "2026-11-07",
      premio: "Salida al cine con todo pago",
      preguntas: [
        { id: "p1", enunciado: "Sube una foto del prototipo de tu producto", formato: "imagen", valor: 6 },
        { id: "p2", enunciado: "¿A qué precio lo venderían y por qué?", formato: "texto", valor: 4 },
        { id: "p3", enunciado: "Escribe el guion de 1 minuto para presentarlo", formato: "texto", valor: 6 },
        { id: "p4", enunciado: "Sube el afiche de lanzamiento", formato: "imagen", valor: 4 },
      ],
    },
    {
      id: "competencia", titulo: "Análisis de la competencia", tipo: "individual", estado: "abierta", fecha: "2026-11-03",
      preguntas: [
        { id: "p1", enunciado: "Nombra 3 marcas que vendan lo mismo que tu equipo", formato: "texto", valor: 6 },
        { id: "p2", enunciado: "¿Qué hacen mejor que ustedes?", formato: "texto", valor: 7 },
        { id: "p3", enunciado: "Sube una captura del perfil de una de ellas", formato: "imagen", valor: 7 },
      ],
    },
  ];
  return [...base, ...S.tasks];
}

function student(ced) {
  const a = DB.alumnos.find((x) => x.cedula === ced);
  if (!a) return null;
  return { ...a, ...(S.overrides[ced] || {}) };
}
function students(section) {
  return DB.alumnos.filter((a) => !section || a.seccion === section).map((a) => student(a.cedula));
}
function team(id) {
  const g = DB.grupos.find((x) => x.id === id);
  if (!g) return null;
  return { ...g, capitanCedula: S.captains[id] ?? g.capitanCedula, logo: S.teamLogos[id] };
}
const teamsOf = (section) => DB.grupos.filter((g) => g.seccion === section).map((g) => team(g.id));
const members = (teamId) => students().filter((a) => a.grupoId === teamId);
const avatarOf = (ced) => S.avatars[ced] || { style: "adventurer-neutral", seed: ced };

/** Nota individual de una tarea: evaluación guardada en el prototipo o la del Excel. */
function individualEval(ced, taskId) {
  if (S.grades[`${taskId}:${ced}`]) return S.grades[`${taskId}:${ced}`];
  if (taskId === DB.tarea.id) {
    const e = DB.tarea.evaluaciones.find((x) => x.cedula === ced);
    if (e) return { puntos: e.puntos, comentarios: autoComments(e.puntos, DB.tarea.preguntas), importada: true };
  }
  return null;
}
function autoComments(puntos, preguntas) {
  return puntos.map((p, i) => (p === preguntas[i].valor ? "¡Excelente! Respuesta completa." : p === 0 ? "No respondiste esta pregunta." : ""));
}
function studentGrade(ced) {
  const a = student(ced);
  const ev = individualEval(ced, DB.tarea.id);
  const raw = ev ? ev.puntos.reduce((s, x) => s + x, 0) : a.notaIndividual;
  return applyBase(raw, a.baseEvaluacion ?? 20);
}
function teamGrade(teamId) {
  const t = team(teamId);
  return t?.notaGrupal ?? null;
}
const adjustmentsFor = (kind, id) => S.adjustments.filter((x) => x.kind === kind && x.id === id);
const sumAdj = (list) => list.reduce((s, x) => s + x.valor, 0);
function studentPoints(ced) {
  const a = student(ced);
  return gradePoints(studentGrade(ced)) + gradePoints(a.grupoId ? teamGrade(a.grupoId) : null) + sumAdj(adjustmentsFor("alumno", ced));
}
function teamPoints(id) {
  return gradePoints(teamGrade(id)) + sumAdj(adjustmentsFor("equipo", id));
}
function ranking(kind, section) {
  const rows = kind === "alumnos"
    ? students(section).map((a) => ({ id: a.cedula, name: `${a.nombres.split(" ")[0]} ${a.apellidos.split(" ")[0]}`, pts: studentPoints(a.cedula), avatar: avatarUrl(avatarOf(a.cedula)) }))
    : teamsOf(section).map((t, i) => ({ id: t.id, name: t.nombre.replace(/^\w+-/, ""), pts: teamPoints(t.id), logo: t.logo, color: TEAM_COLORS[i % TEAM_COLORS.length] }));
  rows.sort((x, y) => y.pts - x.pts || x.name.localeCompare(y.name));
  let pos = 0, last = null;
  rows.forEach((r, i) => { if (r.pts !== last) { pos = i + 1; last = r.pts; } r.pos = pos; });
  return rows;
}

// ---------- tema y acento ----------
function applyPrefs() {
  const p = prefs();
  const root = document.documentElement;
  root.dataset.theme = p.theme;
  root.dataset.accent = p.accent;
  root.classList.toggle("sys-dark", p.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyPrefs);
function prefs() {
  const key = S.session?.cedula || "anon";
  return { theme: "system", accent: "azul", ...(S.prefs[key] || {}) };
}
function setPref(k, v) {
  const key = S.session?.cedula || "anon";
  S.prefs[key] = { ...prefs(), [k]: v };
  save(false);
  applyPrefs();
}

// ---------- logo ----------
let LOGO = "";
async function loadLogo() {
  LOGO = await fetch("../../public/brand/krea-logo.svg").then((r) => r.text()).catch(() => "<strong>KREA</strong>");
}
const logo = (cls = "") => `<span class="logo ${cls}">${LOGO.replace('id="krea-logo-title"', `id="t${Math.random().toString(36).slice(2, 7)}"`)}</span>`;

// ---------- iconos (trazo 2px, 24px) ----------
const I = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  grade: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5"/>',
  task: '<path d="M9 4h6v3H9z"/><path d="M6 6h12v15H6z"/><path d="M9 13l2 2 4-4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M10 17h4"/>',
  team: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 1.5 6 4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  users: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/><path d="M19 4v4M17 6h4"/>',
  plusminus: '<path d="M6 4v6M3 7h6M15 7h6M4 17h16"/>',
  gift: '<path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/><path d="M12 7C9 2 6 5 8 7M12 7c3-5 6-2 4 0"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/>',
  text: '<path d="M5 6h14M5 12h14M5 18h9"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};
const icon = (n, label) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} width="24" height="24">${I[n]}</svg>`;

// ---------- router ----------
const NAV_STUDENT = [
  ["#/inicio", "Inicio", "home"],
  ["#/notas", "Notas", "grade"],
  ["#/tareas", "Tareas", "task"],
  ["#/ranking", "Ranking", "trophy"],
  ["#/equipo", "Equipo", "team"],
  ["#/perfil", "Perfil", "user"],
];
const NAV_TEACHER = [
  ["#/profe", "Panel", "home"],
  ["#/profe/evaluar", "Evaluar", "check"],
  ["#/profe/tareas", "Tareas", "task"],
  ["#/profe/alumnos", "Alumnos", "users"],
  ["#/profe/equipos", "Equipos", "team"],
  ["#/profe/puntos", "Puntos", "plusminus"],
  ["#/ranking", "Ranking", "trophy"],
  ["#/profe/premios", "Premios", "gift"],
];

const routes = [
  [/^#\/ingresar$/, viewLogin, { public: true }],
  [/^#\/recuperar$/, viewRecover, { public: true }],
  [/^#\/recuperar\/enviado$/, viewRecoverSent, { public: true }],
  [/^#\/inicio$/, viewHome],
  [/^#\/notas$/, viewGrades],
  [/^#\/notas\/([\w-]+)$/, viewGradeDetail],
  [/^#\/tareas$/, viewTasks],
  [/^#\/tareas\/([\w-]+)$/, viewSubmit],
  [/^#\/equipo$/, viewTeam],
  [/^#\/ranking$/, viewRanking],
  [/^#\/perfil$/, viewProfile],
  [/^#\/profe$/, viewTeacherHome, { teacher: true }],
  [/^#\/profe\/alumnos$/, viewStudents, { teacher: true }],
  [/^#\/profe\/equipos$/, viewTeams, { teacher: true }],
  [/^#\/profe\/tareas$/, viewTeacherTasks, { teacher: true }],
  [/^#\/profe\/tareas\/nueva$/, viewBuilder, { teacher: true }],
  [/^#\/profe\/evaluar$/, viewGradeQueue, { teacher: true }],
  [/^#\/profe\/evaluar\/([\w-]+)\/(\d+)$/, viewGrading, { teacher: true }],
  [/^#\/profe\/puntos$/, viewPoints, { teacher: true }],
  [/^#\/profe\/premios$/, viewPrizes, { teacher: true }],
  [/^#\/estados$/, viewStates, { public: true }],
  [/^#\/500$/, () => statusScreen("500"), { public: true }],
  [/^#\/sin-conexion$/, () => statusScreen("offline"), { public: true }],
];

const me = () => S.session;
const isTeacher = () => me()?.rol === "profe";

function render(prevRanks) {
  applyPrefs();
  const hash = location.hash || (me() ? (isTeacher() ? "#/profe" : "#/inicio") : "#/ingresar");
  if (!location.hash) history.replaceState(null, "", hash);
  let match, view, opts = {};
  for (const [re, fn, o] of routes) {
    match = hash.match(re);
    if (match) { view = fn; opts = o || {}; break; }
  }
  const app = $("#app");
  if (!view) { app.innerHTML = me() ? shell(statusScreen("404")) : statusScreen("404"); return; }
  if (!opts.public && !me()) { location.hash = "#/ingresar"; return; }
  if (opts.teacher && !isTeacher()) { app.innerHTML = shell(statusScreen("404")); return; }
  const html = view(...match.slice(1));
  app.innerHTML = opts.public ? protoBar() + html : shell(html);
  $$("[data-bind]").forEach((el) => bindings[el.dataset.bind]?.(el));
  if (hash.startsWith("#/ranking")) animateRanking(prevRanks);
  const h1 = $("main h1, .auth-card h1, .status-screen h1");
  if (render.last !== hash) { h1?.setAttribute("tabindex", "-1"); h1?.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  render.last = hash;
  document.title = `${h1?.textContent?.trim() || "KREA"} · KREA`;
}
window.addEventListener("hashchange", () => render());

function protoBar() {
  return `<div class="proto-bar" role="note"><span>Prototipo de diseño · datos de Notas.xlsx</span>
    <a href="#/ingresar">Ingresar</a><a href="#/estados">Estados</a>
    ${me() ? `<button data-bind="switchRole">Ver como ${isTeacher() ? "estudiante" : "profesor"}</button>` : ""}
    <button data-bind="resetProto">Reiniciar datos</button></div>`;
}

function shell(content) {
  const nav = isTeacher() ? NAV_TEACHER : NAV_STUDENT;
  const cur = "#/" + (location.hash.split("/")[1] || "") + (location.hash.startsWith("#/profe/") ? "/" + location.hash.split("/")[2] : "");
  const link = ([href, label, ic]) => `<a href="${href}" ${cur === href || (href !== "#/profe" && location.hash.startsWith(href + "/")) ? 'aria-current="page"' : ""}>${icon(ic)}<span>${label}</span></a>`;
  const u = me();
  const name = isTeacher() ? `${TEACHER.nombres} ${TEACHER.apellidos}` : student(u.cedula).nombres.split(" ")[0];
  const tab = isTeacher() ? nav.filter((n) => ["#/profe", "#/profe/evaluar", "#/profe/alumnos", "#/profe/puntos", "#/ranking"].includes(n[0])) : nav.filter((n) => n[0] !== "#/tareas");
  return `${protoBar()}<div class="shell">
    <nav class="sidebar" aria-label="Principal">${logo()}${nav.map(link).join("")}
      <a href="#/ingresar" data-bind="logout" style="margin-top:auto">${icon("logout")}<span>Salir</span></a></nav>
    <header class="topbar">${logo()}<span class="spacer"></span>
      ${isTeacher() ? '<span class="role-chip">Profesor</span>' : ""}
      <a href="${isTeacher() ? "#/profe" : "#/perfil"}" class="row" style="text-decoration:none;color:inherit" aria-label="Perfil de ${esc(name)}">
        <span class="small" style="font-weight:700">${esc(name)}</span>
        ${isTeacher() ? `<span class="avatar" style="display:grid;place-items:center;font-weight:700">PD</span>` : `<img class="avatar" alt="" src="${avatarUrl(avatarOf(u.cedula))}">`}
      </a></header>
    <main id="main">${content}</main>
    <nav class="tabbar" aria-label="Principal">${tab.map(link).join("")}</nav>
  </div>`;
}

// ---------- vistas públicas ----------
function viewLogin() {
  return `<div class="auth"><div class="auth-card card stack">
    ${logo()}
    <h1 style="text-align:center">¡Hola de nuevo!</h1>
    <p class="muted" style="text-align:center">Entra con tu cédula y la contraseña que te dio tu profe.</p>
    <form class="stack" data-bind="loginForm" novalidate>
      <div class="field"><label for="ced">Cédula</label>
        <input class="input" id="ced" name="ced" inputmode="numeric" autocomplete="username" placeholder="Ej. 33272397" aria-describedby="ced-err">
        <span id="ced-err" class="error-text" hidden></span></div>
      <div class="field"><label for="pw">Contraseña</label>
        <input class="input" id="pw" name="pw" type="password" autocomplete="current-password"></div>
      <button class="btn btn-primary btn-block" type="submit">Entrar</button>
      <a href="#/recuperar" style="text-align:center;font-weight:700">Olvidé mi contraseña</a>
    </form>
    <div class="demo-hints"><span class="eyebrow">Cuentas de prueba (cualquier contraseña)</span>
      <button data-fill="33272397">Yeilin Duarte · 5A · capitana de Repostería</button>
      <button data-fill="33368217">Camila Flórez · 5A · tarea pendiente</button>
      <button data-fill="34098906">María de los Ángeles Méndez · 5A · raspada</button>
      <button data-fill="${TEACHER.cedula}">Profesor demo</button>
    </div></div></div>`;
}
function viewRecover() {
  return `<div class="auth"><div class="auth-card card stack">${logo()}
    <h1 style="text-align:center">Recupera tu contraseña</h1>
    <p class="muted">Escribe tu cédula. Te enviaremos un enlace al correo que tienes registrado para que crees una nueva.</p>
    <form class="stack" data-bind="recoverForm" novalidate>
      <div class="field"><label for="rced">Cédula</label><input class="input" id="rced" inputmode="numeric" autocomplete="username"></div>
      <button class="btn btn-primary btn-block">Enviar enlace</button>
      <a href="#/ingresar" style="text-align:center;font-weight:700">Volver a entrar</a></form></div></div>`;
}
function viewRecoverSent() {
  return `<div class="auth"><div class="auth-card card stack" style="text-align:center">${logo()}
    <div style="font-size:48px" aria-hidden="true">📬</div>
    <h1>Revisa tu correo</h1>
    <p class="muted">Si la cédula está registrada, enviamos un enlace a <strong>y••••@gmail.com</strong>. Vence en 1 hora. Revisa también la carpeta de spam.</p>
    <p class="small muted">¿No tienes acceso a ese correo? Pídele a tu profe que te asigne una contraseña nueva.</p>
    <a class="btn btn-ghost btn-block" href="#/ingresar">Volver a entrar</a></div></div>`;
}

// ---------- estudiante ----------
function viewHome() {
  const a = student(me().cedula);
  const g = studentGrade(a.cedula);
  const t = a.grupoId ? team(a.grupoId) : null;
  const rank = ranking("alumnos", a.seccion);
  const mine = rank.find((r) => r.id === a.cedula);
  const pending = allTasks().filter((x) => x.estado === "abierta" && !S.submissions[`${x.id}:${x.tipo === "grupal" ? a.grupoId : a.cedula}`]);
  return `<div class="page-head"><span class="eyebrow">${a.seccion} · 5.º año</span><h1>¡Hola, ${esc(a.nombres.split(" ")[0])}!</h1></div>
  <div class="stack-lg">
    <div class="grid-2">
      <section class="hero-card stack" aria-labelledby="h-pts"><span class="eyebrow" id="h-pts">Tus puntos</span>
        <div class="row" style="align-items:baseline"><span class="num" style="font-size:56px;line-height:1">${fmt(mine.pts)}</span><span>pts</span></div>
        <p>Puesto <strong>#${mine.pos}</strong> de ${rank.length} en ${a.seccion}</p>
        <a href="#/ranking" class="btn" style="background:var(--surface);color:var(--accent-ink);justify-self:start">Ver ranking</a></section>
      <section class="card stack" aria-labelledby="h-notas"><h2 id="h-notas">Tus notas</h2>
        <a class="list-item card-link" href="#/notas/${DB.tarea.id}"><div class="grow"><strong>Individual</strong><div class="small muted">${esc(DB.tarea.titulo)}</div></div>${gradePill(g, { base: a.baseEvaluacion })}</a>
        <a class="list-item card-link" href="#/notas/logo-y-paleta"><div class="grow"><strong>Grupal</strong><div class="small muted">${t ? esc(t.nombre) : "Sin equipo"}</div></div>${gradePill(t ? teamGrade(t.id) : null)}</a>
        ${a.baseEvaluacion < 20 ? `<p class="small"><span class="chip base">Base ${fmt(a.baseEvaluacion)}</span> Tu profe ajustó tu base de evaluación por conducta.</p>` : ""}
      </section>
    </div>
    <section class="stack" aria-labelledby="h-pend"><div class="row between"><h2 id="h-pend">Por entregar</h2><a href="#/tareas">Ver todas</a></div>
      ${pending.length ? `<ul class="list">${pending.map(taskItem).join("")}</ul>` : empty("🎉", "Estás al día", "No tienes tareas pendientes.")}
    </section>
    ${t ? `<section class="card row" aria-label="Tu equipo">${teamBadge(t)}<div class="grow"><strong>${esc(t.nombre)}</strong><div class="small muted">${members(t.id).length} integrantes · ${t.capitanCedula === a.cedula ? "Eres la capitana o el capitán" : "Capitán: " + esc(student(t.capitanCedula)?.nombres.split(" ")[0] ?? "—")}</div></div><a class="btn btn-ghost" href="#/equipo">Ver equipo</a></section>` : ""}
  </div>`;
}
function taskItem(x) {
  const a = student(me().cedula);
  const key = `${x.id}:${x.tipo === "grupal" ? a.grupoId : a.cedula}`;
  const sent = S.submissions[key];
  return `<li><a class="list-item card-link" href="#/tareas/${x.id}">${icon(x.tipo === "grupal" ? "team" : "user")}
    <div class="grow"><strong>${esc(x.titulo)}</strong><div class="small muted">${x.tipo === "grupal" ? "Grupal" : "Individual"} · vence ${new Date(x.fecha + "T12:00").toLocaleDateString("es-VE", { day: "numeric", month: "short" })}${x.premio ? " · 🎁 premio" : ""}</div></div>
    ${sent ? `<span class="chip ok">${icon("check")} Entregada</span>` : `<span class="chip warn">${icon("clock")} Pendiente</span>`}</a></li>`;
}
function teamBadge(t, size = 56) {
  const i = DB.grupos.findIndex((g) => g.id === t.id);
  return t.logo
    ? `<img class="team-logo" style="width:${size}px;height:${size}px;object-fit:cover" src="${t.logo}" alt="Logo de ${esc(t.nombre)}">`
    : `<span class="team-logo" style="width:${size}px;height:${size}px;background:${TEAM_COLORS[i % TEAM_COLORS.length]}" aria-hidden="true">${esc((t.tema || t.nombre).slice(0, 1))}</span>`;
}
const empty = (art, title, text, cta = "") => `<div class="empty card"><div class="art" aria-hidden="true">${art}</div><h3>${title}</h3><p class="muted">${text}</p>${cta}</div>`;

function viewGrades() {
  const a = student(me().cedula);
  const ind = studentGrade(a.cedula);
  const grp = a.grupoId ? teamGrade(a.grupoId) : null;
  const rows = allTasks().filter((x) => x.estado === "evaluada");
  return `<div class="page-head"><h1>Mis notas</h1><p class="muted">Toca una nota para ver cómo se evaluó cada pregunta.</p></div>
    <div class="card stack" style="margin-bottom:var(--s-lg)"><div class="row between"><span class="small muted">1</span><span class="small muted">10</span><span class="small muted">20</span></div>
      <div class="scale-bar" role="img" aria-label="Escala de colores: rojo es 1, amarillo es 10, verde es 20"></div>
      <p class="small muted">Menos de 10 es raspado y no suma puntos al ranking.</p></div>
    <ul class="list">${rows.map((x) => {
      const g = x.tipo === "grupal" ? grp : ind;
      return `<li><a class="list-item card-link" href="#/notas/${x.id}">${icon(x.tipo === "grupal" ? "team" : "user")}<div class="grow"><strong>${esc(x.titulo)}</strong><div class="small muted">${x.tipo === "grupal" ? "Grupal" : "Individual"} · ${new Date(x.fecha + "T12:00").toLocaleDateString("es-VE")}</div></div>${gradePill(g, { base: x.tipo === "individual" ? a.baseEvaluacion : 20 })}</a></li>`;
    }).join("")}</ul>`;
}

function viewGradeDetail(taskId) {
  const a = student(me().cedula);
  const task = allTasks().find((x) => x.id === taskId);
  if (!task) return statusScreen("404");
  const back = `<a href="#/notas" class="row" style="font-weight:700;text-decoration:none">${icon("back")} Mis notas</a>`;
  if (task.tipo === "grupal" && !task.preguntas) {
    const g = a.grupoId ? teamGrade(a.grupoId) : null;
    return `${back}<div class="page-head" style="margin-top:var(--s-md)"><span class="eyebrow">Grupal</span><h1>${esc(task.titulo)}</h1></div>
      <div class="card stack" style="justify-items:start">${gradePill(g, { lg: true })}
      <p class="muted">Esta nota viene del Excel y no tiene desglose por pregunta. Las próximas tareas grupales se evalúan pregunta por pregunta.</p>
      ${task.premio ? `<p>🎁 Premio: <strong>${esc(task.premio)}</strong></p>` : ""}</div>`;
  }
  const ev = individualEval(a.cedula, taskId);
  if (!ev) return `${back}<div class="page-head" style="margin-top:var(--s-md)"><h1>${esc(task.titulo)}</h1></div>${empty("⏳", "Aún no hay nota", "Tu profe todavía no evalúa esta tarea, o no la entregaste.", `<a class="btn btn-primary" href="#/tareas/${task.id}">Ir a la tarea</a>`)}`;
  const raw = ev.puntos.reduce((s, x) => s + x, 0);
  const base = a.baseEvaluacion ?? 20;
  const g = applyBase(raw, base);
  return `${back}
  <div class="page-head" style="margin-top:var(--s-md)"><span class="eyebrow">Individual</span><h1>${esc(task.titulo)}</h1></div>
  <div class="stack-lg">
    <section class="card row between" aria-label="Resumen">
      <div class="stack" style="gap:4px"><span class="eyebrow">Tu nota</span>${gradePill(g, { lg: true, base })}</div>
      <div class="stack" style="gap:4px;text-align:right"><span class="small muted">Puntaje</span><span class="num" style="font-size:24px">${fmt(raw)} / 20</span>
        ${base < 20 ? `<span class="chip base">Base ${fmt(base)} → ${fmt(raw)} × ${fmt(base)} / 20</span>` : ""}
        <span class="small ${g >= 10 ? "" : "muted"}">${g >= 10 ? `+${fmt(g)} puntos al ranking` : "No suma puntos (menos de 10)"}</span></div>
    </section>
    ${ev.importada ? `<p class="placeholder-flag">${icon("alert")} Prototipo: los puntajes son reales (Excel); las respuestas y los comentarios son de ejemplo.</p>` : ""}
    <ol class="stack" style="list-style:none;padding:0;margin:0">${task.preguntas.map((q, i) => {
      const p = ev.puntos[i] ?? 0;
      const pct = (p / q.valor) * 100;
      const c = ev.comentarios?.[i];
      return `<li class="card q"><div class="q-head"><div><span class="eyebrow">Pregunta ${i + 1}</span><h3>${esc(q.enunciado)}</h3></div>
        <span class="num" style="font-size:20px;white-space:nowrap" aria-label="${fmt(p)} de ${fmt(q.valor)} puntos">${fmt(p)}<span class="muted" style="font-size:15px"> / ${fmt(q.valor)}</span></span></div>
        <div class="q-meter" aria-hidden="true"><span style="width:${pct}%;--g:${gradeColor(1 + (pct / 100) * 19)}"></span></div>
        <div class="q-answer"><span class="eyebrow">Tu respuesta</span><p>${esc(ev.respuestas?.[i] || sampleAnswer(q, a))}</p></div>
        ${c ? `<div class="feedback"><span class="eyebrow">Comentario de tu profe</span><p>${esc(c)}</p></div>` : ""}</li>`;
    }).join("")}</ol>
  </div>`;
}
function sampleAnswer(q, a) {
  const t = a.grupoId ? team(a.grupoId) : null;
  const tema = (t?.tema || "nuestra marca").toLowerCase();
  const map = {
    p1: `Se llama "Dulce Punto" porque queremos que cada ${tema} sea el punto dulce del día.`,
    p2: `Nació porque en el barrio no hay un lugar de ${tema} con precios para estudiantes.`,
    p3: `Vendemos productos de ${tema} hechos a mano, por encargo y para fiestas.`,
    p4: "Jóvenes de 14 a 25 años que compran por Instagram y quieren algo diferente.",
    p5: "Alegre, cercana y creativa, como un amigo que siempre te recomienda algo bueno.",
    p6: "Que es difícil conseguir algo personalizado y bonito sin gastar mucho.",
    p7: "Personalizamos cada pedido con el nombre del cliente y lo entregamos en el liceo.",
    p8: "Creatividad, puntualidad y honestidad.",
  };
  return map[q.id] || "Respuesta de ejemplo para el prototipo.";
}

function viewTasks() {
  const list = allTasks().filter((x) => x.estado === "abierta");
  return `<div class="page-head"><h1>Tareas</h1><p class="muted">Las grupales solo las entrega el capitán del equipo.</p></div>
    ${list.length ? `<ul class="list">${list.map(taskItem).join("")}</ul>` : empty("🎉", "Nada por entregar", "Cuando tu profe publique una tarea aparecerá aquí.")}`;
}

function viewSubmit(taskId) {
  const a = student(me().cedula);
  const task = allTasks().find((x) => x.id === taskId);
  if (!task || !task.preguntas) return statusScreen("404");
  const t = a.grupoId ? team(a.grupoId) : null;
  const key = `${task.id}:${task.tipo === "grupal" ? a.grupoId : a.cedula}`;
  const sent = S.submissions[key];
  const isCaptain = t && t.capitanCedula === a.cedula;
  const canSend = task.tipo === "individual" || isCaptain;
  const cap = t ? student(t.capitanCedula) : null;
  return `<a href="#/tareas" class="row" style="font-weight:700;text-decoration:none">${icon("back")} Tareas</a>
  <div class="page-head" style="margin-top:var(--s-md)"><span class="eyebrow">${task.tipo === "grupal" ? "Grupal · " + esc(t?.nombre ?? "sin equipo") : "Individual"}</span><h1>${esc(task.titulo)}</h1>
    <p class="muted">Vence el ${new Date(task.fecha + "T12:00").toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })} · 20 puntos</p></div>
  ${task.premio ? `<div class="card row" style="margin-bottom:var(--s-md);background:color-mix(in srgb,var(--yellow) 22%,var(--surface))"><span style="font-size:28px" aria-hidden="true">🎁</span><div><strong>Premio para el mejor equipo</strong><p>${esc(task.premio)}</p></div></div>` : ""}
  ${sent ? `<div class="card row" style="margin-bottom:var(--s-md)"><span class="chip ok">${icon("check")} Entregada</span><span class="small muted">el ${new Date(sent.at).toLocaleString("es-VE")}${task.tipo === "grupal" ? " por " + esc(student(sent.by)?.nombres.split(" ")[0]) : ""}</span></div>` : ""}
  ${!canSend ? `<div class="card row" style="margin-bottom:var(--s-md)">${icon("team")}<p>La entrega <strong>${esc(cap ? cap.nombres.split(" ")[0] + " " + cap.apellidos.split(" ")[0] : "el capitán")}</strong>, capitán de tu equipo. Puedes ver las preguntas para ayudar.</p></div>` : ""}
  <form class="stack" data-bind="submitForm" data-key="${key}" novalidate>
    ${task.preguntas.map((q, i) => `<fieldset class="card stack" style="margin:0"><legend class="sr-only">Pregunta ${i + 1}</legend>
      <div class="q-head"><div><span class="eyebrow">Pregunta ${i + 1}</span><h3 id="q${i}">${esc(q.enunciado)}</h3></div><span class="chip">${fmt(q.valor)} pts</span></div>
      ${q.formato === "imagen"
        ? `<label class="btn btn-ghost" style="justify-self:start">${icon("image")} Subir imagen<input type="file" accept="image/*" class="sr-only" ${canSend && !sent ? "" : "disabled"} aria-labelledby="q${i}"></label><span class="help">JPG o PNG, máximo 5 MB.</span>`
        : `<textarea class="input" aria-labelledby="q${i}" placeholder="Escribe tu respuesta" ${canSend && !sent ? "" : "disabled"}></textarea>`}
    </fieldset>`).join("")}
    ${canSend && !sent ? `<button class="btn btn-primary">Entregar tarea</button>` : ""}
  </form>`;
}

function viewTeam() {
  const a = student(me().cedula);
  if (!a.grupoId) return `<div class="page-head"><h1>Mi equipo</h1></div>${empty("🧩", "Aún no tienes equipo", "Tu profe te asignará a uno. Mientras tanto, tus tareas individuales siguen contando.")}`;
  const t = team(a.grupoId);
  const rank = ranking("equipos", a.seccion);
  const mine = rank.find((r) => r.id === t.id);
  const ms = members(t.id).sort((x, y) => (x.cedula === t.capitanCedula ? -1 : y.cedula === t.capitanCedula ? 1 : x.nombres.localeCompare(y.nombres)));
  return `<div class="page-head"><span class="eyebrow">${t.seccion}</span><h1>Mi equipo</h1></div>
  <div class="stack-lg">
    <section class="card row" style="gap:var(--s-lg)">${teamBadge(t, 96)}<div class="stack" style="gap:4px"><h2>${esc(t.nombre.replace(/^\w+-/, ""))}</h2>
      <p class="muted">${esc(t.tema || "Tema por definir")}</p><div class="row"><span class="chip">#${mine.pos} de ${rank.length}</span><span class="chip">${fmt(mine.pts)} pts</span></div></div></section>
    <section class="stack" aria-labelledby="h-int"><h2 id="h-int">Integrantes</h2><ul class="list">${ms.map((m) => `<li class="list-item"><img class="avatar" alt="" src="${avatarUrl(avatarOf(m.cedula))}"><div class="grow truncate"><strong>${esc(m.nombres)} ${esc(m.apellidos)}</strong>${m.cedula === a.cedula ? ' <span class="small muted">(tú)</span>' : ""}</div>${m.cedula === t.capitanCedula ? `<span class="chip captain">${icon("star")} Capitán</span>` : ""}</li>`).join("")}</ul></section>
    <section class="stack" aria-labelledby="h-gn"><h2 id="h-gn">Notas del equipo</h2>
      <a class="list-item card-link" href="#/notas/logo-y-paleta"><div class="grow"><strong>Logo y paleta de la marca</strong><div class="small muted">🎁 Cuenta Canva Pro por 3 meses</div></div>${gradePill(teamGrade(t.id))}</a></section>
  </div>`;
}

function viewRanking() {
  const section = isTeacher() ? S.rankSection || "5A" : student(me().cedula).seccion;
  const kind = S.rankKind || "alumnos";
  const rows = ranking(kind, section);
  const myId = isTeacher() ? null : kind === "alumnos" ? me().cedula : student(me().cedula).grupoId;
  const top3 = rows.slice(0, 3);
  const worst = rows.length > 13 ? rows.slice(-5) : [];
  const middle = rows.slice(3, rows.length - worst.length);
  const row = (r, cls = "") => `<li class="rank-row ${r.pos <= 10 && !cls ? "top10" : ""} ${cls} ${r.id === myId ? "me" : ""}" data-id="${r.id}" data-pts="${r.pts}">
    <span class="rank-pos">${r.pos}</span>${r.avatar ? `<img class="avatar" alt="" src="${r.avatar}">` : `<span class="avatar" style="background:${r.color};display:grid;place-items:center;color:#fff;font-weight:700" aria-hidden="true">${esc(r.name[0])}</span>`}
    <span class="truncate"><strong>${esc(r.name)}</strong>${r.id === myId ? ' <span class="small muted">· tú</span>' : ""}</span>
    <span class="num">${fmt(r.pts)} <span class="small muted">pts</span></span></li>`;
  const pod = (r, p) => r ? `<div class="podium-slot p${p}" data-id="${r.id}">${p === 1 ? '<span class="crown" aria-hidden="true">👑</span>' : ""}${r.avatar ? `<img class="avatar" alt="" src="${r.avatar}">` : `<span class="avatar" style="background:${r.color};display:grid;place-items:center;color:#fff;font:700 28px var(--font-head)" aria-hidden="true">${esc(r.name[0])}</span>`}
    <span class="podium-name">${esc(r.name)}</span><span class="num small">${fmt(r.pts)} pts</span><div class="podium-step" aria-label="Puesto ${r.pos}">${r.pos}</div></div>` : "<div></div>";
  return `<div class="page-head"><div class="row between"><h1>Ranking</h1><span class="live-dot">En vivo</span></div>
    <p class="muted">Puntos = notas de 10 o más + ajustes de tus profes. Se actualiza solo.</p></div>
  <div class="row between" style="margin-bottom:var(--s-lg)">
    <div class="seg" role="tablist" aria-label="Tipo de ranking">${[["alumnos", "Estudiantes"], ["equipos", "Equipos"]].map(([k, l]) => `<button role="tab" aria-selected="${kind === k}" data-bind="rankKind" data-k="${k}">${l}</button>`).join("")}</div>
    ${isTeacher() ? `<div class="seg" aria-label="Sección">${["5A", "5C"].map((s) => `<button aria-pressed="${section === s}" data-bind="rankSection" data-k="${s}">${s}</button>`).join("")}</div>` : `<span class="chip">${section}</span>`}
  </div>
  <div class="podium" aria-label="Podio">${pod(top3[1], 2)}${pod(top3[0], 1)}${pod(top3[2], 3)}</div>
  <ol class="rank-list" aria-label="Posiciones">${top3.map((r) => row(r)).join("")}${middle.map((r) => row(r)).join("")}</ol>
  ${worst.length ? `<p class="danger-head">${icon("alert")} Zona de riesgo · los 5 últimos</p><ol class="rank-list" aria-label="Zona de riesgo">${worst.map((r) => row(r, "danger")).join("")}</ol>` : ""}
  <div class="card stack" style="margin-top:var(--s-lg)"><strong>Prueba el modo en vivo</strong>
    <p class="small muted">Abre esta página en otra pestaña como estudiante y cambia una nota o unos puntos desde el panel del profesor: la fila cambia de puesto con animación. O simula un cambio aquí:</p>
    <button class="btn btn-ghost" data-bind="simulate" style="justify-self:start">Simular cambio de puntos</button></div>`;
}
function snapshotRanks() {
  const m = {};
  $$(".rank-row, .podium-slot").forEach((el) => (m[el.dataset.id + (el.classList.contains("podium-slot") ? ":p" : "")] = { top: el.getBoundingClientRect().top, pos: +el.querySelector(".rank-pos, .podium-step")?.textContent }));
  return m;
}
/** FLIP: cada fila vuelve desde su posición anterior (D011). */
function animateRanking(prev) {
  if (!prev) return;
  const rows = $$(".rank-row");
  let topChanged = false;
  const msgs = [];
  rows.forEach((el) => {
    const old = prev[el.dataset.id];
    if (!old) return;
    const pos = +el.querySelector(".rank-pos").textContent;
    const dy = old.top - el.getBoundingClientRect().top;
    if (old.pos !== pos) {
      const up = pos < old.pos;
      msgs.push(`${el.querySelector("strong").textContent} ${up ? "subió" : "bajó"} al puesto ${pos}`);
      el.classList.add(up ? "moved-up" : "moved-down");
      if (el.classList.contains("danger") && !up) el.classList.add("shake");
      if (up && pos <= 3) topChanged = true;
      el.querySelector(".num").insertAdjacentHTML("afterbegin", `<span class="delta ${up ? "up" : "down"}">${up ? "▲" : "▼"}${Math.abs(old.pos - pos)} </span>`);
    }
    if (dy && !reduced()) {
      el.animate([{ transform: `translateY(${dy}px)`, zIndex: 5, boxShadow: "var(--shadow-md)" }, { transform: "none" }], { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  });
  if (msgs.length) announce(msgs.slice(0, 3).join(". "));
  if (topChanged) confetti();
}
function confetti() {
  if (reduced()) return;
  const c = $("#confetti");
  const ctx = c.getContext("2d");
  c.width = innerWidth; c.height = innerHeight;
  const cs = getComputedStyle(document.documentElement);
  const colors = [cs.getPropertyValue("--accent"), cs.getPropertyValue("--splash"), "#ffc23d", "#ffffff"];
  const parts = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 4, r: Math.random() * 6 + 3, c: colors[(Math.random() * colors.length) | 0], a: Math.random() * 6 }));
  const t0 = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach((p) => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6); ctx.restore(); });
    if (t - t0 < 1200) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
  })(t0);
}

function viewProfile() {
  const a = student(me().cedula);
  const av = avatarOf(a.cedula);
  const style = S.pickStyle || av.style;
  const seeds = S.pickSeeds?.[style] || Array.from({ length: 8 }, (_, i) => `${a.cedula}-${style}-${i}`);
  const p = prefs();
  return `<div class="page-head"><h1>Perfil</h1></div>
  <div class="stack-lg">
    <section class="card row" style="gap:var(--s-lg)"><img class="avatar lg" alt="Tu avatar" src="${avatarUrl(av)}">
      <div class="stack" style="gap:4px"><h2>${esc(a.nombres)} ${esc(a.apellidos)}</h2><p class="muted">C.I. ${Number(a.cedula).toLocaleString("es-VE")} · ${a.seccion}</p>
      ${a.baseEvaluacion < 20 ? `<span class="chip base">Base de evaluación ${fmt(a.baseEvaluacion)}</span>` : ""}</div></section>
    <section class="card stack" aria-labelledby="h-datos"><h2 id="h-datos">Tus datos</h2>
      <div class="grid-2">${[["Primer y segundo nombre", a.nombres], ["Primer y segundo apellido", a.apellidos]].map(([l, v], i) => `<div class="field"><label for="d${i}">${l}</label><input id="d${i}" class="input" value="${esc(v)}" readonly aria-describedby="ro"></div>`).join("")}</div>
      <p class="help" id="ro">Solo tu profe puede cambiar tu nombre. Si hay un error, avísale.</p></section>
    <section class="card stack" aria-labelledby="h-av"><div class="row between"><h2 id="h-av">Avatar</h2>
      <button class="btn btn-ghost" data-bind="dice" aria-label="Lanzar el dado: 8 avatares nuevos"><span class="dice">${icon("dice")}</span> Otros 8</button></div>
      <div class="seg" role="tablist" aria-label="Estilo de avatar">${STYLES.map(([k, l]) => `<button role="tab" aria-selected="${style === k}" data-bind="pickStyle" data-k="${k}">${l}</button>`).join("")}</div>
      <div class="avatar-grid" role="radiogroup" aria-label="Elige tu avatar">${seeds.map((sd, i) => `<button class="avatar-opt" role="radio" aria-checked="${av.style === style && av.seed === sd}" aria-label="Opción ${i + 1}" data-bind="pickAvatar" data-style="${style}" data-seed="${esc(sd)}"><img alt="" loading="lazy" src="${avatarUrl({ style, seed: sd })}"></button>`).join("")}</div></section>
    <section class="card stack" aria-labelledby="h-ap"><h2 id="h-ap">Apariencia</h2>
      <span class="label" id="l-acc">Color</span>
      <div class="swatches" role="radiogroup" aria-labelledby="l-acc">${ACCENTS.map(([k, l, c]) => `<button class="swatch" role="radio" aria-checked="${p.accent === k}" data-bind="accent" data-k="${k}" style="--sw:${c}"><span>${p.accent === k ? icon("check") : ""}</span>${l}</button>`).join("")}</div>
      <span class="label" id="l-th">Tema</span>
      <div class="seg" role="radiogroup" aria-labelledby="l-th">${[["light", "Claro"], ["dark", "Oscuro"], ["system", "Sistema"]].map(([k, l]) => `<button role="radio" aria-checked="${p.theme === k}" data-bind="theme" data-k="${k}">${l}</button>`).join("")}</div></section>
    <section class="card stack" aria-labelledby="h-seg"><h2 id="h-seg">Seguridad</h2>
      <form class="stack" data-bind="pwForm" novalidate><div class="grid-2">
        <div class="field"><label for="np">Nueva contraseña</label><input class="input" id="np" type="password" autocomplete="new-password" aria-describedby="np-h"><span class="help" id="np-h">Mínimo 8 caracteres.</span></div>
        <div class="field"><label for="np2">Repítela</label><input class="input" id="np2" type="password" autocomplete="new-password"></div></div>
        <button class="btn btn-ghost" style="justify-self:start">Cambiar contraseña</button></form>
      <a class="btn btn-danger" href="#/ingresar" data-bind="logout" style="justify-self:start">${icon("logout")} Cerrar sesión</a></section>
  </div>`;
}

// ---------- profesor ----------
function viewTeacherHome() {
  const all = students();
  const evaluated = all.filter((a) => studentGrade(a.cedula) != null);
  const failing = evaluated.filter((a) => studentGrade(a.cedula) < 10);
  const queue = submissionsQueue();
  return `<div class="page-head"><span class="eyebrow">Panel del profesor</span><h1>Buenos días, profe</h1></div>
  <div class="stack-lg">
    <div class="grid-3">
      ${stat("Por evaluar", queue.length, "entregas", "#/profe/evaluar")}
      ${stat("Evaluados", `${evaluated.length}/${all.length}`, "alumnos con nota", "#/profe/alumnos")}
      ${stat("Raspados", failing.length, "con menos de 10", "#/profe/alumnos")}
    </div>
    <section class="stack"><div class="row between"><h2>Por evaluar</h2><a href="#/profe/evaluar">Ver todas</a></div>
      ${queue.length ? `<ul class="list">${queue.slice(0, 4).map(queueItem).join("")}</ul>` : empty("✅", "Todo evaluado", "No hay entregas pendientes.")}</section>
    <section class="stack"><div class="row between"><h2>Últimos ajustes de puntos</h2><a href="#/profe/puntos">Nuevo ajuste</a></div>
      ${S.adjustments.length ? adjustmentLog(5) : empty("➕", "Sin ajustes todavía", "Suma o resta puntos a un alumno o equipo, siempre con un motivo.", '<a class="btn btn-primary" href="#/profe/puntos">Hacer un ajuste</a>')}</section>
  </div>`;
}
const stat = (label, n, sub, href) => `<a class="card card-link stack" style="gap:4px" href="${href}"><span class="eyebrow">${label}</span><span class="num" style="font-size:40px;line-height:1.1">${n}</span><span class="small muted">${sub}</span></a>`;

/** Cola del prototipo: alumnos de 5C sin nota en "Identidad de marca" (entregas de ejemplo). */
function submissionsQueue() {
  return students("5C").filter((a) => !S.grades[`${DB.tarea.id}:${a.cedula}`]).slice(0, 12).map((a, i) => ({ task: DB.tarea, a, i }));
}
const queueItem = ({ task, a, i }) => `<li><a class="list-item card-link" href="#/profe/evaluar/${task.id}/${i}"><img class="avatar" alt="" src="${avatarUrl(avatarOf(a.cedula))}"><div class="grow truncate"><strong>${esc(a.nombres.split(" ")[0])} ${esc(a.apellidos.split(" ")[0])}</strong><div class="small muted">${esc(task.titulo)} · ${a.seccion}</div></div><span class="chip warn">${icon("clock")} Por evaluar</span></a></li>`;

function viewGradeQueue() {
  const q = submissionsQueue();
  return `<div class="page-head"><h1>Evaluar entregas</h1><p class="muted">${q.length} entregas esperando nota.</p></div>
    ${q.length ? `<ul class="list">${q.map(queueItem).join("")}</ul>` : empty("✅", "Todo evaluado", "Cuando lleguen entregas nuevas aparecerán aquí.")}`;
}

function viewGrading(taskId, idx) {
  const q = submissionsQueue();
  const item = q[+idx] || q[0];
  if (!item) return empty("✅", "Todo evaluado", "No quedan entregas.", '<a class="btn btn-primary" href="#/profe">Volver al panel</a>');
  const { task, a } = item;
  const draft = S.draft?.[a.cedula] || { puntos: task.preguntas.map(() => null), comentarios: task.preguntas.map(() => "") };
  const raw = draft.puntos.reduce((s, x) => s + (x ?? 0), 0);
  const done = draft.puntos.every((x) => x != null);
  const base = a.baseEvaluacion ?? 20;
  return `<a href="#/profe/evaluar" class="row" style="font-weight:700;text-decoration:none">${icon("back")} Entregas</a>
  <div class="page-head" style="margin-top:var(--s-md)"><span class="eyebrow">${esc(task.titulo)} · ${a.seccion}</span><h1>${esc(a.nombres)} ${esc(a.apellidos)}</h1>
    <div class="row">${base < 20 ? `<span class="chip base">Base ${fmt(base)}</span>` : '<span class="chip">Base 20</span>'}<span class="small muted">Entregada el 12/10/2026</span></div></div>
  <div class="card row between sum-meter" style="margin-bottom:var(--s-md)"><span>Puntaje <strong class="num">${fmt(raw)} / 20</strong></span><span>Nota ${gradePill(done ? applyBase(raw, base) : null)}</span></div>
  <form class="stack" data-bind="gradeForm" data-ced="${a.cedula}" data-next="${(+idx + 1) % Math.max(q.length - 1, 1)}">
  ${task.preguntas.map((pq, i) => {
    const steps = Array.from({ length: pq.valor * 2 + 1 }, (_, k) => k / 2);
    return `<fieldset class="card stack" style="margin:0"><legend class="sr-only">Pregunta ${i + 1}</legend>
      <div class="q-head"><div><span class="eyebrow">Pregunta ${i + 1} · vale ${fmt(pq.valor)}</span><h3>${esc(pq.enunciado)}</h3></div></div>
      <div class="q-answer"><span class="eyebrow">Respuesta</span><p>${esc(sampleAnswer(pq, a))}</p><span class="placeholder-flag">Respuesta de ejemplo</span></div>
      <div class="score-steps" role="radiogroup" aria-label="Puntos para la pregunta ${i + 1}">${steps.map((v) => `<button type="button" role="radio" aria-checked="${draft.puntos[i] === v}" data-bind="score" data-q="${i}" data-v="${v}">${fmt(v)}</button>`).join("")}</div>
      <div class="field"><label for="c${i}">Comentario para el estudiante <span class="muted">(opcional)</span></label>
        <textarea class="input" id="c${i}" data-bind="comment" data-q="${i}" placeholder="Qué puede mejorar o por qué lo felicitas">${esc(draft.comentarios[i])}</textarea></div></fieldset>`;
  }).join("")}
  <button class="btn btn-primary" ${done ? "" : 'aria-disabled="true"'}>${done ? "Guardar nota y seguir" : "Asigna puntos a todas las preguntas"}</button></form>`;
}

function viewStudents() {
  const sec = S.studSection || "5A";
  const qy = (S.studQuery || "").toLowerCase();
  const rows = students(sec).filter((a) => !qy || `${a.nombres} ${a.apellidos} ${a.cedula}`.toLowerCase().includes(qy));
  return `<div class="page-head"><h1>Alumnos</h1><p class="muted">${students(sec).length} en ${sec}. Toca un alumno para editar sus datos o su base de evaluación.</p></div>
  <div class="row between" style="margin-bottom:var(--s-md)">
    <div class="seg" aria-label="Sección">${["5A", "5C"].map((s) => `<button aria-pressed="${sec === s}" data-bind="studSection" data-k="${s}">${s}</button>`).join("")}</div>
    <label class="sr-only" for="sq">Buscar alumno</label><input id="sq" class="input" style="max-width:280px" type="search" placeholder="Buscar por nombre o cédula" value="${esc(S.studQuery || "")}" data-bind="studQuery"></div>
  <div class="table-wrap"><table><thead><tr><th>Alumno</th><th>Cédula</th><th>Equipo</th><th>Base</th><th>Individual</th><th>Puntos</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>
  ${rows.map((a) => `<tr><td><div class="row" style="flex-wrap:nowrap"><img class="avatar" style="width:32px;height:32px" alt="" src="${avatarUrl(avatarOf(a.cedula))}"><strong>${esc(a.apellidos)}, ${esc(a.nombres)}</strong></div></td>
    <td class="num" style="font-weight:600">${a.cedula}</td><td>${a.grupoId ? esc(team(a.grupoId).nombre.replace(/^\w+-/, "")) : '<span class="muted">Sin asignar</span>'}</td>
    <td>${a.baseEvaluacion < 20 ? `<span class="chip base">${fmt(a.baseEvaluacion)}</span>` : "20"}</td><td>${gradePill(studentGrade(a.cedula))}</td><td class="num">${fmt(studentPoints(a.cedula))}</td>
    <td><button class="btn btn-ghost" data-bind="editStudent" data-ced="${a.cedula}">Editar</button></td></tr>`).join("") || `<tr><td colspan="7">${empty("🔎", "Sin resultados", "Prueba con otro nombre o cédula.")}</td></tr>`}
  </tbody></table></div>
  <dialog id="dlg-student" aria-labelledby="dlg-st-t"></dialog>`;
}

function viewTeams() {
  const sec = S.teamSection || "5A";
  const ts = teamsOf(sec);
  const loose = students(sec).filter((a) => !a.grupoId);
  return `<div class="page-head"><h1>Equipos</h1><p class="muted">Organiza los equipos, elige el capitán y sube su logo.</p></div>
  <div class="seg" style="margin-bottom:var(--s-md)" aria-label="Sección">${["5A", "5C"].map((s) => `<button aria-pressed="${sec === s}" data-bind="teamSection" data-k="${s}">${s}</button>`).join("")}</div>
  <div class="grid-2">${ts.map((t) => `<section class="card stack" aria-labelledby="t-${t.id}">
    <div class="row">${teamBadge(t)}<div class="grow"><h2 id="t-${t.id}" style="font-size:19px">${esc(t.nombre)}</h2><span class="small muted">${members(t.id).length} integrantes · ${fmt(teamPoints(t.id))} pts</span></div>
      <label class="btn btn-ghost">${icon("image")}<span class="sr-only">Subir logo de ${esc(t.nombre)}</span><input type="file" accept="image/*" class="sr-only" data-bind="teamLogo" data-id="${t.id}"></label></div>
    <div class="field"><label for="cap-${t.id}">Capitán</label><select class="input" id="cap-${t.id}" data-bind="captain" data-id="${t.id}">${members(t.id).map((m) => `<option value="${m.cedula}" ${m.cedula === t.capitanCedula ? "selected" : ""}>${esc(m.nombres)} ${esc(m.apellidos)}</option>`).join("")}</select></div>
    <ul class="list">${members(t.id).map((m) => `<li class="list-item" style="padding:8px 12px"><img class="avatar" style="width:32px;height:32px" alt="" src="${avatarUrl(avatarOf(m.cedula))}"><span class="grow truncate">${esc(m.nombres.split(" ")[0])} ${esc(m.apellidos.split(" ")[0])}</span>${m.cedula === t.capitanCedula ? `<span class="chip captain">Capitán</span>` : ""}
      <label class="sr-only" for="mv-${m.cedula}">Mover a otro equipo</label><select id="mv-${m.cedula}" class="input" style="width:auto;min-height:36px;padding:4px 8px" data-bind="moveStudent" data-ced="${m.cedula}">${ts.map((o) => `<option value="${o.id}" ${o.id === t.id ? "selected" : ""}>${esc(o.nombre.split(" ")[0])}</option>`).join("")}<option value="">Sin equipo</option></select></li>`).join("")}</ul>
  </section>`).join("")}</div>
  ${loose.length ? `<section class="card stack" style="margin-top:var(--s-lg)"><h2>Sin equipo (${loose.length})</h2><ul class="list">${loose.map((m) => `<li class="list-item"><span class="grow">${esc(m.nombres)} ${esc(m.apellidos)}</span><label class="sr-only" for="mv-${m.cedula}">Asignar equipo</label><select id="mv-${m.cedula}" class="input" style="width:auto" data-bind="moveStudent" data-ced="${m.cedula}"><option value="">Asignar…</option>${ts.map((o) => `<option value="${o.id}">${esc(o.nombre)}</option>`).join("")}</select></li>`).join("")}</ul></section>` : ""}`;
}

function viewTeacherTasks() {
  const ts = allTasks();
  return `<div class="page-head"><div class="row between"><h1>Tareas</h1><a class="btn btn-primary" href="#/profe/tareas/nueva">${icon("plus")} Nueva tarea</a></div></div>
  <ul class="list">${ts.map((t) => `<li class="list-item">${icon(t.tipo === "grupal" ? "team" : "user")}<div class="grow"><strong>${esc(t.titulo)}</strong><div class="small muted">${t.tipo === "grupal" ? "Grupal" : "Individual"} · ${t.preguntas ? t.preguntas.length + " preguntas" : "importada"}${t.premio ? " · 🎁 " + esc(t.premio) : ""}</div></div>
    <span class="chip ${t.estado === "abierta" ? "warn" : "ok"}">${t.estado === "abierta" ? "Abierta" : t.estado === "borrador" ? "Borrador" : "Evaluada"}</span></li>`).join("")}</ul>`;
}

function viewBuilder() {
  const b = S.builder || { titulo: "", tipo: "individual", premio: "", fecha: "", preguntas: [{ enunciado: "", formato: "texto", valor: 5 }] };
  const sum = b.preguntas.reduce((s, q) => s + (+q.valor || 0), 0);
  const state = sum === 20 ? "ok" : sum > 20 ? "over" : "";
  return `<a href="#/profe/tareas" class="row" style="font-weight:700;text-decoration:none">${icon("back")} Tareas</a>
  <div class="page-head" style="margin-top:var(--s-md)"><h1>Nueva tarea</h1></div>
  <form class="stack" data-bind="builderForm" novalidate>
    <div class="card stack"><div class="field"><label for="bt">Título</label><input class="input" id="bt" data-f="titulo" value="${esc(b.titulo)}" placeholder="Ej. Presentación del producto"></div>
      <div class="grid-2"><div class="field"><span class="label" id="bty">Tipo</span><div class="seg" role="radiogroup" aria-labelledby="bty">${[["individual", "Individual"], ["grupal", "Grupal"]].map(([k, l]) => `<button type="button" role="radio" aria-checked="${b.tipo === k}" data-bind="bType" data-k="${k}">${l}</button>`).join("")}</div></div>
      <div class="field"><label for="bf">Fecha de entrega</label><input class="input" id="bf" type="date" data-f="fecha" value="${esc(b.fecha)}"></div></div>
      ${b.tipo === "grupal" ? `<div class="field"><label for="bp">Premio para el mejor equipo <span class="muted">(opcional)</span></label><input class="input" id="bp" data-f="premio" value="${esc(b.premio)}" placeholder="Ej. Salida al cine con todo pago"><span class="help">Lo gana el equipo con la mejor nota. Solo el capitán entrega.</span></div>` : ""}</div>
    <div class="card stack sum-meter ${state}" aria-live="polite"><div class="row between"><strong>Suma de puntos</strong><span class="num" style="font-size:20px">${fmt(sum)} / 20</span></div>
      <div class="bar"><span style="width:${Math.min(sum, 20) * 5}%"></span></div>
      <span class="small ${state === "ok" ? "chip ok" : state === "over" ? "error-text" : "muted"}" style="justify-self:start">${state === "ok" ? icon("check") + " Suma exacta: lista para publicar" : state === "over" ? icon("alert") + ` Te pasaste por ${fmt(sum - 20)} puntos` : `Faltan ${fmt(20 - sum)} puntos para llegar a 20`}</span></div>
    ${b.preguntas.map((q, i) => `<div class="builder-q"><div class="row between"><span class="eyebrow">Pregunta ${i + 1}</span>${b.preguntas.length > 1 ? `<button type="button" class="btn btn-ghost icon-btn" data-bind="bDel" data-i="${i}" aria-label="Eliminar pregunta ${i + 1}">${icon("trash")}</button>` : ""}</div>
      <div class="field"><label for="bq${i}">Enunciado</label><input class="input" id="bq${i}" data-q="${i}" data-qf="enunciado" value="${esc(q.enunciado)}" placeholder="Escribe la pregunta"></div>
      <div class="grid-2"><div class="field"><span class="label" id="bfm${i}">Formato de respuesta</span><div class="seg" role="radiogroup" aria-labelledby="bfm${i}">${[["texto", "Texto", "text"], ["imagen", "Imagen", "image"]].map(([k, l, ic]) => `<button type="button" role="radio" aria-checked="${q.formato === k}" data-bind="bFmt" data-i="${i}" data-k="${k}">${icon(ic)} ${l}</button>`).join("")}</div></div>
      <div class="field"><label for="bv${i}">Valor (puntos)</label><input class="input" id="bv${i}" type="number" min="0.5" max="20" step="0.5" data-q="${i}" data-qf="valor" value="${q.valor}"></div></div></div>`).join("")}
    <button type="button" class="btn btn-ghost" data-bind="bAdd" style="justify-self:start">${icon("plus")} Agregar pregunta</button>
    <div class="row"><button class="btn btn-primary" ${state === "ok" ? "" : 'aria-disabled="true"'} aria-describedby="pub-h">Publicar tarea</button><span class="help" id="pub-h">${state === "ok" ? "Los estudiantes la verán al instante." : "Para publicar, la suma debe ser exactamente 20."}</span></div>
  </form>`;
}

function adjustmentLog(limit = 50) {
  const list = [...S.adjustments].reverse().slice(0, limit);
  return `<ul class="list">${list.map((x) => {
    const who = x.kind === "alumno" ? (() => { const a = student(x.id); return `${a.nombres.split(" ")[0]} ${a.apellidos.split(" ")[0]}`; })() : team(x.id).nombre;
    const r = REASONS.find((y) => y[0] === x.motivo);
    return `<li class="list-item"><span class="num" style="min-width:48px;color:${x.valor >= 0 ? "var(--success)" : "var(--error)"}">${x.valor > 0 ? "+" : ""}${fmt(x.valor)}</span>
      <div class="grow"><strong>${esc(who)}</strong> <span class="chip">${x.kind}</span><div class="small muted">${esc(r?.[1])}${x.nota ? " · " + esc(x.nota) : ""} · ${new Date(x.at).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}</div></div></li>`;
  }).join("")}</ul>`;
}

function viewPoints() {
  const kind = S.adjKind || "alumno";
  const sec = S.adjSection || "5A";
  const opts = kind === "alumno" ? students(sec).map((a) => [a.cedula, `${a.apellidos}, ${a.nombres}`]) : teamsOf(sec).map((t) => [t.id, t.nombre]);
  return `<div class="page-head"><h1>Ajustes de puntos</h1><p class="muted">Afectan los puntos del ranking, no la nota. Cada ajuste necesita un motivo.</p></div>
  <div class="grid-2" style="align-items:start">
  <form class="card stack" data-bind="adjForm" novalidate>
    <div class="row"><div class="seg" role="radiogroup" aria-label="A quién">${[["alumno", "Alumno"], ["equipo", "Equipo"]].map(([k, l]) => `<button type="button" role="radio" aria-checked="${kind === k}" data-bind="adjKind" data-k="${k}">${l}</button>`).join("")}</div>
      <div class="seg" aria-label="Sección">${["5A", "5C"].map((s) => `<button type="button" aria-pressed="${sec === s}" data-bind="adjSection" data-k="${s}">${s}</button>`).join("")}</div></div>
    <div class="field"><label for="aw">${kind === "alumno" ? "Alumno" : "Equipo"}</label><select class="input" id="aw" name="who">${opts.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
    <div class="field"><label for="ar">Motivo</label><select class="input" id="ar" name="motivo" data-bind="reason"><option value="">Elige un motivo…</option>${REASONS.map(([k, l, v]) => `<option value="${k}" data-v="${v}">${l}${v ? ` (${v > 0 ? "+" : ""}${v})` : ""}</option>`).join("")}</select><span class="error-text" id="ar-err" hidden>${icon("alert")} Elige un motivo</span></div>
    <div class="field"><label for="av">Puntos</label><input class="input" id="av" name="valor" type="number" step="0.5" min="-20" max="20" value="-1" aria-describedby="av-h"><span class="help" id="av-h">Negativo resta, positivo suma.</span></div>
    <div class="field"><label for="an">Detalle <span class="muted">(obligatorio si eliges "Otro")</span></label><textarea class="input" id="an" name="nota" placeholder="Ej. Llegó 20 minutos tarde sin justificativo"></textarea></div>
    <button class="btn btn-primary">Aplicar ajuste</button></form>
  <section class="stack" aria-labelledby="h-hist"><h2 id="h-hist">Historial</h2>${S.adjustments.length ? adjustmentLog() : empty("📋", "Sin ajustes", "Los ajustes aparecen aquí y en el ranking al instante.")}</section></div>`;
}

function viewPrizes() {
  const ts = allTasks().filter((t) => t.tipo === "grupal");
  return `<div class="page-head"><h1>Premios</h1><p class="muted">Cada tarea grupal puede tener un premio para el equipo con la mejor nota.</p></div>
  <ul class="list">${ts.map((t) => {
    const winner = t.estado === "evaluada" ? teamsOf("5A").sort((x, y) => (teamGrade(y.id) ?? 0) - (teamGrade(x.id) ?? 0))[0] : null;
    return `<li class="card row" style="gap:var(--s-md)"><span style="font-size:32px" aria-hidden="true">🎁</span><div class="grow"><strong>${esc(t.premio || "Sin premio")}</strong><div class="small muted">${esc(t.titulo)}</div></div>
      ${winner ? `<span class="chip captain">${icon("trophy")} Ganó ${esc(winner.nombre.replace(/^\w+-/, ""))} (5A)</span>` : `<span class="chip warn">${icon("clock")} En juego</span>`}</li>`;
  }).join("")}</ul>`;
}

// ---------- estados ----------
function statusScreen(kind) {
  const logged = !!me();
  const home = logged ? (isTeacher() ? "#/profe" : "#/inicio") : "#/ingresar";
  const c = {
    404: ["404", "Esta página se fue de recreo", "La dirección no existe o ya no está disponible.", `<a class="btn btn-primary" href="${home}">Ir al inicio</a>${logged ? `<a class="btn btn-ghost" href="${isTeacher() ? "#/profe/evaluar" : "#/notas"}">${isTeacher() ? "Evaluar" : "Mis notas"}</a>` : '<a class="btn btn-ghost" href="#/ingresar">Iniciar sesión</a>'}`],
    500: ["500", "Algo se nos rompió", "No es tu culpa. Intenta de nuevo en un momento.", `<p class="small">Código para soporte: <code>KR-7F3A-2210</code></p><button class="btn btn-primary" onclick="location.reload()">Reintentar</button><a class="btn btn-ghost" href="${home}">Ir al inicio</a>`],
    offline: ["📡", "Sin conexión", "Revisa tus datos o el wifi. Tus notas guardadas se siguen viendo; el ranking se actualizará cuando vuelvas.", '<button class="btn btn-primary" onclick="location.reload()">Reintentar</button>'],
  }[kind];
  return `<div class="status-screen"><div class="stack" style="justify-items:center;max-width:440px">${logo().replace('class="logo ', 'style="height:72px" class="logo ')}
    <span class="code" aria-hidden="true">${c[0]}</span><h1>${c[1]}</h1><p class="muted">${c[2]}</p><div class="row" style="justify-content:center">${c[3]}</div></div></div>`;
}
function viewStates() {
  return `<main id="main" class="stack-lg" style="padding:var(--s-lg)"><h1>Estados del prototipo</h1>
    <div class="grid-2">
      <section class="card stack"><h2>Cargando (skeleton)</h2>${[1, 2, 3].map(() => `<div class="row"><div class="skeleton" style="width:40px;height:40px;border-radius:50%"></div><div class="grow stack" style="gap:6px"><div class="skeleton" style="height:14px;width:60%"></div><div class="skeleton" style="height:12px;width:35%"></div></div><div class="skeleton" style="width:56px;height:28px;border-radius:999px"></div></div>`).join("")}</section>
      <section class="stack"><h2>Vacío</h2>${empty("🎉", "Estás al día", "No tienes tareas pendientes.")}</section>
      <section class="card stack"><h2>Escala de notas</h2><div class="row">${[1, 4, 7, 9.5, 10, 12, 14, 16, 18, 20].map((n) => gradePill(n)).join("")}${gradePill(null)}</div></section>
      <section class="card stack"><h2>Error en formulario</h2><div class="field"><label for="e1">Cédula</label><input id="e1" class="input" value="12ab" aria-invalid="true" aria-describedby="e1e"><span id="e1e" class="error-text">${icon("alert")} Solo números, entre 7 y 9 dígitos</span></div></section>
    </div>
    <div class="row"><a class="btn btn-ghost" href="#/no-existe">404</a><a class="btn btn-ghost" href="#/500">500</a><a class="btn btn-ghost" href="#/sin-conexion">Sin conexión</a></div></main>`;
}

// ---------- interacciones ----------
const on = (el, ev, fn) => el.addEventListener(ev, fn);
const rerender = () => render();
const bindings = {
  resetProto: (el) => on(el, "click", () => { if (confirm("¿Reiniciar los datos del prototipo?")) { localStorage.removeItem(STORE_KEY); S = loadState(); save(); location.hash = "#/ingresar"; render(); } }),
  switchRole: (el) => on(el, "click", () => { S.session = isTeacher() ? { cedula: "33272397", rol: "alumno" } : { ...TEACHER }; save(false); location.hash = isTeacher() ? "#/profe" : "#/inicio"; }),
  logout: (el) => on(el, "click", () => { S.session = null; save(false); }),
  loginForm: (form) => {
    $$("[data-fill]").forEach((b) => on(b, "click", () => { $("#ced").value = b.dataset.fill; $("#pw").value = "demo1234"; $("#pw").focus(); }));
    on(form, "submit", (e) => {
      e.preventDefault();
      const ced = $("#ced").value.replace(/\D/g, "");
      const err = $("#ced-err");
      const ok = ced === TEACHER.cedula || DB.alumnos.some((a) => a.cedula === ced);
      if (!/^\d{7,9}$/.test(ced) || !ok) {
        err.hidden = false; err.innerHTML = `${icon("alert")} ${!/^\d{7,9}$/.test(ced) ? "Escribe tu cédula: solo números, entre 7 y 9 dígitos." : "Cédula o contraseña incorrecta."}`;
        $("#ced").setAttribute("aria-invalid", "true"); $("#ced").focus(); return;
      }
      S.session = ced === TEACHER.cedula ? { ...TEACHER } : { cedula: ced, rol: "alumno" };
      save(false);
      location.hash = ced === TEACHER.cedula ? "#/profe" : "#/inicio";
    });
  },
  recoverForm: (f) => on(f, "submit", (e) => { e.preventDefault(); location.hash = "#/recuperar/enviado"; }),
  submitForm: (f) => on(f, "submit", (e) => { e.preventDefault(); S.submissions[f.dataset.key] = { at: Date.now(), by: me().cedula }; save(); toast("¡Tarea entregada!"); rerender(); }),
  rankKind: (b) => on(b, "click", () => { S.rankKind = b.dataset.k; save(false); rerender(); }),
  rankSection: (b) => on(b, "click", () => { S.rankSection = b.dataset.k; save(false); rerender(); }),
  simulate: (b) => on(b, "click", () => {
    const section = isTeacher() ? S.rankSection || "5A" : student(me().cedula).seccion;
    const kind = S.rankKind || "alumnos";
    const rows = ranking(kind, section);
    const pick = rows[Math.floor(Math.random() * rows.length)];
    const valor = pick.pos > 3 ? 12 : -12;
    const prev = snapshotRanks();
    S.adjustments.push({ kind: kind === "alumnos" ? "alumno" : "equipo", id: pick.id, motivo: valor > 0 ? "participacion" : "inasistencia", valor, nota: "Simulación del prototipo", at: Date.now() });
    save();
    render(prev);
  }),
  dice: (b) => on(b, "click", () => {
    const st = S.pickStyle || avatarOf(me().cedula).style;
    S.pickSeeds = { ...(S.pickSeeds || {}), [st]: Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 9)) };
    save(false); rerender();
    const d = $(".dice"); d?.classList.add("roll");
    announce("8 avatares nuevos");
  }),
  pickStyle: (b) => on(b, "click", () => { S.pickStyle = b.dataset.k; save(false); rerender(); }),
  pickAvatar: (b) => on(b, "click", () => { S.avatars[me().cedula] = { style: b.dataset.style, seed: b.dataset.seed }; save(); toast("Avatar actualizado"); rerender(); }),
  accent: (b) => on(b, "click", () => { setPref("accent", b.dataset.k); rerender(); }),
  theme: (b) => on(b, "click", () => { setPref("theme", b.dataset.k); rerender(); }),
  pwForm: (f) => on(f, "submit", (e) => { e.preventDefault(); const a = $("#np").value, b2 = $("#np2").value; if (a.length < 8 || a !== b2) { toast(a.length < 8 ? "Mínimo 8 caracteres" : "Las contraseñas no coinciden"); return; } toast("Contraseña cambiada"); f.reset(); }),
  score: (b) => on(b, "click", () => { const ced = $("[data-bind=gradeForm]").dataset.ced; const d = draftFor(ced); d.puntos[+b.dataset.q] = +b.dataset.v; save(false); rerender(); $(`[data-bind=score][data-q="${b.dataset.q}"][data-v="${b.dataset.v}"]`)?.focus(); }),
  comment: (t) => on(t, "input", () => { const ced = $("[data-bind=gradeForm]").dataset.ced; draftFor(ced).comentarios[+t.dataset.q] = t.value; save(false); }),
  gradeForm: (f) => on(f, "submit", (e) => {
    e.preventDefault();
    const d = draftFor(f.dataset.ced);
    if (d.puntos.some((x) => x == null)) { toast("Falta asignar puntos a alguna pregunta"); return; }
    S.grades[`${DB.tarea.id}:${f.dataset.ced}`] = { puntos: d.puntos, comentarios: d.comentarios };
    delete S.draft[f.dataset.ced];
    save(); toast("Nota guardada · el ranking ya se actualizó");
    location.hash = submissionsQueue().length ? `#/profe/evaluar/${DB.tarea.id}/0` : "#/profe/evaluar";
  }),
  studSection: (b) => on(b, "click", () => { S.studSection = b.dataset.k; save(false); rerender(); }),
  studQuery: (i) => on(i, "input", () => { S.studQuery = i.value; save(false); rerender(); const n = $("#sq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }),
  editStudent: (b) => on(b, "click", () => openStudentDialog(b.dataset.ced)),
  teamSection: (b) => on(b, "click", () => { S.teamSection = b.dataset.k; save(false); rerender(); }),
  captain: (s) => on(s, "change", () => { S.captains[s.dataset.id] = s.value; save(); toast("Capitán actualizado"); rerender(); }),
  moveStudent: (s) => on(s, "change", () => { S.overrides[s.dataset.ced] = { ...(S.overrides[s.dataset.ced] || {}), grupoId: s.value || null }; save(); toast("Alumno movido"); rerender(); }),
  teamLogo: (i) => on(i, "change", () => { const f = i.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { S.teamLogos[i.dataset.id] = r.result; save(); rerender(); }; r.readAsDataURL(f); }),
  builderForm: (f) => {
    const b = (S.builder ||= { titulo: "", tipo: "individual", premio: "", fecha: "", preguntas: [{ enunciado: "", formato: "texto", valor: 5 }] });
    $$("[data-f]", f).forEach((i) => on(i, "input", () => { b[i.dataset.f] = i.value; save(false); }));
    $$("[data-qf]", f).forEach((i) => on(i, "change", () => { b.preguntas[+i.dataset.q][i.dataset.qf] = i.dataset.qf === "valor" ? Math.round(+i.value * 2) / 2 : i.value; save(false); rerender(); $(`#${i.id}`)?.focus(); }));
    on(f, "submit", (e) => {
      e.preventDefault();
      const sum = b.preguntas.reduce((s, q) => s + (+q.valor || 0), 0);
      if (sum !== 20) { toast(`La suma debe ser 20 (ahora ${fmt(sum)})`); return; }
      if (!b.titulo.trim() || b.preguntas.some((q) => !q.enunciado.trim())) { toast("Completa el título y todas las preguntas"); return; }
      S.tasks.push({ id: "t" + Date.now(), titulo: b.titulo, tipo: b.tipo, estado: "abierta", fecha: b.fecha || "2026-11-14", premio: b.premio, preguntas: b.preguntas.map((q, i) => ({ ...q, id: "p" + (i + 1) })) });
      S.builder = null; save(); toast("Tarea publicada"); location.hash = "#/profe/tareas";
    });
  },
  bType: (b) => on(b, "click", () => { S.builder.tipo = b.dataset.k; save(false); rerender(); }),
  bFmt: (b) => on(b, "click", () => { S.builder.preguntas[+b.dataset.i].formato = b.dataset.k; save(false); rerender(); }),
  bAdd: (b) => on(b, "click", () => { const left = 20 - S.builder.preguntas.reduce((s, q) => s + (+q.valor || 0), 0); S.builder.preguntas.push({ enunciado: "", formato: "texto", valor: Math.max(left, 1) }); save(false); rerender(); $(`#bq${S.builder.preguntas.length - 1}`)?.focus(); }),
  bDel: (b) => on(b, "click", () => { S.builder.preguntas.splice(+b.dataset.i, 1); save(false); rerender(); }),
  adjKind: (b) => on(b, "click", () => { S.adjKind = b.dataset.k; save(false); rerender(); }),
  adjSection: (b) => on(b, "click", () => { S.adjSection = b.dataset.k; save(false); rerender(); }),
  reason: (s) => on(s, "change", () => { const v = s.selectedOptions[0]?.dataset.v; if (v && +v !== 0) $("#av").value = v; $("#ar-err").hidden = true; }),
  adjForm: (f) => on(f, "submit", (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    if (!fd.get("motivo")) { $("#ar-err").hidden = false; $("#ar").setAttribute("aria-invalid", "true"); $("#ar").focus(); return; }
    if (fd.get("motivo") === "otro" && !String(fd.get("nota")).trim()) { toast("Explica el motivo en el detalle"); $("#an").focus(); return; }
    const valor = Math.round(+fd.get("valor") * 2) / 2;
    if (!valor) { toast("Los puntos no pueden ser 0"); return; }
    S.adjustments.push({ kind: S.adjKind || "alumno", id: fd.get("who"), motivo: fd.get("motivo"), valor, nota: String(fd.get("nota")).trim(), at: Date.now() });
    save(); toast(`Ajuste aplicado: ${valor > 0 ? "+" : ""}${fmt(valor)} pts`); rerender();
  }),
};
function draftFor(ced) {
  S.draft ||= {};
  return (S.draft[ced] ||= { puntos: DB.tarea.preguntas.map(() => null), comentarios: DB.tarea.preguntas.map(() => "") });
}
function openStudentDialog(ced) {
  const a = student(ced);
  const d = $("#dlg-student");
  const bases = Array.from({ length: 21 }, (_, i) => 10 + i / 2);
  d.innerHTML = `<form class="dialog-body" method="dialog"><h2 id="dlg-st-t">Editar alumno</h2><p class="muted">C.I. ${ced} · ${a.seccion}</p>
    <div class="field"><label for="en">Nombres</label><input class="input" id="en" value="${esc(a.nombres)}"></div>
    <div class="field"><label for="ea">Apellidos</label><input class="input" id="ea" value="${esc(a.apellidos)}"></div>
    <div class="field"><label for="eb">Base de evaluación</label><select class="input" id="eb" aria-describedby="eb-h">${bases.map((b) => `<option value="${b}" ${b === (a.baseEvaluacion ?? 20) ? "selected" : ""}>${fmt(b)}${b === 20 ? " (normal)" : ""}</option>`).join("")}</select>
      <span class="help" id="eb-h">Por conducta. La nota se calcula sobre esta base; nunca menos de 10.</span></div>
    <div class="field"><label for="ebr">Motivo del cambio de base</label><select class="input" id="ebr">${REASONS.filter((r) => r[2] <= 0).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div>
    <div class="row" style="justify-content:flex-end"><button class="btn btn-ghost" value="cancel">Cancelar</button><button class="btn btn-primary" value="ok" id="es">Guardar</button></div></form>`;
  d.showModal();
  on($("#es"), "click", () => {
    S.overrides[ced] = { ...(S.overrides[ced] || {}), nombres: $("#en").value.trim() || a.nombres, apellidos: $("#ea").value.trim() || a.apellidos, baseEvaluacion: +$("#eb").value };
    save(); toast("Alumno actualizado"); setTimeout(rerender);
  });
}

// ---------- arranque ----------
(async () => {
  applyPrefs();
  try {
    [DB] = await Promise.all([loadSeed(), loadLogo()]);
  } catch {
    $("#app").innerHTML = `<p style="padding:24px">No se pudieron cargar los datos. Sirve el prototipo desde la raíz del repo: <code>bunx serve .</code> y abre <code>/design/prototype/</code>.</p>`;
    return;
  }
  render();
})();
