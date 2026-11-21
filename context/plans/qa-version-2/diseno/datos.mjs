// Datos QA (base qa_4303, ficticios): tareas con enlace, grupal por partes, ideal, contenido extremo.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://qa_app:qa_app@127.0.0.1:54329/qa_4303" });
await c.connect();
const now = Date.now();
const LARGA = "https://ejemplo.com/carpeta-muy-larga/" + "segmento-sin-espacios-".repeat(6) + "documento.pdf?utm_source=correo&utm_medium=enlace&utm_campaign=entrega-final-de-la-tarea";
const SIN_ESP = "Supercalifragilisticoespialidosoanticonstitucionalmentehiperbolico".repeat(1);
const q = (t, p) => c.query(t, p);
const tarea = (id, titulo, tipo, estado, preguntas) =>
  q(`insert into tareas (id,titulo,tipo,secciones,estado,fecha_entrega,preguntas,importada,autor_id,actualizado_en,hora_entrega) values ($1,$2,$3,$4,$5,$6,$7,false,'10000000',$8,null) on conflict (id) do nothing`,
    [id, titulo, tipo, ["5A", "5C"], estado, "2026-12-30", JSON.stringify(preguntas), now]);
await tarea("qa-partes", "Campaña por partes del equipo", "grupal", "abierta", [
  { id: "p1", enunciado: "¿Quién es el público objetivo de la campaña y por qué?", formato: "texto", valor: 5 },
  { id: "p2", enunciado: "Pega el enlace del moodboard compartido", formato: "url", valor: 5 },
  { id: "p3", enunciado: "Sube una foto del boceto del afiche", formato: "imagen", valor: 5 },
  { id: "p4", enunciado: "Resume el mensaje central de la campaña", formato: "texto", valor: 5 },
]);
await tarea("qa-enlace", "Presentación con enlace y texto largo", "individual", "abierta", [
  { id: "p1", enunciado: "Pega el enlace de tu presentación", formato: "url", valor: 8 },
  { id: "p2", enunciado: "Explica en una frase la idea principal de tu presentación", formato: "texto", valor: 6 },
  { id: "p3", enunciado: "Sube una captura de tu diapositiva favorita", formato: "imagen", valor: 6 },
]);
await tarea("qa-evaluada", "Informe evaluado con enlace", "individual", "evaluada", [
  { id: "p1", enunciado: "Enlace al informe", formato: "url", valor: 8 },
  { id: "p2", enunciado: "Conclusión del informe", formato: "texto", valor: 6 },
  { id: "p3", enunciado: "Recomendaciones", formato: "texto", valor: 6 },
]);
await tarea("qa-partes-env", "Informe grupal por partes enviado", "grupal", "abierta", [
  { id: "p1", enunciado: "Introducción", formato: "texto", valor: 10 },
  { id: "p2", enunciado: "Enlace a las fuentes", formato: "url", valor: 10 },
]);
// Entregas
const ent = (id, tareaId, tipo, titular, seccion, integrantes, estado, respuestas, enviadaPor, evaluacion, sinParte) =>
  q(`insert into entregas (id,tarea_id,tipo,titular_id,seccion,integrantes,estado,respuestas,enviada_por,enviada_en,evaluacion,sin_parte) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) on conflict (id) do nothing`,
    [id, tareaId, tipo, titular, seccion, integrantes, estado, JSON.stringify(respuestas), enviadaPor, enviadaPor ? now - 3600000 : null, evaluacion ? JSON.stringify(evaluacion) : null, sinParte]);
await ent("qa-evaluada__45009896", "qa-evaluada", "individual", "45009896", "5A", ["45009896"], "evaluada",
  { p1: { url: LARGA }, p2: { texto: SIN_ESP + " " + SIN_ESP }, p3: { texto: "Texto normal de recomendaciones, de unas cuantas palabras." } }, "45009896",
  { puntos: { p1: 6, p2: 4.5, p3: 5 }, puntaje: 15.5, evaluadaEn: now, comentarios: { p2: "Buen trabajo " + SIN_ESP }, evaluadaPor: "10000000" }, null);
await ent("qa-evaluada__45021029", "qa-evaluada", "individual", "45021029", "5A", ["45021029"], "evaluada",
  { p1: { url: "https://ejemplo.com/a" }, p2: { texto: "Corto." }, p3: { texto: "Otro." } }, "45021029",
  { puntos: { p1: 8, p2: 6, p3: 6 }, puntaje: 20, evaluadaEn: now, comentarios: {}, evaluadaPor: "10000000" }, null);
await ent("qa-enlace__45021029", "qa-enlace", "individual", "45021029", "5A", ["45021029"], "entregada",
  { p1: { url: LARGA }, p2: { texto: SIN_ESP + SIN_ESP }, p3: { texto: "x" } }, "45021029", null, null);
await ent("qa-partes-env__5a-g1", "qa-partes-env", "grupal", "5a-g1", "5A", ["45003711", "45025977", "45042058", "45056902", "45074220"], "entregada",
  { p1: { texto: "Introducción " + SIN_ESP }, p2: { url: LARGA } }, "45025977", null, ["45074220"]);
// Partes
const parte = (tarea, pregunta, equipo, asignado, estado, respuesta, entregada) =>
  q(`insert into partes (entrega_id,pregunta_id,tarea_id,equipo_id,asignado,estado,respuesta,entregada_en,actualizado_en) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict do nothing`,
    [tarea + "__" + equipo, pregunta, tarea, equipo, asignado, estado, respuesta ? JSON.stringify(respuesta) : null, entregada ? now - 1000 : null, now]);
await parte("qa-partes", "p1", "5a-g2", "45021029", "asignada", null, false);
await parte("qa-partes", "p2", "5a-g2", "45032162", "entregada", { url: LARGA }, true);
await parte("qa-partes", "p4", "5a-g2", "45051954", "tomada", null, false);
await parte("qa-partes-env", "p1", "5a-g1", "45003711", "aceptada", { texto: "Introducción " + SIN_ESP }, true);
await parte("qa-partes-env", "p2", "5a-g1", "45042058", "tomada", null, false);
// Ideal (de la entrega del alumno)
await q(`insert into ideales (tarea_id,entrega_id,respuestas,nota,notas,autor_id,actualizado_en) values ('qa-evaluada','qa-evaluada__45009896',null,$1,$2,'10000000',$3) on conflict do nothing`,
  ["Es la mejor porque conecta la evidencia con la conclusión. " + SIN_ESP, JSON.stringify({ p1: "Enlace claro " + LARGA, p2: "Concluye con precisión" }), now]);
console.log("ok");
await c.end();
