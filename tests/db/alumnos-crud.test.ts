// Alta y baja de alumnos y gestión de equipos sobre Postgres en memoria (D327) (W12, D267–D270, D307): las
// transacciones reales del Admin SDK que usan las Server Actions de Alumnos y Equipos. Datos
// propios en 5A (cédulas 3975xxxx, equipos `w12-…`) para no cruzarse con las demás pruebas.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  eliminarAlumnoEnTransaccion,
  equipoValidoPara,
  incorporarAlumnoEnTransaccion,
  resumenBorradoCon,
} from "@/lib/data/alumnos-alta";
import { crearCuentaCon } from "@/lib/data/cuentas";
import { entregasDeIntegrante } from "@/lib/data/entregas";
import {
  crearEquipoEnTransaccion,
  editarEquipoEnTransaccion,
  eliminarEquipoEnTransaccion,
} from "@/lib/data/equipos";
import type { Db } from "@/lib/db";
import { historialBase } from "@/lib/db/schema";
import {
  type Ajuste,
  COL,
  type Entrega,
  type Equipo,
  idEntrega,
  type Usuario,
  zEntrega,
  zEquipo,
  zRankingSeccion,
  zUsuario,
} from "@/lib/modelo";
import { notaDeIntegrante } from "@/lib/ranking-datos";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 6, 18);
const PROFE = "39759999";
const NUEVO = "39750001";
const CAP = "39750002"; // capitán de E_LLENO: se elimina
const OTRO = "39750003"; // integrante de E_LLENO: hereda el cargo
const E_VACIO = "w12-vacio";
const E_LLENO = "w12-lleno";
const E_CON_ENTREGA = "w12-con-entrega";
const E_CON_AJUSTE = "w12-con-ajuste";
const E_OTRA = "w12-otra-seccion";
const E_DISOLVER = "w12-disolver";
const D1 = "39750004"; // capitán de E_DISOLVER
const D2 = "39750005";

const alumno = (cedula: string, equipoId: string | null): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba W12",
  seccion: "5A",
  equipoId,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const equipo = (
  nombre: string,
  capitanId: string | null,
  seccion: "5A" | "5C" = "5A",
): Equipo => ({ nombre, seccion, tema: null, capitanId, logoPath: null });

const evaluacion = (puntaje: number) => ({
  puntos: null,
  comentarios: {},
  puntaje,
  evaluadaPor: PROFE,
  evaluadaEn: 2,
});

const individual = (
  tareaId: string,
  cedula: string,
  puntaje: number | null,
): Entrega => ({
  tareaId,
  tipo: "individual",
  titularId: cedula,
  seccion: "5A",
  integrantes: [cedula],
  estado: puntaje === null ? "entregada" : "evaluada",
  respuestas: { p1: { imagenPath: `respuestas/${tareaId}/${cedula}/p1.jpg` } },
  enviadaPor: cedula,
  enviadaEn: 1,
  evaluacion: puntaje === null ? null : evaluacion(puntaje),
});

const grupal = (tareaId: string, equipoId: string): Entrega => ({
  tareaId,
  tipo: "grupal",
  titularId: equipoId,
  seccion: "5A",
  integrantes: [CAP, OTRO],
  estado: "evaluada",
  respuestas: { p1: { texto: "Lo hicimos juntos" } },
  enviadaPor: CAP,
  enviadaEn: 1,
  evaluacion: evaluacion(16),
});

const ajuste = (
  destino: "alumno" | "equipo",
  destinoId: string,
  anulaA: string | null = null,
): Ajuste => ({
  destino,
  destinoId,
  seccion: "5A",
  motivoId: "participacion",
  motivo: "Participación destacada",
  valor: anulaA ? -2 : 2,
  nota: null,
  autorId: PROFE,
  en: 3,
  anulaA,
});

const ranking = async () =>
  zRankingSeccion.parse((await docs.snap(db(), "ranking", "5A")).data());
const existe = async (col: string, id: string) =>
  (await docs.snap(db(), col as Parameters<typeof docs.snap>[1], id)).exists;

