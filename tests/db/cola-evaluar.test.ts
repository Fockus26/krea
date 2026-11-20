// La cola de Evaluar en vivo sobre Postgres en memoria (D439, D441): las evaluadas en orden, la
// huella que usa el sondeo y el estado de una entrega para el aviso.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  leerEstadoEntrega,
  leerEvaluadas,
  leerResumenCola,
  leerVersionCola,
} from "@/lib/data/cola-evaluar";
import { evaluarEnTransaccion } from "@/lib/data/evaluar";
import type { Db } from "@/lib/db";
import {
  type Entrega,
  type Evaluacion,
  idEntrega,
  type Tarea,
  type Usuario,
} from "@/lib/modelo";
import { baseNueva } from "./base";
import { ponerEntrega, ponerTarea, ponerUsuario } from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 20, 15);
const PROFE = "30262240";
const A1 = "39744001";
const A2 = "39744002";
const A3 = "39744003";
const A4 = "39744004";
const T = "q2-cola";

const alumno = (cedula: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba Q2",
  seccion: "5C",
  equipoId: null,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const tarea: Tarea = {
  titulo: "Prueba Q2",
  tipo: "individual",
  secciones: ["5C"],
  estado: "abierta",
  fechaEntrega: "2026-11-20",
  premio: null,
  preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
  importada: false,
  autorId: PROFE,
  actualizadoEn: 1,
};

const evaluacion = (evaluadaEn: number): Evaluacion => ({
  puntos: { p1: 18 },
  comentarios: {},
  puntaje: 18,
  evaluadaPor: PROFE,
  evaluadaEn,
});

const entrega = (titular: string, o: Partial<Entrega> = {}): Entrega => ({
  tareaId: T,
  tipo: "individual",
  titularId: titular,
  seccion: "5C",
  integrantes: [titular],
  estado: "entregada",
  respuestas: { p1: { texto: "Respuesta" } },
  enviadaPor: titular,
  enviadaEn: AHORA - 10_000,
  evaluacion: null,
  ...o,
});

const E1 = idEntrega(T, A1);
const E2 = idEntrega(T, A2);
const E3 = idEntrega(T, A3);
const E4 = idEntrega(T, A4);

beforeAll(async () => {
  base = await baseNueva();
  for (const c of [PROFE, A1, A2, A3, A4]) await ponerUsuario(db(), alumno(c));
  await ponerTarea(db(), T, tarea);
  await ponerEntrega(db(), E1, entrega(A1));
  await ponerEntrega(
    db(),
    E2,
    entrega(A2, { estado: "evaluada", evaluacion: evaluacion(AHORA - 5000) }),
  );
  await ponerEntrega(
    db(),
    E3,
    entrega(A3, { estado: "evaluada", evaluacion: evaluacion(AHORA - 2000) }),
  );
  // Un borrador no es una entrega: no cuenta en la huella ni en las evaluadas
  await ponerEntrega(
    db(),
    E4,
    entrega(A4, { estado: "borrador", enviadaEn: AHORA }),
  );
}, 30_000);

describe("cola de Evaluar (D439, D441)", () => {
  test("evaluadas: la evaluada más recientemente primero, sin borradores ni pendientes", async () => {
    expect((await leerEvaluadas(db())).map((e) => e.id)).toEqual([E3, E2]);
  });

  test("resumen: cuenta las no borrador y toma los máximos", async () => {
    expect(await leerResumenCola(db())).toEqual({
      total: 3,
      porEvaluar: 1,
      maxEnviada: AHORA - 10_000,
      maxEvaluada: AHORA - 2000,
    });
  });

  test("estado de una entrega: el autor de la evaluación; `null` si no existe", async () => {
    expect(await leerEstadoEntrega(db(), E2)).toEqual({
      estado: "evaluada",
      evaluadaEn: AHORA - 5000,
      evaluadaPor: PROFE,
    });
    expect(await leerEstadoEntrega(db(), E1)).toEqual({
      estado: "entregada",
      evaluadaEn: null,
      evaluadaPor: null,
    });
    expect(await leerEstadoEntrega(db(), "no-existe")).toBeNull();
  });

  test("evaluar cambia la huella y baja el contador", async () => {
    const antes = await leerVersionCola(db());
    const r = await evaluarEnTransaccion(
      db(),
      PROFE,
      {
        entregaId: E1,
        puntos: { p1: 15 },
        comentarios: {},
        version: null,
      },
      AHORA,
    );
    expect(r.ok).toBe(true);
    const despues = await leerVersionCola(db());
    expect(despues.version).not.toBe(antes.version);
    expect(antes.porEvaluar).toBe(1);
    expect(despues.porEvaluar).toBe(0);
    expect((await leerEvaluadas(db()))[0]?.id).toBe(E1);
    // Sin cambios, la misma huella (el sondeo recibe 204)
    expect((await leerVersionCola(db())).version).toBe(despues.version);
  });
});
