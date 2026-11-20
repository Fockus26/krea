// La tarea se cierra sola al vencer y se reabre para todos o para algunos (tanda 2026-11-20 Q4,
// D451–D456): estado efectivo, cerrada para todos, prórrogas y lo que escribe «Reabrir tarea».
import { describe, expect, test } from "bun:test";
import {
  cerradaParaTodos,
  estadoEfectivo,
  estadoEn,
  prorrogasVigentes,
  type TareaConVencimiento,
  vencimientoDe,
} from "@/lib/estado-tarea";
import type { Tarea } from "@/lib/modelo";
import {
  armarReabrir,
  errorVencimientoNuevo,
  type ReabrirTarea,
  titularesReabrir,
  titularesValidos,
  validarReabrir,
} from "@/lib/reabrir-tarea";

/** Instante de una hora civil de Caracas (UTC−4, sin horario de verano). */
const caracas = (dia: number, h: number, m: number) =>
  Date.UTC(2026, 10, dia, h + 4, m);

const t = (o: Partial<TareaConVencimiento> = {}): TareaConVencimiento => ({
  estado: "abierta",
  fechaEntrega: "2026-11-20",
  horaEntrega: "15:30",
  ...o,
});

describe("estadoEfectivo (D451, D452)", () => {
  test("borrador sigue borrador aunque su fecha haya pasado", () => {
    expect(estadoEfectivo(t({ estado: "borrador" }), caracas(25, 9, 0))).toBe(
      "borrador",
    );
  });

  test("abierta sin fecha: abierta", () => {
    expect(estadoEfectivo(t({ fechaEntrega: null }), caracas(25, 9, 0))).toBe(
      "abierta",
    );
  });

  test("antes de la hora de Caracas abierta; a la hora y después, cerrada", () => {
    expect(estadoEfectivo(t(), caracas(20, 15, 29))).toBe("abierta");
    expect(estadoEfectivo(t(), caracas(20, 15, 30))).toBe("cerrada");
    expect(estadoEfectivo(t(), caracas(21, 8, 0))).toBe("cerrada");
    // 19:00 UTC = 15:00 en Caracas: el huso es el del liceo
    expect(estadoEfectivo(t(), Date.UTC(2026, 10, 20, 19, 0))).toBe("abierta");
  });

  test("sin hora vence a las 23:59 de su día", () => {
    const sinHora = t({ horaEntrega: null });
    expect(estadoEfectivo(sinHora, caracas(20, 23, 58))).toBe("abierta");
    expect(estadoEfectivo(sinHora, caracas(20, 23, 59))).toBe("cerrada");
  });

  test("cerrada a mano: cerrada aunque no haya vencido", () => {
    expect(estadoEfectivo(t({ estado: "evaluada" }), caracas(10, 9, 0))).toBe(
      "cerrada",
    );
  });

  test("prórroga vigente: abierta solo para su titular", () => {
    const conP = t({
      prorrogas: { "30111222": { fecha: "2026-11-22", hora: "10:00" } },
    });
    const ahora = caracas(21, 9, 0);
    expect(estadoEfectivo(conP, ahora, "30111222")).toBe("abierta");
    expect(estadoEfectivo(conP, ahora, "30999888")).toBe("cerrada");
    expect(estadoEfectivo(conP, ahora)).toBe("cerrada");
    // También después de cerrarla a mano (reabierta para algunos, D452)
    expect(
      estadoEfectivo({ ...conP, estado: "evaluada" }, ahora, "30111222"),
    ).toBe("abierta");
  });

  test("prórroga vencida: cerrada también para su titular", () => {
    const conP = t({
      prorrogas: { "30111222": { fecha: "2026-11-22", hora: "10:00" } },
    });
    expect(estadoEfectivo(conP, caracas(22, 10, 0), "30111222")).toBe(
      "cerrada",
    );
  });

  test("sin instante (vista previa): el estado guardado", () => {
    expect(estadoEn(t(), undefined)).toBe("abierta");
    expect(estadoEn(t({ estado: "evaluada" }), undefined)).toBe("cerrada");
    expect(estadoEn(t(), caracas(21, 9, 0))).toBe("cerrada");
  });
});

