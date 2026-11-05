import { describe, expect, test } from "bun:test";
import { EMAIL_INVALIDO, validarEdicion } from "@/lib/alumnos";
import {
  armarEdicion,
  type EditarAlumno,
  errorAlumnoTexto,
  filasAlumnos,
  notaIndividualVigente,
  zEditarAlumno,
} from "@/lib/alumnos-datos";
import type { Entrega, Equipo, Usuario } from "@/lib/modelo";

const usuario = (cedula: string, o: Partial<Usuario> = {}): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Jailyn Verónica",
  apellidos: "Martínez Méndez",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "lorelei", semilla: `s-${cedula}` },
  actualizadoEn: 1,
  ...o,
});

const entrada = (o: Partial<EditarAlumno> = {}): EditarAlumno => ({
  cedula: "37575127",
  nombres: "Jailyn Verónica",
  apellidos: "Martínez Méndez",
  base: 20,
  motivo: "",
  ...o,
});

const AHORA = Date.UTC(2026, 10, 5, 15);
const PROFE = "30262232";

describe("zEditarAlumno", () => {
  test("recorta nombres y pasa el email a minúsculas", () => {
    const r = zEditarAlumno.parse({
      ...entrada(),
      nombres: "  Jailyn  ",
      email: " Jailyn@Gmail.COM ",
    });
    expect(r.nombres).toBe("Jailyn");
    expect(r.email).toBe("jailyn@gmail.com");
  });

  test("email vacío vale (quitarlo); uno mal escrito no", () => {
    expect(zEditarAlumno.safeParse({ ...entrada(), email: "" }).success).toBe(
      true,
    );
    expect(
      zEditarAlumno.safeParse({ ...entrada(), email: "no-es-email" }).success,
    ).toBe(false);
  });

  test("base fuera de 10–20 o sin pasos de 0,5: inválida (D006)", () => {
    expect(zEditarAlumno.safeParse(entrada({ base: 9.5 })).success).toBe(false);
    expect(zEditarAlumno.safeParse(entrada({ base: 15.2 })).success).toBe(
      false,
    );
    expect(zEditarAlumno.safeParse(entrada({ base: 15.5 })).success).toBe(true);
  });

  test("nombre vacío: inválido", () => {
    expect(zEditarAlumno.safeParse(entrada({ nombres: " " })).success).toBe(
      false,
    );
  });
});

describe("armarEdicion", () => {
  const actual = usuario("37575127");

  test("sin cambios: no escribe nada", () => {
    const r = armarEdicion({
      actual,
      emailActual: null,
      entrada: entrada(),
      autorId: PROFE,
      ahora: AHORA,
    });
    expect(r).toEqual({
      ok: true,
      edicion: { usuario: null, cambioBase: null, email: undefined },
    });
  });

  test("cambiar la base exige motivo (D108, D176)", () => {
    const r = armarEdicion({
      actual,
      emailActual: null,
      entrada: entrada({ base: 15 }),
      autorId: PROFE,
      ahora: AHORA,
    });
    expect(r).toEqual({ ok: false, error: "motivo" });
  });

  test("base con motivo: perfil nuevo + fila de historial con autor", () => {
    const r = armarEdicion({
      actual,
      emailActual: null,
      entrada: entrada({ base: 15, motivo: "Acuerdo de conducta" }),
      autorId: PROFE,
      ahora: AHORA,
    });
    if (!r.ok) throw new Error("debía valer");
    expect(r.edicion.usuario?.base).toBe(15);
    expect(r.edicion.usuario?.actualizadoEn).toBe(AHORA);
    expect(r.edicion.cambioBase).toEqual({
      alumnoId: "37575127",
      de: 20,
      a: 15,
      motivo: "Acuerdo de conducta",
      autorId: PROFE,
      en: AHORA,
    });
  });

  test("solo el nombre: perfil nuevo sin historial ni motivo", () => {
    const r = armarEdicion({
      actual,
      emailActual: null,
      entrada: entrada({ nombres: "Jailyn" }),
      autorId: PROFE,
      ahora: AHORA,
    });
    if (!r.ok) throw new Error("debía valer");
    expect(r.edicion.usuario?.nombres).toBe("Jailyn");
    expect(r.edicion.cambioBase).toBeNull();
    // Sección, equipo y avatar no cambian
    expect(r.edicion.usuario?.seccion).toBe("5A");
    expect(r.edicion.usuario?.avatar).toEqual(actual.avatar);
  });

  test("email: nuevo, igual (no escribe) y vacío (= null)", () => {
    const con = (email: string, emailActual: string | null) =>
      armarEdicion({
        actual,
        emailActual,
        entrada: entrada({ email }),
        autorId: PROFE,
        ahora: AHORA,
      });
    const nuevo = con("jailyn@gmail.com", null);
    expect(nuevo.ok && nuevo.edicion.email).toBe("jailyn@gmail.com");
    const igual = con("jailyn@gmail.com", "jailyn@gmail.com");
    expect(igual.ok && igual.edicion.email).toBeUndefined();
    const quitar = con("", "jailyn@gmail.com");
    expect(quitar.ok && quitar.edicion.email).toBeNull();
  });

  test("un profesor no se edita aquí", () => {
    const r = armarEdicion({
      actual: usuario(PROFE, { rol: "profesor", seccion: null }),
      emailActual: null,
      entrada: entrada({ cedula: PROFE }),
      autorId: PROFE,
      ahora: AHORA,
    });
    expect(r).toEqual({ ok: false, error: "invalida" });
  });
});

