import { describe, expect, test } from "bun:test";
import { COLA } from "@/lib/demo/evaluar";
import { TAREAS } from "@/lib/demo/tareas";
import { titulosTopbar } from "@/lib/demo/topbar";
import { rutasTopbar, topbarDe } from "@/lib/topbar";

// Rutas finales del brief de la fase 05 (orchestration-2026-11-03-f05-ola1.md, «Formas compartidas»)
const ESTUDIANTE = [
  "/",
  "/notas",
  "/notas/[tarea]",
  "/tareas",
  "/tareas/[tarea]",
  "/equipo",
  "/ranking",
  "/perfil",
];
const PROFESOR = [
  "/profe",
  "/profe/evaluar",
  "/profe/evaluar/[entrega]",
  "/profe/tareas",
  "/profe/tareas/nueva",
  "/profe/tareas/[id]",
  "/profe/alumnos",
  "/profe/equipos",
  "/profe/puntos",
  "/profe/premios",
  "/profe/ranking",
  "/profe/perfil",
  "/profe/profesores",
];

describe("tabla de rutas", () => {
  test("cubre exactamente las rutas finales de cada rol", () => {
    expect([...rutasTopbar("estudiante")].sort()).toEqual(
      [...ESTUDIANTE].sort(),
    );
    expect([...rutasTopbar("profesor")].sort()).toEqual([...PROFESOR].sort());
  });
});

describe("topbarDe · estudiante", () => {
  test.each([
    "/",
    "/notas",
    "/tareas",
    "/equipo",
    "/perfil",
  ])("%s: logo, sin En vivo, con barra inferior", (ruta) => {
    expect(topbarDe("estudiante", ruta)).toEqual({
      variante: "logo",
      enVivo: false,
      barraInferior: true,
      soloAccion: false,
    });
  });

  test("/ranking: logo con el chip En vivo (también en sus subrutas)", () => {
    for (const ruta of ["/ranking", "/ranking/equipos"]) {
      const t = topbarDe("estudiante", ruta);
      expect(t.variante).toBe("logo");
      expect(t.enVivo).toBe(true);
      expect(t.barraInferior).toBe(true);
    }
  });

  test("/notas/[tarea]: volver a Mis notas + título de la tarea", () => {
    const t = topbarDe("estudiante", "/notas/identidad-de-marca", {
      "/notas/identidad-de-marca": "Identidad de marca",
    });
    expect(t).toEqual({
      variante: "detalle",
      titulo: "Identidad de marca",
      volver: { href: "/notas", label: "Volver a Mis notas" },
      enVivo: false,
      barraInferior: true,
      soloAccion: false,
    });
  });

  test("/tareas/[tarea]: volver a Tareas + tipo de tarea", () => {
    const t = topbarDe("estudiante", "/tareas/x", {
      "/tareas/x": "Tarea grupal",
    });
    expect(t.variante).toBe("detalle");
    expect(t.titulo).toBe("Tarea grupal");
    expect(t.volver).toEqual({ href: "/tareas", label: "Volver a Tareas" });
    expect(t.barraInferior).toBe(true);
  });

  test("sin título resuelto usa el de reserva", () => {
    expect(topbarDe("estudiante", "/notas/desconocida").titulo).toBe(
      "Mis notas",
    );
    expect(topbarDe("estudiante", "/tareas/desconocida").titulo).toBe("Tareas");
  });

  test("las rutas del profe no aplican al estudiante: logo por defecto", () => {
    expect(topbarDe("estudiante", "/profe/tareas/nueva").variante).toBe("logo");
    expect(topbarDe("estudiante", "/profe/tareas/nueva").barraInferior).toBe(
      true,
    );
  });
});

