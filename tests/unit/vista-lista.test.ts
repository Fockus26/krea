import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { consecuenciasTexto, sumarConsecuencias } from "@/lib/equipos-gestion";
import {
  eliminarTareaDescripcion,
  fechaTareaTexto,
  SIN_PERDIDA,
  sumarPerdidas,
  type TareaProfe,
} from "@/lib/tareas-profe";
import {
  CLAVE_VISTA_EQUIPOS,
  CLAVE_VISTA_TAREAS,
  VISTA_INICIAL,
  vistaDe,
} from "@/lib/vista";

describe("vistaDe (D313)", () => {
  test("solo «tarjetas» o «lista»; lo demás es Tarjetas", () => {
    expect(vistaDe("lista")).toBe("lista");
    expect(vistaDe("tarjetas")).toBe("tarjetas");
    for (const v of [null, undefined, "", "Lista", "tabla", "1", 1, {}])
      expect(vistaDe(v)).toBe("tarjetas");
    expect(VISTA_INICIAL).toBe("tarjetas");
  });
  test("una clave por pantalla", () => {
    expect(CLAVE_VISTA_TAREAS).toBe("krea.vista.tareas");
    expect(CLAVE_VISTA_EQUIPOS).toBe("krea.vista.equipos");
  });
});

describe("pérdida de varias tareas (D314)", () => {
  test("suma notas y entregas sin evaluar y une las secciones en orden", () => {
    expect(
      sumarPerdidas([
        { notas: 3, sinEvaluar: 1, secciones: ["5C"] },
        { notas: 0, sinEvaluar: 2, secciones: [] },
        { notas: 4, sinEvaluar: 0, secciones: ["5A", "5C"] },
      ]),
    ).toEqual({ notas: 7, sinEvaluar: 3, secciones: ["5A", "5C"] });
    expect(sumarPerdidas([])).toEqual(SIN_PERDIDA);
  });
  test("si una no trae su pérdida, no se cuenta de menos", () => {
    expect(sumarPerdidas([SIN_PERDIDA, undefined])).toBeUndefined();
  });
  test("texto del lote", () => {
    expect(
      eliminarTareaDescripcion(
        sumarPerdidas([
          { notas: 3, sinEvaluar: 1, secciones: ["5C"] },
          { notas: 2, sinEvaluar: 0, secciones: ["5A"] },
        ]),
        true,
      ),
    ).toBe(
      "Se borrarán 5 notas de 5A y 5C y 1 entrega sin evaluar. Los puntos del ranking se recalculan. Esto no se puede deshacer.",
    );
    expect(eliminarTareaDescripcion(SIN_PERDIDA, true)).toBe(
      "Todavía no tienen entregas: nadie pierde notas ni puntos. Esto no se puede deshacer.",
    );
    // La de una no cambia
    expect(eliminarTareaDescripcion(SIN_PERDIDA)).toMatch(
      /^Todavía no tiene entregas/,
    );
    expect(eliminarTareaDescripcion(undefined, true)).toMatch(
      /^Se borrarán sus entregas/,
    );
  });
});

describe("consecuencias de varios equipos (D315)", () => {
  test("suma cada recuento", () => {
    expect(
      sumarConsecuencias([
        { integrantes: 4, entregas: 1, ajustes: 0 },
        { integrantes: 0, entregas: 2, ajustes: 3 },
      ]),
    ).toEqual({ integrantes: 4, entregas: 3, ajustes: 3 });
    expect(sumarConsecuencias([])).toEqual({
      integrantes: 0,
      entregas: 0,
      ajustes: 0,
    });
  });
  test("texto del lote en plural", () => {
    expect(
      consecuenciasTexto({ integrantes: 5, entregas: 2, ajustes: 1 }, true),
    ).toBe(
      "Tienen 5 integrantes, 2 entregas grupales y 1 ajuste: los integrantes quedan sin equipo, las notas se quedan con cada alumno y el ajuste se borra. Se borran también sus logos. No se puede deshacer.",
    );
    expect(
      consecuenciasTexto({ integrantes: 0, entregas: 0, ajustes: 0 }, true),
    ).toMatch(/^No tienen integrantes/);
    // La de uno no cambia
    expect(
      consecuenciasTexto({ integrantes: 0, entregas: 0, ajustes: 0 }),
    ).toMatch(/^No tiene integrantes.*Se borra también su logo/);
  });
});

describe("columna Fecha de la Lista (D313)", () => {
  const t = (o: Partial<TareaProfe>): TareaProfe => ({
    id: "a",
    titulo: "Plan",
    tipo: "grupal",
    estado: "abierta",
    fecha: "2026-11-10",
    premio: null,
    preguntas: 2,
    suma: 20,
    avance: null,
    porEvaluar: 0,
    ...o,
  });
  // Mediodía de Caracas (UTC−4) del día dado
  const mediodia = (d: number) => Date.UTC(2026, 10, d, 16);
  test("vence / venció / fecha / sin fecha", () => {
    expect(fechaTareaTexto(t({}), mediodia(7))).toBe("Vence 10/11/2026");
    expect(fechaTareaTexto(t({}), mediodia(11))).toBe("Venció 10/11/2026");
    expect(fechaTareaTexto(t({ estado: "evaluada" }), mediodia(11))).toBe(
      "10/11/2026",
    );
    expect(
      fechaTareaTexto(t({ estado: "borrador", fecha: null }), mediodia(7)),
    ).toBe("Sin fecha");
  });
});

describe("servidor en lote (D314, D315)", () => {
  const leer = (f: string) => readFileSync(f, "utf8");
  const desde = (codigo: string, marca: string) =>
    codigo.slice(codigo.indexOf(marca));
  test("tareas: sesión, validación, reutiliza el borrado de una y refresca", () => {
    const lote = desde(
      leer("lib/acciones/tareas.ts"),
      "export async function eliminarTareas",
    );
    expect(lote).toMatch(/await exigirSesion\("profesor"\)/);
    expect(lote).toContain("zIdsLote(zIdTareaProfe).safeParse");
    expect(lote).toContain("borrarUnaTarea(db, id)");
    expect(lote).toContain('r.error === "no-existe" ? { ok: true }');
    expect(lote).toContain("refresh()");
  });
  test("equipos: una transacción por equipo con la regla de D307", () => {
    const codigo = leer("lib/acciones/equipos.ts");
    const lote = desde(codigo, "export async function eliminarEquipos");
    expect(lote).toMatch(/await exigirSesion\("profesor"\)/);
    expect(lote).toContain("zIdsLote(zIdDocumento).safeParse");
    expect(lote).toContain("borrarUnEquipo(db, id)");
    expect(lote).toContain('r.error === "no-existe" ? { ok: true }');
    expect(lote).toContain("refresh()");
    // La transacción la abre el borrado de uno, no el lote
    const soloLote = lote.slice(
      0,
      lote.indexOf("async function borrarUnEquipo"),
    );
    expect(soloLote).not.toContain("eliminarEquipoEnTransaccion");
    expect(desde(codigo, "async function borrarUnEquipo")).toContain(
      "eliminarEquipoEnTransaccion(db, id,",
    );
  });
});
