import { describe, expect, test } from "bun:test";
import {
  cambiarPieza,
  horaDePartes,
  MINUTOS,
  minutosConGuardado,
  partesDeHora,
  periodoProbable,
} from "@/lib/reloj";

describe("reloj (D361)", () => {
  test("partesDeHora: 24 h → reloj de 12", () => {
    expect(partesDeHora("15:30")).toEqual({
      hora: 3,
      minuto: 30,
      periodo: "pm",
    });
    expect(partesDeHora("00:05")).toEqual({
      hora: 12,
      minuto: 5,
      periodo: "am",
    });
    expect(partesDeHora("12:00")).toEqual({
      hora: 12,
      minuto: 0,
      periodo: "pm",
    });
    expect(partesDeHora("")).toBeNull();
    expect(partesDeHora("25:00")).toBeNull();
  });

  test("horaDePartes: ida y vuelta", () => {
    for (const h of ["00:00", "07:45", "11:59", "12:00", "12:30", "23:55"])
      expect(
        horaDePartes(partesDeHora(h) ?? { hora: 0, minuto: 0, periodo: "am" }),
      ).toBe(h);
    expect(horaDePartes({ hora: 12, minuto: 0, periodo: "am" })).toBe("00:00");
    expect(horaDePartes({ hora: 12, minuto: 15, periodo: "pm" })).toBe("12:15");
  });

  test("cambiarPieza sin valor: 00 y el período probable", () => {
    expect(cambiarPieza("", { hora: 8 })).toBe("08:00");
    expect(cambiarPieza("", { hora: 3 })).toBe("15:00");
    expect(cambiarPieza("", { minuto: 30 })).toBe("12:30");
    expect(cambiarPieza("", { periodo: "am" })).toBe("00:00");
  });

  test("cambiarPieza con valor: solo cambia la pieza", () => {
    expect(cambiarPieza("15:30", { hora: 9 })).toBe("21:30");
    expect(cambiarPieza("15:30", { minuto: 0 })).toBe("15:00");
    expect(cambiarPieza("15:30", { periodo: "am" })).toBe("03:30");
  });

  test("periodoProbable", () => {
    expect(periodoProbable(7)).toBe("am");
    expect(periodoProbable(11)).toBe("am");
    expect(periodoProbable(12)).toBe("pm");
    expect(periodoProbable(6)).toBe("pm");
  });

  test("minutosConGuardado suma el guardado fuera del paso de 5", () => {
    expect(minutosConGuardado("")).toEqual(MINUTOS);
    expect(minutosConGuardado("10:30")).toEqual(MINUTOS);
    const m = minutosConGuardado("10:37");
    expect(m).toContain(37);
    expect(m).toHaveLength(13);
    expect([...m].sort((a, b) => a - b)).toEqual(m);
  });
});
