// Utilidades del design-qa de la fase 09 (node + Playwright).
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
export const { chromium } = require("playwright");

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..", "..");
export const OUT = join(HERE, "out");
export const SHOTS = join(HERE, "shots");
mkdirSync(OUT, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

export const BASE = process.argv[2] || process.env.BASE_URL || "http://localhost:4303";

export function envTest() {
  const txt = readFileSync(join(ROOT, ".env.test.local"), "utf8");
  const env = {};
  for (const l of txt.split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

export const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "root";

// Inicia sesion por la UI y guarda el storageState. rol: estudiante | profesor.
export async function sesion(browser, rol) {
  const file = join(OUT, "state-" + rol + ".json");
  if (existsSync(file)) return file;
  const env = envTest();
  const user = env[rol.toUpperCase() + "_EMAIL_TEST"];
  const pass = "krea-demo-2026";
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/ingresar", { waitUntil: "load", timeout: 180000 });
  await page.waitForTimeout(1500);
  await page.getByLabel("Cédula").fill(user);
  await page.getByLabel("Contraseña", { exact: true }).fill(pass);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("button", { name: "Entrar" }).waitFor({ state: "detached", timeout: 300000 }); await page.waitForTimeout(1500);
  await ctx.storageState({ path: file });
  await ctx.close();
  return file;
}

// Fija tema y acento antes de que cargue la app (mismas claves que lib/site.ts THEME_SCRIPT).
export async function apariencia(ctx, o) {
  const tema = (o && o.tema) || null;
  const acento = (o && o.acento) || null;
  await ctx.addInitScript(
    ([t, a]) => {
      try {
        if (t) localStorage.setItem("krea-theme", t);
        if (a) localStorage.setItem("krea-accent", a);
      } catch (e) {}
    },
    [tema, acento],
  );
}

export const PERDIDAS = [];
const PUBLICA = (r) => /^\/(ingresar|recuperar|estados|ruta-que-no-existe|no-existe|secciones|componentes|tokens)/.test(r);
async function irCrudo(page, ruta) {
  let r;
  try {
    r = await page.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 45000 });
  } catch (e) {
    r = await page.goto(BASE + ruta, { waitUntil: "load", timeout: 180000 });
  }
  await page.waitForTimeout(400);
  return r;
}
export async function ir(page, ruta) {
  let r = await irCrudo(page, ruta);
  const fin = new URL(page.url()).pathname;
  if (fin.startsWith("/ingresar") && !PUBLICA(ruta)) {
    PERDIDAS.push(new Date().toISOString() + " " + ruta);
    console.log("SESION-PERDIDA en", ruta, "-> reingreso");
    const rol = ruta.startsWith("/profe") ? "PROFESOR" : "ESTUDIANTE";
    const env = envTest();
    await page.getByLabel("Cédula").fill(env[rol + "_EMAIL_TEST"]);
    await page.getByLabel("Contraseña", { exact: true }).fill("krea-demo-2026");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.getByRole("button", { name: "Entrar" }).waitFor({ state: "detached", timeout: 300000 }); await page.waitForTimeout(1500);
    await page.context().storageState({ path: join(OUT, "state-" + rol.toLowerCase() + ".json") });
    r = await irCrudo(page, ruta);
  }
  return r;
}
