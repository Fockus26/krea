// Repro 5: con forced-colors, la opcion activa de ToggleGroup / Tabs segmented (fondo + sombra) no se
// distingue de las demas. PASS si la opcion activa difiere en borde, outline o fondo de una inactiva.
// Uso: node .qa/repro/5-forced-colors-segmentado.mjs <base>
import { chromium, sesion, BASE, SHOTS, ir } from "../dqa/lib.mjs";
import { join } from "node:path";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: await sesion(browser, "estudiante") });
const page = await ctx.newPage();
await page.emulateMedia({ forcedColors: "active" });
const fallos = [];
for (const ruta of ["/notas", "/perfil", "/ranking"]) {
  await ir(page, ruta);
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const efect = (e) => { for (let x = e; x; x = x.parentElement) { const b = getComputedStyle(x).backgroundColor; if (!b.endsWith(", 0)") && b !== "transparent") return b; } return "canvas"; };
    const firma = (e) => { const c = getComputedStyle(e); return [efect(e), c.borderTopWidth + " " + c.borderTopStyle + " " + c.borderTopColor, c.outlineStyle, c.textDecorationLine, c.fontWeight].join("|"); };
    const grupos = [...document.querySelectorAll("[data-slot=toggle-group], [data-slot=tabs-list], nav[aria-label] ul, [role=tablist]")];
    return grupos.map((g) => {
      const items = [...g.querySelectorAll("[data-state=on], [data-state=off], [data-state=active], [data-state=inactive], a[aria-current], a:not([aria-current])")];
      const on = items.find((i) => ["on", "active"].includes(i.getAttribute("data-state")) || i.getAttribute("aria-current") === "page");
      const off = items.find((i) => i !== on);
      return on && off ? { on: on.innerText.trim(), off: off.innerText.trim(), igual: firma(on) === firma(off), f: firma(on), y: on.getBoundingClientRect().top + scrollY } : null;
    }).filter(Boolean);
  });
  for (const g of r) if (g.igual) fallos.push(ruta + " «" + g.on + "» = «" + g.off + "»");
  const g0 = r.find((g) => g.igual);
  if (g0) { await page.evaluate((y) => scrollTo(0, y - 120), g0.y); await page.waitForTimeout(200); await page.screenshot({ path: join(SHOTS, "repro5" + ruta.replace(/\//g, "-") + ".png"), clip: { x: 0, y: 0, width: 390, height: 300 } }); }
}
await browser.close();
console.log(fallos.length ? "FAIL activo indistinguible: " + fallos.join(" | ") : "PASS");