const evaluada = (
  titularId: string,
  puntaje: number,
  en: number,
  tipo: Entrega["tipo"] = "individual",
): Entrega => ({
  tareaId: `t-${en}`,
  tipo,
  titularId,
  seccion: "5A",
  integrantes: [titularId],
  estado: "evaluada",
  respuestas: {},
  enviadaPor: titularId,
  enviadaEn: en - 10,
  evaluacion: {
    puntos: null,
    comentarios: {},
    puntaje,
    evaluadaPor: PROFE,
    evaluadaEn: en,
  },
});

describe("notaIndividualVigente", () => {
  test("la individual evaluada más reciente, con la base vigente (D013)", () => {
    const a = { cedula: "1111111", base: 15 };
    const nota = notaIndividualVigente(a, [
      evaluada("1111111", 20, 1),
      evaluada("1111111", 16, 5),
      evaluada("2222222", 10, 9),
      evaluada("eq-1", 4, 9, "grupal"),
    ]);
    expect(nota).toBe(12); // 16 × 15 / 20
  });

  test("sin individual evaluada: Pendiente (D003)", () => {
    expect(
      notaIndividualVigente({ cedula: "1111111", base: 20 }, []),
    ).toBeNull();
  });
});

describe("filasAlumnos", () => {
  const equipos: Array<{ id: string } & Equipo> = [
    {
      id: "5a-g2",
      nombre: "5A-G2 Repostería",
      seccion: "5A",
      tema: "Repostería",
      capitanId: null,
      logoPath: null,
    },
  ];
  test("solo estudiantes, por sección y nombre, con equipo, puntos y email", () => {
    const filas = filasAlumnos({
      usuarios: [
        usuario("3333333", { nombres: "Zoe", seccion: "5C" }),
        usuario("1111111", { nombres: "María", equipoId: "5a-g2" }),
        usuario("2222222", { nombres: "Ana", base: 15 }),
        usuario(PROFE, { rol: "profesor", seccion: null }),
      ],
      equipos,
      entregas: [],
      rankings: {
        "5A": {
          alumnos: {
            "1111111": {
              nombres: "María",
              apellidos: "X",
              equipoId: "5a-g2",
              estilo: "lorelei",
              puntos: 18.5,
            },
          },
          equipos: {},
          actualizadoEn: 1,
        },
        "5C": null,
      },
      emails: new Map([["2222222", "ana@gmail.com"]]),
    });
    expect(filas.map((f) => f.cedula)).toEqual([
      "2222222",
      "1111111",
      "3333333",
    ]);
    expect(filas[0]).toMatchObject({
      base: 15,
      equipo: null,
      email: "ana@gmail.com",
      puntos: 0,
      nota: null,
      semilla: "s-2222222",
    });
    expect(filas[1]).toMatchObject({
      equipo: "5A-G2 Repostería",
      puntos: 18.5,
      email: null,
    });
  });
});

describe("textos", () => {
  test("cada error dice qué hacer", () => {
    for (const e of ["invalida", "no-existe", "motivo", "red"] as const) {
      expect(errorAlumnoTexto(e).length).toBeGreaterThan(10);
    }
  });

  test("validarEdicion revisa el email solo si viene", () => {
    const base = {
      baseAnterior: 20,
      baseNueva: 20,
      motivo: "",
      nombres: "A",
      apellidos: "B",
    };
    expect(validarEdicion(base)).toEqual({});
    expect(validarEdicion({ ...base, email: "" })).toEqual({});
    expect(validarEdicion({ ...base, email: "x@" })).toEqual({
      email: EMAIL_INVALIDO,
    });
  });
});
