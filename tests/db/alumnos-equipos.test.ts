// Alumnos y Equipos del profesor sobre Postgres en memoria (D327) (W8, D209–D212): las transacciones reales
// del Admin SDK que usan las Server Actions. Mover de equipo → perfil, capitán, ranking y custom
// claims + tokens revocados; cambiar capitán; base con historial (D176) y email de recuperación;
// ruta del logo en el equipo y en el ranking.
import { beforeAll, describe, expect, test } from "bun:test";
import { editarAlumnoEnTransaccion } from "@/lib/data/alumnos";
import {
  cambiarCapitanEnTransaccion,
  cambiarLogoEnTransaccion,
  moverAlumnoEnTransaccion,
} from "@/lib/data/equipos";
import type { Db } from "@/lib/db";
import {
  type Entrega,
  type Equipo,
  idEntrega,
  type Usuario,
  zCambioBase,
  zEquipo,
  zRankingSeccion,
  zUsuario,
} from "@/lib/modelo";
import { sesionDeClaims } from "@/lib/sesion";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 11, 1, 15);
const PROFE = "45001237";
const A1 = "39800001"; // capitán de G1
const A2 = "39800002"; // G1
const A3 = "39800003"; // G2 (capitán)
const A4 = "39800004"; // base 20, con una individual evaluada (16/20)
const A5 = "39800005"; // 5C
const G1 = "w8-g1";
const G2 = "w8-g2";
const G9 = "w8-g9"; // de 5C
const T_IND = "w8-ind";

const alumno = (
  cedula: string,
  equipoId: string | null,
  seccion: Usuario["seccion"] = "5A",
): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba W8",
  seccion,
  equipoId,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const equipo = (
  nombre: string,
  capitanId: string | null,
  seccion: Equipo["seccion"] = "5A",
): Equipo => ({
  nombre,
  seccion,
  tema: null,
  capitanId,
  logoPath: null,
});

const evaluada: Entrega = {
  tareaId: T_IND,
  tipo: "individual",
  titularId: A4,
  seccion: "5A",
  integrantes: [A4],
  estado: "evaluada",
  respuestas: {},
  enviadaPor: A4,
  enviadaEn: 1,
  evaluacion: {
    puntos: null,
    comentarios: {},
    puntaje: 16,
    evaluadaPor: PROFE,
    evaluadaEn: 2,
  },
};

async function usuario(cedula: string) {
  const snap = await docs.snap(db(), "usuarios", cedula);
  return zUsuario.parse(snap.data());
}
async function equipoDoc(id: string) {
  const snap = await docs.snap(db(), "equipos", id);
  return zEquipo.parse(snap.data());
}
async function ranking(seccion: "5A" | "5C" = "5A") {
  const snap = await docs.snap(db(), "ranking", seccion);
  return zRankingSeccion.parse(snap.data());
}

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerDoc(db(), "usuarios", A1, alumno(A1, G1));
  await docs.ponerDoc(db(), "usuarios", A2, alumno(A2, G1));
  await docs.ponerDoc(db(), "usuarios", A3, alumno(A3, G2));
  await docs.ponerDoc(db(), "usuarios", A4, alumno(A4, null));
  await docs.ponerDoc(db(), "usuarios", A5, alumno(A5, G9, "5C"));
  await docs.ponerDoc(db(), "equipos", G1, equipo("5A-G8 Prueba", A1));
  await docs.ponerDoc(db(), "equipos", G2, equipo("5A-G9 Prueba", A3));
  await docs.ponerDoc(db(), "equipos", G9, equipo("5C-G9 Prueba", A5, "5C"));
  await docs.ponerDoc(db(), "entregas", idEntrega(T_IND, A4), evaluada);
});

