import { describe, expect, test } from "bun:test";
import { AJUSTES, AJUSTES_HISTORIAL } from "@/lib/demo/ajustes";
import {
  AJUSTE_INICIAL,
  candidatosPuntos,
  historialPuntos,
} from "@/lib/demo/puntos";
import { MOTIVOS_INICIALES } from "@/lib/motivos";
import {
  ajusteAnuladoTexto,
  ajusteAplicadoTexto,
  anular,
  type Candidato,
  chipMotivo,
  conDeltas,
  deltasSesion,
  esAjusteImportado,
  FILTRO_VACIO,
  type FilaHistorial,
  filtrarCandidatos,
  filtrarHistorial,
  filtrarLabel,
  filtroHistorialTexto,
  historialMetaTexto,
  historialMostrable,
  isoLocal,
  MOTIVO_VACIO,
  motivoNoAnulable,
  motivosFiltro,
  motivoTexto,
  nuevoAjuste,
  opcionesAjusteLabel,
  puedeAnular,
  puntosTexto,
  rutaDestinoHistorial,
  separarMotivo,
  sinErrores,
  sinResultadosTexto,
  VALOR_CERO,
  VALOR_PASO,
  VALOR_RANGO,
  VALOR_VACIO,
  validarAjuste,
  vistaPrevia,
} from "@/lib/puntos";

const cand = (
  id: string,
  puntos: number,
  apellido = id,
  tipo: "alumno" | "equipo" = "alumno",
): Candidato => ({
  id,
  tipo,
  seccion: "5A",
  nombre: `${id} ${apellido}`,
  puntos,
  primerApellido: apellido,
  avatar: { tipo: "alumno", estilo: "adventurer-neutral", seed: id },
});

describe("motivos", () => {
  test("los 7 iniciales del handoff, en orden, con sus valores y sin «Otro» (D376)", () => {
    expect(MOTIVOS_INICIALES.map((m) => [m.etiqueta, m.valor])).toEqual([
      ["Participación destacada", 2],
      ["Ayudó a un compañero", 1],
      ["Trabajo extra", 2],
      ["No estuvo en clase", -2],
      ["No prestó atención", -1],
      ["Uso del celular", -1],
      ["Falta de respeto", -3],
    ]);
  });
  test("chip con signo tipográfico y texto accesible", () => {
    expect(chipMotivo(2)).toEqual({
      variante: "ok",
      visible: "+2",
      accesible: "más 2 puntos",
    });
    expect(chipMotivo(-3)).toEqual({
      variante: "err",
      visible: "−3",
      accesible: "menos 3 puntos",
    });
  });
  test("el filtro: las vigentes, las del historial que ya no están y «Anulación» al final", () => {
    expect(motivosFiltro(MOTIVOS_INICIALES, [])).toEqual([
      ...MOTIVOS_INICIALES.map((m) => m.etiqueta),
      "Anulación",
    ]);
    const cat = [{ id: "a", etiqueta: "Trabajo extra", valor: 2 }];
    expect(
      motivosFiltro(cat, [
        { motivo: "Trabajo extra" },
        { motivo: "Otro" },
        { motivo: "Anulación" },
        { motivo: "Ayudó a un compañero" },
        { motivo: "Otro" },
      ]),
    ).toEqual(["Trabajo extra", "Ayudó a un compañero", "Otro", "Anulación"]);
  });
});

describe("filtrarCandidatos", () => {
  const lista = [
    { nombre: "Juana Montero" },
    { nombre: "Mateo Paredes" },
    { nombre: "5A-G3 Ropa" },
  ];
  test("sin tildes ni mayúsculas", () => {
    expect(filtrarCandidatos(lista, "MONTERO")).toEqual([lista[0]]);
    expect(filtrarCandidatos(lista, "  juana ")).toEqual([lista[0]]);
    expect(filtrarCandidatos(lista, "ropa")).toEqual([lista[2]]);
  });
  test("consulta vacía devuelve todos; sin coincidencias, vacío", () => {
    expect(filtrarCandidatos(lista, "")).toHaveLength(3);
    expect(filtrarCandidatos(lista, "zzz")).toEqual([]);
    expect(sinResultadosTexto(" zzz ")).toBe("Sin resultados para «zzz»");
  });
});

