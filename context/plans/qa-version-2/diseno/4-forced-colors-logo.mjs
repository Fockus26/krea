// Repro 4: con forced-colors (alto contraste de Windows) el logo KREA (mascara CSS + background-color)
// desaparece: su color de fondo se fuerza a Canvas. PASS si el color de las capas del logo difiere del fondo.
// Uso: node .qa/repro/4-forced-colors-logo.mjs <base>
import { chromium, BASE, SHOTS } from "../dqa/lib.mjs";
import { join } from "node:path";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.emulateMedia({ forcedColors: "active" });
await page.goto(BASE + "/ingresar", { waitUntil: "load", timeout: 240000 });
await page.waitForTimeout(1000);
const m = await page.evaluate(() => {
  const capas = [...document.querySelectorAll("[data-slot=logo] span, [role=img][aria-label*=KREA] span, [data-slot=logo] *")].filter((e) => getComputedStyle(e).maskImage !== "none" || getComputedStyle(e).webkitMaskImage !== "none");
  const fondo = getComputedStyle(document.body).backgroundColor;
  return { n: capas.length, fondo, colores: capas.map((e) => getComputedStyle(e).backgroundColor), fca: capas.map((e) => getComputedStyle(e).forcedColorAdjust) };
});
await page.screenshot({ path: join(SHOTS, "repro4-forced-ingresar.png"), clip: { x: 0, y: 0, width: 390, height: 260 } });
await browser.close();
const invisibles = m.colores.filter((c) => c === m.fondo).length;
console.log(m.n === 0 ? "FAIL no encontre capas del logo" : invisibles ? "FAIL " + invisibles + "/" + m.n + " capas del logo = fondo " + m.fondo + " (forced-color-adjust " + m.fca[0] + ")" : "PASS");
