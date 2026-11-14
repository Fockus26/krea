import { describe, expect, test } from "bun:test";
import { zCatalogoMotivos } from "@/lib/modelo";
import {
  aplicarOperacionMotivos,
  type CatalogoMotivos,
  catalogoMotivosDeDocumento,
  ETIQUETA_VACIA,
  errorMotivosTexto,
  IDS_RESERVADOS,
  idMotivoNuevo,
  limpiarEtiqueta,
  MOTIVOS_INICIALES,
  MOTIVOS_MAX,
  VALOR_MOTIVO_VACIO,
  validarOpcion,
} from "@/lib/motivos";

const CAT: CatalogoMotivos = [
  { id: "participacion", etiqueta: "Participación destacada", valor: 2 },
  { id: "celular", etiqueta: "Uso del celular", valor: -1 },
];

describe("catálogo guardado (D375)", () => {
  test("sin fila vale el inicial; la que no valida da null", () => {
    expect(catalogoMotivosDeDocumento(false, undefined)).toBe(
      MOTIVOS_INICIALES,
    );
    expect(
      catalogoMotivosDeDocumento(true, { motivos: CAT, actualizadoEn: 1 }),
    ).toEqual(CAT);
    expect(
      catalogoMotivosDeDocumento(true, { motivos: [], actualizadoEn: 1 }),
    ).toBeNull();
    expect(
      catalogoMotivosDeDocumento(true, {
        motivos: [{ id: "x", etiqueta: "Cero", valor: 0 }],
        actualizadoEn: 1,
      }),
    ).toBeNull();
  });
  test("el inicial valida con el modelo y no trae «Otro»", () => {
    expect(
      zCatalogoMotivos.safeParse({
        motivos: MOTIVOS_INICIALES,
        actualizadoEn: 1,
      }).success,
    ).toBe(true);
    expect(MOTIVOS_INICIALES.some((m) => IDS_RESERVADOS.includes(m.id))).toBe(
      false,
    );
  });
  test("ids nuevos: nunca reservados ni repetidos", () => {
    const ids = new Set(Array.from({ length: 50 }, idMotivoNuevo));
    expect(ids.size).toBe(50);
    for (const id of ids) {
      expect(id).toMatch(/^m-[0-9a-f]{10}$/);
      expect(IDS_RESERVADOS.includes(id)).toBe(false);
    }
  });
});

