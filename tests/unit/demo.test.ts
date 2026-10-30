import { describe, expect, test } from "bun:test";
import {
  ALUMNOS,
  alumnoPorCedula,
  CEDULA_DEMO,
  EQUIPOS,
  equipoDe,
  equipoPorId,
  esCapitan,
  integrantes,
  nombreCorto,
  primerNombre,
  puntosAlumno,
  rankingAlumnos,
  rankingEquipos,
} from "@/lib/demo/seed";
import { notasDe, ordenarNotas, porEntregar, TAREAS } from "@/lib/demo/tareas";
import {
  integrantesTexto,
  pendientesTexto,
  tipoTareaTexto,
} from "@/lib/sections";

describe("seed tipado", () => {
  test("69 alumnos (35 de 5A) y 12 equipos", () => {
    expect(ALUMNOS).toHaveLength(69);
    expect(ALUMNOS.filter((a) => a.seccion === "5A")).toHaveLength(35);
    expect(EQUIPOS).toHaveLength(12);
  });
  test("cédula desconocida lanza error", () => {
    expect(() => alumnoPorCedula("1")).toThrow(RangeError);
    expect(() => equipoPorId("x")).toThrow(RangeError);
  });
});

describe("estudiante de la vista previa (lienzo de Inicio)", () => {
  const yeilin = alumnoPorCedula(CEDULA_DEMO);
  test("Yeilin Duarte, capitana de 5A-G2", () => {
    expect(primerNombre(yeilin)).toBe("Yeilin");
    expect(nombreCorto(yeilin)).toBe("Yeilin Duarte");
    expect(equipoDe(yeilin)?.id).toBe("5a-g2");
    expect(esCapitan(yeilin)).toBe(true);
  });
  test("37,5 pts = 18,5 individual + 19 grupal, #1 de 35 en 5A", () => {
    expect(puntosAlumno(yeilin)).toBe(37.5);
    const ranking = rankingAlumnos("5A");
    expect(ranking).toHaveLength(35);
    expect(ranking.find((f) => f.cedula === CEDULA_DEMO)?.puesto).toBe(1);
  });
  test("integrantes: capitán primero", () => {
    const lista = integrantes(equipoPorId("5a-g2"));
    expect(lista[0].cedula).toBe(CEDULA_DEMO);
    expect(lista.every((a) => a.equipoId === "5a-g2")).toBe(true);
  });
  test("sin equipo: no suma nota grupal", () => {
    const solo = ALUMNOS.find((a) => a.equipoId === null);
    expect(solo).toBeDefined();
    if (solo) expect(equipoDe(solo)).toBeNull();
  });
});

describe("ranking de equipos (HANDOFF §8: G2 19 · G3 18 · G1 17 · G5 17 · G4 15 · G6 14)", () => {
  test("puntos y puestos de competencia", () => {
    const r = rankingEquipos("5A");
    expect(r.map((e) => [e.id, e.puntos, e.puesto])).toEqual([
      ["5a-g2", 19, 1],
      ["5a-g3", 18, 2],
      ["5a-g1", 17, 3],
      ["5a-g5", 17, 3],
      ["5a-g4", 15, 5],
      ["5a-g6", 14, 6],
    ]);
  });
});

describe("tareas de ejemplo", () => {
  test("todas suman 20 menos la evaluada sin preguntas cargadas", () => {
    for (const t of TAREAS) {
      if (t.preguntas.length === 0) continue;
      expect(t.preguntas.reduce((s, p) => s + p.valor, 0)).toBe(20);
    }
  });
  test("notas: evaluadas recientes primero, luego pendientes por fecha", () => {
    const notas = notasDe(alumnoPorCedula(CEDULA_DEMO));
    expect(notas.map((n) => [n.tarea.id, n.puntaje])).toEqual([
      ["logo-y-paleta", 19],
      ["identidad-de-marca", 18.5],
      ["competencia", null],
      ["presentacion-producto", null],
    ]);
  });
  test("alumno sin equipo: grupal Pendiente", () => {
    const solo = ALUMNOS.find((a) => a.equipoId === null);
    if (!solo) throw new Error("el seed debería tener alumnos sin equipo");
    const grupal = notasDe(solo).find((n) => n.tarea.id === "logo-y-paleta");
    expect(grupal?.puntaje).toBeNull();
  });
  test("ordenarNotas no muta la entrada", () => {
    const entrada = notasDe(alumnoPorCedula(CEDULA_DEMO)).reverse();
    const copia = [...entrada];
    ordenarNotas(entrada);
    expect(entrada).toEqual(copia);
  });
  test("por entregar: la más cercana primero", () => {
    expect(porEntregar().map((t) => t.id)).toEqual([
      "competencia",
      "presentacion-producto",
    ]);
  });
});

describe("textos compartidos", () => {
  test("singular y plural", () => {
    expect(pendientesTexto(1)).toBe("1 pendiente");
    expect(pendientesTexto(2)).toBe("2 pendientes");
    expect(integrantesTexto(1)).toBe("1 integrante");
    expect(integrantesTexto(6)).toBe("6 integrantes");
    expect(tipoTareaTexto("grupal")).toBe("Grupal");
    expect(tipoTareaTexto("individual")).toBe("Individual");
  });
});
