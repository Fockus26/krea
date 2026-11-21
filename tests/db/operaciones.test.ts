// Idempotencia por `opId` contra el emulador (D293): la cola sin conexión reintenta una entrega o
// un guardado de tarea que quizá ya entró; el segundo intento devuelve lo mismo sin duplicar.
import { beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { enviarEnTransaccion } from "@/lib/data/entregas";
import { guardarTareaEnTransaccion } from "@/lib/data/tareas";
import { carpetaEntrega } from "@/lib/carpeta-entrega";
import type { Db } from "@/lib/db";
import { tareas as tareasTabla } from "@/lib/db/schema";
import { claveImagen } from "@/lib/entregas";
import { idEntrega, type Tarea, type Usuario } from "@/lib/modelo";
import type { EntradaTarea } from "@/lib/tareas-profe-datos";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 7, 14);
const HOY = "2026-11-07";
const ALUMNO = "39100001";
const OTRO = "39100002";
const PROFE = "30100001";
const TAREA = "w18-ind";
const UUID = "6f1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f";
const OP_ENTREGA = "0d9a2c1e-5b4f-4a3e-9c2d-1e0f9a8b7c6d";
const OP_AJENA = "1e0f9a8b-7c6d-4a3e-9c2d-0d9a2c1e5b4f";
const OP_TAREA = "2a3b4c5d-6e7f-4a1b-8c2d-3e4f5a6b7c8d";
const OP_EVALUADA = "3b4c5d6e-7f8a-4b2c-9d3e-4f5a6b7c8d9e";

const usuario = (cedula: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Prueba",
  apellidos: "Cola",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const tarea: Tarea = {
  titulo: "Prueba W18",
  tipo: "individual",
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-14",
  premio: null,
  preguntas: [
    { id: "p1", enunciado: "Foto", formato: "imagen", valor: 10 },
    { id: "p2", enunciado: "Texto", formato: "texto", valor: 10 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
};

const borrador: EntradaTarea = {
  titulo: "Tarea encolada W18",
  tipo: "individual",
  fecha: null,
  secciones: ["5A"],
  premio: null,
  preguntas: [{ id: "q1", enunciado: "", formato: "texto", valor: null }],
};

async function envio(titular: string, opId: string) {
  const c = carpetaEntrega(idEntrega(TAREA, titular));
  return {
    tareaId: TAREA,
    opId,
    respuestas: {
      p1: { imagenPath: claveImagen(TAREA, c, UUID) },
      p2: { texto: "Hecha sin señal" },
    },
  };
}

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerDoc(db(), "usuarios", ALUMNO, usuario(ALUMNO));
  await docs.ponerDoc(db(), "usuarios", OTRO, usuario(OTRO));
  await docs.ponerDoc(db(), "tareas", TAREA, tarea);
  for (const t of [ALUMNO, OTRO])
    await docs.borrarDoc(db(), "entregas", idEntrega(TAREA, t));
  for (const op of [OP_ENTREGA, OP_AJENA, OP_TAREA, OP_EVALUADA])
    await docs.borrarDoc(db(), "operaciones", op);
});

describe("operaciones/{opId} (emulador, D293)", () => {
  test("entrega: el mismo opId dos veces es un éxito y una sola entrega", async () => {
    const e = await envio(ALUMNO, OP_ENTREGA);
    expect(await enviarEnTransaccion(db(), ALUMNO, e, AHORA)).toEqual({
      ok: true,
    });
    // La respuesta se perdió y la cola reintenta: no es «ya entregada»
    expect(await enviarEnTransaccion(db(), ALUMNO, e, AHORA + 5)).toEqual({
      ok: true,
    });
    const doc = await docs.snap(db(), "entregas", idEntrega(TAREA, ALUMNO));
    expect(doc.get("enviadaEn")).toBe(AHORA);
    const op = await docs.snap(db(), "operaciones", OP_ENTREGA);
    expect(op.data()).toMatchObject({
      uid: ALUMNO,
      tipo: "entrega",
      id: null,
      creadaEn: AHORA,
    });
    expect(op.get("expiraEn") as number).toBeGreaterThan(AHORA);
  });

  test("entrega: un opId nuevo sobre una entregada la edita (D395); sobre una evaluada, «ya evaluada»", async () => {
    const e = await envio(ALUMNO, OP_AJENA);
    expect(await enviarEnTransaccion(db(), ALUMNO, e, AHORA + 9)).toEqual({
      ok: true,
    });
    const doc = await docs.snap(db(), "entregas", idEntrega(TAREA, ALUMNO));
    expect(doc.get("enviadaEn")).toBe(AHORA + 9);
    await docs.actualizarDoc(db(), "entregas", idEntrega(TAREA, ALUMNO), {
      estado: "evaluada",
      evaluacion: {
        puntos: { p1: 10, p2: 10 },
        comentarios: {},
        puntaje: 20,
        evaluadaPor: null,
        evaluadaEn: AHORA + 10,
      },
    });
    const tarde = await envio(ALUMNO, OP_EVALUADA);
    expect(await enviarEnTransaccion(db(), ALUMNO, tarde, AHORA + 11)).toEqual({
      ok: false,
      error: "ya-evaluada",
    });
    const op = await docs.snap(db(), "operaciones", OP_EVALUADA);
    expect(op.exists).toBe(false);
  });

  test("entrega: el opId de otro alumno no le sirve a nadie más", async () => {
    const e = await envio(OTRO, OP_ENTREGA);
    expect(await enviarEnTransaccion(db(), OTRO, e, AHORA)).toEqual({
      ok: false,
      error: "incompleta",
    });
    const doc = await docs.snap(db(), "entregas", idEntrega(TAREA, OTRO));
    expect(doc.exists).toBe(false);
  });

  test("tarea nueva: el mismo opId devuelve el mismo id y no crea otra", async () => {
    const envioTarea = {
      id: null,
      accion: "borrador" as const,
      tarea: borrador,
      opId: OP_TAREA,
    };
    const a = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      envioTarea,
      HOY,
      AHORA,
    );
    const b = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      envioTarea,
      HOY,
      AHORA + 1,
    );
    if (!a.ok || !b.ok) throw new Error("no se guardó");
    expect(b.id).toBe(a.id);
    const iguales = await db()
      .select()
      .from(tareasTabla)
      .where(eq(tareasTabla.titulo, borrador.titulo));
    expect(iguales.length).toBe(1);
    // Otro profe con el mismo opId no lo reutiliza
    expect(
      await guardarTareaEnTransaccion(
        db(),
        "30100002",
        envioTarea,
        HOY,
        AHORA + 2,
      ),
    ).toEqual({ ok: false, error: "invalida" });
    await docs.borrarDoc(db(), "tareas", a.id);
  });
});
