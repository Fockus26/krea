// «Vence» / «venció» por fecha y hora de Caracas (D357): una sola regla (`vencida`) que usan la
// lista del profe, «Por entregar», el encabezado de la tarea, Notas, Inicio y Premios.
import { describe, expect, test } from "bun:test";
import { vencida, verboVence } from "@/lib/fecha";
import { lineaPendientes } from "@/lib/inicio";
import type { Tarea } from "@/lib/modelo";
import { fechaNotaTexto } from "@/lib/notas";
import { avancePremioTexto, estadoPremio } from "@/lib/premios";
import { venceTexto } from "@/lib/tareas";
import {
  fechaTareaTexto,
  metaTarea,
  type TareaProfe,
} from "@/lib/tareas-profe";
import { estadoPremioSeccion } from "@/lib/tareas-profe-datos";
import { filasMisNotas, filasPorEntregar } from "@/lib/vistas-estudiante";

/** Instante de una hora civil de Caracas (UTC−4, sin horario de verano). */
const caracas = (dia: number, h: number, m: number) =>
  Date.UTC(2026, 10, dia, h + 4, m);

describe("vencida: el minuto de su fecha y hora en Caracas", () => {
  test("un minuto antes no; a la hora y después, sí", () => {
    expect(vencida("2026-11-05", "15:30", caracas(5, 15, 29))).toBe(false);
    expect(vencida("2026-11-05", "15:30", caracas(5, 15, 30))).toBe(true);
    expect(vencida("2026-11-05", "15:30", caracas(5, 15, 31))).toBe(true);
    // Medio minuto antes de la hora sigue sin vencer
    expect(vencida("2026-11-05", "15:30", caracas(5, 15, 29) + 30_000)).toBe(
      false,
    );
  });

  test("sin hora vence a las 23:59 de ese día", () => {
    expect(vencida("2026-11-05", null, caracas(5, 23, 58))).toBe(false);
    expect(vencida("2026-11-05", null, caracas(5, 23, 59))).toBe(true);
    expect(vencida("2026-11-05", undefined, caracas(6, 0, 1))).toBe(true);
    expect(vencida("2026-11-05", null, caracas(5, 9, 0))).toBe(false);
  });

  test("el huso es el de Caracas, no el UTC", () => {
    // 02:00 UTC del 6 = 22:00 del 5 en Caracas: una tarea del 5 sin hora aún no vence
    const ahora = Date.UTC(2026, 10, 6, 2, 0);
    expect(vencida("2026-11-05", null, ahora)).toBe(false);
    // 08:00 del 6 en UTC = 04:00 en Caracas: una de las 05:00 del 6 todavía no
    expect(vencida("2026-11-06", "05:00", Date.UTC(2026, 10, 6, 8, 0))).toBe(
      false,
    );
    expect(vencida("2026-11-06", "05:00", Date.UTC(2026, 10, 6, 9, 0))).toBe(
      true,
    );
  });

  test("sin instante (vista previa): «vence»", () => {
    expect(verboVence("2020-01-01", null)).toBe("vence");
    expect(verboVence("2026-11-05", "15:30", caracas(5, 15, 30))).toBe(
      "venció",
    );
  });
});

