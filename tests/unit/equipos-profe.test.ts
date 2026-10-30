import { describe, expect, test } from "bun:test";
import { equiposProfeVista } from "@/lib/demo/equipos-profe";
import {
  cambiarCapitan,
  capitanTexto,
  chipPuestoTexto,
  conEquipoTotal,
  type EstadoEquipos,
  equipoDeCedula,
  eyebrowEquipos,
  LOGO_MAX_BYTES,
  logoLabel,
  metaEquipoTexto,
  miembrosOrdenados,
  moverAlumno,
  movidoTexto,
  opcionesMover,
  recorteCuadrado,
  sinEquipoTitulo,
  validarLogo,
} from "@/lib/equipos-profe";

const base: EstadoEquipos = {
  equipos: {
    A: { miembros: ["1", "2", "3"], capitan: "1" },
    B: { miembros: ["4"], capitan: "4" },
    C: { miembros: [], capitan: null },
  },
  sinEquipo: ["9"],
};

describe("textos", () => {
  test("eyebrow", () => {
    expect(eyebrowEquipos("5A", 6, 30, 35)).toBe(
      "5A · 6 equipos · 30 de 35 con equipo",
    );
    expect(eyebrowEquipos("5A", 1, 1, 1)).toBe(
      "5A · 1 equipo · 1 de 1 con equipo",
    );
  });
  test("chip de puesto, con empate y decimales con coma", () => {
    expect(chipPuestoTexto(1, 19, false)).toBe("#1 · 19 pts");
    expect(chipPuestoTexto(3, 17, true)).toBe("#3 · 17 pts · empate");
    expect(chipPuestoTexto(2, 18.5, false)).toBe("#2 · 18,5 pts");
  });
  test("sin equipo, meta, etiquetas y avisos", () => {
    expect(sinEquipoTitulo(5)).toBe("Sin equipo · 5");
    expect(metaEquipoTexto("Repostería", 4)).toBe(
      "Tema: Repostería · 4 integrantes",
    );
    expect(metaEquipoTexto("Ropa", 1)).toBe("Tema: Ropa · 1 integrante");
    expect(metaEquipoTexto(null, 3)).toBe("Sin tema elegido · 3 integrantes");
    expect(logoLabel("Subir logo", "5A-G2 Repostería")).toBe(
      "Subir logo de 5A-G2 Repostería",
    );
    expect(movidoTexto("Yeilin Duarte", "5A-G1 Barbería")).toBe(
      "Yeilin Duarte pasó a 5A-G1 Barbería",
    );
    expect(capitanTexto("Lidny Rico", "5A-G2 Repostería")).toBe(
      "Lidny Rico es el capitán de 5A-G2 Repostería",
    );
  });
});

describe("opcionesMover", () => {
  const eqs = [
    { id: "A", nombre: "5A-G1" },
    { id: "B", nombre: "5A-G2" },
    { id: "C", nombre: "5A-G3" },
  ];
  test("excluye el equipo actual y ofrece quitar", () => {
    const o = opcionesMover(eqs, "B");
    expect(o.destinos.map((d) => d.id)).toEqual(["A", "C"]);
    expect(o.puedeQuitar).toBe(true);
  });
  test("sin equipo: todos los equipos y no quitar", () => {
    const o = opcionesMover(eqs, null);
    expect(o.destinos).toHaveLength(3);
    expect(o.puedeQuitar).toBe(false);
  });
});

