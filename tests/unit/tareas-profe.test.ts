import { describe, expect, test } from "bun:test";
import {
  BORRADOR_DEMO,
  BORRADOR_ID,
  HOY_DEMO,
  tareasProfeVista,
} from "@/lib/demo/tareas-profe";
import {
  avanceTexto,
  barraEvaluadas,
  borradorReducer,
  crearBorrador,
  ERRORES,
  esFiltroEstado,
  evaluarLabel,
  eyebrowTareas,
  fechaCampo,
  fechaIso,
  filtrarTareas,
  filtroFrase,
  MAX_PREGUNTAS,
  mascaraFecha,
  metaTarea,
  motivoSuma,
  ordenarTareas,
  puedePublicar,
  sumaChip,
  sumaValores,
  type TareaBorrador,
  type TareaProfe,
  tareaAGuardar,
  tieneErrores,
  validarTarea,
} from "@/lib/tareas-profe";

const tarea = (o: Partial<TareaProfe>): TareaProfe => ({
  id: "t",
  titulo: "Tarea",
  tipo: "individual",
  estado: "abierta",
  fecha: "2026-11-03",
  premio: null,
  preguntas: 3,
  suma: 20,
  avance: null,
  porEvaluar: 0,
  ...o,
});

const lista: TareaBorrador = crearBorrador({
  titulo: "Plan",
  tipo: "grupal",
  fecha: "14/11/2026",
  preguntas: [
    { enunciado: "Uno", formato: "texto", valor: 10 },
    { enunciado: "Dos", formato: "imagen", valor: 10 },
  ],
});

describe("lista", () => {
  test("eyebrow y meta", () => {
    expect(eyebrowTareas(5, "5A y 5C")).toBe("5 tareas · 5A y 5C");
    expect(eyebrowTareas(1, "5A")).toBe("1 tarea · 5A");
    expect(
      metaTarea(
        tarea({
          preguntas: 8,
          fecha: "2026-10-30",
          avance: { tipo: "evaluadas", hechas: 12, total: 69 },
        }),
        HOY_DEMO,
      ),
    ).toBe("8 preguntas · vence 30/10/2026 · 12 de 69 evaluadas");
    expect(
      metaTarea(tarea({ fecha: "2026-10-10", preguntas: 1 }), HOY_DEMO),
    ).toBe("1 pregunta · venció 10/10/2026");
    expect(
      metaTarea(
        tarea({ estado: "borrador", tipo: "grupal", fecha: null, preguntas: 10 }),
        HOY_DEMO,
      ),
    ).toBe("10 preguntas · sin fecha · premio por definir");
    expect(
      metaTarea(
        tarea({
          estado: "evaluada",
          tipo: "grupal",
          preguntas: 4,
          avance: { tipo: "evaluadas", hechas: 12, total: 12 },
        }),
        HOY_DEMO,
      ),
    ).toBe("4 preguntas · 12 de 12 equipos evaluados");
  });

  test("avance", () => {
    expect(
      avanceTexto({ tipo: "entregas", hechas: 3, total: 12 }, "grupal"),
    ).toBe("3 de 12 equipos entregaron");
  });

  test("chip de suma solo en borradores que no suman 20", () => {
    expect(sumaChip(tarea({ estado: "borrador", suma: 14 }))).toBe(
      "Suma 14 / 20",
    );
    expect(sumaChip(tarea({ estado: "borrador", suma: 20 }))).toBeNull();
    expect(sumaChip(tarea({ suma: 14 }))).toBeNull();
    expect(sumaChip(tarea({ estado: "borrador", suma: 14.5 }))).toBe(
      "Suma 14,5 / 20",
    );
  });

  test("barra de evaluadas solo en abiertas", () => {
    const avance = { tipo: "evaluadas", hechas: 12, total: 69 } as const;
    expect(barraEvaluadas(tarea({ avance }))).toBeCloseTo(17.39, 1);
    expect(barraEvaluadas(tarea({ estado: "evaluada", avance }))).toBeNull();
    expect(
      barraEvaluadas(
        tarea({ avance: { tipo: "entregas", hechas: 3, total: 12 } }),
      ),
    ).toBeNull();
  });

  test("filtro y frase", () => {
    const ts = [
      tarea({ id: "a" }),
      tarea({ id: "b", estado: "borrador" }),
      tarea({ id: "c", estado: "evaluada" }),
    ];
    expect(filtrarTareas(ts, "todas")).toHaveLength(3);
    expect(filtrarTareas(ts, "borrador").map((t) => t.id)).toEqual(["b"]);
    expect(filtroFrase("abierta")).toBe("Mostrando las tareas abiertas");
    expect(esFiltroEstado("evaluada")).toBe(true);
    expect(esFiltroEstado("x")).toBe(false);
  });

  test("orden: abiertas por fecha, evaluadas recientes, borradores al final", () => {
    const ts = ordenarTareas([
      tarea({ id: "b", estado: "borrador", fecha: null }),
      tarea({ id: "e1", estado: "evaluada", fecha: "2026-10-01" }),
      tarea({ id: "a2", fecha: "2026-11-07" }),
      tarea({ id: "e2", estado: "evaluada", fecha: "2026-10-17" }),
      tarea({ id: "a1", fecha: "2026-11-03" }),
    ]);
    expect(ts.map((t) => t.id)).toEqual(["a1", "a2", "e2", "e1", "b"]);
  });

  test("nombre accesible de Evaluar", () => {
    expect(evaluarLabel(1, "Identidad de marca")).toBe(
      "Evaluar 1 entrega de Identidad de marca",
    );
    expect(evaluarLabel(3, "X")).toBe("Evaluar 3 entregas de X");
  });

  test("vista: 4 de TAREAS + el borrador de 10 preguntas que suma 14", () => {
    const ts = tareasProfeVista();
    expect(ts).toHaveLength(5);
    const b = ts.at(-1);
    expect(b?.id).toBe(BORRADOR_ID);
    expect(b?.preguntas).toBe(10);
    expect(b && sumaChip(b)).toBe("Suma 14 / 20");
    const identidad = ts.find((t) => t.id === "identidad-de-marca");
    expect(identidad && metaTarea(identidad, HOY_DEMO)).toBe(
      "8 preguntas · venció 10/10/2026 · 12 de 69 evaluadas",
    );
    expect(identidad?.porEvaluar).toBe(2);
  });
});

