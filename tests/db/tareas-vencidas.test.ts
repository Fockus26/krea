// La tarea se cierra sola al vencer y se reabre (tanda 2026-11-20 Q4, D451–D456), sobre Postgres
// en memoria: enviar, reabrir para todos y para algunos, decidir el premio y devolver.
import { beforeAll, describe, expect, test } from "bun:test";
import { devolverEnTransaccion } from "@/lib/data/devolver-entrega";
import { enviarEnTransaccion } from "@/lib/data/entregas";
import {
  cerrarTareaEnTransaccion,
  decidirPremioEnTransaccion,
  guardarTareaEnTransaccion,
  reabrirTareaEnTransaccion,
} from "@/lib/data/tareas";
import type { Db } from "@/lib/db";
import {
  type Entrega,
  type Equipo,
  idEntrega,
  type Tarea,
  type Usuario,
} from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

/** Instante de una hora civil de Caracas (UTC−4). La tarea vence el 20/11 a las 3:30 p. m. */
const caracas = (dia: number, h: number, m = 0) =>
  Date.UTC(2026, 10, dia, h + 4, m);
const ANTES = caracas(20, 15, 29);
const VENCIDA = caracas(21, 9);
const HOY = "2026-11-21";
const PROFE = "45001237";
const ADELA = "39100001";
const LUIS = "39100002";
const EQ1 = "q4-g1";
const EQ2 = "q4-g2";

const usuario = (cedula: string, equipoId: string | null): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Prueba",
  apellidos: "Vencida",
  seccion: "5A",
  equipoId,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const equipo = (capitanId: string): Equipo => ({
  nombre: `Equipo ${capitanId}`,
  seccion: "5A",
  tema: null,
  capitanId,
  logoPath: null,
});

const tarea = (o: Partial<Tarea> = {}): Tarea => ({
  titulo: "Prueba Q4",
  tipo: "individual",
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-20",
  horaEntrega: "15:30",
  premio: null,
  preguntas: [{ id: "p1", enunciado: "Texto", formato: "texto", valor: 20 }],
  importada: false,
  autorId: PROFE,
  actualizadoEn: 1,
  ...o,
});

const respuestas = { p1: { texto: "Mi respuesta" } };

const evaluada = (
  tareaId: string,
  tipo: Tarea["tipo"],
  titularId: string,
  puntaje: number,
): Entrega => ({
  tareaId,
  tipo,
  titularId,
  seccion: "5A",
  integrantes: [tipo === "grupal" ? ADELA : titularId],
  estado: "evaluada",
  respuestas,
  enviadaPor: ADELA,
  enviadaEn: 1,
  evaluacion: {
    puntos: null,
    comentarios: {},
    puntaje,
    evaluadaPor: PROFE,
    evaluadaEn: 500,
  },
});

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerUsuario(db(), usuario(ADELA, EQ1));
  await docs.ponerUsuario(db(), usuario(LUIS, EQ2));
  await docs.ponerEquipo(db(), EQ1, equipo(ADELA));
  await docs.ponerEquipo(db(), EQ2, equipo(LUIS));
});

describe("enviar al vencer (D451, D452)", () => {
  test("antes de la hora entra; después, cerrada", async () => {
    await docs.ponerTarea(db(), "q4-env", tarea());
    const envio = { tareaId: "q4-env", respuestas };
    expect(await enviarEnTransaccion(db(), ADELA, envio, ANTES)).toEqual({
      ok: true,
    });
    expect(await enviarEnTransaccion(db(), LUIS, envio, VENCIDA)).toEqual({
      ok: false,
      error: "cerrada",
    });
  });

  test("con prórroga de su titular entra; la de otro no le sirve", async () => {
    await docs.ponerTarea(
      db(),
      "q4-pro",
      tarea({ prorrogas: { [LUIS]: { fecha: "2026-11-22", hora: null } } }),
    );
    const envio = { tareaId: "q4-pro", respuestas };
    expect(await enviarEnTransaccion(db(), LUIS, envio, VENCIDA)).toEqual({
      ok: true,
    });
    expect(await enviarEnTransaccion(db(), ADELA, envio, VENCIDA)).toEqual({
      ok: false,
      error: "cerrada",
    });
  });
});

