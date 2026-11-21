// Repro 8: /profe/alumnos, pildoras de nota con texto blanco + text-shadow sobre gradeColor: axe color-contrast < 4,5.
// Uso: node .qa/repro/8-contraste-pildora-nota-alumnos.mjs <base>
import { createRequire } from "node:module";
import { chromium, sesion, ir, SHOTS } from "../dqa/lib.mjs";
import { join } from "node:path";
const require = createRequire(import.meta.url);
const AxeBuilder = require("@axe-core/playwright").default;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, storageState: await sesion(b, "profesor") });
const p = await ctx.newPage();
await ir(p, "/profe/alumnos");
const r = await new AxeBuilder({ page: p }).withTags(["wcag2aa"]).analyze();
const v = r.violations.filter((x) => x.id === "color-contrast");
const filas = [];
for (const x of v) for (const n of x.nodes.slice(0, 6)) {
  const txt = await p.locator(n.target.join(" ")).first().innerText().catch(() => "?");
  const bg = await p.locator(n.target.join(" ")).first().evaluate((e) => getComputedStyle(e).backgroundColor + " / sombra " + getComputedStyle(e).textShadow).catch(() => "?");
  filas.push("nota «" + txt.trim() + "» " + bg + " :: " + (n.any[0] ? n.any[0].message.slice(0, 80) : ""));
}
await b.close();
console.log(v.length ? "FAIL " + v.reduce((a, x) => a + x.nodes.length, 0) + " pildoras: " + filas.slice(0, 4).join(" | ") : "PASS");
