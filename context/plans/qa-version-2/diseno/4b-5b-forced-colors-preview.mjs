// Variante de 4-forced-colors-logo.mjs y 5-forced-colors-segmentado.mjs para un preview desplegado:
// solo páginas públicas (/ingresar y la galería /componentes), sin sesión.
// Uso: node .qa/repro/4b-5b-forced-colors-preview.mjs https://<preview>.vercel.app <share>
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const [BASE, SHARE] = process.argv.slice(2);
if (!/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(BASE ?? "")) { console.error("URL de preview *.vercel.app"); process.exit(2); }
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await c.newPage();
await p.emulateMedia({ forcedColors: "active" });
if (SHARE) await p.goto(BASE + "/?_vercel_share=" + SHARE, { waitUntil: "commit" });

// 4b: las capas del logo no se pintan del mismo color que el fondo.
await p.goto(BASE + "/ingresar", { waitUntil: "load" });
await p.waitForTimeout(800);
const logo = await p.evaluate(() => {
  const fondo = (e) => { for (let x = e.parentElement; x; x = x.parentElement) { const v = getComputedStyle(x).backgroundColor; if (!v.endsWith(", 0)") && v !== "transparent") return v; } return getComputedStyle(document.body).backgroundColor; };
  return [...document.querySelectorAll("[data-slot=logo] > span")].map((s) => ({ capa: getComputedStyle(s).backgroundColor, fondo: fondo(s.parentElement) }));
});
const logoOk = logo.length > 0 && logo.every((l) => l.capa !== l.fondo);

// 5b: la opción activa difiere de una inactiva en fondo o color.
await p.goto(BASE + "/componentes", { waitUntil: "load" });
await p.waitForTimeout(1200);
const seg = await p.evaluate(() => {
  const firma = (e) => { const s = getComputedStyle(e); return s.backgroundColor + "|" + s.color + "|" + s.outlineStyle; };
  const out = [];
  for (const g of document.querySelectorAll("[data-slot=toggle-group], [data-slot=tabs-list]")) {
    const on = g.querySelector("[data-state=on], [data-state=active]");
    const off = g.querySelector("[data-state=off], [data-state=inactive]");
    if (on && off) out.push({ grupo: g.getAttribute("aria-label") || g.dataset.slot, distinta: firma(on) !== firma(off) });
  }
  return out;
});
const segOk = seg.length > 0 && seg.every((s) => s.distinta);
await b.close();
console.log(JSON.stringify({ logo, grupos: seg.length, iguales: seg.filter((s) => !s.distinta).map((s) => s.grupo) }));
console.log(logoOk && segOk ? "PASS" : `FAIL logo:${logoOk ? "ok" : "invisible"} segmentados:${segOk ? "ok" : "activa indistinguible"}`);