describe("mover de equipo (D210)", () => {
  test("el capitán pasa a otro equipo: perfil, cargo, ranking y claims", async () => {
    const r = await moverAlumnoEnTransaccion(
      db(),
      { cedula: A1, destino: G2 },
      AHORA,
    );
    expect(r).toEqual({ ok: true, afectados: [A1] });
    expect((await usuario(A1)).equipoId).toBe(G2);
    // Al sacar al capitán, el cargo pasa al siguiente integrante (D111)
    expect((await equipoDoc(G1)).capitanId).toBe(A2);
    expect((await equipoDoc(G2)).capitanId).toBe(A3);
    const rk = await ranking();
    expect(rk.alumnos[A1]?.equipoId).toBe(G2);
    expect(rk.actualizadoEn).toBe(AHORA);

    // La sesión lee el equipo de `usuarios` en cada request (D327): no hay claims que poner
    expect(sesionDeClaims(A1, (await usuario(A1)) ?? {})?.equipoId).toBe(G2);
  });

  test("quitar del equipo: equipoId null y claims sin equipo", async () => {
    const r = await moverAlumnoEnTransaccion(
      db(),
      { cedula: A2, destino: null },
      AHORA + 1,
    );
    expect(r).toEqual({ ok: true, afectados: [A2] });
    expect((await usuario(A2)).equipoId).toBeNull();
    // G1 queda vacío: sin capitán (D112)
    expect((await equipoDoc(G1)).capitanId).toBeNull();
    expect((await ranking()).alumnos[A2]?.equipoId).toBeNull();
    expect(sesionDeClaims(A2, (await usuario(A2)) ?? {})?.equipoId).toBeNull();
  });

  test("el primero que llega a un equipo vacío es su capitán", async () => {
    const r = await moverAlumnoEnTransaccion(
      db(),
      { cedula: A4, destino: G1 },
      AHORA + 2,
    );
    expect(r).toEqual({ ok: true, afectados: [A4] });
    expect((await equipoDoc(G1)).capitanId).toBe(A4);
  });

  test("a un equipo de otra sección: no", async () => {
    expect(
      await moverAlumnoEnTransaccion(db(), { cedula: A3, destino: G9 }, AHORA),
    ).toEqual({ ok: false, error: "otra-seccion" });
    expect((await usuario(A3)).equipoId).toBe(G2);
  });

  test("a un equipo que no existe: no", async () => {
    expect(
      await moverAlumnoEnTransaccion(
        db(),
        { cedula: A3, destino: "no-existe" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
  });

  test("al mismo equipo: nada que escribir", async () => {
    const r = await moverAlumnoEnTransaccion(
      db(),
      { cedula: A3, destino: G2 },
      AHORA + 3,
    );
    expect(r).toEqual({ ok: true, afectados: [] });
    // El ranking no se reescribió
    expect((await ranking()).actualizadoEn).toBe(AHORA + 2);
  });
});

describe("cambiar capitán (D012, D210)", () => {
  test("a un integrante: cambia el equipo y el ranking se recalcula", async () => {
    // G2 tiene ahora a A3 y A1
    const r = await cambiarCapitanEnTransaccion(
      db(),
      { equipoId: G2, cedula: A1 },
      AHORA + 4,
    );
    expect(r).toEqual({ ok: true, afectados: [] });
    expect((await equipoDoc(G2)).capitanId).toBe(A1);
    expect((await ranking()).actualizadoEn).toBe(AHORA + 4);
  });

  test("a quien no es integrante: inválido y nada cambia", async () => {
    expect(
      await cambiarCapitanEnTransaccion(
        db(),
        { equipoId: G2, cedula: A2 },
        AHORA + 5,
      ),
    ).toEqual({ ok: false, error: "invalida" });
    expect((await equipoDoc(G2)).capitanId).toBe(A1);
  });
});

describe("editar alumno: base con historial (D176, D209)", () => {
  test("base 20 → 15 con motivo: perfil, historial con autor y puntos recalculados", async () => {
    const antes = (await ranking()).alumnos[A4]?.puntos;
    const r = await editarAlumnoEnTransaccion(
      db(),
      PROFE,
      {
        cedula: A4,
        nombres: "Alumno Editado",
        apellidos: "Prueba W8",
        base: 15,
        motivo: "Acuerdo de conducta",
        email: "alumno.w8@gmail.com",
      },
      AHORA + 6,
    );
    expect(r).toEqual({ ok: true });
    const u = await usuario(A4);
    expect(u.base).toBe(15);
    expect(u.nombres).toBe("Alumno Editado");

    const hist = await docs.historialDe(db(), A4);
    expect(hist.length).toBe(1);
    expect(zCambioBase.parse(hist[0])).toEqual({
      alumnoId: A4,
      de: 20,
      a: 15,
      motivo: "Acuerdo de conducta",
      autorId: PROFE,
      en: AHORA + 6,
    });

    const privado = await docs.snap(db(), "privados", A4);
    expect(privado.data()).toEqual({ email: "alumno.w8@gmail.com" });

    // Nota 16 × 15 / 20 = 12 (D013): los puntos de su nota bajan con la base
    const rk = await ranking();
    expect(rk.alumnos[A4]?.nombres).toBe("Alumno Editado");
    expect(rk.alumnos[A4]?.puntos).toBeLessThan(antes ?? 0);
    // La entrega no se toca: la nota se deriva (D013)
    const e = await docs.entrega(db(), idEntrega(T_IND, A4));
    expect(e?.evaluacion?.puntaje).toBe(16);
  });

  test("cambiar la base sin motivo: no se guarda nada", async () => {
    expect(
      await editarAlumnoEnTransaccion(
        db(),
        PROFE,
        {
          cedula: A4,
          nombres: "Alumno Editado",
          apellidos: "Prueba W8",
          base: 18,
          motivo: "",
        },
        AHORA + 7,
      ),
    ).toEqual({ ok: false, error: "motivo" });
    expect((await usuario(A4)).base).toBe(15);
  });

  test("solo el email (vacío = quitarlo): sin historial nuevo", async () => {
    expect(
      await editarAlumnoEnTransaccion(
        db(),
        PROFE,
        {
          cedula: A4,
          nombres: "Alumno Editado",
          apellidos: "Prueba W8",
          base: 15,
          motivo: "",
          email: "",
        },
        AHORA + 8,
      ),
    ).toEqual({ ok: true });
    const privado = await docs.snap(db(), "privados", A4);
    expect(privado.data()).toEqual({ email: null });
    const hist = await docs.historialDe(db(), A4);
    expect(hist.length).toBe(1);
  });

  test("un alumno que no existe", async () => {
    expect(
      await editarAlumnoEnTransaccion(
        db(),
        PROFE,
        {
          cedula: "39899999",
          nombres: "Nadie",
          apellidos: "Prueba",
          base: 20,
          motivo: "",
        },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
  });
});

describe("logo de equipo (D212)", () => {
  test("la ruta va al equipo y al ranking; devuelve la anterior para borrarla", async () => {
    const r1 = await cambiarLogoEnTransaccion(
      db(),
      G2,
      "equipos/w8-g2/uno.webp",
      AHORA + 9,
    );
    expect(r1).toEqual({ ok: true, anterior: null });
    const r2 = await cambiarLogoEnTransaccion(
      db(),
      G2,
      "equipos/w8-g2/dos.webp",
      AHORA + 10,
    );
    expect(r2).toEqual({ ok: true, anterior: "equipos/w8-g2/uno.webp" });
    expect((await equipoDoc(G2)).logoPath).toBe("equipos/w8-g2/dos.webp");
    expect((await ranking()).equipos[G2]?.logoPath).toBe(
      "equipos/w8-g2/dos.webp",
    );
  });

  test("equipo que no existe", async () => {
    expect(
      await cambiarLogoEnTransaccion(db(), "no-existe", "equipos/x/y.webp", 1),
    ).toEqual({ ok: false, error: "no-existe" });
  });
});
