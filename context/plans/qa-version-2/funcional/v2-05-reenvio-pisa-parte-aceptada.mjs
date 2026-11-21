// Repro v2-05: en una grupal por partes ya enviada, un reenvío del capitán (editar, o un segundo envío
// que llega mientras se procesa el primero) guarda SU texto en la pregunta que el integrante entregó y el
// capitán aceptó; la parte sigue «aceptada» con el texto del integrante. D463 solo impone lo aceptado en
// modo `nueva` (lib/data/entregas.ts:262-295).
// Uso: node --env-file=.env.test.local .qa/repro/v2-05-reenvio-pisa-parte-aceptada.mjs http://localhost:4392
import { login, act, q, cerrarDb } from "../v2/lib.mjs";
import { createHmac } from "node:crypto";
// Tras R2 (D493) el reparto usa el id público: mismo cálculo que lib/id-publico.ts con el secreto del server.mjs de QA
const SECRETO = process.env.QA_AUTH_SECRET || "qa-local-secret-qa-local-secret-qa-local";
const idPub = (c) => createHmac("sha256", createHmac("sha256", SECRETO).update("krea:id-publico:v1").digest()).update(c).digest("base64url").slice(0, 22);
const e = process.env; const SEED = process.env.SEED_PASSWORD || "krea-demo-2026";
const pro = await login(e.PROFESOR_EMAIL_TEST, e.PROFESOR_PASSWORD_TEST);
const cap = await login(e.ESTUDIANTE_EMAIL_TEST, e.ESTUDIANTE_PASSWORD_TEST); // capitán de 5a-g2
const B = "45032162"; const b = await login(B, SEED);
const t = await act("guardarTarea", [{ id: null, accion: "publicar", tarea: { titulo: "[QA] repro v2-05", tipo: "grupal", fecha: "2026-12-15", hora: null, secciones: ["5A"], premio: null, preguntas: [{ id: "h1", enunciado: "Uno", formato: "texto", valor: 10 }, { id: "h2", enunciado: "Dos", formato: "texto", valor: 10 }] } }], pro, { ruta: "/profe/tareas/nueva" });
const k = (p, x = {}) => ({ tareaId: t.id, preguntaId: p, ...x });
await act("asignarParte", [k("h2", { asignado: idPub(B) })], cap, { ruta: "/tareas" });
await act("entregarParte", [k("h2", { respuesta: { texto: "TEXTO DEL INTEGRANTE" } })], b, { ruta: "/tareas" });
await act("aceptarParte", [k("h2")], cap, { ruta: "/tareas" });
const envio = { tareaId: t.id, respuestas: { h1: { texto: "capitan" }, h2: { texto: "TEXTO DEL CAPITAN" } } };
await act("enviarEntrega", [envio], cap, { ruta: "/tareas" });
const r1 = (await q("select respuestas->'h2'->>'texto' t from entregas where id=$1", [`${t.id}__5a-g2`]))[0].t;
await act("enviarEntrega", [envio], cap, { ruta: "/tareas" });
const r2 = (await q("select respuestas->'h2'->>'texto' t from entregas where id=$1", [`${t.id}__5a-g2`]))[0].t;
await cerrarDb();
const ok = r2 === "TEXTO DEL INTEGRANTE";
console.log(ok ? "PASS" : `FAIL primer envío h2=«${r1}», tras el reenvío h2=«${r2}» (la parte sigue aceptada con el del integrante)`);
process.exitCode = ok ? 0 : 1;