describe("reabrir (D455, D456)", () => {
  test("vencida: no se edita; para algunos guarda prórrogas; para todos la abre", async () => {
    await docs.ponerTarea(db(), "q4-re", tarea());
    // El constructor queda de solo lectura al vencer (reabrir es la salida)
    expect(
      await guardarTareaEnTransaccion(
        db(),
        PROFE,
        {
          id: "q4-re",
          accion: "guardar",
          tarea: {
            titulo: "Otro título",
            tipo: "individual",
            fecha: "2026-11-20",
            hora: "15:30",
            secciones: ["5A"],
            premio: null,
            preguntas: [
              { id: "p1", enunciado: "Texto", formato: "texto", valor: 20 },
            ],
          },
        },
        HOY,
        VENCIDA,
      ),
    ).toEqual({ ok: false, error: "cerrada" });

    const algunos = {
      id: "q4-re",
      actualizadoEn: 1,
      para: "algunos" as const,
      fecha: "2026-11-23",
      hora: "10:00",
      titulares: [ADELA],
    };
    expect(
      await reabrirTareaEnTransaccion(db(), algunos, HOY, VENCIDA),
    ).toEqual({ ok: true, id: "q4-re" });
    let t = await docs.tarea(db(), "q4-re");
    expect(t?.estado).toBe("abierta");
    expect(t && "prorrogas" in t ? t.prorrogas : null).toEqual({
      [ADELA]: { fecha: "2026-11-23", hora: "10:00" },
    });
    // El reintento del mismo pedido no falla (ya con otro `actualizadoEn`)
    expect(
      await reabrirTareaEnTransaccion(db(), algunos, HOY, VENCIDA + 1),
    ).toEqual({ ok: true, id: "q4-re" });
    // Con la vista vieja y otro pedido: cambio
    expect(
      await reabrirTareaEnTransaccion(
        db(),
        { ...algunos, titulares: [LUIS] },
        HOY,
        VENCIDA + 2,
      ),
    ).toEqual({ ok: false, error: "cambio" });
    // Alguien que no es de sus secciones: invalida
    const actual = (await docs.tarea(db(), "q4-re"))?.actualizadoEn ?? 0;
    expect(
      await reabrirTareaEnTransaccion(
        db(),
        { ...algunos, actualizadoEn: actual, titulares: ["30555444"] },
        HOY,
        VENCIDA + 3,
      ),
    ).toEqual({ ok: false, error: "invalida" });

    expect(
      await reabrirTareaEnTransaccion(
        db(),
        {
          id: "q4-re",
          actualizadoEn: actual,
          para: "todos",
          fecha: "2026-11-25",
          hora: null,
          titulares: [],
        },
        HOY,
        VENCIDA + 4,
      ),
    ).toEqual({ ok: true, id: "q4-re" });
    t = await docs.tarea(db(), "q4-re");
    expect(t).toMatchObject({
      estado: "abierta",
      fechaEntrega: "2026-11-25",
      actualizadoEn: VENCIDA + 4,
    });
    expect(t && "prorrogas" in t ? t.prorrogas : undefined).toBeUndefined();
    expect(t?.horaEntrega ?? null).toBeNull();
  });

  test("cerrar a mano cierra para todos: se van las prórrogas", async () => {
    await docs.ponerTarea(
      db(),
      "q4-cer",
      tarea({ prorrogas: { [ADELA]: { fecha: "2026-11-23", hora: null } } }),
    );
    expect(await cerrarTareaEnTransaccion(db(), "q4-cer", VENCIDA)).toEqual({
      ok: true,
      id: "q4-cer",
    });
    const t = await docs.tarea(db(), "q4-cer");
    expect(t?.estado).toBe("evaluada");
    expect(t && "prorrogas" in t ? t.prorrogas : undefined).toBeUndefined();
  });
});

describe("premio al cerrar para todos (D453)", () => {
  test("vencida sin cerrar a mano ya se decide; con una prórroga vigente, no", async () => {
    const id = "q4-premio";
    await docs.ponerTarea(
      db(),
      id,
      tarea({ tipo: "grupal", premio: "Almuerzo", horaEntrega: null }),
    );
    await docs.ponerEntrega(
      db(),
      idEntrega(id, EQ1),
      evaluada(id, "grupal", EQ1, 18),
    );
    await docs.ponerEntrega(
      db(),
      idEntrega(id, EQ2),
      evaluada(id, "grupal", EQ2, 18),
    );
    const decidir = (ahora: number) =>
      decidirPremioEnTransaccion(db(), id, "5A", { tipo: "compartir" }, ahora);
    // El 20/11 sin hora vence a las 23:59: a las 9 sigue abierta
    expect(await decidir(caracas(20, 9))).toEqual({
      ok: false,
      error: "sin-empate",
    });
    expect(await decidir(VENCIDA)).toEqual({ ok: true, id });
    await docs.ponerTarea(
      db(),
      id,
      tarea({
        tipo: "grupal",
        premio: "Almuerzo",
        horaEntrega: null,
        prorrogas: { [EQ2]: { fecha: "2026-11-23", hora: null } },
      }),
    );
    expect(await decidir(VENCIDA)).toEqual({ ok: false, error: "sin-empate" });
  });
});

describe("devolver al vencer (D411, D451)", () => {
  test("vencida → tarea-cerrada; con prórroga del titular, se devuelve", async () => {
    const id = "q4-dev";
    await docs.ponerTarea(db(), id, tarea());
    await docs.ponerEntrega(
      db(),
      idEntrega(id, ADELA),
      evaluada(id, "individual", ADELA, 15),
    );
    const envio = { entregaId: idEntrega(id, ADELA), evaluadaEn: 500 };
    expect(await devolverEnTransaccion(db(), envio, VENCIDA)).toEqual({
      ok: false,
      error: "tarea-cerrada",
    });
    await docs.ponerTarea(
      db(),
      id,
      tarea({ prorrogas: { [ADELA]: { fecha: "2026-11-23", hora: null } } }),
    );
    expect(await devolverEnTransaccion(db(), envio, VENCIDA)).toEqual({
      ok: true,
      id: idEntrega(id, ADELA),
    });
  });
});