describe("constructor: reducer", () => {
  test("tarea nueva: una pregunta vacía sin valor", () => {
    const t = crearBorrador();
    expect(t.preguntas).toEqual([
      { id: "q1", enunciado: "", formato: "texto", valor: null },
    ]);
    expect(t.seccion).toBe("5A y 5C");
    expect(t.tipo).toBe("individual");
  });

  test("añadir hasta 20 y no más", () => {
    let t = crearBorrador();
    for (let i = 0; i < 25; i++) t = borradorReducer(t, { tipo: "agregar" });
    expect(t.preguntas).toHaveLength(MAX_PREGUNTAS);
    expect(new Set(t.preguntas.map((p) => p.id)).size).toBe(MAX_PREGUNTAS);
  });

  test("no baja de 1 pregunta", () => {
    const t = crearBorrador();
    expect(borradorReducer(t, { tipo: "eliminar", id: "q1" })).toBe(t);
  });

  test("eliminar y restaurar en su posición con su contenido", () => {
    const t = crearBorrador(BORRADOR_DEMO);
    const quitada = t.preguntas[2];
    if (!quitada) throw new Error("falta la pregunta");
    const sin = borradorReducer(t, { tipo: "eliminar", id: quitada.id });
    expect(sin.preguntas).toHaveLength(9);
    expect(sumaValores(sin.preguntas)).toBe(12);
    const con = borradorReducer(sin, {
      tipo: "restaurar",
      pregunta: quitada,
      indice: 2,
    });
    expect(con.preguntas).toEqual(t.preguntas);
    // Restaurar dos veces no la duplica
    expect(
      borradorReducer(con, { tipo: "restaurar", pregunta: quitada, indice: 2 }),
    ).toBe(con);
  });

  test("ids nuevos no chocan con los restaurados", () => {
    let t = crearBorrador({
      preguntas: [
        { enunciado: "a", formato: "texto", valor: 1 },
        { enunciado: "b", formato: "texto", valor: 1 },
      ],
    });
    const q2 = t.preguntas[1];
    if (!q2) throw new Error("falta q2");
    t = borradorReducer(t, { tipo: "eliminar", id: q2.id });
    t = borradorReducer(t, { tipo: "agregar" });
    t = borradorReducer(t, { tipo: "restaurar", pregunta: q2, indice: 1 });
    expect(t.preguntas.map((p) => p.id)).toEqual(["q1", "q2", "q3"]);
  });

  test("editar una pregunta y los campos", () => {
    let t = crearBorrador();
    t = borradorReducer(t, {
      tipo: "editar",
      id: "q1",
      cambios: { enunciado: "Hola", formato: "imagen", valor: 2.5 },
    });
    t = borradorReducer(t, { tipo: "titulo", valor: "Tarea" });
    t = borradorReducer(t, { tipo: "seccion", valor: "5C" });
    expect(t.preguntas[0]).toEqual({
      id: "q1",
      enunciado: "Hola",
      formato: "imagen",
      valor: 2.5,
    });
    expect(t.titulo).toBe("Tarea");
    expect(t.seccion).toBe("5C");
  });

  test("pasar a Individual oculta el premio sin perderlo; no se guarda", () => {
    let t = borradorReducer(lista, { tipo: "premio", valor: "Salida al cine" });
    t = borradorReducer(t, { tipo: "tipo", valor: "individual" });
    expect(t.premio).toBe("Salida al cine");
    expect(tareaAGuardar(t).premio).toBeNull();
    t = borradorReducer(t, { tipo: "tipo", valor: "grupal" });
    expect(tareaAGuardar(t).premio).toBe("Salida al cine");
  });

  test("la fecha se enmascara al escribir", () => {
    expect(mascaraFecha("1411")).toBe("14/11");
    expect(mascaraFecha("14112026999")).toBe("14/11/2026");
    expect(mascaraFecha("ab1")).toBe("1");
    expect(borradorReducer(lista, { tipo: "fecha", valor: "01122026" }).fecha).toBe(
      "01/12/2026",
    );
  });
});

