import { describe, expect, test } from "bun:test";
import { zCatalogoSecciones, zDecisionesPremio, zSeccion } from "@/lib/modelo";
import {
  agregarAnio,
  agregarSeccion,
  anioDoc,
  aplicarOperacion,
  CATALOGO_INICIAL,
  type CatalogoSecciones,
  catalogoDeDocumento,
  codigoSeccion,
  codigosQueSeVan,
  errorSeccionesTexto,
  esCodigoSeccion,
  filasSecciones,
  letrasLibres,
  listaSecciones,
  nombreAnio,
  normalizarCatalogo,
  numerosLibres,
  ordenarSecciones,
  partesSeccion,
  quitarAnio,
  quitarSeccion,
  renombrarAnio,
  renombrarSeccion,
  resumenCatalogo,
  seccionDeSlug,
  seccionesDe,
  seccionesDelAnio,
  seccionVacia,
  slugSeccion,
  sumarUso,
  USO_VACIO,
  usoDe,
  usoPorSeccion,
  usoTexto,
} from "@/lib/secciones";

const CAT: CatalogoSecciones = [
  { numero: 4, letras: ["B"] },
  { numero: 5, letras: ["A", "C"] },
];

const catalogo = (r: ReturnType<typeof agregarAnio>) => {
  if (!r.ok) throw new Error(r.error);
  return r.catalogo;
};

describe("códigos (D317)", () => {
  test("código = número de año + letra, y vuelta", () => {
    expect(codigoSeccion(5, "A")).toBe("5A");
    expect(partesSeccion("4B")).toEqual({ numero: 4, letra: "B" });
    for (const malo of ["5", "AA", "0A", "5a", "10A", "5AB", ""]) {
      expect(partesSeccion(malo)).toBeNull();
      expect(esCodigoSeccion(malo)).toBe(false);
    }
    expect(esCodigoSeccion("9Z")).toBe(true);
    expect(esCodigoSeccion(5)).toBe(false);
    expect(esCodigoSeccion(null)).toBe(false);
  });

  test("zSeccion valida la forma: 5B vale; 5, AA, 0A y 5a no", () => {
    expect(zSeccion.safeParse("5B").success).toBe(true);
    for (const malo of ["5", "AA", "0A", "5a", "5 A"]) {
      expect(zSeccion.safeParse(malo).success).toBe(false);
    }
  });

  test("nombre del año y slugs", () => {
    expect(nombreAnio(5)).toBe("5.º año");
    expect(slugSeccion("5A")).toBe("5a");
    expect(seccionDeSlug("5a", CAT)).toBe("5A");
    expect(seccionDeSlug("4b", CAT)).toBe("4B");
    // Solo si existe en el catálogo, y solo el slug en minúscula
    expect(seccionDeSlug("5b", CAT)).toBeNull();
    expect(seccionDeSlug("5A", CAT)).toBeNull();
    expect(seccionDeSlug("x", CAT)).toBeNull();
  });

  test("seccionesDe: planas y ordenadas por año y letra", () => {
    expect(seccionesDe(CATALOGO_INICIAL)).toEqual(["5A", "5C"]);
    expect(
      seccionesDe([
        { numero: 5, letras: ["C", "A"] },
        { numero: 4, letras: ["B"] },
      ]),
    ).toEqual(["4B", "5A", "5C"]);
    expect(seccionesDe([])).toEqual([]);
  });

  test("ordenar y listar", () => {
    expect(ordenarSecciones(["5C", "4B", "5A", "5C"])).toEqual([
      "4B",
      "5A",
      "5C",
    ]);
    expect(listaSecciones(["5C", "4B", "5A"])).toBe("4B, 5A y 5C");
    expect(listaSecciones(["5C", "5A"])).toBe("5A y 5C");
    expect(listaSecciones(["5A"])).toBe("5A");
    expect(listaSecciones([])).toBe("");
  });
});

