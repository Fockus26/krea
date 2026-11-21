// Hora de entrega de las tareas (D352–D355): formato, zod, validación del constructor, lo que
// arma el servidor y dónde se muestra.
import { describe, expect, test } from "bun:test";
import { filaDeTarea, tareaDeFila } from "@/lib/data/filas";
import {
  claveVencimiento,
  esHoraValida,
  formatFechaHora,
  formatHora,
  HORA_FIN_DEL_DIA,
  horaPasada,
} from "@/lib/fecha";
import { type Tarea, zHora, zTarea, zTareaDoc } from "@/lib/modelo";
import { venceTexto } from "@/lib/tareas";
import {
  borradorReducer,
  crearBorrador,
  ERRORES,
  elegidasTexto,
  fechaTareaTexto,
  horaCampo,
  horaValor,
  mensajeErrorTarea,
  metaTarea,
  ordenarTareas,
  type TareaProfe,
  tareaAGuardar,
  tieneErrores,
  validarTarea,
} from "@/lib/tareas-profe";
import {
  armarTarea,
  datosBorradorDe,
  type EntradaTarea,
  tareaProfeDe,
  zEntradaTarea,
} from "@/lib/tareas-profe-datos";
import { filasPorEntregar } from "@/lib/vistas-estudiante";

const HOY = "2026-11-05";
// 15:00 UTC = 11:00 en Caracas (UTC−4)
const AHORA = Date.UTC(2026, 10, 5, 15);
const PROFE = "45001237";

describe("formato de la hora (D355)", () => {
  test("12 h con «a. m.» / «p. m.»", () => {
    expect(formatHora("15:30")).toBe("3:30 p. m.");
    expect(formatHora("09:05")).toBe("9:05 a. m.");
    expect(formatHora("00:00")).toBe("12:00 a. m.");
    expect(formatHora("12:00")).toBe("12:00 p. m.");
    expect(formatHora("23:59")).toBe("11:59 p. m.");
    expect(() => formatHora("24:00")).toThrow(RangeError);
  });

  test("fecha con hora; sin hora, solo la fecha", () => {
    expect(formatFechaHora("2026-11-12", "15:30")).toBe(
      "12/11/2026 · 3:30 p. m.",
    );
    expect(formatFechaHora("2026-11-12", null)).toBe("12/11/2026");
    expect(formatFechaHora("2026-11-12")).toBe("12/11/2026");
    expect(venceTexto("2026-11-12", "08:00")).toBe(
      "Vence 12/11/2026 · 8:00 a. m.",
    );
    expect(venceTexto("2026-11-12")).toBe("Vence 12/11/2026");
  });

  test("vencimiento ordenable: sin hora = final del día", () => {
    expect(claveVencimiento("2026-11-12", "15:30")).toBe("2026-11-12T15:30");
    expect(claveVencimiento("2026-11-12", null)).toBe(
      `2026-11-12T${HORA_FIN_DEL_DIA}`,
    );
    expect(claveVencimiento(null, "10:00")).toBeNull();
  });

  test("hora pasada: a la misma hora ya venció", () => {
    expect(horaPasada("10:59", "11:00")).toBe(true);
    expect(horaPasada("11:00", "11:00")).toBe(true);
    expect(horaPasada("11:01", "11:00")).toBe(false);
  });
});