describe("constructor: suma y validación", () => {
  test("suma con medios puntos y sin valor", () => {
    expect(
      sumaValores([{ valor: 0.5 }, { valor: null }, { valor: 2.5 }]),
    ).toBe(3);
    expect(sumaValores([{ valor: 0.1 }, { valor: 0.2 }])).toBe(0.5);
  });

  test("motivo de la suma", () => {
    expect(motivoSuma(14)).toBe("La suma tiene que ser 20: faltan 6");
    expect(motivoSuma(22)).toBe("La suma tiene que ser 20: te pasaste por 2");
    expect(motivoSuma(19)).toBe("La suma tiene que ser 20: falta 1");
    expect(motivoSuma(20)).toBeNull();
  });

  test("fechas del campo", () => {
    expect(fechaIso("14/11/2026")).toBe("2026-11-14");
    expect(fechaIso("31/02/2026")).toBeNull();
    expect(fechaIso("14/11")).toBeNull();
    expect(fechaCampo("2026-11-14")).toBe("14/11/2026");
    expect(fechaCampo(null)).toBe("");
  });

  test("una tarea completa se puede publicar", () => {
    expect(tieneErrores(validarTarea(lista, HOY_DEMO))).toBe(false);
    expect(puedePublicar(lista, HOY_DEMO)).toBe(true);
  });

  test("errores por campo", () => {
    const t = crearBorrador({
      fecha: "01/10/2026",
      preguntas: [{ enunciado: "  ", formato: "texto", valor: null }],
    });
    const e = validarTarea(t, HOY_DEMO);
    expect(e.titulo).toBe(ERRORES.titulo);
    expect(e.fecha).toBe(ERRORES.fechaPasada);
    expect(e.preguntas.q1).toEqual({
      enunciado: ERRORES.enunciado,
      valor: ERRORES.valor,
    });
    expect(e.suma).toBe("La suma tiene que ser 20: faltan 20");
    expect(puedePublicar(t, HOY_DEMO)).toBe(false);
    expect(validarTarea(crearBorrador({ fecha: "14/1" }), HOY_DEMO).fecha).toBe(
      ERRORES.fecha,
    );
  });

  test("el borrador de la vista no se puede publicar: suma 14", () => {
    const t = crearBorrador(BORRADOR_DEMO);
    expect(sumaValores(t.preguntas)).toBe(14);
    expect(puedePublicar(t, HOY_DEMO)).toBe(false);
  });
});
