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
import { anular, deltasSesion } from "@/lib/puntos";

const usuario = (cedula: string, o: Partial<Usuario> = {}): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Jorge Luis",
  apellidos: "Quintero Rojas",
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
  destinoId: "32828381",
  seccion: "5A",
  motivoId: "participacion",
  motivo: "Participación destacada",
  valor: 2,
  nota: null,
  autorId: "30262232",
  en: EN,
  anulaA: null,
  ...o,
});

describe("armarAjuste", () => {
  const entrada = (o = {}) =>
    zAplicarAjuste.parse({
      destino: "alumno",
      destinoId: "32828381",
      motivoId: "celular",
      valor: -1,
      nota: "  ",
      ...o,
    });

  test("guarda la etiqueta del motivo, la sección del servidor y el autor", () => {
    expect(
      armarAjuste({
        entrada: entrada(),
        seccion: "5C",
        autorId: "30262232",
        ahora: 9,
      }),
    ).toEqual({
      ok: true,
      ajuste: {
        destino: "alumno",
        destinoId: "32828381",
        seccion: "5C",
        motivoId: "celular",
        motivo: "Uso del celular",
        valor: -1,
        nota: null,
        autorId: "30262232",
        en: 9,
        anulaA: null,
      },
    });
  });

  test("«Otro» exige detalle; el valor no puede ser 0 ni salir de los pasos de 0,5", () => {
    expect(
      armarAjuste({
        entrada: entrada({ motivoId: "otro" }),
        seccion: "5A",
        autorId: "1",
        ahora: 0,
      }),
    ).toEqual({ ok: false, error: "detalle" });
    expect(zAplicarAjuste.safeParse({ ...entrada(), valor: 0 }).success).toBe(
      false,
    );
    expect(zAplicarAjuste.safeParse({ ...entrada(), valor: 1.2 }).success).toBe(
      false,
    );
    expect(
      zAplicarAjuste.safeParse({ ...entrada(), motivoId: "anulacion" }).success,
    ).toBe(false);
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
        destinoId: "32828381",
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
    usuario("32828381"),
    usuario("30262232", {
      rol: "profesor",
      seccion: null,
      nombres: "Ana",
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
      nombre: "Jorge Quintero",
      anulado: true,
      profe: "Ana Pérez",
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
        profe: "Ana",
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
            "32828381": {
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
    });
    expect(c.alumno["5A"]).toHaveLength(1);
    expect(c.alumno["5A"][0]).toMatchObject({
      id: "32828381",
      nombre: "Jorge Quintero",
      puntos: 31.5,
      primerApellido: "Quintero",
    });
    expect(c.equipo["5A"][0]).toMatchObject({ id: "5a-g3", puntos: 12 });
    expect(c.alumno["5C"]).toEqual([]);
  });
});