describe("zod de la hora (D352)", () => {
  test("HH:MM de 24 h", () => {
    for (const h of ["00:00", "09:30", "12:00", "19:45", "23:59"]) {
      expect(zHora.safeParse(h).success).toBe(true);
      expect(esHoraValida(h)).toBe(true);
    }
    for (const h of ["24:00", "9:30", "12:60", "12:5", "1230", "", "ab:cd"]) {
      expect(zHora.safeParse(h).success).toBe(false);
      expect(esHoraValida(h)).toBe(false);
    }
  });

  const base: Tarea = {
    titulo: "Afiche",
    tipo: "individual",
    secciones: ["5A"],
    estado: "abierta",
    fechaEntrega: "2026-11-12",
    premio: null,
    preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
    importada: false,
    autorId: PROFE,
    actualizadoEn: 1,
  };

  test("en la tarea: ausente, null o válida; inválida no", () => {
    expect(zTarea.safeParse(base).success).toBe(true);
    expect(zTarea.safeParse({ ...base, horaEntrega: null }).success).toBe(true);
    expect(zTarea.parse({ ...base, horaEntrega: "15:30" }).horaEntrega).toBe(
      "15:30",
    );
    expect(zTarea.safeParse({ ...base, horaEntrega: "25:00" }).success).toBe(
      false,
    );
    expect(
      zTareaDoc.safeParse({ ...base, estado: "borrador", horaEntrega: "7:00" })
        .success,
    ).toBe(false);
  });

  test("fila de Postgres ida y vuelta", () => {
    const con = { ...base, horaEntrega: "15:30" };
    const fila = filaDeTarea("t1", con);
    expect(fila.horaEntrega).toBe("15:30");
    expect(tareaDeFila(fila)).toMatchObject({ id: "t1", horaEntrega: "15:30" });
    // Una de antes (sin hora) se guarda como NULL y vuelve sin hora
    const sin = filaDeTarea("t2", base);
    expect(sin.horaEntrega).toBeNull();
    expect(tareaDeFila(sin)?.horaEntrega ?? null).toBeNull();
    // Una fila con una hora corrupta no pasa la validación
    expect(tareaDeFila({ ...fila, horaEntrega: "99:99" })).toBeNull();
  });
});

describe("constructor: campo de hora y validación (D354)", () => {
  const lista = crearBorrador({
    titulo: "Plan de redes",
    fecha: "05/11/2026",
    secciones: ["5A"],
    preguntas: [{ enunciado: "Uno", formato: "texto", valor: 20 }],
  });
  const conHora = (hora: string, fecha = "05/11/2026") => ({
    ...lista,
    fecha,
    hora,
  });

  test("el reducer guarda la hora; vacía = sin hora", () => {
    const t = borradorReducer(lista, { tipo: "hora", valor: "15:30" });
    expect(t.hora).toBe("15:30");
    expect(tareaAGuardar(t).hora).toBe("15:30");
    expect(tareaAGuardar(lista).hora).toBeNull();
    expect(horaValor("")).toBeNull();
    expect(horaValor("7:3")).toBeNull();
    expect(horaCampo(null)).toBe("");
    expect(horaCampo("08:15")).toBe("08:15");
    expect(crearBorrador().hora).toBe("");
  });

  test("hoy con hora pasada: error; futura o sin hora: no", () => {
    expect(validarTarea(conHora("10:00"), HOY, null, "11:00").hora).toBe(
      ERRORES.horaPasada,
    );
    expect(validarTarea(conHora("11:00"), HOY, null, "11:00").hora).toBe(
      ERRORES.horaPasada,
    );
    expect(
      tieneErrores(validarTarea(conHora("10:00"), HOY, null, "11:00")),
    ).toBe(true);
    expect(validarTarea(conHora("11:01"), HOY, null, "11:00").hora).toBe(
      undefined,
    );
    expect(validarTarea(conHora(""), HOY, null, "23:58").hora).toBeUndefined();
    expect(
      tieneErrores(validarTarea(conHora("18:00"), HOY, null, "11:00")),
    ).toBe(false);
  });

  test("otro día no mira la hora; sin la hora actual tampoco", () => {
    expect(
      validarTarea(conHora("08:00", "06/11/2026"), HOY, null, "11:00").hora,
    ).toBeUndefined();
    expect(validarTarea(conHora("08:00"), HOY).hora).toBeUndefined();
  });

  test("la fecha y hora guardadas se conservan aunque ya hayan pasado", () => {
    expect(
      validarTarea(conHora("08:00"), HOY, HOY, "11:00", "08:00").hora,
    ).toBeUndefined();
    // Cambiar la hora de hoy a otra que ya pasó, no
    expect(
      validarTarea(conHora("09:00"), HOY, HOY, "11:00", "08:00").hora,
    ).toBe(ERRORES.horaPasada);
  });

  test("una hora con forma inválida es error del campo", () => {
    expect(validarTarea(conHora("7:3"), HOY).hora).toBe(ERRORES.hora);
  });
});

