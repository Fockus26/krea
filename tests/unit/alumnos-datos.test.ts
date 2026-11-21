import { describe, expect, test } from "bun:test";
import {
  accionDeEntrega,
  EMAIL_INVALIDO,
  entregaAccionLabel,
  separarEntregas,
  validarEdicion,
} from "@/lib/alumnos";
import {
  armarEdicion,
  type EditarAlumno,
  entregasDeAlumno,
  errorAlumnoTexto,
  filasAlumnos,
  notaGrupalVigente,
  notaIndividualVigente,
  puntajeFinalDe,
  zEditarAlumno,
} from "@/lib/alumnos-datos";
import type { Entrega, Equipo, Usuario } from "@/lib/modelo";

const usuario = (cedula: string, o: Partial<Usuario> = {}): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Fernanda Olga",
  apellidos: "Miranda Montero",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "lorelei", semilla: `s-${cedula}` },
  actualizadoEn: 1,
  ...o,
});

const entrada = (o: Partial<EditarAlumno> = {}): EditarAlumno => ({
  cedula: "45087827",
  nombres: "Fernanda Olga",
  apellidos: "Miranda Montero",
  base: 20,
  motivo: "",
  ...o,
});

const AHORA = Date.UTC(2026, 10, 5, 15);
const PROFE = "45001237";