describe("vistaPrevia", () => {
  test("el ejemplo del lienzo: Mateo Paredes 17 → 19, puesto 16 → 11", () => {
    const c = candidatosPuntos().alumno["5A"];
    const mateo = c.find((x) => x.id === AJUSTE_INICIAL.destinoId);
    if (!mateo) throw new Error("falta Mateo");
    const v = vistaPrevia({ destino: mateo, valor: 2, ranking: c });
    expect(v.frase).toBe(
      "Mateo Paredes pasa de 17 a 19 pts y sube del puesto 16 al 11. Su nota no cambia.",
    );
    expect(v.variante).toBe("ok");
    expect(v.movimiento).toBe("sube");
  });
  test("baja", () => {
    const r = [cand("a", 20), cand("b", 15), cand("c", 10)];
    const v = vistaPrevia({ destino: r[0], valor: -6, ranking: r });
    expect(v.movimiento).toBe("baja");
    expect(v.variante).toBe("err");
    expect(v.frase).toBe(
      "a a pasa de 20 a 14 pts y baja del puesto 1 al 2. Su nota no cambia.",
    );
  });
  test("se mantiene; con medios puntos", () => {
    const r = [cand("a", 20), cand("b", 15), cand("c", 10)];
    const v = vistaPrevia({ destino: r[1], valor: 0.5, ranking: r });
    expect(v.movimiento).toBe("igual");
    expect(v.frase).toBe(
      "b b pasa de 15 a 15,5 pts y se mantiene en el puesto 2. Su nota no cambia.",
    );
  });
  test("empates con rankCompetition (1-2-2-4)", () => {
    // b y c empatan en 2.º; d (4.º) sube a 15 y empata con ellos en el 2.º
    const r = [cand("a", 20), cand("b", 15), cand("c", 15), cand("d", 10)];
    const v = vistaPrevia({ destino: r[3], valor: 5, ranking: r });
    expect([v.puestoAntes, v.puestoDespues]).toEqual([4, 2]);
  });
  test("equipo: «El equipo …»", () => {
    const c = candidatosPuntos().equipo["5A"];
    const ropa = c.find((x) => x.id === "5a-g3");
    if (!ropa) throw new Error("falta 5A-G3");
    const v = vistaPrevia({ destino: ropa, valor: 1, ranking: c });
    expect(v.frase.startsWith("El equipo 5A-G3 Ropa pasa de ")).toBe(true);
    expect(v.frase.endsWith(". Su nota no cambia.")).toBe(true);
    expect(v.partes.prefijo + v.partes.nombre).toBe("El equipo 5A-G3 Ropa");
  });
  test("usa los puntos con los deltas de la sesión", () => {
    const r = conDeltas([cand("a", 20), cand("b", 15)], { "alumno:b": 6 });
    expect(r[1].puntos).toBe(21);
    const v = vistaPrevia({ destino: r[1], valor: 1, ranking: r });
    expect([v.antes, v.despues, v.puestoAntes]).toEqual([21, 22, 1]);
  });
  test("solo «Su nota no cambia» habla de nota (D007)", () => {
    const r = [cand("a", 20), cand("b", 15)];
    const v = vistaPrevia({ destino: r[1], valor: 2, ranking: r });
    expect(v.frase.match(/nota/g)).toHaveLength(1);
    expect(puntosTexto(17.5)).toBe("17,5 pts");
  });
});

