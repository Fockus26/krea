// Repro 9: una tarea inexistente (/tareas/tarea-que-no-existe) como alumno: la 404 se pinta DENTRO del shell
// con un segundo <main id="contenido"> y un segundo enlace «Tu perfil» de 32x32 (< 44 px). PASS si hay un solo main y ningun «Tu perfil» < 44.
// Uso: node .qa/repro/9-404-dentro-del-shell.mjs <base>
import { chromium, sesion, ir, SHOTS } from "../dqa/lib.mjs";
import { join } from "node:path";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, storageState: await sesion(b, "estudiante") });
const p = await ctx.newPage();
await ir(p, "/tareas/tarea-que-no-existe");
const m = await p.evaluate(() => ({
  mains: document.querySelectorAll("main").length,
  ids: document.querySelectorAll("#contenido").length,
  perfil: [...document.querySelectorAll('[aria-label="Tu perfil"]')].map((e) => { const r = e.getBoundingClientRect(); return Math.round(r.width) + "x" + Math.round(r.height); }),
}));
await p.screenshot({ path: join(SHOTS, "repro9-404-shell.png"), fullPage: true });
await b.close();
const mal = m.mains > 1 || m.perfil.some((s) => parseInt(s) < 44);
console.log(mal ? "FAIL mains=" + m.mains + " #contenido=" + m.ids + " «Tu perfil»=" + m.perfil.join(",") : "PASS");
