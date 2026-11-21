// Repro 13: 390 px con fuente del navegador al 200 % (CDP Page.setFontSizes 32 px) en las rutas nuevas (partes, enlace, evaluada) y del profe.
// PASS si ninguna tiene scroll horizontal. Uso: node .qa/repro/13-texto-200-rutas-nuevas.mjs <base>
import { chromium, sesion, ir } from "../dqa/lib.mjs";
const b = await chromium.launch();
const fallos = [];
for (const [rol, rutas] of [["estudiante", ["/tareas/qa-partes", "/tareas/qa-enlace", "/notas/qa-evaluada", "/tareas", "/equipo", "/"]], ["profesor", ["/profe/evaluar/qa-enlace__45021029", "/profe/evaluar/qa-partes-env__5a-g1", "/profe/tareas/qa-evaluada/ideal", "/profe/tareas/qa-partes", "/profe/alumnos", "/profe"]]]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, storageState: await sesion(b, rol) });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Page.enable");
  await cdp.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
  for (const r of rutas) {
    await ir(p, r);
    await p.waitForTimeout(1200);
    const m = await p.evaluate(() => { const d = document.documentElement; const fuera = [...document.querySelectorAll("body *")].filter((e) => { const q = e.getBoundingClientRect(); return q.width && (q.right > d.clientWidth + 1 || q.left < -1); }).slice(0, 2).map((e) => e.tagName.toLowerCase() + "." + String(e.className).split(" ").slice(0, 3).join(".")); return { sw: d.scrollWidth, cw: d.clientWidth, fuera }; });
    if (m.sw > m.cw + 1) fallos.push(r + " " + m.sw + ">" + m.cw + " (" + m.fuera.join(", ") + ")");
  }
  await ctx.close();
}
await b.close();
console.log(fallos.length ? "FAIL " + fallos.join(" | ") : "PASS");
