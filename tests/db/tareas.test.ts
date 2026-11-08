// Tareas del profe sobre Postgres en memoria (D327) (D199–D202): las transacciones reales del
// Admin SDK que usan las Server Actions de lib/acciones/tareas.ts.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  cerrarTareaEnTransaccion,
  decidirPremioEnTransaccion,
  guardarTareaEnTransaccion,
} from "@/lib/data/tareas";
import type { Db } from "@/lib/db";
import {
  type Entrega,
  type Equipo,
  idEntrega,
  type Tarea,
  zTarea,
  zTareaDoc,
} from "@/lib/modelo";
import type { EntradaTarea } from "@/lib/tareas-profe-datos";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const HOY = "2026-11-05";
const AHORA = Date.UTC(2026, 10, 5, 15);
const PROFE = "30262232";
const G1 = "w6-g1";
const G2 = "w6-g2";
const CON_PREMIO = "w6-premio";

const entrada = (o: Partial<EntradaTarea> = {}): EntradaTarea => ({
  titulo: "Prueba W6",
  tipo: "grupal",
  fecha: "2026-11-14",
  secciones: ["5C"],
  premio: "Salida al cine",
  preguntas: [
    { id: "q1", enunciado: "Uno", formato: "texto", valor: 12 },
    { id: "q2", enunciado: "", formato: "imagen", valor: null },
  ],
  ...o,
});

const completa = entrada({
  preguntas: [
    { id: "q1", enunciado: "Uno", formato: "texto", valor: 12 },
    { id: "q2", enunciado: "Dos", formato: "imagen", valor: 8 },
  ],
});

const equipo = (nombre: string): Equipo => ({
  nombre,
  seccion: "5C",
  tema: null,
  capitanId: null,
  logoPath: null,
});

const evaluada = (
  tareaId: string,
  titularId: string,
  puntaje: number,
): Entrega => ({
  tareaId,
  tipo: "grupal",
  titularId,
  seccion: "5C",
  integrantes: ["39000010"],
  estado: "evaluada",
  respuestas: {},
  enviadaPor: "39000010",
  enviadaEn: 1,
  evaluacion: {
    puntos: null,
    comentarios: {},
    puntaje,
    evaluadaPor: PROFE,
    evaluadaEn: AHORA,
  },
});

const tareaPremio: Tarea = {
  titulo: "Afiche",
  tipo: "grupal",
  secciones: ["5C"],
  estado: "evaluada",
  fechaEntrega: "2026-10-24",
  premio: "Almuerzo",
  preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
  importada: false,
  autorId: PROFE,
  actualizadoEn: 1,
};

async function leer(id: string) {
  const snap = await docs.snap(db(), "tareas", id);
  return zTareaDoc.parse(snap.data());
}

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerDoc(db(), "equipos", G1, equipo("5C-G1 Prueba"));
  await docs.ponerDoc(db(), "equipos", G2, equipo("5C-G2 Prueba"));
  await docs.ponerDoc(db(), "tareas", CON_PREMIO, tareaPremio);
  await docs.ponerDoc(
    db(),
    "entregas",
    idEntrega(CON_PREMIO, G1),
    evaluada(CON_PREMIO, G1, 18.5),
  );
  await docs.ponerDoc(
    db(),
    "entregas",
    idEntrega(CON_PREMIO, G2),
    evaluada(CON_PREMIO, G2, 18.5),
  );
});