describe("servidor: armarTarea con hora (D354)", () => {
  const entrada = (o: Partial<EntradaTarea> = {}): EntradaTarea => ({
    titulo: "Plan de redes",
    tipo: "individual",
    fecha: HOY,
    hora: "18:00",
    secciones: ["5A"],
    premio: null,
    preguntas: [{ id: "q1", enunciado: "Uno", formato: "texto", valor: 20 }],
    ...o,
  });
  const armar = (o: Partial<Parameters<typeof armarTarea>[0]> = {}) =>
    armarTarea({
      entrada: entrada(),
      accion: "publicar",
      previa: null,
      conEntregas: false,
      autorId: PROFE,
      hoy: HOY,
      ahora: AHORA,
      ...o,
    });

  test("publicar hoy a una hora futura guarda la hora", () => {
    const r = armar();
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea.horaEntrega).toBe("18:00");
  });

  test("hoy a una hora ya pasada (en Caracas): hora-pasada", () => {
    expect(armar({ entrada: entrada({ hora: "10:30" }) })).toEqual({
      ok: false,
      error: "hora-pasada",
    });
    expect(armar({ entrada: entrada({ hora: "11:00" }) })).toEqual({
      ok: false,
      error: "hora-pasada",
    });
    expect(mensajeErrorTarea("hora-pasada")).toBe(ERRORES.horaPasada);
  });

  test("sin hora (o un envío viejo de la cola sin el campo): al final del día", () => {
    const r = armar({ entrada: entrada({ hora: null }) });
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea.horaEntrega).toBeNull();
    const { hora: _h, ...vieja } = entrada();
    const parseada = zEntradaTarea.parse(vieja);
    const r2 = armar({ entrada: parseada });
    if (!r2.ok) throw new Error(r2.error);
    expect(r2.tarea.horaEntrega).toBeNull();
    expect(zEntradaTarea.safeParse({ ...vieja, hora: "7:00" }).success).toBe(
      false,
    );
  });

  test("otro día no mira la hora", () => {
    const r = armar({
      entrada: entrada({ fecha: "2026-11-06", hora: "07:00" }),
    });
    expect(r.ok).toBe(true);
  });

  test("con entregas: conserva la hora guardada; vencida ya no se edita (D451)", () => {
    const vencida: Tarea = zTarea.parse({
      titulo: "Plan de redes",
      tipo: "individual",
      secciones: ["5A"],
      estado: "abierta",
      fechaEntrega: HOY,
      horaEntrega: "08:00",
      premio: null,
      preguntas: [{ id: "q1", enunciado: "Uno", formato: "texto", valor: 20 }],
      importada: false,
      autorId: PROFE,
      actualizadoEn: 1,
    });
    // 08:00 ya pasó a las 11:00: cerrada, la salida es reabrirla (D455)
    expect(
      armar({
        accion: "guardar",
        previa: vencida,
        conEntregas: true,
        entrada: entrada({ titulo: "Plan v2", hora: "16:00" }),
      }),
    ).toEqual({ ok: false, error: "cerrada" });
    const previa: Tarea = zTarea.parse({
      titulo: "Plan de redes",
      tipo: "individual",
      secciones: ["5A"],
      estado: "abierta",
      fechaEntrega: HOY,
      horaEntrega: "12:00",
      premio: null,
      preguntas: [{ id: "q1", enunciado: "Uno", formato: "texto", valor: 20 }],
      importada: false,
      autorId: PROFE,
      actualizadoEn: 1,
    });
    const igual = armar({
      accion: "guardar",
      previa,
      conEntregas: true,
      entrada: entrada({ titulo: "Plan v2", hora: "12:00" }),
    });
    if (!igual.ok) throw new Error(igual.error);
    expect(igual.tarea).toMatchObject({
      titulo: "Plan v2",
      horaEntrega: "12:00",
    });
    expect(
      armar({
        accion: "guardar",
        previa,
        conEntregas: true,
        entrada: entrada({ hora: "09:00" }),
      }),
    ).toEqual({ ok: false, error: "hora-pasada" });
    const movida = armar({
      accion: "guardar",
      previa,
      conEntregas: true,
      entrada: entrada({ hora: "16:00" }),
    });
    if (!movida.ok) throw new Error(movida.error);
    expect(movida.tarea.horaEntrega).toBe("16:00");
  });

  test("el borrador guarda la hora aunque no tenga fecha", () => {
    const r = armar({
      accion: "borrador",
      entrada: entrada({ fecha: null, hora: "07:45" }),
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea).toMatchObject({ fechaEntrega: null, horaEntrega: "07:45" });
  });

  test("constructor y lista leen la hora guardada", () => {
    const r = armar();
    if (!r.ok) throw new Error(r.error);
    expect(datosBorradorDe(r.tarea).hora).toBe("18:00");
    const profe = tareaProfeDe({ id: "t1", ...r.tarea }, undefined, {
      alumnos: { "5A": 30 },
      equipos: { "5A": [] },
    });
    expect(profe.hora).toBe("18:00");
    expect(fechaTareaTexto(profe, AHORA)).toBe("Vence 05/11/2026 · 6:00 p. m.");
    expect(metaTarea(profe, AHORA)).toBe(
      "1 pregunta · vence 05/11/2026 · 6:00 p. m. · 0 de 30 entregaron",
    );
    const { horaEntrega: _h, ...sinHora } = r.tarea;
    expect(datosBorradorDe(sinHora).hora).toBe("");
  });
});