describe("transformar el catálogo", () => {
  test("agregar año: ordenado, con letras o sin ninguna", () => {
    const c = catalogo(agregarAnio(CATALOGO_INICIAL, 4, ["B", "A"]));
    expect(c).toEqual([
      { numero: 4, letras: ["A", "B"] },
      { numero: 5, letras: ["A", "C"] },
    ]);
    expect(catalogo(agregarAnio([], 1))).toEqual([{ numero: 1, letras: [] }]);
  });

  test("agregar año repetido, fuera de rango o con letras malas o repetidas → error", () => {
    expect(agregarAnio(CAT, 5)).toEqual({ ok: false, error: "existe-anio" });
    expect(agregarAnio(CAT, 0)).toEqual({ ok: false, error: "invalida" });
    expect(agregarAnio(CAT, 10)).toEqual({ ok: false, error: "invalida" });
    expect(agregarAnio(CAT, 2.5)).toEqual({ ok: false, error: "invalida" });
    expect(agregarAnio(CAT, 3, ["a"])).toEqual({
      ok: false,
      error: "invalida",
    });
    expect(agregarAnio(CAT, 3, ["A", "A"])).toEqual({
      ok: false,
      error: "invalida",
    });
  });

  test("renombrar año: mueve sus letras; el destino no puede existir", () => {
    expect(catalogo(renombrarAnio(CAT, 4, 3))).toEqual([
      { numero: 3, letras: ["B"] },
      { numero: 5, letras: ["A", "C"] },
    ]);
    expect(catalogo(renombrarAnio(CAT, 5, 6))[1]).toEqual({
      numero: 6,
      letras: ["A", "C"],
    });
    expect(renombrarAnio(CAT, 4, 5)).toEqual({
      ok: false,
      error: "existe-anio",
    });
    expect(renombrarAnio(CAT, 2, 3)).toEqual({ ok: false, error: "no-existe" });
    expect(catalogo(renombrarAnio(CAT, 4, 4))).toEqual(CAT);
  });

  test("quitar año", () => {
    expect(catalogo(quitarAnio(CAT, 4))).toEqual([
      { numero: 5, letras: ["A", "C"] },
    ]);
    expect(catalogo(quitarAnio(CATALOGO_INICIAL, 5))).toEqual([]);
    expect(quitarAnio(CAT, 1)).toEqual({ ok: false, error: "no-existe" });
  });

  test("agregar sección: letra sin usar en un año que existe", () => {
    expect(catalogo(agregarSeccion(CAT, 5, "B"))[1]).toEqual({
      numero: 5,
      letras: ["A", "B", "C"],
    });
    expect(agregarSeccion(CAT, 5, "A")).toEqual({
      ok: false,
      error: "existe-seccion",
    });
    expect(agregarSeccion(CAT, 3, "A")).toEqual({
      ok: false,
      error: "no-existe",
    });
    expect(agregarSeccion(CAT, 5, "AB")).toEqual({
      ok: false,
      error: "invalida",
    });
  });

  test("renombrar sección: cambia la letra dentro de su año", () => {
    expect(catalogo(renombrarSeccion(CAT, "4B", "D"))[0]).toEqual({
      numero: 4,
      letras: ["D"],
    });
    expect(catalogo(renombrarSeccion(CAT, "5C", "B"))[1]).toEqual({
      numero: 5,
      letras: ["A", "B"],
    });
    expect(renombrarSeccion(CAT, "5A", "C")).toEqual({
      ok: false,
      error: "existe-seccion",
    });
    expect(renombrarSeccion(CAT, "5B", "D")).toEqual({
      ok: false,
      error: "no-existe",
    });
    expect(renombrarSeccion(CAT, "5a", "D")).toEqual({
      ok: false,
      error: "invalida",
    });
    expect(catalogo(renombrarSeccion(CAT, "5A", "A"))).toEqual(CAT);
  });

  test("quitar sección: el año se queda aunque quede sin secciones", () => {
    expect(catalogo(quitarSeccion(CAT, "4B"))[0]).toEqual({
      numero: 4,
      letras: [],
    });
    expect(quitarSeccion(CAT, "4C")).toEqual({ ok: false, error: "no-existe" });
  });

  test("normalizar: ordena, une años repetidos y quita lo que no vale", () => {
    expect(
      normalizarCatalogo([
        { numero: 5, letras: ["C", "A", "C"] },
        { numero: 0, letras: ["A"] },
        { numero: 5, letras: ["B", "x"] },
        { numero: 2, letras: [] },
      ]),
    ).toEqual([
      { numero: 2, letras: [] },
      { numero: 5, letras: ["A", "B", "C"] },
    ]);
  });

  test("libres: números y letras sin usar", () => {
    expect(numerosLibres(CAT)).toEqual([1, 2, 3, 6, 7, 8, 9]);
    expect(letrasLibres(CAT, 5)).toHaveLength(24);
    expect(letrasLibres(CAT, 5)).not.toContain("A");
    expect(letrasLibres(CAT, 1)).toHaveLength(26);
    expect(seccionesDelAnio(CAT, 5)).toEqual(["5A", "5C"]);
    expect(seccionesDelAnio(CAT, 1)).toEqual([]);
  });

  test("límites: 9 años y 26 letras", () => {
    let c: CatalogoSecciones = [];
    for (let n = 1; n <= 9; n++) c = catalogo(agregarAnio(c, n));
    expect(c).toHaveLength(9);
    expect(numerosLibres(c)).toEqual([]);
    let d: CatalogoSecciones = [{ numero: 1, letras: [] }];
    for (const l of letrasLibres(d, 1)) d = catalogo(agregarSeccion(d, 1, l));
    expect(d[0]?.letras).toHaveLength(26);
    expect(letrasLibres(d, 1)).toEqual([]);
  });
});

