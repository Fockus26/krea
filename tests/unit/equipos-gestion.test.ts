import { describe, expect, test } from "bun:test";
import { equiposProfeDatos } from "@/lib/equipos-datos";
import {
  bloqueoEliminar,
  bloqueoTexto,
  equipoNuevo,
  nombreRepetido,
  validarEquipo,
  zCrearEquipo,
  zEditarEquipo,
} from "@/lib/equipos-gestion";

describe("crear y editar equipo (D270)", () => {
  test("tema vacío = sin tema; el nombre se recorta y es obligatorio", () => {
    const d = zCrearEquipo.parse({
      nombre: "  Repostería ",
      tema: "  ",
      seccion: "5A",
    });
    expect(d).toEqual({ nombre: "Repostería", tema: null, seccion: "5A" });
    expect(
      zCrearEquipo.safeParse({ nombre: " ", tema: "", seccion: "5A" }).success,
    ).toBe(false);
    expect(
      zEditarEquipo.safeParse({ equipoId: "a/b", nombre: "X", tema: "" })
        .success,
    ).toBe(false);
  });

  test("un equipo nuevo nace sin capitán ni logo", () => {
    expect(
      equipoNuevo({ nombre: "Cerámica", tema: "Barro", seccion: "5C" }),
    ).toEqual({
      nombre: "Cerámica",
      seccion: "5C",
      tema: "Barro",
      capitanId: null,
      logoPath: null,
    });
  });

  test("nombre repetido en la sección sin mirar mayúsculas, tildes ni espacios", () => {
    const eqs = [
      { id: "a", nombre: "Repostería", seccion: "5A" as const },
      { id: "b", nombre: "Cerámica", seccion: "5C" as const },
    ];
    expect(nombreRepetido("reposteria", eqs, "5A")).toBe(true);
    expect(nombreRepetido("  REPOSTERÍA  ", eqs, "5A")).toBe(true);
    expect(nombreRepetido("Repostería", eqs, "5C")).toBe(false);
    // Al renombrar, su propio nombre no cuenta
    expect(nombreRepetido("Repostería", eqs, "5A", "a")).toBe(false);
  });

  test("validación del cliente", () => {
    expect(validarEquipo({ nombre: "", tema: "" }).nombre).toBeDefined();
    expect(
      validarEquipo({ nombre: "X", tema: "t".repeat(61) }).tema,
    ).toBeDefined();
    expect(validarEquipo({ nombre: "X", tema: "" })).toEqual({});
  });
});

describe("eliminar equipo (D271)", () => {
  test("solo vacío, sin entregas grupales ni ajustes; dice por qué", () => {
    expect(bloqueoEliminar({ integrantes: 0, entregas: 0, ajustes: 0 })).toBe(
      null,
    );
    const b = bloqueoEliminar({ integrantes: 3, entregas: 2, ajustes: 1 });
    expect(b).toEqual({ motivo: "integrantes", n: 3 });
    expect(bloqueoTexto({ motivo: "integrantes", n: 1 })).toContain(
      "1 integrante.",
    );
    expect(
      bloqueoEliminar({ integrantes: 0, entregas: 1, ajustes: 4 }),
    ).toEqual({ motivo: "entregas", n: 1 });
    expect(bloqueoTexto({ motivo: "ajustes", n: 2 })).toContain("2 ajustes");
  });

  test("el tablero cuenta entregas grupales y ajustes de cada equipo", () => {
    const d = equiposProfeDatos("5A", {
      usuarios: [],
      equipos: [
        {
          id: "eq",
          nombre: "Repostería",
          seccion: "5A",
          tema: null,
          capitanId: null,
          logoPath: null,
        },
      ],
      ranking: null,
      entregas: [
        { tipo: "grupal", titularId: "eq" },
        { tipo: "individual", titularId: "eq" },
      ],
      ajustes: [
        { destino: "equipo", destinoId: "eq" },
        { destino: "alumno", destinoId: "eq" },
      ],
    });
    expect(d.equipos[0]?.conDatos).toEqual({ entregas: 1, ajustes: 1 });
    // Sin entregas ni ajustes (vista previa) no hay recuento
    const sin = equiposProfeDatos("5A", {
      usuarios: [],
      equipos: [],
      ranking: null,
    });
    expect(sin.equipos).toEqual([]);
  });
});
