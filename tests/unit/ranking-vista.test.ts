import { describe, expect, test } from "bun:test";
import { rankCompetition } from "@/lib/ranking";
import {
  AYUDA_CLAVE,
  ayudaAbiertaDe,
  ayudaValor,
  ESTADOS_SLUG,
  estadoDeSlug,
  estadoSlug,
  eyebrowRanking,
  type ItemRanking,
  MAX_MOVIMIENTOS,
  type Movimiento,
  movimientoTexto,
  partirRanking,
  puntosAccesible,
  puntosConSigno,
  subtituloEquipo,
  tiempoRelativo,
  tituloLista,
  ultimosMovimientos,
} from "@/lib/ranking-vista";

function items(puntos: number[]): ItemRanking[] {
  return rankCompetition(
    puntos.map((p, i) => ({
      id: `a${i}`,
      puntos: p,
      primerApellido: String.fromCharCode(65 + i),
    })),
  ).map((f) => ({
    ...f,
    tipo: "estudiante",
    nombre: `Alumno ${f.id}`,
    estilo: "adventurer-neutral",
    seed: f.id,
  }));
}

describe("partirRanking", () => {
  test("podio con las 3 primeras y lista desde la 4.ª", () => {
    const { podio, resto } = partirRanking(items([30, 28, 26, 24, 22, 20, 18]));
    expect(podio.map((p) => p.puesto)).toEqual([1, 2, 3]);
    expect(resto.map((p) => p.puesto)).toEqual([4, 5, 6, 7]);
  });
  test("empate en el 2.º: el podio trae dos 2.º y la lista empieza en el 4", () => {
    const { podio, resto } = partirRanking(items([30, 28, 28, 20, 18, 16, 14]));
    expect(podio.map((p) => p.puesto)).toEqual([1, 2, 2]);
    expect(resto[0].puesto).toBe(4);
  });
  test("empate en el 3.º: el empatado cae en la lista con el mismo puesto", () => {
    const { podio, resto } = partirRanking(items([30, 28, 26, 26, 20, 18, 16]));
    expect(podio.map((p) => p.puesto)).toEqual([1, 2, 3]);
    expect(resto[0].puesto).toBe(3);
    expect(resto[0].empate).toBe(true);
  });
  test("con menos de 4 filas no hay lista", () => {
    const { podio, resto } = partirRanking(items([10, 5]));
    expect(podio).toHaveLength(2);
    expect(resto).toHaveLength(0);
  });
  test("conserva la zona de riesgo de rankCompetition", () => {
    const { resto } = partirRanking(
      items([30, 28, 26, 24, 22, 20, 18, 16, 14]),
    );
    expect(resto.filter((r) => r.enRiesgo)).toHaveLength(5);
  });
});

describe("textos", () => {
  test("eyebrow con singular y plural", () => {
    expect(eyebrowRanking("5A", 35, "estudiantes")).toBe(
      "Sección 5A · 35 estudiantes",
    );
    expect(eyebrowRanking("5C", 6, "equipos")).toBe("Sección 5C · 6 equipos");
    expect(eyebrowRanking("5A", 1, "equipos")).toBe("Sección 5A · 1 equipo");
  });
  test("subtítulo de equipo con capitán/capitana (D075)", () => {
    expect(subtituloEquipo(5, "Christian Sepúlveda")).toBe(
      "5 integrantes · capitán Christian Sepúlveda",
    );
    expect(subtituloEquipo(1, "Ana Pérez", true)).toBe(
      "1 integrante · capitana Ana Pérez",
    );
  });
  test("título de la lista", () => {
    expect(tituloLista(35)).toBe("Puestos 4 a 35");
  });
});

