// Repro 2: una tarea inexistente muestra la 404 pero responde HTTP 200 (estado HTTP real, STATUS-SCREENS).
// Uso: node .qa/repro/2-404-dinamico-http-200.mjs <base>  -> PASS si todas responden 404.
import { chromium, sesion, BASE, SHOTS } from "../dqa/lib.mjs";
import { join } from "node:path";
const browser = await chromium.launch();
const fallos = [];
for (const [rol, rutas] of [["estudiante", ["/notas/tarea-que-no-existe", "/tareas/tarea-que-no-existe", "/esta-ruta-no-existe"]], ["profesor", ["/profe/tareas/no-existe", "/profe/evaluar/no-existe__00000000", "/profe/equipos/5z"]]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: await sesion(browser, rol) });
  const page = await ctx.newPage();
  for (const r of rutas) {
    const resp = await page.goto(BASE + r, { waitUntil: "load", timeout: 240000 });
    await page.waitForTimeout(1200);
    const h1 = await page.evaluate(() => [...document.querySelectorAll("h1")].map((h) => h.innerText).join(" / "));
    const robots = await page.evaluate(() => [...document.querySelectorAll("meta[name=robots]")].map((m) => m.content).join(" / "));
    const fin = new URL(page.url()).pathname;
    console.log(rol, r, "->", fin, resp.status(), "h1:", h1, "robots:", robots);
    if (/recreo/i.test(h1) && resp.status() !== 404) fallos.push(rol + " " + r + " HTTP " + resp.status());
    await page.screenshot({ path: join(SHOTS, "repro2-" + rol + r.replace(/\//g, "-") + ".png") });
  }
  await ctx.close();
}
await browser.close();
console.log(fallos.length ? "FAIL " + fallos.join(" | ") : "PASS");
