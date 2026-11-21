// Helpers de QA v2 (Postgres local qa_4302). Nunca imprime contraseñas.
import pg from "pg";

export const DB_URL =
  process.env.QA_DB_URL ??
  "postgresql://qa_app:qa_app@127.0.0.1:54329/qa_4302";
if (!/127\.0\.0\.1|localhost/.test(DB_URL)) throw new Error("solo base local");

let pool;
export function db() {
  pool ??= new pg.Pool({ connectionString: DB_URL, max: 3 });
  return pool;
}
export async function q(sql, params = []) {
  const r = await db().query(sql, params);
  return r.rows;
}
export async function cerrarDb() {
  if (pool) await pool.end();
  pool = undefined;
}

export const DOMINIO = "alumnos.krea.app";
export const emailDe = (cedula) => `${cedula}@${DOMINIO}`;

export const BASE = (process.argv[2] ?? "http://localhost:4302").replace(/\/$/, "");

/** Login directo contra Better Auth; devuelve el valor de la cookie de sesión o lanza. */
export async function login(cedula, password, base = BASE) {
  const r = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({ email: emailDe(cedula), password }),
  });
  if (!r.ok) throw new Error(`login ${cedula}: ${r.status}`);
  const cookies = r.headers.getSetCookie();
  const c = cookies.find((x) => x.startsWith("krea.session_token="));
  if (!c) throw new Error("sin cookie");
  return c.split(";")[0].slice("krea.session_token=".length);
}

/** Contexto de Playwright con la sesión ya puesta. */
export async function contexto(browser, cookie, base = BASE, opts = {}) {
  const ctx = await browser.newContext({ baseURL: base, ...opts });
  const u = new URL(base);
  if (cookie)
    await ctx.addCookies([
      {
        name: "krea.session_token",
        value: decodeURIComponent(cookie) === cookie ? cookie : cookie,
        domain: u.hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  return ctx;
}

export const PASS_QA = "qa-local-Clave-2026";

/** Pone una contraseña conocida a una cédula (solo base local). */
export async function ponerPassword(cedula, password = PASS_QA) {
  const { hashPassword } = await import("better-auth/crypto");
  const h = await hashPassword(password);
  const r = await q(
    `update account set password=$1, updated_at=now() where user_id=$2 and provider_id='credential' returning id`,
    [h, cedula],
  );
  if (!r.length) throw new Error(`sin cuenta ${cedula}`);
  await q(`update usuarios set debe_cambiar_password=false where cedula=$1`, [cedula]);
  await q(`delete from rate_limit where key=$1`, [`fallos|${emailDe(cedula)}`]);
}

/** Llama a una Server Action con el id capturado de una petición real. */
export async function accion(page, actionId, args, ruta) {
  return page.evaluate(
    async ({ actionId, args, ruta }) => {
      const r = await fetch(ruta ?? location.pathname, {
        method: "POST",
        headers: {
          "next-action": actionId,
          accept: "text/x-component",
          "content-type": "text/plain;charset=UTF-8",
        },
        body: JSON.stringify(args),
      });
      return { status: r.status, text: await r.text() };
    },
    { actionId, args, ruta },
  );
}

/** Captura ids de Server Actions que el cliente envía. */
export function capturarAcciones(page) {
  const vistas = [];
  page.on("request", (req) => {
    const id = req.headers()["next-action"];
    if (id && req.method() === "POST")
      vistas.push({ id, url: req.url(), body: req.postData() });
  });
  return vistas;
}

export function resultado(ok, medida) {
  console.log(ok ? "PASS" : `FAIL ${medida}`);
  process.exitCode = ok ? 0 : 1;
}

// ---- Server Actions por HTTP (ids del manifiesto de next dev) ----
import { readFileSync } from "node:fs";
function manifiesto() {
  const f = process.env.QA_DEV ? ".next/dev/server/server-reference-manifest.json" : ".next/server/server-reference-manifest.json";
  return JSON.parse(readFileSync(f, "utf8")).node;
}
function rutaDeWorker(w) {
  return (
    "/" +
    w.replace(/^app\//, "").replace(/\/page$/, "").split("/").filter((s) => !/^\(.*\)$/.test(s)).join("/")
  ).replace(/\/+$/, "") || "/";
}
export function idAccion(nombre, preferida) {
  const m = manifiesto();
  for (const [id, v] of Object.entries(m)) {
    if (v.exportedName !== nombre) continue;
    const workers = Object.keys(v.workers).filter((w) => w.endsWith("/page"));
    let w = (preferida && workers.find((x) => rutaDeWorker(x) === preferida)) || workers.find((x) => !x.includes("[")) || workers[0];
    return { id, ruta: rutaDeWorker(w ?? "app/page") };
  }
  throw new Error(`acción ${nombre} sin compilar (abre una página que la use)`);
}
/** Ejecuta la Server Action `nombre` con `args` como la cookie dada. Devuelve el valor (o {raw}). */
export async function act(nombre, args, cookie, { ruta, base = BASE } = {}) {
  let a;
  try { a = idAccion(nombre, ruta); } catch (x) { return { sinCompilar: nombre }; }
  const path = ruta && ruta.includes("/") ? ruta : a.ruta;
  const r = await fetch(base + path, {
    method: "POST",
    redirect: "manual",
    headers: {
      "next-action": a.id,
      accept: "text/x-component",
      "content-type": "text/plain;charset=UTF-8",
      origin: base,
      ...(cookie ? { cookie: `krea.session_token=${cookie}` } : {}),
    },
    body: JSON.stringify(args),
  });
  const text = await r.text();
  const lineas = text.split("\n").filter(Boolean);
  for (const l of lineas) {
    const m = l.match(/^1:(.*)$/);
    if (m) { try { return JSON.parse(m[1]); } catch {} }
  }
  return { raw: text.slice(0, 300), status: r.status, location: r.headers.get("x-action-redirect") ?? r.headers.get("location") };
}