beforeAll(async () => {
  base = await baseNueva();
  const set = (col: string, id: string, data: object) =>
    docs.ponerDoc(db(), col as Parameters<typeof docs.ponerDoc>[1], id, data);
  await docs.borrarDoc(db(), "usuarios", NUEVO);
  await docs.borrarDoc(db(), "privados", NUEVO);
  await set(COL.usuarios, PROFE, {
    ...alumno(PROFE, null),
    rol: "profesor",
    seccion: null,
  });
  await set(COL.usuarios, CAP, alumno(CAP, E_LLENO));
  await set(COL.usuarios, OTRO, alumno(OTRO, E_LLENO));
  await set(COL.privados, CAP, { email: "cap@example.com" });
  await set(COL.equipos, E_VACIO, equipo("W12 Vacío", null));
  await set(COL.equipos, E_LLENO, equipo("W12 Lleno", CAP));
  await set(COL.equipos, E_CON_ENTREGA, equipo("W12 Con entrega", null));
  await set(COL.equipos, E_CON_AJUSTE, equipo("W12 Con ajuste", null));
  await set(COL.equipos, E_OTRA, equipo("W12 Otra sección", null, "5C"));
  await set(
    COL.entregas,
    idEntrega("w12-t1", CAP),
    individual("w12-t1", CAP, 18),
  );
  await set(
    COL.entregas,
    idEntrega("w12-t2", CAP),
    individual("w12-t2", CAP, 12),
  );
  await set(
    COL.entregas,
    idEntrega("w12-t3", CAP),
    individual("w12-t3", CAP, null),
  );
  await set(
    COL.entregas,
    idEntrega("w12-t1", OTRO),
    individual("w12-t1", OTRO, 15),
  );
  await set(
    COL.entregas,
    idEntrega("w12-g1", E_LLENO),
    grupal("w12-g1", E_LLENO),
  );
  await set(
    COL.entregas,
    idEntrega("w12-g1", E_CON_ENTREGA),
    grupal("w12-g1", E_CON_ENTREGA),
  );
  await set(COL.ajustes, "w12-aj-cap", ajuste("alumno", CAP));
  await set(
    COL.ajustes,
    "w12-aj-cap-anula",
    ajuste("alumno", CAP, "w12-aj-cap"),
  );
  await set(COL.ajustes, "w12-aj-otro", ajuste("alumno", OTRO));
  await set(COL.ajustes, "w12-aj-equipo", ajuste("equipo", E_CON_AJUSTE));
  await db().insert(historialBase).values({
    id: "w12-hist-cap",
    alumnoId: CAP,
    de: 20,
    a: 18,
    motivo: "Acuerdo de conducta",
    autorId: PROFE,
    en: 1,
  });
}, 30_000);

describe("agregar alumno (D267)", () => {
  test("un equipo de otra sección no vale para un alumno de 5A", async () => {
    expect(await equipoValidoPara(db(), E_VACIO, "5A")).toBe(true);
    expect(await equipoValidoPara(db(), E_OTRA, "5A")).toBe(false);
    expect(await equipoValidoPara(db(), "w12-no-existe", "5A")).toBe(false);
  });

  test("crea la cuenta, entra en un equipo vacío como capitán y en el ranking", async () => {
    const { passwordTemporal } = await crearCuentaCon(
      db(),
      {
        rol: "estudiante",
        cedula: NUEVO,
        nombres: "Nuevo",
        apellidos: "Prueba W12",
        email: null,
        seccion: "5A",
      },
      AHORA,
    );
    expect(passwordTemporal.length).toBeGreaterThanOrEqual(12);
    const r = await incorporarAlumnoEnTransaccion(db(), NUEVO, E_VACIO, AHORA);
    expect(r).toEqual({ ok: true, afectados: [NUEVO] });
    const u = zUsuario.parse((await docs.snap(db(), "usuarios", NUEVO)).data());
    expect(u.equipoId).toBe(E_VACIO);
    expect(u.debeCambiarPassword).toBe(true);
    const e = zEquipo.parse((await docs.snap(db(), "equipos", E_VACIO)).data());
    expect(e.capitanId).toBe(NUEVO);
    const rk = await ranking();
    expect(rk.alumnos[NUEVO]).toMatchObject({ equipoId: E_VACIO, puntos: 0 });
  });

  test("sin equipo: igual reescribe el ranking; a un equipo de otra sección, no", async () => {
    expect(
      await incorporarAlumnoEnTransaccion(db(), NUEVO, E_OTRA, AHORA),
    ).toEqual({ ok: false, error: "otra-seccion" });
    // Dejar al nuevo fuera para las pruebas de eliminar equipo
    await docs.actualizarDoc(db(), "usuarios", NUEVO, { equipoId: null });
    await docs.actualizarDoc(db(), "equipos", E_VACIO, { capitanId: null });
    const r = await incorporarAlumnoEnTransaccion(db(), NUEVO, null, AHORA + 1);
    expect(r).toEqual({ ok: true, afectados: [] });
    const rk = await ranking();
    expect(rk.actualizadoEn).toBe(AHORA + 1);
    expect(rk.alumnos[NUEVO]?.equipoId).toBeNull();
  });
});

