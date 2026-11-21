// Repro v2-04: en /profe/evaluar/<entrega>, abrir «Eliminar entrega» (o «Devolver al alumno») con el
// teclado y cerrarlo con Escape o Cancelar deja el foco en <body>: el diálogo no tiene DialogTrigger y
// onCloseAutoFocus solo devuelve el foco en la variante de menú (acciones-entrega.tsx:234-241).
// Uso: node --env-file=.env.test.local .qa/repro/v2-04-foco-perdido-dialogo-evaluar.mjs http://localhost:4392
import { chromium } from "@playwright/test";
import { BASE, login, act, q, cerrarDb, contexto } from "../v2/lib.mjs";
const e = process.env;
const pro = await login(e.PROFESOR_EMAIL_TEST, e.PROFESOR_PASSWORD_TEST);
const AL = "45050717"; const al = await login(AL, process.env.SEED_PASSWORD || "krea-demo-2026");
const t = await act("guardarTarea", [{ id: null, accion: "publicar", tarea: { titulo: "[QA] repro v2-04", tipo: "individual", fecha: "2026-12-15", hora: null, secciones: ["5A"], premio: null, preguntas: [{ id: "r1", enunciado: "Uno", formato: "texto", valor: 20 }] } }], pro, { ruta: "/profe/tareas/nueva" });
await act("enviarEntrega", [{ tareaId: t.id, respuestas: { r1: { texto: "uno" } } }], al, { ruta: "/tareas" });
const browser = await chromium.launch();
const c = await contexto(browser, pro, BASE, { viewport: { width: 1280, height: 900 } }); const p = await c.newPage();
await p.goto(`${BASE}/profe/evaluar/${t.id}__${AL}`, { timeout: 120000 }); await p.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
const b = p.getByRole("button", { name: /Eliminar entrega/ }).first();
await b.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(800);
await p.keyboard.press("Escape"); await p.waitForTimeout(800);
const foco = await p.evaluate(() => document.activeElement?.tagName + "|" + (document.activeElement?.textContent ?? "").trim().slice(0, 30));
await browser.close(); await cerrarDb();
const ok = foco.startsWith("BUTTON|Eliminar entrega");
console.log(ok ? "PASS" : `FAIL foco tras cerrar el diálogo: ${foco.split("|")[0]}`);
process.exitCode = ok ? 0 : 1;
