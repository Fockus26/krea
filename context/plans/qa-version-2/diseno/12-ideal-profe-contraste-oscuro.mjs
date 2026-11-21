// Repro 12: /profe/tareas/qa-evaluada/ideal en oscuro: texto subrayado #7aa2f7 sobre #59462c (3,56:1, 13 px).
// Uso: node .qa/repro/12-ideal-profe-contraste-oscuro.mjs <base>   (requiere la tarea sembrada qa-evaluada con ideal)
import { createRequire } from "node:module";
import { chromium, sesion, ir, apariencia, SHOTS } from "../dqa/lib.mjs";
import { join } from "node:path";
const require = createRequire(import.meta.url);
const AxeBuilder = require("@axe-core/playwright").default;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, storageState: await sesion(b, "profesor"), colorScheme: "dark" });
await apariencia(ctx, { tema: "dark" });
const p = await ctx.newPage();
await ir(p, "/profe/tareas/qa-evaluada/ideal");
const r = await new AxeBuilder({ page: p }).withRules(["color-contrast"]).analyze();
const v = r.violations[0];
let d = "";
if (v) { const n = v.nodes[0]; d = n.target.join(" ") + " «" + (n.html || "").slice(0, 120) + "» " + (n.any[0] ? n.any[0].message.slice(0, 90) : ""); await p.locator(n.target.join(" ")).first().scrollIntoViewIfNeeded(); await p.screenshot({ path: join(SHOTS, "repro12-ideal-oscuro.png") }); }
await b.close();
console.log(v ? "FAIL " + d : "PASS");
