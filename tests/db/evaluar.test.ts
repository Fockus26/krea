// Evaluar y Ajustes de puntos sobre Postgres en memoria (W7, D204–D207, D327): las transacciones
// reales que usan las Server Actions. Comprueba que el ranking se recalcula en la
// misma transacción, que un ajuste y su anulación mueven puntos y nunca la nota (D007), y que dos
// profes escribiendo a la vez en la misma sección no pierden escrituras.
import { beforeAll, describe, expect, test } from "bun:test";
import { idAnulacion } from "@/lib/ajustes-datos";
import {
  anularAjusteEnTransaccion,
  aplicarAjusteEnTransaccion,
} from "@/lib/data/ajustes";
import { enviarEnTransaccion } from "@/lib/data/entregas";
import {
  deshacerEvaluacionEnTransaccion,
  evaluarEnTransaccion,
} from "@/lib/data/evaluar";
import type { Db } from "@/lib/db";
import { notaFinal } from "@/lib/grades";
import {
  type Entrega,
  type Equipo,
  idEntrega,
  type Tarea,
  type Usuario,
} from "@/lib/modelo";
import { baseNueva } from "./base";
import {
  ajuste,
  entrega as leerEntrega,
  ponerEntrega,
  ponerEquipo,
  ponerTarea,
  ponerUsuario,
  rankingDe,
} from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 5, 15);
const PROFE = "30262232";
const PROFE_2 = "30262233";
const A1 = "39700001"; // base 15
const A2 = "39700002"; // base 20
const A3 = "39700003"; // base 20, para la concurrencia
const EQ = "w7-g1";
const T_IND = "w7-ind";
const T_GRU = "w7-gru";

const alumno = (cedula: string, base: number): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba W7",
  seccion: "5C",
  equipoId: EQ,
  base,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const equipo: Equipo = {
  nombre: "5C-G9 Prueba W7",
  seccion: "5C",
  tema: null,
  capitanId: A1,
  logoPath: null,
};

