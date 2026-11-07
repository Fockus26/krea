import { describe, expect, test } from "bun:test";
import {
  acotar,
  desplazarMes,
  diaDeshabilitado,
  diaSemana,
  etiquetaDia,
  focoInicial,
  hayMes,
  moverFoco,
  rango,
  semanasDelMes,
  sumarMeses,
  tituloMes,
} from "@/lib/calendario";
import { fechaCampo, fechaIso } from "@/lib/tareas-profe";

const HOY = "2026-11-07";
const L = { hoy: HOY };

describe("semanasDelMes", () => {
  test("noviembre 2026: 6 filas, lunes a domingo, empieza el 26/10", () => {
    const s = semanasDelMes({ anio: 2026, mes: 11 });
    expect(s).toHaveLength(6);
    expect(s.every((f) => f.length === 7)).toBe(true);
    expect(s[0][0]).toBe("2026-10-26");
    expect(s[0][6]).toBe("2026-11-01");
    expect(s[5][6]).toBe("2026-12-06");
  });

  test("febrero 2028 (bisiesto) incluye el 29", () => {
    const dias = semanasDelMes({ anio: 2028, mes: 2 }).flat();
    expect(dias).toContain("2028-02-29");
    expect(dias.filter((d) => d.startsWith("2028-02"))).toHaveLength(29);
  });

  test("febrero 2027 no bisiesto con el 1 en lunes: 4 filas exactas", () => {
    const s = semanasDelMes({ anio: 2027, mes: 2 });
    expect(s).toHaveLength(4);
    expect(s[0][0]).toBe("2027-02-01");
    expect(s[3][6]).toBe("2027-02-28");
  });

  test("un mes puede ocupar 6 semanas (agosto 2026)", () => {
    expect(semanasDelMes({ anio: 2026, mes: 8 })).toHaveLength(6);
  });
});

describe("meses y días", () => {
  test("cambio de año en las flechas", () => {
    expect(desplazarMes({ anio: 2026, mes: 12 }, 1)).toEqual({
      anio: 2027,
      mes: 1,
    });
    expect(desplazarMes({ anio: 2026, mes: 1 }, -1)).toEqual({
      anio: 2025,
      mes: 12,
    });
  });
  test("sumarMeses recorta al último día", () => {
    expect(sumarMeses("2026-01-31", 1)).toBe("2026-02-28");
    expect(sumarMeses("2028-01-31", 1)).toBe("2028-02-29");
    expect(sumarMeses("2026-12-15", 1)).toBe("2027-01-15");
  });
  test("diaSemana: 0 = lunes", () => {
    expect(diaSemana("2026-11-09")).toBe(0);
    expect(diaSemana("2026-11-07")).toBe(5);
    expect(diaSemana("2026-11-08")).toBe(6);
  });
  test("títulos y etiquetas", () => {
    expect(tituloMes({ anio: 2026, mes: 11 })).toBe("noviembre de 2026");
    expect(etiquetaDia("2026-11-14", HOY)).toBe(
      "sábado, 14 de noviembre de 2026",
    );
    expect(etiquetaDia(HOY, HOY)).toBe("sábado, 7 de noviembre de 2026, hoy");
  });
});

describe("deshabilitados (D200)", () => {
  test("anteriores a hoy no, hoy sí", () => {
    expect(diaDeshabilitado("2026-11-06", L)).toBe(true);
    expect(diaDeshabilitado(HOY, L)).toBe(false);
    expect(diaDeshabilitado("2026-11-08", L)).toBe(false);
  });
  test("pasado el año tampoco", () => {
    expect(diaDeshabilitado("2027-11-08", L)).toBe(false); // 366 días
    expect(diaDeshabilitado("2027-11-09", L)).toBe(true);
  });
  test("la fecha guardada que ya pasó se puede conservar", () => {
    const l = { hoy: HOY, fechaGuardada: "2026-10-30" };
    expect(diaDeshabilitado("2026-10-30", l)).toBe(false);
    expect(diaDeshabilitado("2026-10-29", l)).toBe(true);
    expect(rango(l).min).toBe("2026-10-30");
  });
  test("flechas de mes: no hay mes anterior al de hoy", () => {
    expect(hayMes({ anio: 2026, mes: 11 }, -1, L)).toBe(false);
    expect(hayMes({ anio: 2026, mes: 11 }, 1, L)).toBe(true);
    expect(hayMes({ anio: 2027, mes: 11 }, 1, L)).toBe(false);
    expect(
      hayMes({ anio: 2026, mes: 11 }, -1, {
        hoy: HOY,
        fechaGuardada: "2026-10-30",
      }),
    ).toBe(true);
  });
});

describe("moverFoco", () => {
  const f = "2026-11-18"; // miércoles
  test("flechas", () => {
    expect(moverFoco(f, "ArrowLeft", L)).toBe("2026-11-17");
    expect(moverFoco(f, "ArrowRight", L)).toBe("2026-11-19");
    expect(moverFoco(f, "ArrowUp", L)).toBe("2026-11-11");
    expect(moverFoco(f, "ArrowDown", L)).toBe("2026-11-25");
  });
  test("cruza de mes y de año", () => {
    expect(moverFoco("2026-11-30", "ArrowRight", L)).toBe("2026-12-01");
    expect(moverFoco("2026-12-31", "ArrowDown", L)).toBe("2027-01-07");
  });
  test("Inicio y Fin: lunes y domingo de la semana", () => {
    expect(moverFoco(f, "Home", L)).toBe("2026-11-16");
    expect(moverFoco(f, "End", L)).toBe("2026-11-22");
  });
  test("RePág / AvPág: mes; con Mayús, año", () => {
    expect(moverFoco(f, "PageDown", L)).toBe("2026-12-18");
    expect(moverFoco("2026-12-18", "PageUp", L)).toBe("2026-11-18");
    expect(moverFoco("2026-11-08", "PageDown", L, true)).toBe("2027-11-08");
    expect(moverFoco(f, "PageDown", L, true)).toBe("2027-11-08");
  });
  test("no se sale del rango", () => {
    expect(moverFoco(HOY, "ArrowLeft", L)).toBe(HOY);
    expect(moverFoco("2026-11-09", "PageUp", L)).toBe(HOY);
    expect(moverFoco("2027-11-08", "ArrowRight", L)).toBe("2027-11-08");
  });
  test("otras teclas no mueven", () => {
    expect(moverFoco(f, "a", L)).toBeNull();
    expect(moverFoco(f, "Enter", L)).toBeNull();
  });
});

describe("foco inicial y ida y vuelta con el campo", () => {
  test("abre en el día del campo, o en hoy si está vacío o es inválido", () => {
    expect(focoInicial("2026-12-02", L)).toBe("2026-12-02");
    expect(focoInicial(null, L)).toBe(HOY);
    expect(focoInicial(fechaIso("31/02/2026"), L)).toBe(HOY);
  });
  test("un día pasado sin guardar se acota a hoy", () => {
    expect(acotar("2026-01-01", L)).toBe(HOY);
  });
  test("dd/mm/aaaa ↔ ISO", () => {
    const iso = "2028-02-29";
    expect(fechaIso(fechaCampo(iso))).toBe(iso);
    expect(fechaCampo("2026-11-14")).toBe("14/11/2026");
  });
});