describe("validarAjuste", () => {
  const ok = {
    tipo: "alumno" as const,
    destinoId: "1",
    motivo: "participacion",
    valor: 2,
    detalle: "",
  };
  test("válido", () => {
    expect(sinErrores(validarAjuste(ok))).toBe(true);
  });
  test("faltan destino y motivo", () => {
    const e = validarAjuste({ ...ok, destinoId: null, motivo: null });
    expect(e.destino).toContain("alumno");
    expect(e.motivo).toBe(MOTIVO_VACIO);
    expect(
      validarAjuste({ ...ok, tipo: "equipo", destinoId: null }).destino,
    ).toContain("equipo");
  });
  test("valor: vacío, 0, paso y rango", () => {
    expect(validarAjuste({ ...ok, valor: null }).valor).toBe(VALOR_VACIO);
    expect(validarAjuste({ ...ok, valor: 0 }).valor).toBe(VALOR_CERO);
    expect(validarAjuste({ ...ok, valor: 1.25 }).valor).toBe(VALOR_PASO);
    expect(validarAjuste({ ...ok, valor: 21 }).valor).toBe(VALOR_RANGO);
    expect(validarAjuste({ ...ok, valor: -0.5 }).valor).toBeUndefined();
  });
  test("el detalle es opcional siempre (D376)", () => {
    expect(sinErrores(validarAjuste({ ...ok, detalle: "  " }))).toBe(true);
  });
});

const fila = (over: Partial<FilaHistorial> = {}): FilaHistorial => ({
  id: "x",
  tipo: "alumno",
  destinoId: "1",
  seccion: "5A",
  nombre: "Mateo Paredes",
  valor: 2,
  motivo: "Participación destacada",
  fecha: "2026-10-25T10:15",
  profe: "[Nombre del profe]",
  anulado: false,
  nuevo: false,
  ...over,
});

describe("anular", () => {
  const opts = { nuevoId: "n1", fecha: "2026-10-30T08:00", profe: "P" };
  test("crea el inverso arriba y marca el original sin borrarlo", () => {
    const r = anular([fila(), fila({ id: "y" })], "x", opts);
    expect(r).toHaveLength(3);
    expect(r[0]).toMatchObject({
      id: "n1",
      valor: -2,
      motivo: "Anulación",
      anulaA: "x",
      nuevo: true,
      detalle: "«Participación destacada» del 25/10/2026, 10:15 a. m.",
    });
    expect(r[1]).toMatchObject({ id: "x", anulado: true });
    expect(r[2].anulado).toBe(false);
    expect(motivoTexto(r[0])).toBe(
      "Anulación de «Participación destacada» del 25/10/2026, 10:15 a. m.",
    );
  });
  test("no se anula dos veces ni se anula una anulación", () => {
    const r = anular([fila()], "x", opts);
    expect(() => anular(r, "x", { ...opts, nuevoId: "n2" })).toThrow();
    expect(() => anular(r, "n1", { ...opts, nuevoId: "n2" })).toThrow();
    expect(puedeAnular(r[1])).toBe(false);
    expect(motivoNoAnulable(r[1])).toBe("Ya está anulado");
    expect(motivoNoAnulable(r[0])).toBe("Una anulación no se anula");
    expect(motivoNoAnulable(fila())).toBeNull();
  });
  test("los deltas de la sesión suman aplicados y anulaciones; los del seed no", () => {
    const r = anular([fila()], "x", opts);
    expect(deltasSesion(r)).toEqual({ "alumno:1": -2 });
    expect(deltasSesion([fila()])).toEqual({});
  });
  test("textos de los toasts", () => {
    expect(ajusteAplicadoTexto(fila())).toBe(
      "Ajuste aplicado: +2 pts a Mateo Paredes",
    );
    expect(ajusteAnuladoTexto(fila())).toBe(
      "Ajuste anulado: −2 pts a Mateo Paredes",
    );
  });
});

describe("nuevoAjuste", () => {
  test("toma la etiqueta del motivo y el nombre del historial", () => {
    const eq = cand("5a-g3", 18, "5A-G3 Ropa", "equipo");
    const f = nuevoAjuste({
      id: "n",
      destino: { ...eq, nombre: "5A-G3 Ropa" },
      motivo: { id: "m-1", etiqueta: "Llegó tarde", valor: -1 },
      valor: -1.5,
      detalle: "  Llegaron tarde ",
      fecha: "2026-10-30T09:05",
      profe: "P",
    });
    expect(f).toMatchObject({
      nombre: "Equipo 5A-G3 Ropa",
      motivo: "Llegó tarde",
      valor: -1.5,
      detalle: "Llegaron tarde",
      nuevo: true,
      anulado: false,
    });
    expect(motivoTexto(f)).toBe("Llegó tarde");
  });
  test("isoLocal", () => {
    expect(isoLocal(new Date(2026, 9, 3, 7, 5))).toBe("2026-10-03T07:05");
  });
});