describe("moverAlumno", () => {
  test("a otro equipo", () => {
    const s = moverAlumno(base, "2", "B");
    expect(s.equipos.A?.miembros).toEqual(["1", "3"]);
    expect(s.equipos.B?.miembros).toEqual(["4", "2"]);
    expect(s.equipos.B?.capitan).toBe("4");
    expect(equipoDeCedula(s, "2")).toBe("B");
    expect(base.equipos.A?.miembros).toEqual(["1", "2", "3"]);
  });
  test("quitar del equipo lo manda a Sin equipo", () => {
    const s = moverAlumno(base, "3", null);
    expect(s.sinEquipo).toEqual(["9", "3"]);
    expect(conEquipoTotal(s)).toBe(conEquipoTotal(base) - 1);
  });
  test("asignar desde Sin equipo", () => {
    const s = moverAlumno(base, "9", "A");
    expect(s.sinEquipo).toEqual([]);
    expect(s.equipos.A?.miembros).toEqual(["1", "2", "3", "9"]);
  });
  test("sacar al capitán pasa el cargo al siguiente", () => {
    const s = moverAlumno(base, "1", "B");
    expect(s.equipos.A?.capitan).toBe("2");
    expect(s.equipos.B?.capitan).toBe("4");
  });
  test("un equipo que queda en 1 tiene capitán automático", () => {
    const s = moverAlumno(moverAlumno(base, "1", null), "2", null);
    expect(s.equipos.A?.miembros).toEqual(["3"]);
    expect(s.equipos.A?.capitan).toBe("3");
  });
  test("un equipo que queda vacío no tiene capitán; el primero que llega lo es", () => {
    const vacio = moverAlumno(base, "4", null);
    expect(vacio.equipos.B).toEqual({ miembros: [], capitan: null });
    const lleno = moverAlumno(vacio, "9", "B");
    expect(lleno.equipos.B).toEqual({ miembros: ["9"], capitan: "9" });
  });
  test("mismo destino o equipo desconocido no cambia nada", () => {
    expect(moverAlumno(base, "1", "A")).toBe(base);
    expect(moverAlumno(base, "9", null)).toBe(base);
    expect(moverAlumno(base, "1", "Z")).toBe(base);
  });
});

describe("capitán", () => {
  test("cambiar capitán y ordenar con el capitán primero", () => {
    const s = cambiarCapitan(base, "A", "3");
    expect(s.equipos.A?.capitan).toBe("3");
    expect(miembrosOrdenados(s.equipos.A as never)).toEqual(["3", "1", "2"]);
  });
  test("ignora a quien no es integrante o ya es capitán", () => {
    expect(cambiarCapitan(base, "A", "4")).toBe(base);
    expect(cambiarCapitan(base, "A", "1")).toBe(base);
  });
});

describe("logo", () => {
  test("tipos y peso", () => {
    expect(validarLogo({ type: "image/webp", size: 1000 }).ok).toBe(true);
    expect(validarLogo({ type: "image/png", size: LOGO_MAX_BYTES }).ok).toBe(
      true,
    );
    const tipo = validarLogo({ type: "image/gif", size: 1000 });
    expect(tipo.ok).toBe(false);
    const peso = validarLogo({ type: "image/jpeg", size: 6 * 1024 * 1024 });
    expect(peso).toEqual({
      ok: false,
      message: "La imagen pesa 6 MB. El máximo es 5 MB.",
    });
    expect(validarLogo({ type: "image/jpeg", size: 0 }).ok).toBe(false);
  });
  test("recorte cuadrado centrado", () => {
    expect(recorteCuadrado(1000, 500)).toEqual({ x: 250, y: 0, lado: 500 });
    expect(recorteCuadrado(400, 900)).toEqual({ x: 0, y: 250, lado: 400 });
    expect(recorteCuadrado(300, 300)).toEqual({ x: 0, y: 0, lado: 300 });
  });
});

describe("datos de ejemplo del seed", () => {
  test("5A: seis equipos y 30 de 35 con equipo", () => {
    const d = equiposProfeVista("5A");
    expect(d.equipos).toHaveLength(6);
    expect(d.total).toBe(35);
    expect(conEquipoTotal(d.inicial)).toBe(30);
    expect(d.inicial.sinEquipo).toHaveLength(5);
  });
  test("5C también cuadra", () => {
    const d = equiposProfeVista("5C");
    expect(conEquipoTotal(d.inicial) + d.inicial.sinEquipo.length).toBe(
      d.total,
    );
  });
});