describe("eliminar alumno (D268, D269)", () => {
  test("el resumen cuenta notas, entregas sin nota, ajustes y la capitanía", async () => {
    const r = await resumenBorradoCon(db(), CAP);
    expect(r).toEqual({
      ok: true,
      resumen: {
        notas: 2,
        sinNota: 1,
        ajustes: 1,
        capitania: {
          equipo: "W12 Lleno",
          sucesor: `Alumno ${OTRO} Prueba W12`,
        },
      },
    });
  });

  test("un profe no se elimina por aquí; una cédula sin perfil, no existe", async () => {
    expect(await resumenBorradoCon(db(), PROFE)).toEqual({
      ok: false,
      error: "no-alumno",
    });
    expect(await eliminarAlumnoEnTransaccion(db(), PROFE, AHORA)).toEqual({
      ok: false,
      error: "no-alumno",
    });
    expect(await existe(COL.usuarios, PROFE)).toBe(true);
    expect(await resumenBorradoCon(db(), "39750099")).toEqual({
      ok: false,
      error: "no-existe",
    });
  });

  test("borra todo lo suyo en una transacción; la grupal y el equipo conservan su nota", async () => {
    // Ranking de partida con todos (el alta lo reescribe)
    await incorporarAlumnoEnTransaccion(db(), OTRO, E_LLENO, AHORA);
    const antes = await ranking();
    expect(antes.alumnos[CAP]).toBeDefined();
    const puntosEquipo = antes.equipos[E_LLENO]?.puntos;
    expect(puntosEquipo).toBeGreaterThan(0);

    const r = await eliminarAlumnoEnTransaccion(db(), CAP, AHORA + 5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.imagenes.sort()).toEqual([
      `respuestas/w12-t1/${CAP}/p1.jpg`,
      `respuestas/w12-t2/${CAP}/p1.jpg`,
      `respuestas/w12-t3/${CAP}/p1.jpg`,
    ]);

    for (const t of ["w12-t1", "w12-t2", "w12-t3"])
      expect(await existe(COL.entregas, idEntrega(t, CAP))).toBe(false);
    expect(await existe(COL.ajustes, "w12-aj-cap")).toBe(false);
    expect(await existe(COL.ajustes, "w12-aj-cap-anula")).toBe(false);
    expect(await existe(COL.historialBase, "w12-hist-cap")).toBe(false);
    expect(await existe(COL.usuarios, CAP)).toBe(false);
    expect(await existe(COL.privados, CAP)).toBe(false);

    // Lo de los demás se queda
    expect(await existe(COL.entregas, idEntrega("w12-t1", OTRO))).toBe(true);
    expect(await existe(COL.ajustes, "w12-aj-otro")).toBe(true);
    const g = (
      await docs.snap(db(), "entregas", idEntrega("w12-g1", E_LLENO))
    ).data() as Entrega;
    expect(g.integrantes).toEqual([CAP, OTRO]);
    expect(g.evaluacion?.puntaje).toBe(16);

    // El cargo pasa al siguiente integrante
    const e = zEquipo.parse((await docs.snap(db(), "equipos", E_LLENO)).data());
    expect(e.capitanId).toBe(OTRO);

    const despues = await ranking();
    expect(despues.actualizadoEn).toBe(AHORA + 5);
    expect(despues.alumnos[CAP]).toBeUndefined();
    expect(despues.alumnos[OTRO]?.puntos).toBe(antes.alumnos[OTRO]?.puntos);
    expect(despues.equipos[E_LLENO]?.puntos).toBe(puntosEquipo);
  });

  test("repetir sobre un alumno ya borrado responde que no existe", async () => {
    expect(await eliminarAlumnoEnTransaccion(db(), CAP, AHORA)).toEqual({
      ok: false,
      error: "no-existe",
    });
  });

  test("al borrar al alumno se va también su cuenta (no puede volver a entrar)", async () => {
    expect(await docs.existeCuenta(db(), CAP)).toBe(false);
    // Un profesor no se borra por aquí (D234)
    expect(await eliminarAlumnoEnTransaccion(db(), PROFE, AHORA)).toEqual({
      ok: false,
      error: "no-alumno",
    });
    expect(await docs.existeCuenta(db(), PROFE)).toBe(true);
  });
});