describe("historial", () => {
  test("separa el «Otro» del Panel en motivo + detalle", () => {
    expect(separarMotivo('Otro: "Entregaron la maqueta sin nombres"')).toEqual({
      motivo: "Otro",
      detalle: "Entregaron la maqueta sin nombres",
    });
    expect(separarMotivo("Uso del celular")).toEqual({
      motivo: "Uso del celular",
    });
  });
  test("las 5 filas del lienzo, sin tocar las 4 del Panel", () => {
    expect(AJUSTES).toHaveLength(4);
    expect(AJUSTES_HISTORIAL).toHaveLength(5);
    const h = historialPuntos();
    expect(h.map((f) => f.nombre)).toEqual([
      "Mateo Paredes",
      "Pablo Escobar",
      "Equipo 5A-G3 Ropa",
      "Hugo Iglesias",
      "Equipo 5C-G1",
    ]);
    expect(motivoTexto(h[4])).toBe('Otro: "Entregaron la maqueta sin nombres"');
    expect(historialMetaTexto(h[0])).toBe(
      "25/10/2026, 10:15 a. m. · [Nombre del profe]",
    );
    expect(h.every((f) => !f.nuevo && !f.anulado)).toBe(true);
  });
  test("filtro por sección, tipo y motivo, con su frase", () => {
    const h = historialPuntos();
    expect(filtrarHistorial(h, FILTRO_VACIO)).toHaveLength(5);
    expect(filtroHistorialTexto(FILTRO_VACIO, 5, 5)).toBe(
      "Mostrando los 5 ajustes",
    );
    const f = {
      ...FILTRO_VACIO,
      seccion: "5A" as const,
      tipo: "alumno" as const,
    };
    const r = filtrarHistorial(h, f);
    expect(r.map((x) => x.nombre)).toEqual([
      "Mateo Paredes",
      "Pablo Escobar",
      "Hugo Iglesias",
    ]);
    expect(filtroHistorialTexto(f, r.length, h.length)).toBe(
      "Mostrando 3 de 5 ajustes · 5A · Alumnos",
    );
    expect(filtrarLabel(f)).toBe("Filtrar el historial (2 filtros activos)");
    const otro = { ...FILTRO_VACIO, motivo: "Otro" };
    expect(filtrarHistorial(h, otro).map((x) => x.id)).toEqual(["aj-4"]);
  });
  test("nombre accesible del menú de fila", () => {
    expect(opcionesAjusteLabel("Mateo Paredes")).toBe(
      "Opciones del ajuste de Mateo Paredes",
    );
  });
});

describe("D260–D261: Historial sin ajustes del Excel y con enlace al destino", () => {
  const importado = fila({
    id: "x",
    motivo: "Ajuste del Excel",
    motivoId: "importado",
  });
  const normal = fila({ id: "y" });

  test("el ajuste importado no se muestra, ni con el filtro vacío", () => {
    expect(filtrarHistorial([importado, normal], FILTRO_VACIO)).toEqual([
      normal,
    ]);
    expect(historialMostrable([importado, normal])).toEqual([normal]);
    expect(esAjusteImportado(importado)).toBe(true);
    expect(esAjusteImportado(normal)).toBe(false);
  });

  test("no se borra: deltasSesion sigue sumándolo si es nuevo", () => {
    const d = deltasSesion([{ ...importado, nuevo: true, valor: 2 }]);
    expect(Object.values(d)).toEqual([2]);
  });

  test("alumno → ficha en Alumnos; equipo → equipos de su sección", () => {
    expect(
      rutaDestinoHistorial({ tipo: "alumno", destinoId: "123", seccion: "5A" }),
    ).toBe("/profe/alumnos?seccion=5A&alumno=123");
    expect(
      rutaDestinoHistorial({ tipo: "equipo", destinoId: "g1", seccion: "5C" }),
    ).toBe("/profe/equipos/5c");
    expect(
      rutaDestinoHistorial({ tipo: "alumno", destinoId: "", seccion: "5C" }),
    ).toBeNull();
  });
});
