// Repro 3: movil 390 px con la fuente del navegador al 200 % (32 px, via CDP Page.setFontSizes:
// escala rem y media queries en rem como el ajuste real). PASS si ninguna ruta tiene scroll horizontal.
// Uso: node .qa/repro/3-texto-200-movil.mjs <base>
import { chromium, sesion, BASE, SHOTS, ir } from "../dqa/lib.mjs";
import { join } from "node:path";
const browser = await chromium.launch();
const st = await sesion(browser, "estudiante");
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: st });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Page.enable");
await cdp.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
const fallos = [];
for (const ruta of ["/", "/notas", "/ranking", "/perfil", "/notas/identidad-de-marca"]) {
  await ir(page, ruta);
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => {
    const d = document.documentElement;
    const nav = document.querySelector("nav.h-bnav, nav[aria-label] .h-bnav, nav");
    const fuera = [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > d.clientWidth + 1 || r.left < -1); }).slice(0, 2).map((e) => e.tagName.toLowerCase() + "." + String(e.className).split(" ").slice(0, 3).join("."));
    return { sw: d.scrollWidth, cw: d.clientWidth, rem: getComputedStyle(d).fontSize, fuera };
  });
  if (m.sw > m.cw + 1) fallos.push(ruta + " " + m.sw + ">" + m.cw + " (" + m.fuera.join(", ") + ")");
  await page.screenshot({ path: join(SHOTS, "repro3" + ruta.replace(/\//g, "-") + ".png") });
}
await browser.close();
console.log(fallos.length ? "FAIL " + fallos.join(" | ") : "PASS");