describe("equipos (D270, D307–D309)", () => {
  let creado = "";

  test("crea un equipo sin capitán ni logo y lo suma al ranking", async () => {
    const r = await crearEquipoEnTransaccion(
      db(),
      { nombre: "W12 Nuevo", tema: "Cerámica", seccion: "5A" },
      AHORA,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    creado = r.id;
    const e = zEquipo.parse((await docs.snap(db(), "equipos", creado)).data());
    expect(e).toEqual({
      nombre: "W12 Nuevo",
      seccion: "5A",
      tema: "Cerámica",
      capitanId: null,
      logoPath: null,
    });
    expect((await ranking()).equipos[creado]).toEqual({
      nombre: "W12 Nuevo",
      logoPath: null,
      puntos: 0,
    });
  });

  test("un nombre repetido en la sección (sin mirar mayúsculas ni tildes) no se crea", async () => {
    expect(
      await crearEquipoEnTransaccion(
        db(),
        { nombre: "w12 nuevo", tema: null, seccion: "5A" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "repetido" });
    expect(
      await editarEquipoEnTransaccion(
        db(),
        { equipoId: E_VACIO, nombre: "W12 NUEVO", tema: null },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "repetido" });
  });

  test("renombra y cambia el tema; el ranking lleva el nombre nuevo", async () => {
    const r = await editarEquipoEnTransaccion(
      db(),
      { equipoId: creado, nombre: "W12 Renombrado", tema: null },
      AHORA,
    );
    expect(r).toEqual({ ok: true, id: creado });
    const e = zEquipo.parse((await docs.snap(db(), "equipos", creado)).data());
    expect(e.nombre).toBe("W12 Renombrado");
    expect(e.tema).toBeNull();
    expect((await ranking()).equipos[creado]?.nombre).toBe("W12 Renombrado");
  });

  test("con integrantes, entregas y ajustes también se elimina: se deshace todo (D307)", async () => {
    // Datos propios: 2 integrantes, 1 grupal evaluada, 1 ajuste del equipo y 1 de un alumno
    await docs.ponerDoc(db(), "usuarios", D1, alumno(D1, E_DISOLVER));
    await docs.ponerDoc(db(), "usuarios", D2, alumno(D2, E_DISOLVER));
    await docs.ponerDoc(
      db(),
      "equipos",
      E_DISOLVER,
      equipo("W12 Disolver", D1),
    );
    await docs.ponerDoc(db(), "entregas", idEntrega("w12-g2", E_DISOLVER), {
      ...grupal("w12-g2", E_DISOLVER),
      integrantes: [D1, D2],
      enviadaPor: D1,
    });
    await docs.ponerDoc(
      db(),
      "ajustes",
      "w12-aj-disolver",
      ajuste("equipo", E_DISOLVER),
    );
    await docs.ponerDoc(db(), "ajustes", "w12-aj-d1", ajuste("alumno", D1));
    await incorporarAlumnoEnTransaccion(db(), D2, E_DISOLVER, AHORA);
    const antes = await ranking();
    expect(antes.equipos[E_DISOLVER]?.puntos).toBeGreaterThan(0);
    const puntosD1 = antes.alumnos[D1]?.puntos;
    expect(puntosD1).toBeGreaterThan(0);

    const r = await eliminarEquipoEnTransaccion(db(), E_DISOLVER, AHORA + 9);
    expect(r.resultado).toEqual({ ok: true, id: E_DISOLVER });
    expect(r.afectados.sort()).toEqual([D1, D2]);
    expect(await existe(COL.equipos, E_DISOLVER)).toBe(false);

    // Integrantes «Sin equipo»
    for (const c of [D1, D2]) {
      const u = zUsuario.parse((await docs.snap(db(), "usuarios", c)).data());
      expect(u.equipoId).toBeNull();
      expect(u.actualizadoEn).toBe(AHORA + 9);
    }

    // La entrega se queda intacta con el nombre del equipo
    const g = zEntrega.parse(
      (
        await docs.snap(db(), "entregas", idEntrega("w12-g2", E_DISOLVER))
      ).data(),
    );
    expect(g.titularNombre).toBe("W12 Disolver");
    expect(g.titularId).toBe(E_DISOLVER);
    expect(g.integrantes).toEqual([D1, D2]);
    expect(g.evaluacion?.puntaje).toBe(16);

    // El ajuste del equipo se borra; el del alumno, no
    expect(await existe(COL.ajustes, "w12-aj-disolver")).toBe(false);
    expect(await existe(COL.ajustes, "w12-aj-d1")).toBe(true);

    // Ranking: sin el equipo; los alumnos conservan sus puntos y quedan sin equipo
    const despues = await ranking();
    expect(despues.actualizadoEn).toBe(AHORA + 9);
    expect(despues.equipos[E_DISOLVER]).toBeUndefined();
    expect(despues.alumnos[D1]).toMatchObject({
      equipoId: null,
      puntos: puntosD1,
    });

    // Su nota en la grupal sigue saliendo: la busca por `integrantes`, como el DAL
    const deD2 = await entregasDeIntegrante(db(), D2);
    const nota = deD2.find((e) => e.tareaId === "w12-g2");
    expect(nota && notaDeIntegrante(nota, 20, D2)).toBe(16);
  });

  test("con solo entregas o solo ajustes, igual: la entrega se queda y el ajuste se va", async () => {
    for (const id of [E_CON_ENTREGA, E_CON_AJUSTE]) {
      const r = await eliminarEquipoEnTransaccion(db(), id, AHORA);
      expect(r.resultado).toEqual({ ok: true, id });
      expect(r.afectados).toEqual([]);
      expect(await existe(COL.equipos, id)).toBe(false);
    }
    const g = (
      await docs.snap(db(), "entregas", idEntrega("w12-g1", E_CON_ENTREGA))
    ).data() as Entrega;
    expect(g.titularNombre).toBe("W12 Con entrega");
    expect(g.evaluacion?.puntaje).toBe(16);
    expect(await existe(COL.ajustes, "w12-aj-equipo")).toBe(false);
  });

  test("un equipo vacío se elimina y sale del ranking; repetir: no existe", async () => {
    const r = await eliminarEquipoEnTransaccion(db(), creado, AHORA);
    expect(r).toEqual({
      resultado: { ok: true, id: creado },
      logo: null,
      afectados: [],
    });
    expect(await existe(COL.equipos, creado)).toBe(false);
    expect((await ranking()).equipos[creado]).toBeUndefined();
    expect(
      (await eliminarEquipoEnTransaccion(db(), creado, AHORA)).resultado,
    ).toEqual({ ok: false, error: "no-existe" });
  });
});
