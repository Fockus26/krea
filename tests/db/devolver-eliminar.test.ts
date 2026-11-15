// «Devolver al alumno» y «Eliminar entrega» sobre Postgres en memoria (tanda 11-14 X1, D411–D415):
// las transacciones reales de las Server Actions. Devolver saca los puntos del ranking del alumno
// y del equipo y deja la entrega editable (el alumno la reenvía); solo con la tarea abierta y con
// la nota que el profe veía. Eliminar borra la fila, recalcula y devuelve las rutas de imagen.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  devolverEnTransaccion,
  eliminarEntregaEnTransaccion,
} from "@/lib/data/devolver-entrega";
import { enviarEnTransaccion } from "@/lib/data/entregas";
import {
  deshacerEvaluacionEnTransaccion,
  evaluarEnTransaccion,
} from "@/lib/data/evaluar";
import type { Db } from "@/lib/db";
import {
  type Entrega,
  type Equipo,
  idEntrega,
  type Tarea,
  type Usuario,
} from "@/lib/modelo";
import { baseNueva } from "./base";
import {
  entrega as leerEntrega,
  ponerEntrega,
  ponerEquipo,
  ponerTarea,
  ponerUsuario,
  rankingDe,
} from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 14, 15);
const PROFE = "30262232";
const A1 = "39711001"; // capitán, base 15
const A2 = "39711002"; // base 20
const EQ = "x1-g1";
const T_IND = "x1-ind";
const T_GRU = "x1-gru";
const T_CERRADA = "x1-cerrada";

const alumno = (cedula: string, base: number): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba X1",
  seccion: "5A",
  equipoId: EQ,
  base,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const equipo: Equipo = {
  nombre: "5A-G9 Prueba X1",
  seccion: "5A",
  tema: null,
  capitanId: A1,
  logoPath: null,
};

const tarea = (
  tipo: Tarea["tipo"],
  estado: Tarea["estado"],
  preguntas: Tarea["preguntas"],
): Tarea => ({
  titulo: `Prueba X1 ${tipo}`,
  tipo,
  secciones: ["5A"],
  estado,
  fechaEntrega: "2026-11-20",
  premio: null,
  preguntas,
  importada: false,
  autorId: PROFE,
  actualizadoEn: 1,
});

const entregada = (
  tareaId: string,
  tipo: Entrega["tipo"],
  titularId: string,
  integrantes: string[],
  respuestas: Entrega["respuestas"] = { p1: { texto: "Respuesta" } },
): Entrega => ({
  tareaId,
  tipo,
  titularId,
  seccion: "5A",
  integrantes,
  estado: "entregada",
  respuestas,
  enviadaPor: integrantes[0] ?? null,
  enviadaEn: AHORA - 1000,
  evaluacion: null,
});

const E1 = idEntrega(T_IND, A1);
const E2 = idEntrega(T_IND, A2);
const EG = idEntrega(T_GRU, EQ);
const EC = idEntrega(T_CERRADA, A1);
const EC2 = idEntrega(T_CERRADA, A2);
const IMAGENES = ["entregas/x1-gru/a/uno.jpg", "entregas/x1-gru/a/dos.jpg"];

async function ranking() {
  const r = await rankingDe(db(), "5A");
  if (!r) throw new Error("sin ranking");
  return r;
}
const puntosAlumno = async (c: string) =>
  (await ranking()).alumnos[c]?.puntos ?? 0;
const puntosEquipo = async () => (await ranking()).equipos[EQ]?.puntos ?? 0;

async function evaluar(entregaId: string, puntos: Record<string, number>) {
  const r = await evaluarEnTransaccion(
    db(),
    PROFE,
    { entregaId, puntos, comentarios: {}, version: null },
    AHORA,
  );
  if (!r.ok) throw new Error(`no se evaluó ${entregaId}: ${r.error}`);
  return r.evaluadaEn;
}