describe("tiempoRelativo", () => {
  const ahora = 1_000_000_000;
  test("segundos, minutos, horas y días", () => {
    expect(tiempoRelativo(ahora, ahora - 20_000)).toBe("hace un momento");
    expect(tiempoRelativo(ahora, ahora - 2 * 60_000)).toBe("hace 2 min");
    expect(tiempoRelativo(ahora, ahora - 59 * 60_000)).toBe("hace 59 min");
    expect(tiempoRelativo(ahora, ahora - 3 * 3_600_000)).toBe("hace 3 h");
    expect(tiempoRelativo(ahora, ahora - 50 * 3_600_000)).toBe("hace 2 d");
  });
  test("un instante futuro no da negativos", () => {
    expect(tiempoRelativo(ahora, ahora + 5000)).toBe("hace un momento");
  });
});

describe("movimientos", () => {
  const sube: Movimiento = {
    id: "1",
    tipo: "sube",
    nombre: "María Méndez",
    puesto: 4,
    cambio: 2,
    hace: 10,
  };
  test("texto de subida, bajada y ajuste", () => {
    expect(movimientoTexto(sube)).toBe("María Méndez subió al puesto 4");
    expect(
      movimientoTexto({
        ...sube,
        tipo: "baja",
        nombre: "Valentina Gámez",
        puesto: 27,
      }),
    ).toBe("Valentina Gámez bajó al puesto 27");
    expect(
      movimientoTexto({
        id: "3",
        tipo: "puntos",
        nombre: "Jorge Quintero",
        valor: 2,
        motivo: "Participación destacada",
        hace: 1,
      }),
    ).toBe("Jorge Quintero · Participación destacada");
  });
  test("puntos con signo tipográfico y texto accesible", () => {
    expect(puntosConSigno(2)).toBe("+2");
    expect(puntosConSigno(-1)).toBe("−1");
    expect(puntosConSigno(0.5)).toBe("+0,5");
    expect(puntosAccesible(2)).toBe("más 2 puntos");
    expect(puntosAccesible(-1)).toBe("menos 1 punto");
  });
  test("últimos: recientes primero y como mucho 6", () => {
    const lista: Movimiento[] = Array.from({ length: 9 }, (_, i) => ({
      ...sube,
      id: String(i),
      hace: i,
    }));
    const r = ultimosMovimientos(lista);
    expect(r).toHaveLength(MAX_MOVIMIENTOS);
    expect(r[0].id).toBe("8");
  });
});

describe("estados de la vista", () => {
  test("slug ↔ estado", () => {
    expect(
      estadoSlug({ rol: "estudiante", seccion: "5A", vista: "equipos" }),
    ).toBe("equipos");
    expect(
      estadoSlug({ rol: "profesor", seccion: "5A", vista: "estudiantes" }),
    ).toBe("profesor");
    expect(
      estadoSlug({ rol: "profesor", seccion: "5C", vista: "equipos" }),
    ).toBe("profesor-5c-equipos");
  });
  test("todos los slugs se leen y vuelven iguales", () => {
    for (const s of ESTADOS_SLUG) {
      const e = estadoDeSlug(s);
      expect(e).toBeDefined();
      if (e) expect(estadoSlug(e)).toBe(s);
    }
  });
  test("slug desconocido", () => {
    expect(estadoDeSlug("profesor-5b")).toBeUndefined();
    expect(estadoDeSlug("x")).toBeUndefined();
  });
});

describe("ayuda móvil", () => {
  test("abierta por defecto y si el valor es ilegible", () => {
    expect(ayudaAbiertaDe(null)).toBe(true);
    expect(ayudaAbiertaDe("abierto")).toBe(true);
    expect(ayudaAbiertaDe("???")).toBe(true);
  });
  test("cerrada solo si se guardó cerrada", () => {
    expect(ayudaAbiertaDe("cerrado")).toBe(false);
    expect(ayudaAbiertaDe(ayudaValor(false))).toBe(false);
    expect(ayudaAbiertaDe(ayudaValor(true))).toBe(true);
  });
  test("clave de localStorage", () => {
    expect(AYUDA_CLAVE).toBe("krea-ranking-ayuda");
  });
});
