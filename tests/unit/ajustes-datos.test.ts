import { describe, expect, test } from "bun:test";
import {
  armarAjuste,
  armarAnulacion,
  candidatosDe,
  historialDe,
  idAnulacion,
  MOTIVO_ID_ANULACION,
  zAplicarAjuste,
} from "@/lib/ajustes-datos";
import type { Ajuste, Equipo, Usuario } from "@/lib/modelo";
import { MOTIVOS_INICIALES } from "@/lib/motivos";
import { anular, deltasSesion } from "@/lib/puntos";

const usuario = (cedula: string, o: Partial<Usuario> = {}): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Mateo Luis",
  apellidos: "Paredes Rojas",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
  ...o,
});

const EN = Date.UTC(2026, 9, 25, 14, 15); // 25/10/2026, 10:15 a. m. en Caracas

const ajuste = (
  id: string,
  o: Partial<Ajuste> = {},
): { id: string } & Ajuste => ({
  id,
  destino: "alumno",
  destinoId: "45003711",
  seccion: "5A",
  motivoId: "participacion",
  motivo: "Participación destacada",
  valor: 2,
  nota: null,
  autorId: "45001237",
  en: EN,
  anulaA: null,
  ...o,
});

describe("armarAjuste", () => {
  const entrada = (o = {}) =>
    zAplicarAjuste.parse({
      destino: "alumno",
      destinoId: "45003711",
      motivoId: "celular",
      valor: -1,
      nota: "  ",
      ...o,
    });

  test("guarda la etiqueta del motivo, la sección del servidor y el autor", () => {
    expect(
      armarAjuste({
        entrada: entrada(),
        motivos: MOTIVOS_INICIALES,
        seccion: "5C",
        autorId: "45001237",
        ahora: 9,
      }),
    ).toEqual({
      ok: true,
      ajuste: {
        destino: "alumno",
        destinoId: "45003711",
        seccion: "5C",
        motivoId: "celular",
        motivo: "Uso del celular",
        valor: -1,
        nota: null,
        autorId: "45001237",
        en: 9,
        anulaA: null,
      },
    });
  });

  test("la etiqueta sale del catálogo leído, nunca del body; el valor, del stepper (D375)", () => {
    const motivos = [{ id: "m-1", etiqueta: "Trajo material", valor: 1 }];
    const r = armarAjuste({
      entrada: entrada({ motivoId: "m-1", valor: 2.5, nota: " Para todos " }),
      motivos,
      seccion: "5A",
      autorId: "1",
      ahora: 0,
    });
    expect(r.ok && r.ajuste).toMatchObject({
      motivoId: "m-1",
      motivo: "Trajo material",
      valor: 2.5,
      nota: "Para todos",
    });
  });

  test("una opción que ya no está en el catálogo da `motivo` (D375); sin detalle vale (D376)", () => {
    expect(
      armarAjuste({
        entrada: entrada({ motivoId: "m-borrada" }),
        motivos: MOTIVOS_INICIALES,
        seccion: "5A",
        autorId: "1",
        ahora: 0,
      }),
    ).toEqual({ ok: false, error: "motivo" });
    expect(
      armarAjuste({
        entrada: entrada({ motivoId: "ayudo", nota: "" }),
        motivos: MOTIVOS_INICIALES,
        seccion: "5A",
        autorId: "1",
        ahora: 0,
      }).ok,
    ).toBe(true);
  });

  test("el valor no puede ser 0 ni salir de los pasos de 0,5; los ids reservados no pasan", () => {
    expect(zAplicarAjuste.safeParse({ ...entrada(), valor: 0 }).success).toBe(
      false,
    );
    expect(zAplicarAjuste.safeParse({ ...entrada(), valor: 1.2 }).success).toBe(
      false,
    );
    for (const motivoId of ["anulacion", "importado", "otro"])
      expect(zAplicarAjuste.safeParse({ ...entrada(), motivoId }).success).toBe(
        false,
      );
  });
});

describe("anulación (D121)", () => {
  test("inverso con motivo Anulación y el detalle de lo que anula", () => {
    const r = armarAnulacion({
      original: ajuste("a1"),
      autorId: "30262233",
      ahora: 99,
    });
    expect(r).toEqual({
      ok: true,
      ajuste: {
        destino: "alumno",
        destinoId: "45003711",
        seccion: "5A",
        motivoId: MOTIVO_ID_ANULACION,
        motivo: "Anulación",
        valor: -2,
        nota: "«Participación destacada» del 25/10/2026, 10:15 a. m.",
        autorId: "30262233",
        en: 99,
        anulaA: "a1",
      },
    });
    expect(idAnulacion("a1")).toBe("a1__anulacion");
  });

  test("una anulación no se anula", () => {
    const inv = ajuste("x", { anulaA: "a1", motivoId: MOTIVO_ID_ANULACION });
    expect(armarAnulacion({ original: inv, autorId: "1", ahora: 0 })).toEqual({
      ok: false,
      error: "invalida",
    });
  });
});

