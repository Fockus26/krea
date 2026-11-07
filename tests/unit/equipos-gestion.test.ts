import { describe, expect, test } from "bun:test";
import { equiposProfeDatos } from "@/lib/equipos-datos";
import {
  consecuenciasEliminar,
  consecuenciasTexto,
  equipoNuevo,
  escriturasEliminarEquipo,
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

describe("eliminar equipo (D307)", () => {
  test("siempre se puede: los recuentos se normalizan", () => {
    expect(
      consecuenciasEliminar({ integrantes: 3, entregas: 2, ajustes: 1 }),
    ).toEqual({ integrantes: 3, entregas: 2, ajustes: 1 });
    expect(
      consecuenciasEliminar({
        integrantes: -1,
        entregas: Number.NaN,
        ajustes: 2.7,
      }),
    ).toEqual({ integrantes: 0, entregas: 0, ajustes: 2 });
  });

  test("el texto dice qué tiene y qué pasa con cada cosa, con números", () => {
    expect(
      consecuenciasTexto({ integrantes: 3, entregas: 2, ajustes: 1 }),
    ).toBe(
      "Tiene 3 integrantes, 2 entregas grupales y 1 ajuste: los integrantes quedan sin equipo, las notas se quedan con cada alumno y el ajuste se borra. Se borra también su logo. No se puede deshacer.",
    );
    expect(
      consecuenciasTexto({ integrantes: 1, entregas: 0, ajustes: 4 }),
    ).toBe(
      "Tiene 1 integrante y 4 ajustes: el integrante queda sin equipo y los ajustes se borran. Se borra también su logo. No se puede deshacer.",
    );
    expect(
      consecuenciasTexto({ integrantes: 0, entregas: 1, ajustes: 0 }),
    ).toStartWith("Tiene 1 entrega grupal: la nota se queda con cada alumno.");
    expect(
      consecuenciasTexto({ integrantes: 0, entregas: 0, ajustes: 0 }),
    ).toStartWith("No tiene integrantes, entregas grupales ni ajustes");
  });

  test("escrituras: un perfil, una entrega y un ajuste cada uno, más el equipo y el ranking", () => {
    expect(
      escriturasEliminarEquipo({ integrantes: 3, entregas: 2, ajustes: 1 }),
    ).toBe(8);
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
