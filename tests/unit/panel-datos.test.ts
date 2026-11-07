import { describe, expect, test } from "bun:test";
import { mapasEvaluar } from "@/lib/evaluar-datos";
import type { Ajuste, Entrega, Tarea, Usuario } from "@/lib/modelo";
import {
  AJUSTES_RECIENTES,
  panelDatosDe,
  SIN_TAREA_EVALUADA,
} from "@/lib/panel-datos";

const alumno = (cedula: string, seccion: "5A" | "5C", base = 20): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "María de los Ángeles",
  apellidos: "Méndez Rivas",
  seccion,
  equipoId: null,
  base,
  avatar: { estilo: "fun-emoji", semilla: cedula },
  actualizadoEn: 1,
});

const tarea: { id: string } & Tarea = {
  id: "t1",
  titulo: "Identidad de marca",
  tipo: "individual",
  secciones: ["5A"],
  estado: "evaluada",
  fechaEntrega: "2026-10-10",
  premio: null,
  preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
};

const entrega = (
  titular: string,
  o: Partial<Entrega> = {},
): { id: string } & Entrega => ({
  id: `t1__${titular}`,
  tareaId: "t1",
  tipo: "individual",
  titularId: titular,
  seccion: "5A",
  integrantes: [titular],
  estado: "entregada",
  respuestas: {},
  enviadaPor: titular,
  enviadaEn: Date.UTC(2026, 9, 24, 15),
  evaluacion: null,
  ...o,
});

const evaluada = (titular: string, puntaje: number) =>
  entrega(titular, {
    estado: "evaluada",
    evaluacion: {
      puntos: { p1: puntaje },
      comentarios: {},
      puntaje,
      evaluadaPor: null,
      evaluadaEn: 5,
    },
  });

const mapas = mapasEvaluar({
  usuarios: [
    alumno("30000001", "5A", 10),
    alumno("30000002", "5A"),
    alumno("30000003", "5A"),
    alumno("30000004", "5C"),
  ],
  equipos: [],
  tareas: [tarea],
});

describe("panelDatosDe", () => {
  test("cola, avance y raspados de la tarea evaluada más reciente (con base)", () => {
    const pendiente = entrega("30000003");
    const d = panelDatosDe({
      cola: [pendiente],
      entregas: [evaluada("30000001", 18), evaluada("30000002", 18), pendiente],
      ajustes: [],
      mapas,
    });
    expect(d.tareaEvaluada).toBe("Identidad de marca");
    // 5C no tiene la tarea: 0 de 0
    expect(d.avance).toEqual({
      "5A": { evaluados: 2, total: 3 },
      "5C": { evaluados: 0, total: 0 },
    });
    // 18 × 10 / 20 = 9 → raspado
    expect(d.raspados).toEqual([
      { seccion: "5A", nombre: "María de los Ángeles Méndez", nota: 9 },
    ]);
    expect(d.entregas).toHaveLength(1);
    expect(d.entregas[0]).toMatchObject({
      id: "t1__30000003",
      nombre: "María Méndez · 5A",
      meta: "Identidad de marca · Individual · 24/10/2026",
    });
  });

  test("una sección nueva (4B): avance propio, sin `undefined` y las secciones del filtro (D323)", () => {
    const de4B: Usuario = { ...alumno("40000001", "5A"), seccion: "4B" };
    const t = { ...tarea, secciones: ["4B", "5A"] };
    const d = panelDatosDe({
      cola: [],
      entregas: [
        { ...evaluada("40000001", 8), seccion: "4B" },
        evaluada("30000001", 18),
      ],
      ajustes: [],
      mapas: mapasEvaluar({
        usuarios: [...mapas.usuarios.values(), de4B],
        equipos: [],
        tareas: [t],
      }),
      secciones: ["4B", "5A", "5C", "6A"],
    });
    expect(d.secciones).toEqual(["4B", "5A", "5C", "6A"]);
    expect(d.avance).toEqual({
      "4B": { evaluados: 1, total: 1 },
      "5A": { evaluados: 1, total: 3 },
      "5C": { evaluados: 0, total: 0 },
      "6A": { evaluados: 0, total: 0 },
    });
    expect(d.raspados.map((r) => r.seccion)).toEqual(["4B", "5A"]);
  });

  test("sin evaluaciones; los últimos ajustes, del más reciente, con «Otro» y su detalle", () => {
    const aj = (id: string, en: number, o: Partial<Ajuste> = {}) => ({
      id,
      destino: "alumno" as const,
      destinoId: "30000001",
      seccion: "5A" as const,
      motivoId: "ayudo",
      motivo: "Ayudó a un compañero",
      valor: 1,
      nota: null,
      autorId: null,
      en,
      anulaA: null,
      ...o,
    });
    const d = panelDatosDe({
      cola: [],
      entregas: [],
      ajustes: [
        aj("a", 1),
        aj("b", 5, {
          motivoId: "otro",
          motivo: "Otro",
          nota: "Trajo material",
        }),
        aj("c", 3),
        aj("d", 2),
        aj("e", 4),
      ],
      mapas,
    });
    expect(d.tareaEvaluada).toBe(SIN_TAREA_EVALUADA);
    expect(d.ajustes.map((a) => a.id)).toEqual(["b", "e", "c", "d"]);
    expect(d.ajustes).toHaveLength(AJUSTES_RECIENTES);
    expect(d.ajustes[0]?.motivo).toBe('Otro: "Trajo material"');
  });
});
