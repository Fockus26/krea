// Premios de W11 sobre Postgres en memoria (D327) (D263–D266): empate de una individual decidido
// con «darAlumno» y «Crear / Editar premio» (`guardarPremioEnTransaccion`), con las transacciones
// reales del Admin SDK que usan las Server Actions de lib/acciones/tareas.ts.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  decidirPremioEnTransaccion,
  eliminarTareaEnTransaccion,
  guardarPremioEnTransaccion,
} from "@/lib/data/tareas";
import type { Db } from "@/lib/db";
import {
  type Entrega,
  idEntrega,
  type Tarea,
  type Usuario,
  zTareaDoc,
} from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 6, 15);
const PROFE = "45001237";
const ADELA = "39110001";
const LUIS = "39110002";
const INDIVIDUAL = "w11-individual";
const ABIERTA = "w11-abierta";
const FOTO = "premios/w11-abierta/foto-uno.jpg";

const usuario = (cedula: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Prueba",
  apellidos: "W11",
  seccion: "5C",
  equipoId: null,
  base: 20,
  avatar: { estilo: "adventurer", semilla: cedula },
  actualizadoEn: 1,
});

const evaluada = (titularId: string, puntaje: number): Entrega => ({
  tareaId: INDIVIDUAL,
  tipo: "individual",
  titularId,
  seccion: "5C",
  integrantes: [titularId],
  estado: "evaluada",
  respuestas: {},
  enviadaPor: titularId,
  enviadaEn: 1,
  evaluacion: {
    puntos: null,
    comentarios: {},
    puntaje,
    evaluadaPor: PROFE,
    evaluadaEn: AHORA,
  },
});

const tarea = (o: Partial<Tarea>): Tarea => ({
  titulo: "Ensayo W11",
  tipo: "individual",
  secciones: ["5C"],
  estado: "evaluada",
  fechaEntrega: "2026-10-24",
  premio: "Libro de diseño",
  preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
  importada: false,
  autorId: PROFE,
  actualizadoEn: 1,
  ...o,
});

async function leer(id: string) {
  const snap = await docs.snap(db(), "tareas", id);
  return zTareaDoc.parse(snap.data());
}

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerDoc(db(), "usuarios", ADELA, usuario(ADELA));
  await docs.ponerDoc(db(), "usuarios", LUIS, usuario(LUIS));
  await docs.ponerDoc(db(), "tareas", INDIVIDUAL, tarea({}));
  await docs.ponerDoc(
    db(),
    "tareas",
    ABIERTA,
    tarea({ estado: "abierta", premio: null, fechaEntrega: "2026-11-20" }),
  );
  await docs.ponerDoc(
    db(),
    "entregas",
    idEntrega(INDIVIDUAL, ADELA),
    evaluada(ADELA, 18),
  );
  await docs.ponerDoc(
    db(),
    "entregas",
    idEntrega(INDIVIDUAL, LUIS),
    evaluada(LUIS, 18),
  );
});

describe("premio individual (Postgres)", () => {
  test("empate entre alumnos: «darAlumno» a un empatado; «dar» a equipo no", async () => {
    expect(
      await decidirPremioEnTransaccion(
        db(),
        INDIVIDUAL,
        "5C",
        { tipo: "dar", equipoId: ADELA },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "invalida" });
    expect(
      await decidirPremioEnTransaccion(
        db(),
        INDIVIDUAL,
        "5C",
        { tipo: "darAlumno", alumnoId: "39119999" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "invalida" });
    expect(
      await decidirPremioEnTransaccion(
        db(),
        INDIVIDUAL,
        "5C",
        { tipo: "darAlumno", alumnoId: LUIS },
        AHORA,
      ),
    ).toEqual({ ok: true, id: INDIVIDUAL });
    const t = await leer(INDIVIDUAL);
    expect("decisionesPremio" in t ? t.decisionesPremio : null).toEqual({
      "5C": { tipo: "darAlumno", alumnoId: LUIS },
    });
  });

  test("guardar el premio de una abierta, cambiar la foto y quitarla", async () => {
    expect(
      await guardarPremioEnTransaccion(
        db(),
        ABIERTA,
        "Entradas al cine",
        { tipo: "nueva", clave: FOTO },
        AHORA,
      ),
    ).toEqual({ ok: true, anterior: null });
    let t = await leer(ABIERTA);
    expect(t.premio).toBe("Entradas al cine");
    expect(t.premioFoto).toBe(FOTO);
    // Doble envío: lo mismo otra vez, sin duplicar nada
    expect(
      await guardarPremioEnTransaccion(
        db(),
        ABIERTA,
        "Entradas al cine",
        { tipo: "mantener" },
        AHORA + 1,
      ),
    ).toEqual({ ok: true, anterior: null });
    expect(
      await guardarPremioEnTransaccion(
        db(),
        ABIERTA,
        "Entradas al cine",
        { tipo: "quitar" },
        AHORA + 2,
      ),
    ).toEqual({ ok: true, anterior: FOTO });
    t = await leer(ABIERTA);
    expect(t.premioFoto).toBeNull();
  });

  test("cerrada o inexistente: no se cambia el premio", async () => {
    expect(
      await guardarPremioEnTransaccion(
        db(),
        INDIVIDUAL,
        "Otro",
        { tipo: "mantener" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "cerrada" });
    expect(
      await guardarPremioEnTransaccion(
        db(),
        "w11-no-existe",
        "Otro",
        { tipo: "mantener" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
  });

  test("eliminar la tarea devuelve también la foto del premio para borrarla", async () => {
    await guardarPremioEnTransaccion(
      db(),
      ABIERTA,
      "Cine",
      { tipo: "nueva", clave: FOTO },
      AHORA + 3,
    );
    const r = await eliminarTareaEnTransaccion(db(), ABIERTA, AHORA + 4);
    expect(r.resultado).toEqual({ ok: true, id: ABIERTA });
    expect(r.imagenes).toContain(FOTO);
  });
});