describe("historial y destinatarios", () => {
  const usuarios = [
    usuario("45003711"),
    usuario("45001237", {
      rol: "profesor",
      seccion: null,
      nombres: "Adela",
      apellidos: "Pérez",
    }),
  ];
  const equipos: Array<{ id: string } & Equipo> = [
    {
      id: "5a-g3",
      nombre: "5A-G3 Ropa",
      seccion: "5A",
      tema: "Ropa",
      capitanId: null,
      logoPath: null,
    },
  ];
  const nombres = {
    usuarios: new Map(usuarios.map((u) => [u.cedula, u])),
    equipos: new Map(equipos.map((e) => [e.id, e])),
  };

  test("más reciente primero, el anulado marcado, con su detalle y quien lo aplicó", () => {
    const filas = historialDe(
      [
        ajuste("a1"),
        ajuste("a1__anulacion", {
          valor: -2,
          motivoId: MOTIVO_ID_ANULACION,
          motivo: "Anulación",
          nota: "«Participación destacada» del 25/10/2026, 10:15 a. m.",
          anulaA: "a1",
          en: EN + 60_000,
        }),
        ajuste("a2", {
          destino: "equipo",
          destinoId: "5a-g3",
          motivoId: "otro",
          motivo: "Otro",
          nota: "Sin nombres",
          valor: -1,
          en: EN - 60_000,
          autorId: null,
        }),
      ],
      nombres,
    );
    expect(filas.map((f) => f.id)).toEqual(["a1__anulacion", "a1", "a2"]);
    expect(filas[1]).toMatchObject({
      nombre: "Mateo Paredes",
      anulado: true,
      profe: "Adela Pérez",
      fecha: "2026-10-25T10:15",
      nuevo: false,
    });
    expect(filas[0]).toMatchObject({ anulaA: "a1", anulado: false });
    expect(filas[2]).toMatchObject({
      nombre: "Equipo 5A-G3 Ropa",
      detalle: "Sin nombres",
      profe: "Sin nombre",
    });
    // Desde el servidor no hay deltas de sesión: los puntos ya vienen del ranking
    expect(deltasSesion(filas)).toEqual({});
    expect(() =>
      anular(filas, "a1", {
        nuevoId: "n",
        fecha: "2026-10-25T10:20",
        profe: "Adela",
      }),
    ).toThrow();
  });

  test("candidatos con los puntos del ranking, por nombre y sin el profe", () => {
    const c = candidatosDe({
      usuarios,
      equipos,
      rankings: {
        "5A": {
          alumnos: {
            "45003711": {
              nombres: "",
              apellidos: "",
              equipoId: null,
              estilo: "",
              puntos: 31.5,
            },
          },
          equipos: { "5a-g3": { nombre: "", logoPath: null, puntos: 12 } },
          actualizadoEn: 0,
        },
      },
      secciones: ["5A", "5C"],
    });
    expect(c.alumno["5A"]).toHaveLength(1);
    expect(c.alumno["5A"][0]).toMatchObject({
      id: "45003711",
      nombre: "Mateo Paredes",
      puntos: 31.5,
      primerApellido: "Paredes",
    });
    expect(c.equipo["5A"][0]).toMatchObject({ id: "5a-g3", puntos: 12 });
    expect(c.alumno["5C"]).toEqual([]);
  });

  test("una sección nueva (4B) del catálogo, o fuera de él, no rompe (D323)", () => {
    const c = candidatosDe({
      usuarios: [
        ...usuarios,
        usuario("40000001", { seccion: "4B" }),
        usuario("40000002", { seccion: "7Z" }),
      ],
      equipos: [
        ...equipos,
        {
          id: "4b-g1",
          nombre: "4B-G1",
          seccion: "4B",
          tema: null,
          capitanId: null,
          logoPath: null,
        },
      ],
      rankings: {},
      secciones: ["4B", "5A", "5C", "6A"],
    });
    expect(c.alumno["4B"]?.map((a) => a.id)).toEqual(["40000001"]);
    expect(c.alumno["4B"]?.[0]).toMatchObject({ seccion: "4B", puntos: 0 });
    expect(c.equipo["4B"]?.map((e) => e.id)).toEqual(["4b-g1"]);
    // La del catálogo sin nadie sale vacía; la de fuera se agrupa igual
    expect(c.alumno["6A"]).toEqual([]);
    expect(c.alumno["7Z"]?.map((a) => a.id)).toEqual(["40000002"]);
  });
});