describe("guardar, publicar y cerrar (Postgres)", () => {
  test("borrador nuevo → publicar → editar con entregas → cerrar", async () => {
    const nuevo = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      { id: null, accion: "borrador", tarea: entrada() },
      HOY,
      AHORA,
    );
    if (!nuevo.ok) throw new Error(nuevo.error);
    const id = nuevo.id;
    const borrador = await leer(id);
    expect(borrador).toMatchObject({
      estado: "borrador",
      autorId: PROFE,
      secciones: ["5C"],
    });
    expect(zTarea.safeParse(borrador).success).toBe(false);

    // Publicar a medias no se puede; completa, sí
    expect(
      await guardarTareaEnTransaccion(
        db(),
        PROFE,
        { id, accion: "publicar", tarea: entrada() },
        HOY,
        AHORA,
      ),
    ).toEqual({ ok: false, error: "invalida" });
    expect(
      await guardarTareaEnTransaccion(
        db(),
        PROFE,
        { id, accion: "publicar", tarea: completa },
        HOY,
        AHORA + 1,
      ),
      // Recién publicada: lleva el aviso push para sus secciones (D336)
    ).toEqual({
      ok: true,
      id,
      aviso: { id, titulo: "Prueba W6", secciones: ["5C"] },
    });
    expect((await leer(id)).estado).toBe("abierta");

    // Con una entrega, las preguntas quedan como estaban
    await docs.ponerDoc(db(), "entregas", idEntrega(id, G1), {
      ...evaluada(id, G1, 10),
      estado: "entregada",
      evaluacion: null,
    });
    const editada = await guardarTareaEnTransaccion(
      db(),
      PROFE,
      {
        id,
        accion: "guardar",
        tarea: {
          ...completa,
          titulo: "Prueba W6 (v2)",
          preguntas: [
            { id: "x", enunciado: "Otra", formato: "texto", valor: 20 },
          ],
        },
      },
      HOY,
      AHORA + 2,
    );
    expect(editada.ok).toBe(true);
    const t = await leer(id);
    expect(t.titulo).toBe("Prueba W6 (v2)");
    expect(t.preguntas.map((p) => p.id)).toEqual(["q1", "q2"]);

    expect(await cerrarTareaEnTransaccion(db(), id, AHORA + 3)).toEqual({
      ok: true,
      id,
    });
    expect((await leer(id)).estado).toBe("evaluada");
    expect(await cerrarTareaEnTransaccion(db(), id, AHORA + 4)).toEqual({
      ok: false,
      error: "cerrada",
    });
    expect(
      await guardarTareaEnTransaccion(
        db(),
        PROFE,
        { id, accion: "guardar", tarea: completa },
        HOY,
        AHORA + 5,
      ),
    ).toEqual({ ok: false, error: "cerrada" });
  });

  test("una tarea que no existe", async () => {
    expect(
      await guardarTareaEnTransaccion(
        db(),
        PROFE,
        { id: "w6-no-existe", accion: "borrador", tarea: entrada() },
        HOY,
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
    expect(await cerrarTareaEnTransaccion(db(), "w6-no-existe", AHORA)).toEqual(
      { ok: false, error: "no-existe" },
    );
  });
});

describe("decidir el premio (Postgres)", () => {
  test("empate en 5C: dar a un empatado, no a otro; cambiar a compartir", async () => {
    expect(
      await decidirPremioEnTransaccion(
        db(),
        CON_PREMIO,
        "5C",
        { tipo: "dar", equipoId: "otro-equipo" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "invalida" });
    expect(
      await decidirPremioEnTransaccion(
        db(),
        CON_PREMIO,
        "5C",
        { tipo: "dar", equipoId: G2 },
        AHORA,
      ),
    ).toEqual({ ok: true, id: CON_PREMIO });
    expect((await leer(CON_PREMIO)).estado).toBe("evaluada");
    const t = zTarea.parse(
      (await docs.snap(db(), "tareas", CON_PREMIO)).data(),
    );
    expect(t.decisionesPremio).toEqual({ "5C": { tipo: "dar", equipoId: G2 } });
    expect(
      await decidirPremioEnTransaccion(
        db(),
        CON_PREMIO,
        "5C",
        { tipo: "compartir" },
        AHORA + 1,
      ),
    ).toEqual({ ok: true, id: CON_PREMIO });
  });

  test("sin empate o en otra sección: no se decide", async () => {
    expect(
      await decidirPremioEnTransaccion(
        db(),
        CON_PREMIO,
        "5A",
        { tipo: "compartir" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "sin-empate" });
    await docs.ponerDoc(
      db(),
      "entregas",
      idEntrega(CON_PREMIO, G1),
      evaluada(CON_PREMIO, G1, 19),
    );
    expect(
      await decidirPremioEnTransaccion(
        db(),
        CON_PREMIO,
        "5C",
        { tipo: "compartir" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "sin-empate" });
  });
});
