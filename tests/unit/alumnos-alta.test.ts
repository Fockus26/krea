import { describe, expect, test } from "bun:test";
import {
  borradoTexto,
  cabeEnTransaccion,
  capitaniaTexto,
  equiposDeSeccion,
  escriturasBorrado,
  planBorradoAlumno,
  sinNotaTexto,
  validarAlumnoNuevo,
  zCrearAlumno,
} from "@/lib/alumnos-alta";

const valido = {
  cedula: "31234567",
  nombres: "Ana María",
  apellidos: "Pérez Gil",
  seccion: "5A",
  email: "",
  equipoId: null,
};

describe("zCrearAlumno (D267)", () => {
  test("acepta el formulario y deja el email en minúsculas", () => {
    const d = zCrearAlumno.parse({ ...valido, email: " Ana@Gmail.COM " });
    expect(d.email).toBe("ana@gmail.com");
    expect(d.equipoId).toBeNull();
  });

  test("rechaza nombres en blanco, cédula mala, sección o equipo inválidos", () => {
    expect(zCrearAlumno.safeParse({ ...valido, nombres: "   " }).success).toBe(
      false,
    );
    expect(zCrearAlumno.safeParse({ ...valido, cedula: "12ab" }).success).toBe(
      false,
    );
    expect(zCrearAlumno.safeParse({ ...valido, seccion: "5B" }).success).toBe(
      false,
    );
    expect(
      zCrearAlumno.safeParse({ ...valido, equipoId: "../otro" }).success,
    ).toBe(false);
    expect(zCrearAlumno.safeParse({ ...valido, email: "no-es" }).success).toBe(
      false,
    );
  });

  test("la validación del cliente pide cédula, primer nombre y primer apellido", () => {
    const e = validarAlumnoNuevo({
      cedula: "",
      primerNombre: " ",
      primerApellido: "",
      email: "mal",
    });
    expect(Object.keys(e).sort()).toEqual([
      "apellidos",
      "cedula",
      "email",
      "nombres",
    ]);
    expect(
      validarAlumnoNuevo({
        cedula: "31234567",
        primerNombre: "Ana",
        primerApellido: "Pérez",
        email: "",
      }),
    ).toEqual({});
  });

  test("el selector de equipo ofrece solo los de la sección, por nombre", () => {
    const eqs = [
      { id: "b", nombre: "Repostería", seccion: "5A" as const },
      { id: "c", nombre: "Cerámica", seccion: "5C" as const },
      { id: "a", nombre: "Animación", seccion: "5A" as const },
    ];
    expect(equiposDeSeccion(eqs, "5A").map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("planBorradoAlumno (D268)", () => {
  const C = "31234567";
  const entregas = [
    {
      id: "t1__31234567",
      tipo: "individual",
      titularId: C,
      estado: "evaluada",
    },
    {
      id: "t2__31234567",
      tipo: "individual",
      titularId: C,
      estado: "entregada",
    },
    {
      id: "t1__otro",
      tipo: "individual",
      titularId: "39999999",
      estado: "evaluada",
    },
    { id: "g1__eq", tipo: "grupal", titularId: "eq", estado: "evaluada" },
  ] as const;
  const ajustes = [
    { id: "a1", destino: "alumno", destinoId: C, anulaA: null },
    { id: "a2", destino: "alumno", destinoId: C, anulaA: "a1" },
    { id: "a3", destino: "equipo", destinoId: C, anulaA: null },
    { id: "a4", destino: "alumno", destinoId: "39999999", anulaA: null },
  ] as const;

  test("borra sus individuales y sus ajustes; las grupales no", () => {
    const p = planBorradoAlumno(C, entregas, ajustes);
    expect(p.entregas).toEqual(["t1__31234567", "t2__31234567"]);
    expect(p.ajustes).toEqual(["a1", "a2"]);
    expect(p.notas).toBe(1);
    expect(p.sinNota).toBe(1);
    // La anulación se borra, pero no se cuenta como otro ajuste
    expect(p.ajustesVisibles).toBe(1);
  });

  test("cuenta las escrituras y respeta el tope de 500", () => {
    const p = planBorradoAlumno(C, entregas, ajustes);
    // 2 entregas + 2 ajustes + 1 historial + perfil, privado, recuperación + ranking + 1 equipo
    expect(escriturasBorrado(p, 1, 1)).toBe(10);
    expect(cabeEnTransaccion(500)).toBe(true);
    expect(cabeEnTransaccion(501)).toBe(false);
  });
});

describe("textos del borrado (fila 149)", () => {
  test("dice cuántas notas y ajustes se pierden, con plural", () => {
    expect(borradoTexto({ notas: 3, ajustes: 1 })).toBe(
      "Se borrarán 3 notas individuales y 1 ajuste de puntos.",
    );
    expect(borradoTexto({ notas: 1, ajustes: 0 })).toBe(
      "Se borrarán 1 nota individual y 0 ajustes de puntos.",
    );
    expect(borradoTexto({ notas: 0, ajustes: 0 })).toBe(
      "No tiene notas individuales ni ajustes de puntos.",
    );
  });

  test("entregas sin nota y capitanía, solo cuando aplican", () => {
    expect(sinNotaTexto(0)).toBeNull();
    expect(sinNotaTexto(2)).toBe(
      "También se borran 2 entregas que aún no tienen nota.",
    );
    expect(capitaniaTexto(null)).toBeNull();
    expect(capitaniaTexto({ equipo: "Repostería", sucesor: "Luis Mora" })).toBe(
      "Es capitán de Repostería: el cargo pasa a Luis Mora.",
    );
    expect(capitaniaTexto({ equipo: "Repostería", sucesor: null })).toContain(
      "queda vacío",
    );
  });
});
