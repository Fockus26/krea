// Carga de la tarea hecha antes de la web (2026-11-10) y el permiso temporal de editar respuestas,
// sobre Postgres en memoria: la tarea se crea publicada, cada alumno queda evaluado sin respuestas
// y el ranking lo cuenta; repetir no duplica; el profe pasa las respuestas sin tocar la nota.
import { beforeAll, describe, expect, test } from "bun:test";
import { editarRespuestasEnTransaccion } from "@/lib/data/respuestas-profe";
import {
  cargarTareaHistorica,
  puntosPorPregunta,
} from "@/lib/data/tarea-historica";
import type { Db } from "@/lib/db";
import { idEntrega, type Tarea, type Usuario } from "@/lib/modelo";
import { baseNueva } from "./base";
import { entrega, tarea as leerTarea, ponerUsuario, rankingDe } from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 10, 15);
const PROFE = "30262232";
const A1 = "39800001";
const A2 = "39800002";
const C1 = "39800003"; // 5C
const T = "historica";

const alumno = (cedula: string, seccion: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba histórica",
  seccion,
  equipoId: null,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const tarea: Tarea = {
  titulo: "Identidad de marca",
  tipo: "individual",
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-13",
  horaEntrega: "17:00",
  premio: "Ir al Cine",
  premioFoto: null,
  preguntas: [
    { id: "p1", enunciado: "Uno", formato: "texto", valor: 12 },
    { id: "p2", enunciado: "Dos", formato: "texto", valor: 8 },
  ],
  importada: false,
  autorId: PROFE,
  actualizadoEn: AHORA,
};

beforeAll(async () => {
  base = await baseNueva();
  await ponerUsuario(db(), {
    ...alumno(PROFE, "5A"),
    rol: "profesor",
    seccion: null,
  });
  await ponerUsuario(db(), alumno(A1, "5A"));
  await ponerUsuario(db(), alumno(A2, "5A"));
  await ponerUsuario(db(), alumno(C1, "5C"));
});

describe("puntosPorPregunta", () => {
  test("encaja en orden y respeta el tope y los pasos de 0,5", () => {
    expect(puntosPorPregunta(tarea, [10.5, 8])).toEqual({ p1: 10.5, p2: 8 });
    expect(puntosPorPregunta(tarea, [12.5, 8])).toBeNull();
    expect(puntosPorPregunta(tarea, [1.25, 8])).toBeNull();
    expect(puntosPorPregunta(tarea, [1])).toBeNull();
  });
});

describe("cargarTareaHistorica", () => {
  test("ensayo: no escribe nada", async () => {
    const r = await cargarTareaHistorica(db(), {
      id: T,
      tarea,
      notas: [{ cedula: A1, puntos: [10, 8] }],
      autorId: PROFE,
      ahora: AHORA,
      ensayo: true,
    });
    expect(r.tarea).toBe("creada");
    expect(await leerTarea(db(), T)).toBeNull();
  });

  test("crea la tarea abierta y evalúa a cada alumno sin respuestas", async () => {
    const r = await cargarTareaHistorica(db(), {
      id: T,
      tarea,
      notas: [
        { cedula: A1, puntos: [10, 8] },
        { cedula: A2, puntos: [6, 2.5] },
        { cedula: C1, puntos: [1, 1] },
        { cedula: "39899999", puntos: [1, 1] },
      ],
      autorId: PROFE,
      ahora: AHORA,
    });
    expect(r.tarea).toBe("creada");
    expect(r.alumnos).toEqual([
      { cedula: A1, estado: "evaluada", puntaje: 18 },
      { cedula: A2, estado: "evaluada", puntaje: 8.5 },
      { cedula: C1, estado: "error", motivo: "otra-seccion" },
      { cedula: "39899999", estado: "error", motivo: "no-existe" },
    ]);
    const t = await leerTarea(db(), T);
    expect(t?.estado).toBe("abierta");
    expect(t?.premio).toBe("Ir al Cine");
    const e = await entrega(db(), idEntrega(T, A1));
    expect(e?.estado).toBe("evaluada");
    expect(e?.respuestas).toEqual({});
    expect(e?.evaluacion?.puntos).toEqual({ p1: 10, p2: 8 });
    expect(e?.evaluacion?.evaluadaPor).toBe(PROFE);
    const ranking = await rankingDe(db(), "5A");
    expect(ranking?.alumnos[A1]?.puntos).toBeGreaterThan(0);
  });

  test("repetir no pisa la tarea ni reevalúa", async () => {
    const r = await cargarTareaHistorica(db(), {
      id: T,
      tarea: { ...tarea, titulo: "Otro título" },
      notas: [{ cedula: A1, puntos: [0, 0] }],
      autorId: PROFE,
      ahora: AHORA + 1,
    });
    expect(r).toEqual({
      tarea: "ya-estaba",
      alumnos: [{ cedula: A1, estado: "ya-estaba" }],
    });
    expect((await leerTarea(db(), T))?.titulo).toBe("Identidad de marca");
    expect((await entrega(db(), idEntrega(T, A1)))?.evaluacion?.puntaje).toBe(
      18,
    );
  });
});

describe("editarRespuestasEnTransaccion", () => {
  const id = idEntrega(T, A1);

  test("guarda las de texto y quita las vacías, sin tocar la nota", async () => {
    const antes = await entrega(db(), id);
    expect(
      await editarRespuestasEnTransaccion(db(), {
        entregaId: id,
        respuestas: { p1: "  Dulce Hogar  ", p2: "" },
      }),
    ).toEqual({ ok: true });
    const e = await entrega(db(), id);
    expect(e?.respuestas).toEqual({ p1: { texto: "Dulce Hogar" } });
    expect(e?.evaluacion).toEqual(antes?.evaluacion ?? null);
  });

  test("rechaza preguntas que no son de la tarea y entregas que no existen", async () => {
    expect(
      await editarRespuestasEnTransaccion(db(), {
        entregaId: id,
        respuestas: { p9: "x" },
      }),
    ).toEqual({ ok: false, error: "invalida" });
    expect(
      await editarRespuestasEnTransaccion(db(), {
        entregaId: idEntrega(T, "39899999"),
        respuestas: { p1: "x" },
      }),
    ).toEqual({ ok: false, error: "no-existe" });
  });
});