describe("cerradaParaTodos (D453)", () => {
  const ahora = caracas(21, 9, 0);
  test("vencida o cerrada a mano, sin prórrogas vigentes", () => {
    expect(cerradaParaTodos(t(), ahora)).toBe(true);
    expect(cerradaParaTodos(t({ estado: "evaluada" }), caracas(1, 9, 0))).toBe(
      true,
    );
    expect(cerradaParaTodos(t(), caracas(20, 9, 0))).toBe(false);
    expect(cerradaParaTodos(t({ estado: "borrador" }), ahora)).toBe(false);
  });

  test("con una prórroga vigente no; cuando vence, sí", () => {
    const conP = t({
      prorrogas: {
        e1: { fecha: "2026-11-22", hora: null },
        e2: { fecha: "2026-11-20", hora: "16:00" },
      },
    });
    expect(cerradaParaTodos(conP, ahora)).toBe(false);
    expect(prorrogasVigentes(conP, ahora)).toEqual(["e1"]);
    expect(cerradaParaTodos(conP, caracas(22, 23, 59))).toBe(true);
  });

  test("vencimientoDe: la fecha de su prórroga, o la de la tarea", () => {
    const conP = t({ prorrogas: { e1: { fecha: "2026-11-22", hora: null } } });
    expect(vencimientoDe(conP, "e1")).toEqual({
      fecha: "2026-11-22",
      hora: null,
    });
    expect(vencimientoDe(conP, "e2")).toEqual({
      fecha: "2026-11-20",
      hora: "15:30",
    });
    expect(vencimientoDe(conP)).toEqual({ fecha: "2026-11-20", hora: "15:30" });
  });
});

/* ---------- Reabrir (D455, D456) ---------- */

const TAREA: Tarea = {
  titulo: "Identidad de marca",
  tipo: "individual",
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-20",
  horaEntrega: "15:30",
  premio: null,
  preguntas: [{ id: "p1", enunciado: "¿Qué es?", formato: "texto", valor: 20 }],
  importada: false,
  autorId: null,
  actualizadoEn: 100,
};
const AHORA = caracas(21, 9, 0);
const HOY = "2026-11-21";
const VALIDOS = new Set(["30111222", "30999888"]);

const envio = (o: Partial<ReabrirTarea> = {}): ReabrirTarea => ({
  id: "t1",
  actualizadoEn: 100,
  para: "todos",
  fecha: "2026-11-24",
  hora: "10:00",
  titulares: [],
  ...o,
});

const armar = (e: ReabrirTarea, previa = TAREA, ahora = AHORA) =>
  armarReabrir({ previa, envio: e, validos: VALIDOS, hoy: HOY, ahora });

describe("armarReabrir", () => {
  test("para todos: abierta con la fecha nueva y sin prórrogas", () => {
    const previa = {
      ...TAREA,
      prorrogas: { "30111222": { fecha: "2026-11-22", hora: null } },
    };
    expect(armar(envio(), previa)).toEqual({
      ok: true,
      cambios: {
        estado: "abierta",
        fechaEntrega: "2026-11-24",
        horaEntrega: "10:00",
        prorrogas: null,
      },
    });
    // Cerrada a mano también se reabre
    expect(armar(envio(), { ...TAREA, estado: "evaluada" })).toMatchObject({
      ok: true,
      cambios: { estado: "abierta" },
    });
  });

  test("para algunos: el estado no cambia y las prórrogas son las pedidas", () => {
    const r = armar(
      envio({ para: "algunos", titulares: ["30111222"], hora: null }),
      { ...TAREA, estado: "evaluada" },
    );
    expect(r).toEqual({
      ok: true,
      cambios: {
        estado: "evaluada",
        fechaEntrega: "2026-11-20",
        horaEntrega: "15:30",
        prorrogas: { "30111222": { fecha: "2026-11-24", hora: null } },
      },
    });
  });

  test("para algunos sin nadie: quita las prórrogas (cierra para todos)", () => {
    const previa = {
      ...TAREA,
      prorrogas: { "30111222": { fecha: "2026-11-22", hora: null } },
    };
    expect(
      armar(
        envio({ para: "algunos", titulares: [], fecha: null, hora: null }),
        previa,
      ),
    ).toMatchObject({ ok: true, cambios: { prorrogas: null } });
  });

  test("el reintento del mismo pedido no falla ni reescribe", () => {
    const yaReabierta = {
      ...TAREA,
      fechaEntrega: "2026-11-24",
      horaEntrega: "10:00",
      actualizadoEn: 200,
    };
    expect(armar(envio(), yaReabierta)).toEqual({ ok: true, cambios: null });
    const conP = {
      ...TAREA,
      actualizadoEn: 200,
      prorrogas: { "30111222": { fecha: "2026-11-24", hora: "10:00" } },
    };
    expect(
      armar(envio({ para: "algunos", titulares: ["30111222"] }), conP),
    ).toEqual({ ok: true, cambios: null });
  });

  test("otro profe la cambió, o ya no está cerrada: cambio", () => {
    expect(armar(envio({ actualizadoEn: 99 }))).toEqual({
      ok: false,
      error: "cambio",
    });
    // Sigue abierta (no venció): no hay qué reabrir
    expect(armar(envio(), TAREA, caracas(20, 9, 0))).toEqual({
      ok: false,
      error: "cambio",
    });
  });

  test("fecha y hora nuevas: futuras y a un año como mucho", () => {
    expect(armar(envio({ fecha: "2026-11-20" }))).toEqual({
      ok: false,
      error: "fecha-pasada",
    });
    expect(armar(envio({ fecha: HOY, hora: "08:00" }))).toEqual({
      ok: false,
      error: "hora-pasada",
    });
    expect(armar(envio({ fecha: "2028-01-01" }))).toEqual({
      ok: false,
      error: "fecha-lejana",
    });
    expect(errorVencimientoNuevo(HOY, null, HOY, AHORA)).toBeNull();
  });

  test("titulares que no son de sus secciones, borrador o importada: invalida", () => {
    expect(armar(envio({ para: "algunos", titulares: ["30555444"] }))).toEqual({
      ok: false,
      error: "invalida",
    });
    expect(armar(envio(), { ...TAREA, importada: true })).toEqual({
      ok: false,
      error: "invalida",
    });
  });
});