beforeAll(async () => {
  base = await baseNueva();
  await ponerUsuario(db(), alumno(A1, 15));
  await ponerUsuario(db(), alumno(A2, 20));
  await ponerEquipo(db(), EQ, equipo);
  await ponerTarea(
    db(),
    T_IND,
    tarea("individual", "abierta", [
      { id: "p1", enunciado: "Uno", formato: "texto", valor: 12 },
      { id: "p2", enunciado: "Dos", formato: "texto", valor: 8 },
    ]),
  );
  await ponerTarea(
    db(),
    T_GRU,
    tarea("grupal", "abierta", [
      { id: "p1", enunciado: "Uno", formato: "imagen", valor: 20 },
    ]),
  );
  // «evaluada» = cerrada: ya no está abierta
  await ponerTarea(
    db(),
    T_CERRADA,
    tarea("individual", "evaluada", [
      { id: "p1", enunciado: "Uno", formato: "texto", valor: 20 },
    ]),
  );
  await ponerEntrega(db(), E1, entregada(T_IND, "individual", A1, [A1]));
  await ponerEntrega(db(), E2, entregada(T_IND, "individual", A2, [A2]));
  await ponerEntrega(
    db(),
    EG,
    entregada(T_GRU, "grupal", EQ, [A1, A2], {
      p1: { imagenPaths: IMAGENES },
    }),
  );
  await ponerEntrega(db(), EC, entregada(T_CERRADA, "individual", A1, [A1]));
  await ponerEntrega(db(), EC2, entregada(T_CERRADA, "individual", A2, [A2]));
});

