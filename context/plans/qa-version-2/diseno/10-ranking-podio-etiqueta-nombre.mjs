// Repro 10: /ranking, botones del podio y filas: el nombre accesible (aria-label) no contiene el texto visible (WCAG 2.5.3, axe label-content-name-mismatch).
// Uso: node .qa/repro/10-ranking-podio-etiqueta-nombre.mjs <base>
import { createRequire } from "node:module";
import { chromium, sesion, ir } from "../dqa/lib.mjs";
const require = createRequire(import.meta.url);
const AxeBuilder = require("@axe-core/playwright").default;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, storageState: await sesion(b, "estudiante") });
const p = await ctx.newPage();
await ir(p, "/ranking");
const r = await new AxeBuilder({ page: p }).withRules(["label-content-name-mismatch"]).analyze();
const v = r.violations[0];
const ej = v ? await p.locator(v.nodes[0].target.join(" ")).first().evaluate((e) => "aria-label=«" + e.getAttribute("aria-label") + "» texto=«" + e.innerText.replace(/\s+/g, " ").trim().slice(0, 50) + "»") : "";
await b.close();
console.log(v ? "FAIL " + v.nodes.length + " nodos (ej. " + ej + ")" : "PASS");
