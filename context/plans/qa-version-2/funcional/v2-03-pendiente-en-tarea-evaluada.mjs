// Repro v2-03: /tareas/<tarea> de una entrega YA evaluada pinta cada pregunta como «Pendiente · vale N»
// (obtenido={null} fijo en app/(estudiante)/tareas/[tarea]/page.tsx:208), junto a «Tu profe ya la evaluó».
// Uso: node --env-file=.env.test.local .qa/repro/v2-03-pendiente-en-tarea-evaluada.mjs http://localhost:4392
// Crea su propia tarea y entrega (base local).
import { BASE, login, act, cerrarDb, q } from "../v2/lib.mjs";
const e = process.env;
const pro = await login(e.PROFESOR_EMAIL_TEST, e.PROFESOR_PASSWORD_TEST);
const AL = "45042058"; const al = await login(AL, process.env.SEED_PASSWORD || "krea-demo-2026");
const t = await act("guardarTarea", [{ id: null, accion: "publicar", tarea: { titulo: "[QA] repro v2-03", tipo: "individual", fecha: "2026-12-15", hora: null, secciones: ["5A"], premio: null, preguntas: [{ id: "r1", enunciado: "Uno", formato: "texto", valor: 12 }, { id: "r2", enunciado: "Dos", formato: "texto", valor: 8 }] } }], pro, { ruta: "/profe/tareas/nueva" });
await act("enviarEntrega", [{ tareaId: t.id, respuestas: { r1: { texto: "uno" }, r2: { texto: "dos" } } }], al, { ruta: "/tareas" });
const [f] = await q("select enviada_en from entregas where id=$1", [`${t.id}__${AL}`]);
const ev = await act("guardarEvaluacion", [{ entregaId: `${t.id}__${AL}`, puntos: { r1: 11, r2: 7.5 }, comentarios: {}, version: null, enviadaEn: Number(f.enviada_en) }], pro, { ruta: "/profe/evaluar" });
const html = await (await fetch(`${BASE}/tareas/${t.id}`, { headers: { cookie: `krea.session_token=${al}` } })).text();
const pendientes = (html.match(/Pendiente · vale/g) ?? []).length;
await cerrarDb();
if (!ev.ok) { console.log(`FAIL no se pudo preparar: ${JSON.stringify(ev)}`); process.exit(1); }
if (pendientes > 0) console.log(`FAIL ${pendientes} preguntas dicen «Pendiente · vale» en una entrega evaluada (11 / 12 y 7,5 / 8)`);
else console.log("PASS");
process.exitCode = pendientes > 0 ? 1 : 0;