describe("devolver al alumno (Postgres)", () => {
  test("quita la nota y los puntos del alumno y del equipo; la entrega vuelve a entregada", async () => {
    const grupal = await evaluar(EG, { p1: 16 });
    const alumnoAntes = await puntosAlumno(A1);
    const equipoAntes = await puntosEquipo();
    const evaluadaEn = await evaluar(E1, { p1: 12, p2: 8 });
    expect(await puntosAlumno(A1)).toBeGreaterThan(alumnoAntes);

    expect(
      await devolverEnTransaccion(
        db(),
        { entregaId: E1, evaluadaEn },
        AHORA + 1,
      ),
    ).toEqual({ ok: true, id: E1 });
    const e = await leerEntrega(db(), E1);
    expect(e?.estado).toBe("entregada");
    expect(e?.evaluacion).toBeNull();
    // Sin `evaluacionAnterior`: un «Deshacer» viejo no resucita la nota (D412)
    expect(e?.evaluacionAnterior).toBeUndefined();
    expect(e?.respuestas).toEqual({ p1: { texto: "Respuesta" } });
    expect(await puntosAlumno(A1)).toBe(alumnoAntes);
    expect((await ranking()).actualizadoEn).toBe(AHORA + 1);

    // Ahora la grupal: salen los puntos del equipo y de sus integrantes
    expect(
      await devolverEnTransaccion(
        db(),
        { entregaId: EG, evaluadaEn: grupal },
        AHORA + 2,
      ),
    ).toEqual({ ok: true, id: EG });
    expect(await puntosEquipo()).toBeLessThan(equipoAntes);
    expect(await puntosEquipo()).toBe(0);
    expect(await puntosAlumno(A2)).toBe(0);
    expect((await leerEntrega(db(), EG))?.estado).toBe("entregada");
  });

  test("tras devolver, el alumno la reenvía (D395) y el formulario o el Deshacer viejos no la pisan", async () => {
    // La nota que tenía en pantalla otro profe ya no es la vigente: `cambio`
    expect(
      await evaluarEnTransaccion(
        db(),
        PROFE,
        {
          entregaId: E1,
          puntos: { p1: 10, p2: 8 },
          comentarios: {},
          version: AHORA,
        },
        AHORA + 3,
      ),
    ).toEqual({ ok: false, error: "cambio" });
    expect(
      await deshacerEvaluacionEnTransaccion(db(), PROFE, E1, AHORA, AHORA + 3),
    ).toEqual({ ok: false, error: "cambio" });

    const r = await enviarEnTransaccion(
      db(),
      A1,
      {
        tareaId: T_IND,
        respuestas: { p1: { texto: "Corregida" }, p2: { texto: "Nueva" } },
      },
      AHORA + 4,
    );
    expect(r.ok).toBe(true);
    const e = await leerEntrega(db(), E1);
    expect(e?.estado).toBe("entregada");
    expect(e?.enviadaEn).toBe(AHORA + 4);
    expect(e?.respuestas).toEqual({
      p1: { texto: "Corregida" },
      p2: { texto: "Nueva" },
    });
  });

  test("sin nota → no-evaluada; con otra nota → cambio; no existe → no-existe", async () => {
    expect(
      await devolverEnTransaccion(
        db(),
        { entregaId: E2, evaluadaEn: AHORA },
        AHORA + 5,
      ),
    ).toEqual({ ok: false, error: "no-evaluada" });
    const evaluadaEn = await evaluar(E2, { p1: 6, p2: 4 });
    expect(
      await devolverEnTransaccion(
        db(),
        { entregaId: E2, evaluadaEn: evaluadaEn - 1 },
        AHORA + 5,
      ),
    ).toEqual({ ok: false, error: "cambio" });
    expect((await leerEntrega(db(), E2))?.estado).toBe("evaluada");
    expect(
      await devolverEnTransaccion(
        db(),
        { entregaId: "x1-nada__39711009", evaluadaEn },
        AHORA + 5,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
  });

  test("con la tarea cerrada → tarea-cerrada y la nota se queda (D411)", async () => {
    const evaluadaEn = await evaluar(EC, { p1: 18 });
    const antes = await puntosAlumno(A1);
    expect(
      await devolverEnTransaccion(
        db(),
        { entregaId: EC, evaluadaEn },
        AHORA + 6,
      ),
    ).toEqual({ ok: false, error: "tarea-cerrada" });
    const e = await leerEntrega(db(), EC);
    expect(e?.estado).toBe("evaluada");
    expect(e?.evaluacion?.evaluadaEn).toBe(evaluadaEn);
    expect(await puntosAlumno(A1)).toBe(antes);
  });
});

describe("eliminar entrega (Postgres)", () => {
  test("lo que el profe veía cambió → cambio y no se borra", async () => {
    expect(
      await eliminarEntregaEnTransaccion(
        db(),
        { entregaId: EG, enviadaEn: AHORA - 999, evaluadaEn: null },
        AHORA + 7,
      ),
    ).toEqual({ ok: false, error: "cambio" });
    expect(
      await eliminarEntregaEnTransaccion(
        db(),
        { entregaId: EG, enviadaEn: AHORA - 1000, evaluadaEn: AHORA },
        AHORA + 7,
      ),
    ).toEqual({ ok: false, error: "cambio" });
    expect(await leerEntrega(db(), EG)).not.toBeNull();
  });

  test("grupal evaluada: borra la fila, recalcula el ranking y devuelve las rutas de imagen", async () => {
    const evaluadaEn = await evaluar(EG, { p1: 20 });
    expect(await puntosEquipo()).toBeGreaterThan(0);
    expect(
      await eliminarEntregaEnTransaccion(
        db(),
        { entregaId: EG, enviadaEn: AHORA - 1000, evaluadaEn },
        AHORA + 8,
      ),
    ).toEqual({ ok: true, id: EG, imagenes: IMAGENES });
    expect(await leerEntrega(db(), EG)).toBeNull();
    expect(await puntosEquipo()).toBe(0);
    expect((await ranking()).actualizadoEn).toBe(AHORA + 8);
    // Ya no está: otro intento no encuentra nada
    expect(
      await eliminarEntregaEnTransaccion(
        db(),
        { entregaId: EG, enviadaEn: AHORA - 1000, evaluadaEn },
        AHORA + 9,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
  });

  test("vale con la tarea cerrada y sin evaluar; sin imágenes, ninguna ruta", async () => {
    const antes = await puntosAlumno(A2);
    expect(
      await eliminarEntregaEnTransaccion(
        db(),
        { entregaId: EC2, enviadaEn: AHORA - 1000, evaluadaEn: null },
        AHORA + 10,
      ),
    ).toEqual({ ok: true, id: EC2, imagenes: [] });
    expect(await leerEntrega(db(), EC2)).toBeNull();
    expect(await puntosAlumno(A2)).toBe(antes);
  });

  test("individual evaluada en tarea cerrada: los puntos del alumno salen del ranking", async () => {
    const e = await leerEntrega(db(), EC);
    const evaluadaEn = e?.evaluacion?.evaluadaEn ?? -1;
    const antes = await puntosAlumno(A1);
    expect(
      await eliminarEntregaEnTransaccion(
        db(),
        { entregaId: EC, enviadaEn: AHORA - 1000, evaluadaEn },
        AHORA + 11,
      ),
    ).toEqual({ ok: true, id: EC, imagenes: [] });
    expect(await puntosAlumno(A1)).toBeLessThan(antes);
  });
});
