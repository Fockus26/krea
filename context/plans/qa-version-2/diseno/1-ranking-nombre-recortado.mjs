// Repro 1: en el ranking a 320/360 px el nombre de la fila queda en pocos px (una letra + elipsis).
// Uso: node .qa/repro/1-ranking-nombre-recortado.mjs <base>   -> PASS | FAIL <medida>
// PASS si en /ranking y /ranking/equipos cada nombre de fila visible mide >= 64 px o cabe entero.
import { chromium, sesion, BASE, SHOTS, ir } from "../dqa/lib.mjs";
import { join } from "node:path";
const browser = await chromium.launch();
const st = await sesion(browser, "estudiante");
const fallos = [];
for (const w of [320, 360]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, storageState: st });
  const page = await ctx.newPage();
  for (const ruta of ["/ranking", "/ranking/equipos"]) {
    await ir(page, ruta);
    await page.waitForTimeout(1500);
    const filas = await page.evaluate(() => [...document.querySelectorAll("span.text-button.truncate")].map((s) => {
      const r = s.getBoundingClientRect();
      const fila = s.closest("li, a, [data-slot]") || s.parentElement;
      return { nombre: s.textContent, ancho: Math.round(r.width), necesita: s.scrollWidth, empate: /Empate/.test(fila.textContent), y: Math.round(r.top + scrollY) };
    }).filter((f) => f.ancho > 0));
    const malas = filas.filter((f) => f.necesita > f.ancho + 1 && f.ancho < 64);
    for (const m of malas) fallos.push(w + " " + ruta + " «" + m.nombre + "» " + m.ancho + "px de " + m.necesita + (m.empate ? " (con Empate)" : ""));
    if (malas[0]) {
      await page.evaluate((y) => scrollTo(0, y - 200), malas[0].y);
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(SHOTS, "repro1-" + w + ruta.replace(/\//g, "-") + ".png") });
    }
  }
  await ctx.close();
}
await browser.close();
console.log(fallos.length ? "FAIL " + fallos.length + " nombres < 64px: " + fallos.slice(0, 8).join(" | ") : "PASS");
