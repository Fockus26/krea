// Lo puro de «Devolver al alumno» y «Eliminar entrega» (tanda 11-14 X1, D411–D415).
import { describe, expect, test } from "bun:test";
import {
  comprobarDevolver,
  comprobarEliminar,
  devolverDescripcion,
  devolverEntrega,
  devolverTextoBoton,
  eliminarDescripcion,
  errorDevolverTexto,
  masAccionesLabel,
  puedeDevolver,
  zDevolverEntrega,
  zEliminarEntrega,
} from "@/lib/devolver-entrega";
import type { Entrega, Evaluacion } from "@/lib/modelo";

const evaluacion: Evaluacion = {
  puntos: { p1: 18 },
  comentarios: {},
  puntaje: 18,
  evaluadaPor: "30262232",
  evaluadaEn: 500,
  bases: { "39711001": 15 },
};

const evaluada: Entrega = {
  tareaId: "t1",
  tipo: "individual",
  titularId: "39711001",
  seccion: "5A",
  integrantes: ["39711001"],
  estado: "evaluada",
  respuestas: { p1: { texto: "Hola" } },
  enviadaPor: "39711001",
  enviadaEn: 100,
  evaluacion,
  evaluacionAnterior: null,
};

const entregada: Entrega = {
  ...evaluada,
  estado: "entregada",
  evaluacion: null,
};

describe("puedeDevolver (D411)", () => {
  test("evaluada y tarea abierta", () => {
    expect(puedeDevolver(evaluada, { estado: "abierta" })).toBe(true);
  });
  test("no con la tarea cerrada, sin nota o sin tarea", () => {
    expect(puedeDevolver(evaluada, { estado: "evaluada" })).toBe(false);
    expect(puedeDevolver(entregada, { estado: "abierta" })).toBe(false);
    expect(puedeDevolver(evaluada, null)).toBe(false);
  });
});

describe("comprobarDevolver", () => {
  test("la nota que el profe veía y la tarea abierta: nada que objetar", () => {
    expect(comprobarDevolver(evaluada, { estado: "abierta" }, 500)).toBeNull();
  });
  test("sin nota → no-evaluada; otra nota → cambio; cerrada → tarea-cerrada", () => {
    expect(comprobarDevolver(entregada, { estado: "abierta" }, 500)).toBe(
      "no-evaluada",
    );
    expect(comprobarDevolver(evaluada, { estado: "abierta" }, 499)).toBe(
      "cambio",
    );
    expect(comprobarDevolver(evaluada, { estado: "evaluada" }, 500)).toBe(
      "tarea-cerrada",
    );
  });
});

describe("devolverEntrega (D412)", () => {
  test("queda entregada, sin evaluación y sin evaluacionAnterior; lo demás igual", () => {
    const d = devolverEntrega({ ...evaluada, evaluacionAnterior: evaluacion });
    expect(d.estado).toBe("entregada");
    expect(d.evaluacion).toBeNull();
    expect("evaluacionAnterior" in d).toBe(false);
    expect(d.respuestas).toEqual(evaluada.respuestas);
    expect(d.enviadaEn).toBe(100);
  });
  test("una evaluada sin respuestas (histórica) se devuelve igual", () => {
    const d = devolverEntrega({ ...evaluada, respuestas: {} });
    expect(d).toMatchObject({ estado: "entregada", respuestas: {} });
  });
  test("conserva los campos que no conoce (otra unidad los añade)", () => {
    const conExtra = { ...evaluada, extra: ["x"] } as Entrega;
    expect(
      (devolverEntrega(conExtra) as Record<string, unknown>).extra,
    ).toEqual(["x"]);
  });
});

describe("comprobarEliminar (D413)", () => {
  test("mismo envío y misma nota", () => {
    expect(
      comprobarEliminar(evaluada, { enviadaEn: 100, evaluadaEn: 500 }),
    ).toBeNull();
    expect(
      comprobarEliminar(entregada, { enviadaEn: 100, evaluadaEn: null }),
    ).toBeNull();
  });
  test("reenviada u otra nota → cambio; un borrador no es una entrega", () => {
    expect(
      comprobarEliminar(evaluada, { enviadaEn: 101, evaluadaEn: 500 }),
    ).toBe("cambio");
    expect(
      comprobarEliminar(evaluada, { enviadaEn: 100, evaluadaEn: null }),
    ).toBe("cambio");
    expect(
      comprobarEliminar(
        { ...entregada, estado: "borrador" },
        { enviadaEn: 100, evaluadaEn: null },
      ),
    ).toBe("no-existe");
  });
});

describe("entrada de las acciones", () => {
  test("zod: ids válidos e instantes", () => {
    expect(
      zDevolverEntrega.safeParse({ entregaId: "t1__39711001", evaluadaEn: 5 })
        .success,
    ).toBe(true);
    expect(
      zDevolverEntrega.safeParse({ entregaId: "../x", evaluadaEn: 5 }).success,
    ).toBe(false);
    expect(
      zEliminarEntrega.safeParse({
        entregaId: "t1__39711001",
        enviadaEn: null,
        evaluadaEn: null,
      }).success,
    ).toBe(true);
    expect(
      zEliminarEntrega.safeParse({ entregaId: "t1__39711001" }).success,
    ).toBe(false);
  });
});

describe("textos (filas 218–222)", () => {
  test("botones y nombre accesible", () => {
    expect(masAccionesLabel("Ana Pérez")).toBe("Más acciones de Ana Pérez");
    expect(devolverTextoBoton("individual")).toBe("Devolver al alumno");
    expect(devolverTextoBoton("grupal")).toBe("Devolver al equipo");
  });
  test("qué se pierde: nombra al equipo y a todos sus integrantes", () => {
    expect(
      devolverDescripcion({ nombre: "Ana Pérez", tipo: "individual" }),
    ).toBe(
      "Se borra la nota de Ana Pérez en esta tarea y su puntaje sale del ranking; podrá editar y volver a entregar.",
    );
    expect(
      devolverDescripcion({ nombre: "Los Pixel", tipo: "grupal" }),
    ).toContain("equipo Los Pixel");
    expect(
      eliminarDescripcion({
        nombre: "Ana Pérez",
        tipo: "individual",
        evaluada: true,
      }),
    ).toBe(
      "Se borran las respuestas, las imágenes y la nota de Ana Pérez y su puntaje sale del ranking. No se puede deshacer.",
    );
    expect(
      eliminarDescripcion({
        nombre: "Los Pixel",
        tipo: "grupal",
        evaluada: false,
      }),
    ).toBe(
      "Se borran las respuestas y las imágenes del equipo Los Pixel, para todos sus integrantes. No se puede deshacer.",
    );
  });
  test("cada error tiene su texto", () => {
    for (const e of [
      "no-existe",
      "invalida",
      "cambio",
      "no-evaluada",
      "tarea-cerrada",
      "red",
    ] as const) {
      expect(errorDevolverTexto(e).length).toBeGreaterThan(10);
    }
    expect(errorDevolverTexto("tarea-cerrada")).toContain("abierta");
  });
});