describe("topbarDe · profesor", () => {
  test.each([
    "/profe",
    "/profe/evaluar",
    "/profe/tareas",
    "/profe/alumnos",
    "/profe/equipos",
    "/profe/puntos",
    "/profe/premios",
    "/profe/perfil",
    "/profe/profesores",
  ])("%s: logo, sin En vivo, con barra inferior", (ruta) => {
    expect(topbarDe("profesor", ruta)).toEqual({
      variante: "logo",
      enVivo: false,
      barraInferior: true,
      soloAccion: false,
    });
  });

  test("/profe/ranking: chip En vivo", () => {
    expect(topbarDe("profesor", "/profe/ranking").enVivo).toBe(true);
    expect(topbarDe("profesor", "/profe/ranking/5c").enVivo).toBe(true);
    // /ranking es del estudiante
    expect(topbarDe("profesor", "/ranking").enVivo).toBe(false);
  });

  test("/profe/evaluar/[entrega]: X «Salir de la evaluación» → /profe, «Entrega n de m», con barra inferior", () => {
    const t = topbarDe("profesor", "/profe/evaluar/abc", {
      "/profe/evaluar/abc": "Entrega 1 de 7",
    });
    expect(t).toEqual({
      variante: "evaluar",
      titulo: "Entrega 1 de 7",
      volver: { href: "/profe", label: "Salir de la evaluación" },
      enVivo: false,
      barraInferior: true,
      soloAccion: false,
    });
    expect(topbarDe("profesor", "/profe/evaluar/otra").titulo).toBe(
      "Evaluar entrega",
    );
  });

  test("constructor (nueva y [id]): volver a Tareas + «Nueva tarea», sin barra inferior, solo la acción", () => {
    for (const ruta of ["/profe/tareas/nueva", "/profe/tareas/plan-redes"]) {
      expect(topbarDe("profesor", ruta)).toEqual({
        variante: "detalle",
        titulo: "Nueva tarea",
        volver: { href: "/profe/tareas", label: "Volver a Tareas" },
        enVivo: false,
        barraInferior: false,
        soloAccion: true,
      });
    }
  });
});

describe("normalización", () => {
  test("ignora barra final, query y hash; nulo = raíz", () => {
    expect(
      topbarDe("estudiante", "/notas/x/?a=1#b", { "/notas/x": "T" }),
    ).toMatchObject({ variante: "detalle", titulo: "T" });
    expect(topbarDe("profesor", "/profe/tareas/nueva/").barraInferior).toBe(
      false,
    );
    expect(topbarDe("estudiante", null).variante).toBe("logo");
  });

  test("un segmento de más no cae en la ruta dinámica", () => {
    expect(topbarDe("estudiante", "/notas/x/y").variante).toBe("logo");
    expect(topbarDe("profesor", "/profe/evaluar/a/b").variante).toBe("logo");
  });
});

describe("titulosTopbar (lib/demo)", () => {
  test("estudiante: título de cada tarea en /notas y su tipo en /tareas", () => {
    const t = titulosTopbar("estudiante");
    for (const tarea of TAREAS) {
      expect(t[`/notas/${tarea.id}`]).toBe(tarea.titulo);
      expect(t[`/tareas/${tarea.id}`]).toBe(
        tarea.tipo === "grupal" ? "Tarea grupal" : "Tarea individual",
      );
    }
  });

  test("profesor: «Entrega n de m» por entrega de la cola", () => {
    const t = titulosTopbar("profesor");
    expect(Object.keys(t)).toHaveLength(COLA.length + TAREAS.length);
    const [primera] = COLA;
    expect(primera).toBeDefined();
    expect(t[`/profe/evaluar/${primera?.id}`]).toBe(
      `Entrega 1 de ${COLA.length}`,
    );
    expect(
      topbarDe("profesor", `/profe/evaluar/${primera?.id}`, t).titulo,
    ).toBe(`Entrega 1 de ${COLA.length}`);
  });

  test("profesor: el constructor de cada tarea de TAREAS lleva su título", () => {
    const t = titulosTopbar("profesor");
    for (const tarea of TAREAS) {
      expect(topbarDe("profesor", `/profe/tareas/${tarea.id}`, t).titulo).toBe(
        tarea.titulo,
      );
    }
    // El borrador y la tarea nueva conservan «Nueva tarea» del lienzo
    expect(topbarDe("profesor", "/profe/tareas/plan-redes", t).titulo).toBe(
      "Nueva tarea",
    );
  });
});
