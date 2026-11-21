// Repro 7: inicio del alumno en tema oscuro: texto blanco sobre #7aa2f7 (2,51:1). PASS si axe no reporta color-contrast.
// Uso: node .qa/repro/7-contraste-oscuro-inicio.mjs <base>
import { createRequire } from "node:module";
import { chromium, sesion, ir, apariencia, SHOTS } from "../dqa/lib.mjs";
import { join } from "node:path";
const require = createRequire(import.meta.url);
const AxeBuilder = require("@axe-core/playwright").default;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, storageState: await sesion(b, "estudiante"), colorScheme: "dark" });
await apariencia(ctx, { tema: "dark" });
const p = await ctx.newPage();
await ir(p, "/");
const r = await new AxeBuilder({ page: p }).withTags(["wcag2aa"]).options({ rules: { "color-contrast": { enabled: true } } }).analyze();
const v = r.violations.filter((x) => x.id === "color-contrast");
await p.screenshot({ path: join(SHOTS, "repro7-inicio-oscuro.png"), fullPage: true });
const desc = v.flatMap((x) => x.nodes.map((n) => n.target.join(" ") + " :: " + (n.html || "").slice(0, 140)));
await b.close();
console.log(v.length ? "FAIL " + desc.length + " nodos: " + desc.slice(0, 5).join(" | ") : "PASS");