describe("zEditarAlumno", () => {
  test("recorta nombres y pasa el email a minúsculas", () => {
    const r = zEditarAlumno.parse({
      ...entrada(),
      nombres: "  Fernanda  ",
      email: " Fernanda@Gmail.COM ",
    });
    expect(r.nombres).toBe("Fernanda");
    expect(r.email).toBe("fernanda@gmail.com");
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
  const actual = usuario("45087827");

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
      alumnoId: "45087827",
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
      entrada: entrada({ nombres: "Fernanda" }),
      autorId: PROFE,
      ahora: AHORA,
    });
    if (!r.ok) throw new Error("debía valer");
    expect(r.edicion.usuario?.nombres).toBe("Fernanda");
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
    const nuevo = con("fernanda@gmail.com", null);
    expect(nuevo.ok && nuevo.edicion.email).toBe("fernanda@gmail.com");
    const igual = con("fernanda@gmail.com", "fernanda@gmail.com");
    expect(igual.ok && igual.edicion.email).toBeUndefined();
    const quitar = con("", "fernanda@gmail.com");
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

describe("notaGrupalVigente (D399)", () => {
  const grupal = (
    equipo: string,
    integrantes: string[],
    puntaje: number,
    en: number,
    noParticiparon?: string[],
  ): Entrega => ({
    ...evaluada(equipo, puntaje, en, "grupal"),
    integrantes,
    evaluacion: {
      puntos: null,
      comentarios: {},
      puntaje,
      evaluadaPor: PROFE,
      evaluadaEn: en,
      ...(noParticiparon ? { noParticiparon } : {}),
    },
  });
  const yo = { cedula: "1111111", base: 15 };

  test("la grupal evaluada más reciente, con su base; la individual no cuenta", () => {
    expect(
      notaGrupalVigente(yo, [
        grupal("eq-1", ["1111111", "2222222"], 20, 1),
        grupal("eq-1", ["1111111", "2222222"], 16, 5),
        evaluada("1111111", 20, 9),
      ]),
    ).toBe(12); // 16 × 15 / 20
  });

  test("«No participó» queda con la nota mínima (D365)", () => {
    expect(
      notaGrupalVigente(yo, [
        grupal("eq-1", ["1111111", "2222222"], 20, 1, ["1111111"]),
      ]),
    ).toBe(1);
  });

  test("movido de equipo: la nota se queda con el equipo con el que entregó (D221)", () => {
    const vieja = grupal("eq-1", ["1111111", "2222222"], 18, 1);
    expect(notaGrupalVigente({ cedula: "1111111", base: 20 }, [vieja])).toBe(
      18,
    );
    // Quien entró después al equipo no recibe la nota de esa entrega
    expect(
      notaGrupalVigente({ cedula: "3333333", base: 20 }, [vieja]),
    ).toBeNull();
  });

  test("sin grupal evaluada, o solo entregada: Pendiente (D003)", () => {
    expect(notaGrupalVigente(yo, [])).toBeNull();
    expect(
      notaGrupalVigente(yo, [
        {
          ...grupal("eq-1", ["1111111"], 10, 1),
          estado: "entregada",
          evaluacion: null,
        },
      ]),
    ).toBeNull();
  });

  test("filasAlumnos trae notaGrupal junto a la individual", () => {
    const [f] = filasAlumnos({
      usuarios: [usuario("1111111", { base: 15 })],
      equipos: [],
      entregas: [
        grupal("eq-1", ["1111111"], 16, 5),
        evaluada("1111111", 20, 9),
      ],
      rankings: { "5A": null },
      emails: new Map(),
    });
    expect(f).toMatchObject({ nota: 15, notaGrupal: 12 });
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
        usuario("1111111", { nombres: "Juana", equipoId: "5a-g2" }),
        usuario("2222222", { nombres: "Adela", base: 15 }),
        usuario(PROFE, { rol: "profesor", seccion: null }),
      ],
      equipos,
      entregas: [],
      rankings: {
        "5A": {
          alumnos: {
            "1111111": {
              nombres: "Juana",
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
      emails: new Map([["2222222", "adela@gmail.com"]]),
    });
    expect(filas.map((f) => f.cedula)).toEqual([
      "2222222",
      "1111111",
      "3333333",
    ]);
    expect(filas[0]).toMatchObject({
      base: 15,
      equipo: null,
      email: "adela@gmail.com",
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

describe("entregasDeAlumno", () => {
  test("las suyas con id y tarea viva, la más reciente primero, con nota o Pendiente", () => {
    const yo = { cedula: "1111111", base: 15 };
    const titulos = new Map([
      ["t-1", "Identidad de marca"],
      ["t-5", "Logo"],
      ["t-7", "Afiche"],
    ]);
    const pendiente: Entrega & { id: string } = {
      ...evaluada("1111111", 0, 7),
      id: "t-7__1111111",
      estado: "entregada",
      evaluacion: null,
    };
    const borrador: Entrega & { id: string } = {
      ...pendiente,
      id: "t-5__1111111",
      tareaId: "t-5",
      estado: "borrador",
    };
    expect(
      entregasDeAlumno(
        yo,
        [
          { ...evaluada("1111111", 20, 1), id: "t-1__1111111" },
          pendiente,
          borrador,
          // Sin id (ejemplo), de otro alumno o de una tarea que ya no existe: fuera
          evaluada("1111111", 10, 5),
          { ...evaluada("2222222", 10, 1), id: "t-1__2222222" },
          { ...evaluada("1111111", 10, 9), id: "t-9__1111111" },
        ],
        titulos,
      ),
    ).toEqual([
      {
        id: "t-7__1111111",
        titulo: "Afiche",
        tipo: "individual",
        nota: null,
        puntaje: null,
        estado: "entregada",
        noParticipo: false,
      },
      {
        id: "t-1__1111111",
        titulo: "Identidad de marca",
        tipo: "individual",
        nota: 15,
        puntaje: 20,
        estado: "evaluada",
        noParticipo: false,
      },
    ]);
  });
});

describe("puntajeFinalDe", () => {
  test("el puntaje de su entrega evaluada; sin ella, sin nota", () => {
    const t = { id: "identidad-de-marca", titulo: "Identidad de marca" };
    const evaluada = {
      tareaId: t.id,
      tipo: "individual",
      titularId: "1111111",
      seccion: "5A",
      integrantes: ["1111111"],
      estado: "evaluada",
      respuestas: {},
      enviadaPor: null,
      enviadaEn: null,
      evaluacion: {
        puntos: null,
        comentarios: {},
        puntaje: 17.5,
        evaluadaPor: "45001237",
        evaluadaEn: 1,
      },
    } satisfies Entrega;
    expect(puntajeFinalDe("1111111", t, [evaluada])).toEqual({
      titulo: "Identidad de marca",
      puntaje: 17.5,
    });
    expect(puntajeFinalDe("2222222", t, [evaluada]).puntaje).toBeNull();
  });
});

describe("ficha: individuales y grupales (D400, D401)", () => {
  const e = (
    id: string,
    tipo: "individual" | "grupal",
    estado: "entregada" | "evaluada",
  ) => ({
    id,
    titulo: id,
    tipo,
    nota: estado === "evaluada" ? 15 : null,
    puntaje: estado === "evaluada" ? 15 : null,
    estado,
    noParticipo: false,
  });

  test("separa por tipo y conserva el orden", () => {
    const r = separarEntregas([
      e("a", "grupal", "evaluada"),
      e("b", "individual", "entregada"),
      e("c", "grupal", "entregada"),
    ]);
    expect(r.individuales.map((x) => x.id)).toEqual(["b"]);
    expect(r.grupales.map((x) => x.id)).toEqual(["a", "c"]);
  });

  test("Corregir si está evaluada, Evaluar si no", () => {
    expect(accionDeEntrega({ estado: "evaluada" })).toBe("corregir");
    expect(accionDeEntrega({ estado: "entregada" })).toBe("evaluar");
    expect(entregaAccionLabel("corregir", "Logo")).toBe(
      "Corregir la entrega de Logo",
    );
  });
});