describe("textos con «vence» / «venció»", () => {
  const tp = (o: Partial<TareaProfe> = {}): TareaProfe => ({
    id: "a",
    titulo: "Plan",
    tipo: "individual",
    estado: "abierta",
    fecha: "2026-11-05",
    hora: "15:30",
    premio: null,
    preguntas: 1,
    suma: 20,
    avance: null,
    porEvaluar: 0,
    ...o,
  });

  test("lista del profe: el mismo día cambia a la hora", () => {
    expect(fechaTareaTexto(tp(), caracas(5, 15, 29))).toBe(
      "Vence 05/11/2026 · 3:30 p. m.",
    );
    expect(fechaTareaTexto(tp(), caracas(5, 15, 30))).toBe(
      "Venció 05/11/2026 · 3:30 p. m.",
    );
    expect(metaTarea(tp(), caracas(5, 15, 31))).toBe(
      "1 pregunta · venció 05/11/2026 · 3:30 p. m.",
    );
    expect(metaTarea(tp({ hora: null }), caracas(5, 15, 31))).toBe(
      "1 pregunta · vence 05/11/2026",
    );
  });

  test("encabezado de la tarea y Notas pendientes", () => {
    expect(venceTexto("2026-11-05", "15:30", caracas(5, 15, 29))).toBe(
      "Vence 05/11/2026 · 3:30 p. m.",
    );
    expect(venceTexto("2026-11-05", "15:30", caracas(5, 15, 30))).toBe(
      "Venció 05/11/2026 · 3:30 p. m.",
    );
    expect(fechaNotaTexto(false, "2026-11-05", "08:00", caracas(5, 8, 0))).toBe(
      "venció el 05/11/2026 · 8:00 a. m.",
    );
    expect(fechaNotaTexto(false, "2026-11-05", null, caracas(5, 8, 0))).toBe(
      "vence el 05/11/2026",
    );
    expect(fechaNotaTexto(true, "2026-11-05", "08:00", caracas(5, 9, 0))).toBe(
      "evaluada el 05/11/2026",
    );
  });

  test("Inicio: la más cercana por fecha y hora, con su hora", () => {
    const vs = [
      { fecha: "2026-11-05", hora: null },
      { fecha: "2026-11-05", hora: "10:00" },
      { fecha: "2026-11-07", hora: "08:00" },
    ];
    expect(lineaPendientes(vs, caracas(5, 9, 59))).toBe(
      "Tienes 3 tareas por entregar. La más cercana vence el 05/11/2026 · 10:00 a. m.",
    );
    expect(lineaPendientes(vs, caracas(5, 10, 0))).toBe(
      "Tienes 3 tareas por entregar. La más cercana venció el 05/11/2026 · 10:00 a. m.",
    );
    expect(
      lineaPendientes(
        [{ fecha: "2026-11-05", hora: "10:00" }],
        caracas(5, 10, 0),
      ),
    ).toBe("Tienes 1 tarea por entregar. Venció el 05/11/2026 · 10:00 a. m.");
  });

  test("Premios: avance con hora y «venció» al pasar", () => {
    const abierta = (ahora: number) =>
      estadoPremio(
        {
          estado: "abierta",
          premio: "Cine",
          fecha: "2026-11-05",
          hora: "15:30",
          ahora,
          avance: { entregaron: 2, total: 5 },
        },
        [],
      );
    const antes = abierta(caracas(5, 15, 29));
    const despues = abierta(caracas(5, 15, 30));
    expect(antes).toEqual({
      tipo: "en-juego",
      entregaron: 2,
      total: 5,
      vence: "2026-11-05",
      venceHora: "15:30",
      vencida: false,
    });
    expect(despues).toMatchObject({ vencida: true });
    if (despues.tipo !== "en-juego") throw new Error("en juego");
    expect(
      avancePremioTexto(2, 5, despues.vence, "grupal", {
        hora: despues.venceHora,
        vencida: despues.vencida,
      }),
    ).toBe("2 de 5 equipos entregaron · venció 05/11/2026 · 3:30 p. m.");
    // La tarea pasa su hora y su instante a la tarjeta de la sección
    expect(
      estadoPremioSeccion(
        {
          id: "t",
          estado: "abierta",
          premio: "Cine",
          fechaEntrega: "2026-11-05",
          horaEntrega: "15:30",
          tipo: "grupal",
        },
        "5A",
        [],
        [],
        [],
        caracas(5, 15, 29),
      ),
    ).toMatchObject({ venceHora: "15:30", vencida: false });
  });

  const tarea = (id: string, hora: string | null): Tarea & { id: string } => ({
    id,
    titulo: id,
    tipo: "individual",
    secciones: ["5A"],
    estado: "abierta",
    fechaEntrega: "2026-11-05",
    horaEntrega: hora,
    premio: null,
    preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
    importada: false,
    autorId: "45001237",
    actualizadoEn: 1,
  });
  const datos = {
    usuario: {
      cedula: "39000010",
      rol: "estudiante",
      nombres: "Adela",
      apellidos: "Pérez",
      seccion: "5A",
      base: 15,
    } as never,
    equipo: null,
    tareas: [tarea("manana", "08:00"), tarea("noche", null)],
    entregas: [],
  };

  test("«Por entregar» del alumno: la vencida por hora se cierra y sale (D451, D458)", () => {
    const filas = filasPorEntregar(datos, caracas(5, 12, 0));
    expect(filas.map((f) => [f.id, f.vencida])).toEqual([["noche", false]]);
    // Antes de las 8:00 sigue, con su hora
    expect(filasPorEntregar(datos, caracas(5, 7, 0)).map((f) => f.id)).toEqual([
      "manana",
      "noche",
    ]);
    // Sin instante (vista previa) nada sale vencido
    expect(filasPorEntregar(datos).every((f) => !f.vencida)).toBe(true);
  });

  test("Mis notas: la pendiente de las 8:00 venció a mediodía; la de sin hora, no", () => {
    const filas = filasMisNotas(datos, caracas(5, 12, 0));
    expect(filas.map((f) => [f.id, f.fecha])).toEqual([
      ["manana", "venció el 05/11/2026 · 8:00 a. m."],
      ["noche", "vence el 05/11/2026"],
    ]);
  });
});
