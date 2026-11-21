// Repro 11: /perfil, pestaña de estilo de avatar con aria-controls que apunta a un panel no montado (axe aria-valid-attr-value).
// Uso: node .qa/repro/11-perfil-aria-controls-invalido.mjs <base>
import { createRequire } from "node:module";
import { chromium, sesion, ir } from "../dqa/lib.mjs";
const require = createRequire(import.meta.url);
const AxeBuilder = require("@axe-core/playwright").default;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, storageState: await sesion(b, "estudiante") });
const p = await ctx.newPage();
await ir(p, "/perfil");
const r = await new AxeBuilder({ page: p }).withRules(["aria-valid-attr-value"]).analyze();
await b.close();
console.log(r.violations.length ? "FAIL " + r.violations[0].nodes.map((n) => n.target.join(" ").slice(0, 70) + " " + (n.any[0] ? n.any[0].message.slice(0, 80) : "")).join(" | ") : "PASS");