describe("titulares del diálogo", () => {
  const usuarios = [
    {
      cedula: "2",
      rol: "estudiante",
      seccion: "5A",
      nombres: "Zoe",
      apellidos: "Paz",
    },
    {
      cedula: "1",
      rol: "estudiante",
      seccion: "5A",
      nombres: "Ana",
      apellidos: "Ríos",
    },
    {
      cedula: "3",
      rol: "estudiante",
      seccion: "5C",
      nombres: "Leo",
      apellidos: "Mar",
    },
    {
      cedula: "4",
      rol: "profesor",
      seccion: null,
      nombres: "Profe",
      apellidos: "X",
    },
  ] as const;
  const equipos = [
    { id: "e1", seccion: "5A", nombre: "Los Pixeles" },
    { id: "e2", seccion: "5C", nombre: "Tipos Duros" },
  ];

  test("individual: alumnos de sus secciones por nombre, con entrega y prórroga", () => {
    const filas = titularesReabrir({
      tarea: {
        ...TAREA,
        prorrogas: { "1": { fecha: "2026-11-24", hora: null } },
      },
      usuarios,
      equipos,
      entregas: [{ estado: "entregada", titularId: "2" }],
      ahora: AHORA,
    });
    expect(filas).toEqual([
      {
        id: "1",
        nombre: "Ana Ríos",
        seccion: "5A",
        entrego: false,
        prorroga: { fecha: "2026-11-24", hora: null },
      },
      {
        id: "2",
        nombre: "Zoe Paz",
        seccion: "5A",
        entrego: true,
        prorroga: null,
      },
    ]);
    expect([...titularesValidos(TAREA, usuarios, equipos)].sort()).toEqual([
      "1",
      "2",
    ]);
  });

  test("grupal: los equipos de sus secciones", () => {
    const grupal = {
      ...TAREA,
      tipo: "grupal" as const,
      secciones: ["5A", "5C"],
    };
    expect(
      titularesReabrir({
        tarea: grupal,
        usuarios,
        equipos,
        entregas: [],
        ahora: AHORA,
      }).map((f) => f.id),
    ).toEqual(["e1", "e2"]);
    expect([...titularesValidos(grupal, usuarios, equipos)]).toEqual([
      "e1",
      "e2",
    ]);
  });
});

describe("validarReabrir (el diálogo)", () => {
  const campos = {
    para: "todos" as const,
    tipo: "individual" as const,
    fecha: "24/11/2026",
    hora: "",
    marcados: [],
    conProrrogas: false,
  };

  test("fecha del campo a ISO; sin hora, al final del día", () => {
    expect(validarReabrir(campos, HOY, AHORA)).toEqual({
      ok: true,
      fecha: "2026-11-24",
      hora: null,
    });
  });

  test("fecha vacía, pasada o con la hora de hoy ya pasada", () => {
    expect(validarReabrir({ ...campos, fecha: "" }, HOY, AHORA)).toMatchObject({
      ok: false,
      errores: { fecha: "Escribe la fecha como dd/mm/aaaa." },
    });
    expect(
      validarReabrir({ ...campos, fecha: "20/11/2026" }, HOY, AHORA),
    ).toMatchObject({
      ok: false,
      errores: { fecha: "La fecha de entrega ya pasó." },
    });
    expect(
      validarReabrir(
        { ...campos, fecha: "21/11/2026", hora: "08:30" },
        HOY,
        AHORA,
      ),
    ).toMatchObject({
      ok: false,
      errores: { hora: "La hora de entrega de hoy ya pasó." },
    });
  });

  test("para algunos sin marcados: quita las prórrogas, o pide marcar", () => {
    const algunos = { ...campos, para: "algunos" as const, fecha: "" };
    expect(
      validarReabrir({ ...algunos, conProrrogas: true }, HOY, AHORA),
    ).toEqual({ ok: true, fecha: null, hora: null });
    expect(validarReabrir(algunos, HOY, AHORA)).toEqual({
      ok: false,
      errores: { titulares: "Marca al menos un alumno." },
    });
  });
});
