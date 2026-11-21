// Repro 6: recorriendo con Tab en movil (390x844), el elemento enfocado queda debajo de la barra
// inferior fija o de la superior (tras terminar el scroll suave). PASS si ninguno queda tapado > 50 %.
// Uso: node .qa/repro/6-foco-tapado-barra.mjs <base>
import { chromium, sesion, ir, SHOTS } from "../dqa/lib.mjs";
import { join } from "node:path";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: await sesion(browser, "estudiante") });
const page = await ctx.newPage();
const fallos = [];
for (const ruta of ["/", "/notas", "/perfil"]) {
  await ir(page, ruta);
  await page.keyboard.press("Shift");
  let shot = false;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(900);
    const s = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const r = a.getBoundingClientRect();
      if (!r.height) return null;
      const barras = [...document.querySelectorAll("header, nav")].filter((e) => ["fixed", "sticky"].includes(getComputedStyle(e).position) && !e.contains(a));
      let tapado = 0;
      for (const b of barras) { const q = b.getBoundingClientRect(); const h = Math.max(0, Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top)); tapado = Math.max(tapado, h / r.height); }
      return { k: a.tagName.toLowerCase() + " «" + (a.getAttribute("aria-label") || a.innerText || "").trim().replace(/\s+/g, " ").slice(0, 30) + "»", tapado: Math.round(tapado * 100), top: Math.round(r.top), bottom: Math.round(r.bottom) };
    });
    if (s && s.tapado > 50 && !s.k.includes("Saltar al contenido")) {
      fallos.push(ruta + " " + s.k + " " + s.tapado + "% bajo barra (y " + s.top + "-" + s.bottom + ")");
      if (!shot) { await page.screenshot({ path: join(SHOTS, "repro6" + ruta.replace(/\//g, "-") + ".png") }); shot = true; }
    }
  }
}
await browser.close();
console.log(fallos.length ? "FAIL " + fallos.length + ": " + fallos.slice(0, 6).join(" | ") : "PASS");