describe("operaciones de la pantalla (D318)", () => {
  test("aplicarOperacion delega en cada transformación", () => {
    expect(
      catalogo(
        aplicarOperacion(CAT, { tipo: "crearSeccion", numero: 4, letra: "A" }),
      )[0],
    ).toEqual({ numero: 4, letras: ["A", "B"] });
    expect(aplicarOperacion(CAT, { tipo: "eliminarAnio", numero: 7 })).toEqual({
      ok: false,
      error: "no-existe",
    });
  });

  test("códigos que se van: los que hay que comprobar vacíos y cuyo ranking se borra", () => {
    expect(
      codigosQueSeVan(CAT, { tipo: "crearAnio", numero: 1, letras: ["A"] }),
    ).toEqual([]);
    expect(
      codigosQueSeVan(CAT, { tipo: "crearSeccion", numero: 5, letra: "B" }),
    ).toEqual([]);
    expect(codigosQueSeVan(CAT, { tipo: "editarAnio", de: 5, a: 6 })).toEqual([
      "5A",
      "5C",
    ]);
    expect(codigosQueSeVan(CAT, { tipo: "editarAnio", de: 5, a: 5 })).toEqual(
      [],
    );
    expect(codigosQueSeVan(CAT, { tipo: "eliminarAnio", numero: 4 })).toEqual([
      "4B",
    ]);
    expect(
      codigosQueSeVan(CAT, { tipo: "editarSeccion", codigo: "4B", letra: "D" }),
    ).toEqual(["4B"]);
    expect(
      codigosQueSeVan(CAT, { tipo: "editarSeccion", codigo: "4B", letra: "B" }),
    ).toEqual([]);
    expect(
      codigosQueSeVan(CAT, { tipo: "eliminarSeccion", codigo: "5C" }),
    ).toEqual(["5C"]);
  });

  test("documento: ausente = inicial, `anios: []` = sin secciones, inválido = null", () => {
    expect(catalogoDeDocumento(false, undefined)).toBe(CATALOGO_INICIAL);
    expect(catalogoDeDocumento(true, { anios: [], actualizadoEn: 1 })).toEqual(
      [],
    );
    expect(
      catalogoDeDocumento(true, {
        anios: [{ numero: 5, letras: ["C", "A"] }],
        actualizadoEn: 1,
      }),
    ).toEqual([{ numero: 5, letras: ["A", "C"] }]);
    expect(catalogoDeDocumento(true, { anios: "5A" })).toBeNull();
    expect(anioDoc([{ numero: 5, letras: ["C", "A"] }])).toEqual([
      { numero: 5, letras: ["A", "C"] },
    ]);
  });

  test("filas de la pantalla: uso por sección y por año; resumen", () => {
    const usos = usoPorSeccion({
      usuarios: [{ rol: "estudiante", seccion: "5A" }],
      equipos: [],
      tareas: [],
      entregas: [],
      ajustes: [],
    });
    const filas = filasSecciones(CAT, usos);
    expect(filas.map((f) => f.nombre)).toEqual(["4.º año", "5.º año"]);
    expect(filas[0]?.vacio).toBe(true);
    expect(filas[1]?.vacio).toBe(false);
    expect(filas[1]?.secciones.map((s) => [s.codigo, s.vacia])).toEqual([
      ["5A", false],
      ["5C", true],
    ]);
    expect(filas[1]?.uso.alumnos).toBe(1);
    expect(filasSecciones([{ numero: 2, letras: [] }], usos)[0]).toEqual({
      numero: 2,
      nombre: "2.º año",
      secciones: [],
      uso: USO_VACIO,
      vacio: true,
    });
    expect(resumenCatalogo(CAT)).toBe("2 años · 3 secciones");
    expect(resumenCatalogo([{ numero: 5, letras: ["A"] }])).toBe(
      "1 año · 1 sección",
    );
    expect(resumenCatalogo([])).toBe("0 años · 0 secciones");
  });
});