describe("dónde se muestra y cómo ordena", () => {
  const tp = (id: string, fecha: string | null, hora?: string | null) =>
    ({
      id,
      titulo: id,
      tipo: "individual",
      estado: "abierta",
      fecha,
      hora,
      premio: null,
      preguntas: 1,
      suma: 20,
      avance: null,
      porEvaluar: 0,
    }) satisfies TareaProfe;

  test("lista del profe: el mismo día, la de hora más temprana primero", () => {
    const orden = ordenarTareas([
      tp("sin-hora", "2026-11-12"),
      tp("tarde", "2026-11-12", "16:00"),
      tp("temprano", "2026-11-12", "08:00"),
      tp("antes", "2026-11-11"),
      tp("sin-fecha", null),
    ]).map((t) => t.id);
    expect(orden).toEqual([
      "antes",
      "temprano",
      "tarde",
      "sin-hora",
      "sin-fecha",
    ]);
  });

  test("columna Fecha sin hora: como antes", () => {
    expect(fechaTareaTexto(tp("a", "2026-11-12"), AHORA)).toBe(
      "Vence 12/11/2026",
    );
    expect(fechaTareaTexto(tp("a", "2026-11-12", null), AHORA)).toBe(
      "Vence 12/11/2026",
    );
  });

  test("«Por entregar» del alumno: con hora y ordenadas por vencimiento", () => {
    const tarea = (fecha: string, hora: string | null): Tarea => ({
      titulo: `T ${fecha} ${hora}`,
      tipo: "individual",
      secciones: ["5A"],
      estado: "abierta",
      fechaEntrega: fecha,
      horaEntrega: hora,
      premio: null,
      preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
      importada: false,
      autorId: PROFE,
      actualizadoEn: 1,
    });
    const filas = filasPorEntregar({
      usuario: {
        cedula: "39000010",
        rol: "estudiante",
        nombres: "Adela",
        apellidos: "Pérez",
        seccion: "5A",
        base: 15,
      } as never,
      equipo: null,
      tareas: [
        { id: "b", ...tarea("2026-11-12", null) },
        { id: "a", ...tarea("2026-11-12", "09:00") },
      ],
      entregas: [],
    });
    expect(filas.map((f) => [f.id, f.vence])).toEqual([
      ["a", "12/11/2026 · 9:00 a. m."],
      ["b", "12/11/2026"],
    ]);
  });
});

describe("selector de secciones (D356)", () => {
  test("contador por año", () => {
    expect(elegidasTexto(0)).toBe("Ninguna elegida");
    expect(elegidasTexto(1)).toBe("1 elegida");
    expect(elegidasTexto(2)).toBe("2 elegidas");
  });
});
