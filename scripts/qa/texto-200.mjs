// Guarda de texto al 200 % (D503): a 390 px, con la fuente del navegador al 200 % (CDP Page.setFontSizes,
// 32 px: escala rem y las media queries en rem como el ajuste real), ninguna ruta tiene scroll horizontal.
// Recorre todas las rutas de alumno y de profe más los enlaces internos que encuentra en ellas
// (una pasada: así entran las dinámicas, hasta 2 por patrón). Sale con código 1 y lista los fallos.
// Uso (servidor local con la base sembrada, nunca producción):
//   node scripts/qa/texto-200.mjs http://localhost:4307
//   EXTRA=/tareas/qa-partes,/profe/evaluar/qa-enlace__45021029 node scripts/qa/texto-200.mjs <base>
// Cuentas: ESTUDIANTE_EMAIL_TEST / PROFESOR_EMAIL_TEST (cédulas del seed) y QA_PASSWORD (por defecto, la del seed).
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://localhost:4307").replace(/\/$/, "");
if (!/\/\/(localhost|127\.0\.0\.1)[:/]/.test(`${BASE}/`)) {
  console.error("Solo contra un servidor local.");
  process.exit(2);
}
const CLAVE = process.env.QA_PASSWORD || "krea-demo-2026";
const DOMINIO = "alumnos.krea.app";
const ANCHO = 390;

const ROLES = [
  {
    rol: "estudiante",
    cedula: process.env.ESTUDIANTE_EMAIL_TEST || "45009896",
    rutas: [
      "/",
      "/notas",
      "/tareas",
      "/equipo",
      "/ranking",
      "/ranking/equipos",
      "/perfil",
    ],
  },
  {
    rol: "profesor",
    cedula: process.env.PROFESOR_EMAIL_TEST || "10000000",
    rutas: [
      "/profe",
      "/profe/alumnos",
      "/profe/equipos",
      "/profe/evaluar",
      "/profe/perfil",
      "/profe/premios",
      "/profe/profesores",
      "/profe/puntos",
      "/profe/ranking",
      "/profe/ranking/equipos",
      "/profe/secciones",
      "/profe/tareas",
      "/profe/tareas/nueva",
    ],
  },
];
const EXTRA = (process.env.EXTRA ?? "").split(",").filter(Boolean);
// No son pantallas del producto o cierran la sesión.
const OMITIR =
  /^\/(api|salir|secciones|componentes|tokens|estados|correos|sin-conexion)(\/|$)/;

// El limitador de intentos del login puede responder sin cookie: se reintenta con calma.
async function cookie(cedula) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`${BASE}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify({ email: `${cedula}@${DOMINIO}`, password: CLAVE }),
    });
    const c = r.headers
      .getSetCookie()
      .find((x) => x.startsWith("krea.session_token="));
    if (c) return c.split(";")[0].slice("krea.session_token=".length);
    await new Promise((ok) => setTimeout(ok, 15000));
  }
  throw new Error(`login ${cedula}: sin cookie de sesión`);
}

const medir = () => {
  const d = document.documentElement;
  const fuera = [...document.querySelectorAll("body *")]
    .filter((e) => {
      const q = e.getBoundingClientRect();
      return q.width && (q.right > d.clientWidth + 1 || q.left < -1);
    })
    .slice(0, 3)
    .map(
      (e) =>
        `${e.tagName.toLowerCase()}.${String(e.className).split(" ").slice(0, 4).join(".")}`,
    );
  const hrefs = [...document.querySelectorAll("a[href^='/']")].map(
    (a) => a.getAttribute("href").split(/[?#]/)[0],
  );
  return { sw: d.scrollWidth, cw: d.clientWidth, fuera, hrefs };
};

const browser = await chromium.launch();
const fallos = [];
let medidas = 0;
try {
  for (const { rol, cedula, rutas } of ROLES) {
    const ctx = await browser.newContext({
      viewport: { width: ANCHO, height: 844 },
    });
    const u = new URL(BASE);
    await ctx.addCookies([
      {
        name: "krea.session_token",
        value: await cookie(cedula),
        domain: u.hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Page.enable");
    await cdp.send("Page.setFontSizes", {
      fontSizes: { standard: 32, fixed: 26 },
    });

    const vistas = new Set();
    const porForma = new Map();
    const cola = [
      ...rutas,
      ...EXTRA.filter((r) => (rol === "profesor") === r.startsWith("/profe")),
    ];
    const descubiertas = [];
    const visitar = async (ruta, descubrir) => {
      if (vistas.has(ruta)) return;
      vistas.add(ruta);
      await page.goto(BASE + ruta, { waitUntil: "load", timeout: 400000 });
      await page.waitForTimeout(2500);
      const m = await page.evaluate(medir);
      medidas++;
      if (m.sw > m.cw + 1)
        fallos.push(`${rol} ${ruta} ${m.sw}>${m.cw} (${m.fuera.join(", ")})`);
      if (descubrir)
        for (const h of m.hrefs) {
          const mismoRol =
            rol === "profesor"
              ? h.startsWith("/profe")
              : !h.startsWith("/profe");
          if (!mismoRol || OMITIR.test(h) || h === "/ingresar") continue;
          // Forma: los segmentos con dígitos o guiones largos son parámetros; máximo 2 por forma.
          const forma = h
            .split("/")
            .map((s, i) => (i > 1 && /[0-9_-]/.test(s) ? ":p" : s))
            .join("/");
          const n = porForma.get(forma) ?? 0;
          if (n < 2 && !vistas.has(h) && !rutas.includes(h)) {
            porForma.set(forma, n + 1);
            descubiertas.push(h);
          }
        }
    };
    for (const r of cola) await visitar(r, true);
    for (const r of descubiertas) await visitar(r, false);
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log(`${medidas} rutas medidas a ${ANCHO} px con texto al 200 %`);
console.log(fallos.length ? `FAIL ${fallos.join(" | ")}` : "PASS");
process.exit(fallos.length ? 1 : 0);