const tarea = (tipo: Tarea["tipo"], preguntas: Tarea["preguntas"]): Tarea => ({
  titulo: `Prueba W7 ${tipo}`,
  tipo,
  secciones: ["5C"],
  estado: "abierta",
  fechaEntrega: "2026-11-14",
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
): Entrega => ({
  tareaId,
  tipo,
  titularId,
  seccion: "5C",
  integrantes,
  estado: "entregada",
  respuestas: { p1: { texto: "Respuesta" } },
  enviadaPor: integrantes[0] ?? null,
  enviadaEn: AHORA - 1000,
  evaluacion: null,
});

const E1 = idEntrega(T_IND, A1);
const E2 = idEntrega(T_IND, A2);
const E3 = idEntrega(T_IND, A3);
const EG = idEntrega(T_GRU, EQ);

async function ranking() {
  const r = await rankingDe(db(), "5C");
  if (!r) throw new Error("sin ranking");
  return r;
}

async function entrega(id: string) {
  const e = await leerEntrega(db(), id);
  if (!e) throw new Error("sin entrega");
  return e;
}

const puntosDe = async (c: string) => (await ranking()).alumnos[c]?.puntos;

beforeAll(async () => {
  base = await baseNueva();
  await ponerUsuario(db(), alumno(A1, 15));
  await ponerUsuario(db(), alumno(A2, 20));
  await ponerUsuario(db(), alumno(A3, 20));
  await ponerEquipo(db(), EQ, equipo);
  await ponerTarea(
    db(),
    T_IND,
    tarea("individual", [
      { id: "p1", enunciado: "Uno", formato: "texto", valor: 12 },
      { id: "p2", enunciado: "Dos", formato: "texto", valor: 8 },
    ]),
  );
  await ponerTarea(
    db(),
    T_GRU,
    tarea("grupal", [
      { id: "p1", enunciado: "Uno", formato: "texto", valor: 20 },
    ]),
  );
  await ponerEntrega(db(), E1, entregada(T_IND, "individual", A1, [A1]));
  await ponerEntrega(db(), E2, entregada(T_IND, "individual", A2, [A2]));
  await ponerEntrega(db(), E3, entregada(T_IND, "individual", A3, [A3]));
  await ponerEntrega(db(), EG, entregada(T_GRU, "grupal", EQ, [A1, A2]));
});

describe("evaluar (Postgres)", () => {
  test("rechaza puntajes fuera del máximo, incompletos o de otra pregunta", async () => {
    const intentar = (puntos: Record<string, number>) =>
      evaluarEnTransaccion(
        db(),
        PROFE,
        { entregaId: E1, puntos, comentarios: {}, version: null },
        AHORA,
      );
    expect(await intentar({ p1: 12.5, p2: 8 })).toEqual({
      ok: false,
      error: "incompleta",
    });
    expect(await intentar({ p1: 12 })).toEqual({
      ok: false,
      error: "incompleta",
    });
    expect(await intentar({ p1: 12, p2: 8, p9: 1 })).toEqual({
      ok: false,
      error: "invalida",
    });
    expect((await entrega(E1)).estado).toBe("entregada");
  });

  test("evaluar → la entrega queda evaluada y el ranking cambia en la misma transacción", async () => {
    const r = await evaluarEnTransaccion(
      db(),
      PROFE,
      {
        entregaId: E1,
        puntos: { p1: 12, p2: 6.5 },
        comentarios: { p1: "  Muy clara  ", p2: "   " },
        version: null,
      },
      AHORA,
    );
    expect(r).toEqual({ ok: true, id: E1, evaluadaEn: AHORA });
    const e = await entrega(E1);
    expect(e.estado).toBe("evaluada");
    expect(e.evaluacion).toEqual({
      puntos: { p1: 12, p2: 6.5 },
      comentarios: { p1: "Muy clara" },
      puntaje: 18.5,
      evaluadaPor: PROFE,
      evaluadaEn: AHORA,
    });
    expect(e.evaluacionAnterior).toBeNull();
    // Base 15 (D006): 18,5 × 15 / 20 = 13,9
    expect(await puntosDe(A1)).toBe(notaFinal(18.5, 15) ?? -1);
  });

  test("corregir una evaluada recalcula y guarda quién y cuándo; Deshacer la devuelve", async () => {
    const r = await evaluarEnTransaccion(
      db(),
      PROFE_2,
      {
        entregaId: E1,
        puntos: { p1: 6, p2: 2 },
        comentarios: {},
        version: AHORA,
      },
      AHORA + 10,
    );
    expect(r.ok).toBe(true);
    const e = await entrega(E1);
    expect(e.evaluacion?.evaluadaPor).toBe(PROFE_2);
    expect(e.evaluacion?.evaluadaEn).toBe(AHORA + 10);
    expect(e.evaluacionAnterior?.puntaje).toBe(18.5);
    // 8 × 15 / 20 = 6 < 10 → no aporta (D007)
    expect(await puntosDe(A1)).toBe(0);

    // Otro profe no deshace lo que no guardó; el autor, sí, una sola vez
    expect(
      await deshacerEvaluacionEnTransaccion(
        db(),
        PROFE,
        E1,
        AHORA + 10,
        AHORA + 11,
      ),
    ).toEqual({ ok: false, error: "cambio" });
    expect(
      await deshacerEvaluacionEnTransaccion(
        db(),
        PROFE_2,
        E1,
        AHORA + 10,
        AHORA + 12,
      ),
    ).toEqual({ ok: true, id: E1, evaluadaEn: AHORA + 10 });
    const d = await entrega(E1);
    expect(d.evaluacion?.puntaje).toBe(18.5);
    expect(d.evaluacionAnterior).toBeUndefined();
    expect(await puntosDe(A1)).toBe(13.9);
    expect(
      await deshacerEvaluacionEnTransaccion(db(), PROFE, E1, AHORA, AHORA + 13),
    ).toEqual({ ok: false, error: "cambio" });
  });

  test("deshacer la primera evaluación la deja Pendiente (D003)", async () => {
    await evaluarEnTransaccion(
      db(),
      PROFE,
      {
        entregaId: E2,
        puntos: { p1: 10, p2: 8 },
        comentarios: {},
        version: null,
      },
      AHORA + 20,
    );
    expect(await puntosDe(A2)).toBe(18);
    await deshacerEvaluacionEnTransaccion(
      db(),
      PROFE,
      E2,
      AHORA + 20,
      AHORA + 21,
    );
    const e = await entrega(E2);
    expect(e.estado).toBe("entregada");
    expect(e.evaluacion).toBeNull();
    expect(await puntosDe(A2)).toBe(0);
  });

  test("grupal: el equipo suma el puntaje y cada integrante su base (D177)", async () => {
    const r = await evaluarEnTransaccion(
      db(),
      PROFE,
      { entregaId: EG, puntos: { p1: 16 }, comentarios: {}, version: null },
      AHORA + 30,
    );
    expect(r.ok).toBe(true);
    const rk = await ranking();
    expect(rk.equipos[EQ]?.puntos).toBe(16);
    // A1: 13,9 (individual) + 16 × 15 / 20 = 12 → 25,9; A2: 16 (base 20)
    expect(rk.alumnos[A1]?.puntos).toBe(25.9);
    expect(rk.alumnos[A2]?.puntos).toBe(16);
  });
});

describe("ajustes de puntos (Postgres)", () => {
  test("ajuste + anulación: el ranking vuelve y la nota no cambia (D007, D121)", async () => {
    const antes = await puntosDe(A1);
    const notaAntes = (await entrega(E1)).evaluacion;

    const r = await aplicarAjusteEnTransaccion(
      db(),
      PROFE,
      {
        destino: "alumno",
        destinoId: A1,
        motivoId: "participacion",
        valor: 2,
        nota: "",
      },
      AHORA + 40,
    );
    if (!r.ok) throw new Error(r.error);
    const aj = await ajuste(db(), r.id);
    expect(aj).toMatchObject({
      seccion: "5C",
      motivo: "Participación destacada",
      nota: null,
      autorId: PROFE,
      anulaA: null,
    });
    expect(await puntosDe(A1)).toBe((antes ?? 0) + 2);
    expect((await entrega(E1)).evaluacion).toEqual(notaAntes);

    const an = await anularAjusteEnTransaccion(db(), PROFE_2, r.id, AHORA + 41);
    expect(an).toEqual({ ok: true, id: idAnulacion(r.id) });
    const inversa = await ajuste(db(), idAnulacion(r.id));
    if (!inversa) throw new Error("sin anulación");
    expect(inversa).toMatchObject({
      valor: -2,
      motivo: "Anulación",
      motivoId: "anulacion",
      anulaA: r.id,
      autorId: PROFE_2,
    });
    expect(inversa.nota).toStartWith("«Participación destacada» del ");
    // El original no se borra
    expect(await ajuste(db(), r.id)).not.toBeNull();
    expect(await puntosDe(A1)).toBe(antes ?? -1);
    expect((await entrega(E1)).evaluacion).toEqual(notaAntes);

    // Ni se anula dos veces ni se anula una anulación
    expect(
      await anularAjusteEnTransaccion(db(), PROFE, r.id, AHORA + 42),
    ).toEqual({ ok: false, error: "anulado" });
    expect(
      await anularAjusteEnTransaccion(
        db(),
        PROFE,
        idAnulacion(r.id),
        AHORA + 43,
      ),
    ).toEqual({ ok: false, error: "invalida" });
  });

  test("equipo: mueve los puntos del equipo, no los de sus integrantes", async () => {
    const antes = await ranking();
    const r = await aplicarAjusteEnTransaccion(
      db(),
      PROFE,
      {
        destino: "equipo",
        destinoId: EQ,
        motivoId: "ayudo",
        valor: -1.5,
        nota: "Entregaron sin nombres",
      },
      AHORA + 50,
    );
    expect(r.ok).toBe(true);
    const despues = await ranking();
    expect(despues.equipos[EQ]?.puntos).toBe(
      (antes.equipos[EQ]?.puntos ?? 0) - 1.5,
    );
    expect(despues.alumnos[A1]?.puntos).toBe(antes.alumnos[A1]?.puntos ?? -1);
  });

  test("«Otro» (ya no es una opción, D376) y destinos que no existen no se guardan", async () => {
    expect(
      await aplicarAjusteEnTransaccion(
        db(),
        PROFE,
        {
          destino: "alumno",
          destinoId: A1,
          motivoId: "otro",
          valor: 1,
          nota: "Trajo material",
        },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "motivo" });
    expect(
      await aplicarAjusteEnTransaccion(
        db(),
        PROFE,
        {
          destino: "equipo",
          destinoId: "w7-no-existe",
          motivoId: "ayudo",
          valor: 1,
          nota: "",
        },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
  });
});

describe("concurrencia: dos profes a la vez (Postgres)", () => {
  test("en la misma sección no se pierde ninguna escritura del ranking", async () => {
    const a2 = await puntosDe(A2);
    const [r1, r2, r3] = await Promise.all([
      evaluarEnTransaccion(
        db(),
        PROFE,
        {
          entregaId: E2,
          puntos: { p1: 12, p2: 8 },
          comentarios: {},
          version: null,
        },
        AHORA + 60,
      ),
      evaluarEnTransaccion(
        db(),
        PROFE_2,
        {
          entregaId: E3,
          puntos: { p1: 11, p2: 8 },
          comentarios: {},
          version: null,
        },
        AHORA + 61,
      ),
      aplicarAjusteEnTransaccion(
        db(),
        PROFE,
        {
          destino: "alumno",
          destinoId: A3,
          motivoId: "extra",
          valor: 2,
          nota: "",
        },
        AHORA + 62,
      ),
    ]);
    expect([r1.ok, r2.ok, r3.ok]).toEqual([true, true, true]);
    expect(await puntosDe(A2)).toBe((a2 ?? 0) + 20);
    // 19 + 2 del ajuste
    expect(await puntosDe(A3)).toBe(21);
  });

  test("la misma entrega, abierta con la misma versión: gana una y la otra recibe `cambio` (F-M1, D224)", async () => {
    const intentar = (autor: string, p1: number, ahora: number) =>
      evaluarEnTransaccion(
        db(),
        autor,
        {
          entregaId: E3,
          puntos: { p1, p2: 4 },
          comentarios: {},
          version: AHORA + 61,
        },
        ahora,
      );
    const [r1, r2] = await Promise.all([
      intentar(PROFE, 4, AHORA + 70),
      intentar(PROFE_2, 12, AHORA + 71),
    ]);
    expect([r1.ok, r2.ok].filter(Boolean)).toHaveLength(1);
    const perdedora = r1.ok ? r2 : r1;
    expect(perdedora).toEqual({ ok: false, error: "cambio" });
    const e = await entrega(E3);
    const puntaje = e.evaluacion?.puntaje;
    expect([8, 16]).toContain(puntaje ?? -1);
    // La anterior es la de antes de ambas (19): la perdedora no escribió nada
    expect(e.evaluacionAnterior?.puntaje).toBe(19);
    // 8 no aporta (< 10); 16 sí. Más los 2 del ajuste.
    expect(await puntosDe(A3)).toBe((puntaje === 16 ? 16 : 0) + 2);
  });

  test("una pestaña con la versión vieja no pisa la nota que guardó otra (F-M1, D224)", async () => {
    const antes = await entrega(E3);
    const vigente = antes.evaluacion?.evaluadaEn ?? null;
    const puntosA3 = await puntosDe(A3);
    // Pestaña abierta cuando E3 tenía la evaluación de AHORA + 61
    expect(
      await evaluarEnTransaccion(
        db(),
        PROFE,
        {
          entregaId: E3,
          puntos: { p1: 0, p2: 0 },
          comentarios: {},
          version: AHORA + 61,
        },
        AHORA + 80,
      ),
    ).toEqual({ ok: false, error: "cambio" });
    expect((await entrega(E3)).evaluacion?.evaluadaEn ?? null).toBe(vigente);
    expect(await puntosDe(A3)).toBe(puntosA3);
    // Con la versión vigente, sí
    const r = await evaluarEnTransaccion(
      db(),
      PROFE,
      {
        entregaId: E3,
        puntos: { p1: 0, p2: 0 },
        comentarios: {},
        version: vigente,
      },
      AHORA + 81,
    );
    expect(r.ok).toBe(true);
  });
});

describe("el alumno edita mientras el profe evalúa (D397)", () => {
  const A4 = "39700004";
  const E4 = idEntrega(T_IND, A4);
  const respuestas = (texto: string) => ({
    p1: { texto },
    p2: { texto: "Dos" },
  });
  const evaluar = (enviadaEn: number | null | undefined, ahora: number) =>
    evaluarEnTransaccion(
      db(),
      PROFE,
      {
        entregaId: E4,
        puntos: { p1: 12, p2: 8 },
        comentarios: {},
        version: null,
        ...(enviadaEn !== undefined ? { enviadaEn } : {}),
      },
      ahora,
    );

  beforeAll(async () => {
    await ponerUsuario(db(), { ...alumno(A4, 20), equipoId: null });
  });

  test("con el `enviadaEn` viejo: `editada` y no guarda; con el nuevo, sí", async () => {
    expect(
      await enviarEnTransaccion(
        db(),
        A4,
        { tareaId: T_IND, respuestas: respuestas("Primera") },
        AHORA,
      ),
    ).toEqual({ ok: true });
    // El profe abre el formulario (ve `enviadaEn` = AHORA); el alumno edita antes de que guarde
    expect(
      await enviarEnTransaccion(
        db(),
        A4,
        { tareaId: T_IND, respuestas: respuestas("Editada") },
        AHORA + 10,
      ),
    ).toEqual({ ok: true });
    expect(await evaluar(AHORA, AHORA + 20)).toEqual({
      ok: false,
      error: "editada",
    });
    const e = await entrega(E4);
    expect(e.estado).toBe("entregada");
    expect(e.respuestas.p1).toEqual({ texto: "Editada" });
    // Recarga: ve la versión nueva y guarda
    expect((await evaluar(AHORA + 10, AHORA + 30)).ok).toBe(true);
    // Ya evaluada: el alumno no la puede editar
    expect(
      await enviarEnTransaccion(
        db(),
        A4,
        { tareaId: T_IND, respuestas: respuestas("Tarde") },
        AHORA + 40,
      ),
    ).toEqual({ ok: false, error: "ya-evaluada" });
  });

  test("sin `enviadaEn` (formulario viejo) no se mira", async () => {
    // Corregir la evaluada sin el campo: pasa el control de versión normal (D224)
    const vigente = (await entrega(E4)).evaluacion?.evaluadaEn ?? null;
    const r = await evaluarEnTransaccion(
      db(),
      PROFE,
      {
        entregaId: E4,
        puntos: { p1: 10, p2: 8 },
        comentarios: {},
        version: vigente,
      },
      AHORA + 50,
    );
    expect(r.ok).toBe(true);
  });
});