describe("aplicarOperacionMotivos", () => {
  test("crear va al final, con la etiqueta limpia", () => {
    const r = aplicarOperacionMotivos(CAT, {
      tipo: "crear",
      id: "m-1",
      etiqueta: "  Trajo   material ",
      valor: 1.5,
    });
    expect(r).toEqual({
      ok: true,
      motivos: [...CAT, { id: "m-1", etiqueta: "Trajo material", valor: 1.5 }],
    });
  });
  test("etiqueta repetida sin distinguir mayúsculas ni tildes", () => {
    expect(
      aplicarOperacionMotivos(CAT, {
        tipo: "crear",
        id: "m-1",
        etiqueta: "PARTICIPACION destacada",
        valor: 1,
      }),
    ).toEqual({ ok: false, error: "repetida" });
  });
  test("«Anulación» está reservada; vacía o de más de 40 no vale", () => {
    const crear = (etiqueta: string) =>
      aplicarOperacionMotivos(CAT, {
        tipo: "crear",
        id: "m-1",
        etiqueta,
        valor: 1,
      });
    expect(crear("anulacion")).toEqual({ ok: false, error: "reservada" });
    expect(crear("   ")).toEqual({ ok: false, error: "etiqueta" });
    expect(crear("a".repeat(41))).toEqual({ ok: false, error: "etiqueta" });
    expect(crear("a".repeat(40)).ok).toBe(true);
  });
  test("valor fuera de rango, 0 o fuera de los pasos de 0,5", () => {
    for (const valor of [0, 21, -20.5, 1.25])
      expect(
        aplicarOperacionMotivos(CAT, {
          tipo: "crear",
          id: "m-1",
          etiqueta: "Nueva",
          valor,
        }),
      ).toEqual({ ok: false, error: "valor" });
    expect(
      aplicarOperacionMotivos(CAT, {
        tipo: "crear",
        id: "m-1",
        etiqueta: "Nueva",
        valor: -20,
      }).ok,
    ).toBe(true);
  });
  test("crear con id reservado o que ya existe no se acepta", () => {
    for (const id of ["otro", "anulacion", "importado", "celular"])
      expect(
        aplicarOperacionMotivos(CAT, {
          tipo: "crear",
          id,
          etiqueta: "Nueva",
          valor: 1,
        }),
      ).toEqual({ ok: false, error: "invalida" });
  });
  test("tope de opciones", () => {
    const lleno = Array.from({ length: MOTIVOS_MAX }, (_, i) => ({
      id: `m-${i}`,
      etiqueta: `Opción ${i}`,
      valor: 1,
    }));
    expect(
      aplicarOperacionMotivos(lleno, {
        tipo: "crear",
        id: "m-x",
        etiqueta: "Otra más",
        valor: 1,
      }),
    ).toEqual({ ok: false, error: "tope" });
  });
  test("editar cambia etiqueta y valor en su lugar; su propia etiqueta no cuenta como repetida", () => {
    expect(
      aplicarOperacionMotivos(CAT, {
        tipo: "editar",
        id: "participacion",
        etiqueta: "participación destacada",
        valor: 3,
      }),
    ).toEqual({
      ok: true,
      motivos: [
        { id: "participacion", etiqueta: "participación destacada", valor: 3 },
        CAT[1],
      ],
    });
    expect(
      aplicarOperacionMotivos(CAT, {
        tipo: "editar",
        id: "participacion",
        etiqueta: "Uso del celular",
        valor: 3,
      }),
    ).toEqual({ ok: false, error: "repetida" });
    expect(
      aplicarOperacionMotivos(CAT, {
        tipo: "editar",
        id: "no-esta",
        etiqueta: "X",
        valor: 1,
      }),
    ).toEqual({ ok: false, error: "no-existe" });
  });
  test("borrar: la que no está, y la última no se borra", () => {
    expect(
      aplicarOperacionMotivos(CAT, { tipo: "borrar", id: "celular" }),
    ).toEqual({ ok: true, motivos: [CAT[0]] });
    expect(aplicarOperacionMotivos(CAT, { tipo: "borrar", id: "x" })).toEqual({
      ok: false,
      error: "no-existe",
    });
    expect(
      aplicarOperacionMotivos([CAT[0]], {
        tipo: "borrar",
        id: "participacion",
      }),
    ).toEqual({ ok: false, error: "ultima" });
  });
});

describe("validarOpcion y textos", () => {
  test("vacía, sin valor, repetida", () => {
    expect(validarOpcion(CAT, { etiqueta: " ", valor: null })).toEqual({
      etiqueta: ETIQUETA_VACIA,
      valor: VALOR_MOTIVO_VACIO,
    });
    expect(
      validarOpcion(CAT, { etiqueta: "uso del CELULAR", valor: 1 }).etiqueta,
    ).toBe("Ya existe «uso del CELULAR».");
    expect(
      validarOpcion(CAT, { etiqueta: "Uso del celular", valor: -1 }, "celular"),
    ).toEqual({});
    expect(validarOpcion(CAT, { etiqueta: "Nueva", valor: 0 }).valor).toBe(
      errorMotivosTexto("valor"),
    );
  });
  test("limpiarEtiqueta junta espacios", () => {
    expect(limpiarEtiqueta("  a \n b  ")).toBe("a b");
  });
  test("la opción borrada mientras el formulario estaba abierto", () => {
    expect(errorMotivosTexto("no-existe")).toBe(
      "Esa opción ya no existe. Recarga la página.",
    );
  });
});
