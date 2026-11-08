// Presencia en «Editar alumno» y «el último gana» sobre Postgres en memoria (W14, D275–D277, D327).
// Quién puede usar la ruta de presencia lo prueba tests/unit/acceso.test.ts.
import { beforeAll, describe, expect, test } from "bun:test";
import { versionDe } from "@/lib/alumnos-datos";
import { editarAlumnoEnTransaccion } from "@/lib/data/alumnos";
import { eliminarAlumnoEnTransaccion } from "@/lib/data/alumnos-alta";
import {
  borrarPresenciaAlumno,
  leerPresencia,
  marcarPresencia,
  quitarPresencia,
} from "@/lib/data/presencia";
import type { Db } from "@/lib/db";
import type { Usuario } from "@/lib/modelo";
import { VIGENCIA_MS } from "@/lib/presencia";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 6, 16);
const PROFE_A = "39740001";
const PROFE_B = "39740002";
const ALUMNO = "39740003";
const ALUMNO_BORRAR = "39740004";

const alumno = (cedula: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Luis",
  apellidos: "Prueba W14",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "lorelei", semilla: cedula },
  actualizadoEn: 1,
});

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerUsuario(db(), alumno(ALUMNO));
  await docs.ponerUsuario(db(), alumno(ALUMNO_BORRAR));
}, 30_000);

describe("presencia (D275)", () => {
  test("marcar crea la entrada, latir la renueva sin mover `desde`, quitar la borra", async () => {
    await marcarPresencia(db(), ALUMNO, PROFE_A, "Ana Pérez", AHORA);
    await marcarPresencia(db(), ALUMNO, PROFE_A, "Ana Pérez", AHORA + 20_000);
    const [e] = await leerPresencia(db(), AHORA + 20_000);
    expect(e).toEqual({
      alumnoId: ALUMNO,
      entrada: {
        profeId: PROFE_A,
        nombre: "Ana Pérez",
        desde: AHORA,
        latido: AHORA + 20_000,
      },
    });
    await quitarPresencia(db(), ALUMNO, PROFE_A);
    expect(await leerPresencia(db(), AHORA + 20_000)).toEqual([]);
  });

  test("quitar solo borra la entrada propia", async () => {
    await marcarPresencia(db(), ALUMNO, PROFE_A, "Ana Pérez", AHORA);
    await marcarPresencia(db(), ALUMNO, PROFE_B, "Beto Díaz", AHORA);
    await quitarPresencia(db(), ALUMNO, PROFE_B);
    const vivas = await leerPresencia(db(), AHORA);
    expect(vivas.map((v) => v.entrada.profeId)).toEqual([PROFE_A]);
    await quitarPresencia(db(), ALUMNO, PROFE_A);
  });

  test("las vencidas no se leen (pestaña cerrada sin `pagehide`)", async () => {
    await marcarPresencia(db(), ALUMNO, PROFE_A, "Ana Pérez", AHORA);
    expect(await leerPresencia(db(), AHORA + VIGENCIA_MS + 1)).toEqual([]);
    await quitarPresencia(db(), ALUMNO, PROFE_A);
  });

  test("eliminar alumno borra todas sus entradas, ninguna de otro (D277)", async () => {
    await marcarPresencia(db(), ALUMNO_BORRAR, PROFE_A, "Ana Pérez", AHORA);
    await marcarPresencia(db(), ALUMNO_BORRAR, PROFE_B, "Beto Díaz", AHORA);
    await marcarPresencia(db(), ALUMNO, PROFE_A, "Ana Pérez", AHORA);
    expect(await borrarPresenciaAlumno(db(), ALUMNO_BORRAR)).toBe(2);
    expect(await docs.presenciaDe(db(), ALUMNO_BORRAR)).toEqual([]);
    expect(await docs.presenciaDe(db(), ALUMNO)).toHaveLength(1);
    expect(await borrarPresenciaAlumno(db(), ALUMNO_BORRAR)).toBe(0);

    // Y la transacción del borrado también la limpia
    await marcarPresencia(db(), ALUMNO_BORRAR, PROFE_A, "Ana Pérez", AHORA);
    expect(
      (await eliminarAlumnoEnTransaccion(db(), ALUMNO_BORRAR, AHORA)).ok,
    ).toBe(true);
    expect(await docs.presenciaDe(db(), ALUMNO_BORRAR)).toEqual([]);
    await quitarPresencia(db(), ALUMNO, PROFE_A);
  });
});

describe("«el último gana» (D276)", () => {
  test("dos profes abren el mismo alumno: el segundo guardado recibe el conflicto", async () => {
    const u = await docs.usuario(db(), ALUMNO);
    if (!u) throw new Error("sin alumno");
    const abierto = versionDe(u, null);
    const entrada = {
      cedula: ALUMNO,
      apellidos: "Prueba W14",
      base: 20,
      motivo: "",
      email: "",
    };

    const a = await editarAlumnoEnTransaccion(
      db(),
      PROFE_A,
      { ...entrada, nombres: "Luis Ana", version: abierto },
      AHORA,
    );
    expect(a).toEqual({ ok: true });

    const b = await editarAlumnoEnTransaccion(
      db(),
      PROFE_B,
      { ...entrada, nombres: "Luis Bruno", version: abierto },
      AHORA + 1,
    );
    expect(b).toEqual({
      ok: false,
      error: "conflicto",
      actual: {
        nombres: "Luis Ana",
        apellidos: "Prueba W14",
        base: 20,
        email: null,
      },
    });
    expect((await docs.usuario(db(), ALUMNO))?.nombres).toBe("Luis Ana");

    // Con la versión nueva (lo que vio tras el aviso), el último gana
    if (b.ok || b.error !== "conflicto") throw new Error("sin conflicto");
    const c = await editarAlumnoEnTransaccion(
      db(),
      PROFE_B,
      { ...entrada, nombres: "Luis Bruno", version: b.actual },
      AHORA + 2,
    );
    expect(c).toEqual({ ok: true });
    expect((await docs.usuario(db(), ALUMNO))?.nombres).toBe("Luis Bruno");
  });

  test("un email cambiado por otro profe también es conflicto", async () => {
    const u = await docs.usuario(db(), ALUMNO);
    if (!u) throw new Error("sin alumno");
    const abierto = versionDe(u, null);
    await docs.ponerDoc(db(), "privados", ALUMNO, {
      email: "luis.w14@gmail.com",
    });
    const r = await editarAlumnoEnTransaccion(
      db(),
      PROFE_A,
      {
        cedula: ALUMNO,
        nombres: abierto.nombres,
        apellidos: abierto.apellidos,
        base: 18,
        motivo: "Acuerdo",
        email: "",
        version: abierto,
      },
      AHORA + 3,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("conflicto");
    expect((await docs.usuario(db(), ALUMNO))?.base).toBe(20);
  });
});