describe("documento config/secciones", () => {
  test("válido, vacío, y con años o letras repetidos", () => {
    expect(
      zCatalogoSecciones.safeParse({ anios: CAT, actualizadoEn: 1 }).success,
    ).toBe(true);
    expect(
      zCatalogoSecciones.safeParse({ anios: [], actualizadoEn: 1 }).success,
    ).toBe(true);
    expect(
      zCatalogoSecciones.safeParse({
        anios: [
          { numero: 5, letras: ["A"] },
          { numero: 5, letras: ["B"] },
        ],
        actualizadoEn: 1,
      }).success,
    ).toBe(false);
    expect(
      zCatalogoSecciones.safeParse({
        anios: [{ numero: 5, letras: ["A", "A"] }],
        actualizadoEn: 1,
      }).success,
    ).toBe(false);
    expect(
      zCatalogoSecciones.safeParse({
        anios: [{ numero: 10, letras: [] }],
        actualizadoEn: 1,
      }).success,
    ).toBe(false);
  });

  test("decisionesPremio por registro (D320): lee lo guardado y rechaza claves malas", () => {
    const d = zDecisionesPremio.parse({
      "5C": { tipo: "dar", equipoId: "g2" },
    });
    expect(d["5C"]).toEqual({ tipo: "dar", equipoId: "g2" });
    expect(d["5A"]).toBeUndefined();
    expect(
      zDecisionesPremio.safeParse({ "4B": { tipo: "compartir" } }).success,
    ).toBe(true);
    expect(
      zDecisionesPremio.safeParse({ "5a": { tipo: "compartir" } }).success,
    ).toBe(false);
  });
});

describe("uso de una sección (D318)", () => {
  const datos = {
    usuarios: [
      { rol: "estudiante", seccion: "5A" },
      { rol: "estudiante", seccion: "5A" },
      { rol: "profesor", seccion: "5C" },
      { rol: "profesor", seccion: null },
    ],
    equipos: [{ seccion: "5A" }],
    tareas: [{ secciones: ["5A", "5C"] }, { secciones: ["5A"] }],
    entregas: [{ seccion: "5A" }],
    ajustes: [{ seccion: "5C" }],
  };

  test("usoPorSeccion cuenta alumnos, profes asignados, equipos, tareas, entregas y ajustes", () => {
    const usos = usoPorSeccion(datos);
    expect(usoDe(usos, "5A")).toEqual({
      alumnos: 2,
      profesores: 0,
      equipos: 1,
      tareas: 2,
      entregas: 1,
      ajustes: 0,
    });
    expect(usoDe(usos, "5C")).toEqual({
      ...USO_VACIO,
      profesores: 1,
      tareas: 1,
      ajustes: 1,
    });
    expect(usoDe(usos, "4B")).toEqual(USO_VACIO);
  });

  test("vacía solo con todo en 0", () => {
    expect(seccionVacia(USO_VACIO)).toBe(true);
    expect(seccionVacia({ ...USO_VACIO, ajustes: 1 })).toBe(false);
    expect(seccionVacia({ ...USO_VACIO, profesores: 1 })).toBe(false);
  });

  test("usoTexto en singular y plural", () => {
    expect(usoTexto({ ...USO_VACIO, alumnos: 12, equipos: 3, tareas: 2 })).toBe(
      "Tiene 12 alumnos, 3 equipos y 2 tareas",
    );
    expect(usoTexto({ ...USO_VACIO, tareas: 1 })).toBe("Tiene 1 tarea");
    expect(usoTexto({ ...USO_VACIO, profesores: 1, ajustes: 2 })).toBe(
      "Tiene 1 profe asignado y 2 ajustes de puntos",
    );
    expect(usoTexto(USO_VACIO)).toBe("Sin alumnos, equipos ni tareas");
  });

  test("sumar el uso de las secciones de un año", () => {
    const usos = usoPorSeccion(datos);
    expect(sumarUso([usoDe(usos, "5A"), usoDe(usos, "5C")]).tareas).toBe(3);
    expect(sumarUso([])).toEqual(USO_VACIO);
  });

  test("errores con texto", () => {
    expect(errorSeccionesTexto("existe-seccion", "5A")).toBe("Ya existe 5A.");
    expect(errorSeccionesTexto("existe-anio", "4.º año")).toBe(
      "Ya existe 4.º año.",
    );
    expect(errorSeccionesTexto("con-datos")).toContain("no se puede");
  });
});
