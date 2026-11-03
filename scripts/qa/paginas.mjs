// Comprobación de las páginas del build (fase 05, sin servidor de la app).
// Uso: bun run build && bun run check:paginas
// Recorre .next/server/app/**/*.html (salvo _not-found y demás `_…`, /secciones, /componentes y
// /tokens, que son internas) y, por página: exactamente un <h1> y un <main>, <title> único entre
// páginas, `noindex` salvo /ingresar (D023), como mucho un contenedor de avisos (Sonner, D035), y
// que cada <a href> interno apunte a una página generada o a una ruta planificada.
// Sale con código 1 y lista los fallos. Node, sin dependencias.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/*
 * Rutas finales que aún no tienen página (brief de la fase 05, «Formas compartidas»): un enlace
 * hacia ellas no cuenta como roto. Las olas 2–3 las van creando; la ola 3 vacía la lista al cerrar
 * la fase. Un patrón dinámico deja de excusar enlaces en cuanto el build genera alguna página
 * suya: desde ahí cada enlace debe ir a una página generada (p. ej. un id que no existe).
 */
const RUTAS_PLANIFICADAS = [
  "/tareas",
  "/tareas/[tarea]",
  "/equipo",
  "/ranking",
  "/perfil",
  "/profe/evaluar",
  "/profe/evaluar/[entrega]",
  "/profe/tareas",
  "/profe/tareas/nueva",
  "/profe/tareas/[id]",
  "/profe/alumnos",
  "/profe/equipos",
  "/profe/puntos",
  "/profe/premios",
  "/profe/ranking",
  "/profe/perfil",
];

/** Única página que se indexa (D023). */
const INDEXABLES = new Set(["/ingresar"]);

const RAIZ = join(".next", "server", "app");
const INTERNAS = ["/secciones", "/componentes", "/tokens"];

function htmls(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return htmls(ruta);
    return nombre.endsWith(".html") ? [ruta] : [];
  });
}

/** `index.html` → `/`; `profe/evaluar.html` → `/profe/evaluar`. */
function rutaDe(archivo) {
  const rel = relative(RAIZ, archivo)
    .split(sep)
    .join("/")
    .replace(/\.html$/, "");
  return rel === "index" ? "/" : `/${rel}`;
}

// `[tarea].html` es el esqueleto de reserva del prerender parcial (cacheComponents), no una página
// real: las páginas reales son las de `generateStaticParams`.
const esInterna = (ruta) =>
  INTERNAS.some((p) => ruta === p || ruta.startsWith(`${p}/`)) ||
  ruta.split("/").some((s) => s.startsWith("_") || /^\[.+\]$/.test(s));

const patron = (ruta) =>
  new RegExp(
    `^${ruta
      .split("/")
      .map((s) =>
        /^\[[^/]+\]$/.test(s) ? "[^/]+" : s.replace(/[.*+?^${}()|\\]/g, "\\$&"),
      )
      .join("/")}$`,
  );

const normalizar = (href) => {
  const limpio = href.split(/[?#]/)[0] ?? "";
  return limpio.length > 1 ? limpio.replace(/\/+$/, "") : limpio || "/";
};

// Sin <script> ni <template> de datos: el payload RSC repite textos que no son DOM
const sinScripts = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

const atributo = (etiqueta, nombre) =>
  etiqueta.match(new RegExp(`\\s${nombre}="([^"]*)"`, "i"))?.[1];

let archivos;
try {
  archivos = htmls(RAIZ);
} catch {
  console.error(`No existe ${RAIZ}: corre antes \`bun run build\`.`);
  process.exit(1);
}

const paginas = archivos
  .map((archivo) => ({ archivo, ruta: rutaDe(archivo) }))
  .filter(({ ruta }) => !esInterna(ruta))
  .sort((a, b) => a.ruta.localeCompare(b.ruta));

const generadas = new Set(paginas.map((p) => p.ruta));
const estaticasPlanificadas = new Set(
  RUTAS_PLANIFICADAS.filter((r) => !r.includes("[")),
);
const planificadas = RUTAS_PLANIFICADAS.map((r) => {
  const re = patron(r);
  const dinamica = r.includes("[");
  // ¿El build ya genera páginas de este patrón (sin contar rutas estáticas que también encaja)?
  const conPaginas =
    dinamica &&
    [...generadas].some((g) => re.test(g) && !estaticasPlanificadas.has(g));
  return { ruta: r, re, excusa: !conPaginas };
});

const fallos = [];
const titulos = new Map();

for (const { archivo, ruta } of paginas) {
  const html = readFileSync(archivo, "utf8");
  const dom = sinScripts(html);
  const falla = (msg) => fallos.push(`${ruta}: ${msg}`);

  const h1 = dom.match(/<h1[\s>]/gi)?.length ?? 0;
  if (h1 !== 1) falla(`${h1} <h1> (debe haber 1)`);
  const main = dom.match(/<main[\s>]/gi)?.length ?? 0;
  if (main !== 1) falla(`${main} <main> (debe haber 1)`);

  const titulo = dom.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!titulo) falla("sin <title>");
  else {
    const otra = titulos.get(titulo);
    if (otra) falla(`<title> «${titulo}» repetido (también en ${otra})`);
    else titulos.set(titulo, ruta);
  }

  const robots = [...dom.matchAll(/<meta\b[^>]*>/gi)]
    .map(([m]) => m)
    .find((m) => atributo(m, "name") === "robots");
  const noindex = /noindex/i.test(
    robots ? (atributo(robots, "content") ?? "") : "",
  );
  if (INDEXABLES.has(ruta) && noindex) falla("lleva noindex y debe indexarse");
  if (!INDEXABLES.has(ruta) && !noindex) falla("falta robots noindex");

  const avisos = [...dom.matchAll(/<section\b[^>]*>/gi)].filter(([s]) =>
    (atributo(s, "aria-label") ?? "").startsWith("Notificaciones"),
  ).length;
  if (avisos > 1)
    falla(`${avisos} contenedores de avisos (Sonner): debe haber 1 como mucho`);

  const rotos = new Set();
  for (const [a] of dom.matchAll(/<a\b[^>]*>/gi)) {
    const href = atributo(a, "href");
    if (
      !href ||
      href.startsWith("#") ||
      !href.startsWith("/") ||
      href.startsWith("//")
    )
      continue;
    const destino = normalizar(href);
    if (generadas.has(destino) || esInterna(destino)) continue;
    if (planificadas.some((p) => p.excusa && p.re.test(destino))) continue;
    rotos.add(destino);
  }
  for (const destino of rotos) falla(`enlace roto a ${destino}`);
}

const pendientes = RUTAS_PLANIFICADAS.filter(
  (r) => ![...generadas].some((g) => patron(r).test(g)),
);
console.log(
  `${paginas.length} páginas: ${paginas.map((p) => p.ruta).join(", ") || "ninguna"}`,
);
if (pendientes.length)
  console.log(
    `Planificadas sin página todavía (${pendientes.length}): ${pendientes.join(", ")}`,
  );

if (fallos.length) {
  console.error(`\n${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("Páginas en verde.");
