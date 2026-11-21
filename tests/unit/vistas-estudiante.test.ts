import { describe, expect, test } from "bun:test";
import alumnosJson from "@/data/seed/alumnos.json";
import gruposJson from "@/data/seed/grupos.json";
import tareaJson from "@/data/seed/tarea-identidad-marca.json";
import { diaDeInstante } from "@/lib/fecha";
import { NOTA_MIN } from "@/lib/grades";
import type { Ajuste, Entrega, SeccionId, Tarea, Usuario } from "@/lib/modelo";
import { NO_PARTICIPASTE } from "@/lib/notas";
import { calcularRanking } from "@/lib/ranking-datos";
import { docsDesdeSeed } from "@/lib/seed-firestore";
import {
  type ConId,
  type DatosAlumno,
  desgloseReal,
  detalleNota,
  equipoVista,
  estiloDe,
  filasMisNotas,
  inicioVista,
  navUsuarioDe,
  notasDelAlumno,
  perfilVista,
  puestoAlumno,
  RESPUESTA_IMAGEN,
  RESPUESTA_SIN_REGISTRO,
  titulosTopbarDe,
} from "@/lib/vistas-estudiante";

// 6 nov 2026, 01:00 en Caracas = 05:00 UTC
const AHORA = Date.UTC(2026, 10, 6, 5, 0);
const seed = docsDesdeSeed(alumnosJson, gruposJson, tareaJson, AHORA);

const RAQUEL = "45009896"; // 5A, capitana de 5a-g2, 18,5 en Identidad
const ELSA = "45011133"; // 5A, 5a-g6, con desglose
const HUGO = "45019792"; // 5A, sin equipo ni nota

const abierta: ConId<Tarea> = {
  id: "presentacion",
  titulo: "Presentación del producto",
  tipo: "grupal",
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-07",
  premio: "Salida al cine",
  preguntas: [
    { id: "p1", enunciado: "Sube una foto", formato: "imagen", valor: 20 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: AHORA,
};

/** Lo que leería el DAL para un alumno: lo de su sección y las entregas donde figura. */
function datosDe(
  cedula: string,
  extra: {
    tareas?: ConId<Tarea>[];
    entregas?: ConId<Entrega>[];
    ajustes?: Ajuste[];
    usuario?: Partial<Usuario>;
  } = {},
): DatosAlumno {
  const base = seed.usuarios.find((u) => u.id === cedula)?.data;
  if (!base) throw new Error(cedula);
  const usuario = { ...base, ...extra.usuario };
  const seccion = usuario.seccion as SeccionId;
  const equipoDoc = seed.equipos.find((e) => e.id === usuario.equipoId);
  const entregas = [
    ...seed.entregas.map((e) => ({ id: e.id, ...e.data })),
    ...(extra.entregas ?? []),
  ];
  const ajustes = [
    ...seed.ajustes.map((a) => a.data),
    ...(extra.ajustes ?? []),
  ];
  return {
    usuario,
    equipo: equipoDoc ? { id: equipoDoc.id, ...equipoDoc.data } : null,
    tareas: [
      ...seed.tareas
        .filter((t) => t.data.secciones.includes(seccion))
        .map((t) => ({ id: t.id, ...t.data })),
      ...(extra.tareas ?? []),
    ],
    entregas: entregas.filter((e) => e.integrantes.includes(cedula)),
    ajustes: ajustes.filter(
      (a) => a.destino === "alumno" && a.destinoId === cedula,
    ),
    ranking: calcularRanking(
      seccion,
      {
        usuarios: seed.usuarios.map((u) =>
          u.id === cedula ? usuario : u.data,
        ),
        equipos: seed.equipos.map((e) => ({ id: e.id, ...e.data })),
        entregas,
        ajustes,
      },
      AHORA,
    ),
  };
}

const companerosDe = (equipoId: string) =>
  seed.usuarios.filter((u) => u.data.equipoId === equipoId).map((u) => u.data);

describe("notasDelAlumno / filasMisNotas", () => {
  test("evaluadas primero (más reciente), luego pendientes por fecha", () => {
    const d = datosDe(RAQUEL, { tareas: [abierta] });
    const notas = notasDelAlumno(d);
    expect(notas.map((n) => n.tarea.id)).toEqual([
      "identidad-de-marca",
      "logo-y-paleta",
      "presentacion",
    ]);
    expect(notas[0]?.nota).toBe(18.5);
    expect(notas[2]?.nota).toBeNull();
  });

  test("la fecha de una evaluada es el día de Caracas de `evaluadaEn`", () => {
    expect(diaDeInstante(AHORA)).toBe("2026-11-06");
    const filas = filasMisNotas(datosDe(RAQUEL, { tareas: [abierta] }));
    expect(filas[0]?.fecha).toBe("evaluada el 06/11/2026");
    expect(filas[2]?.fecha).toBe("vence el 07/11/2026");
    expect(filas[1]?.detalle).toBe("5A-G2 Repostería");
  });

  test("la base escala también la grupal (D177)", () => {
    const d = datosDe(RAQUEL, { usuario: { base: 15 } });
    const grupal = filasMisNotas(d).find((f) => f.id === "logo-y-paleta");
    // 19 × 15 / 20 = 14,25 → 14,3 (D013)
    expect(grupal?.nota).toBe(14.3);
    expect(grupal?.base).toBe(15);
  });

  test("sin nota: todo Pendiente (D003)", () => {
    const filas = filasMisNotas(datosDe(HUGO));
    expect(filas.every((f) => f.nota === null)).toBe(true);
  });

  test("equipo eliminado: la nota grupal sigue con ella y nombra al equipo de entonces (D308)", () => {
    // Tras eliminar 5a-g2: sin equipo, y su grupal lleva `titularNombre`
    const d = datosDe(RAQUEL, { usuario: { equipoId: null } });
    expect(d.equipo).toBeNull();
    const sinEquipo: DatosAlumno = {
      ...d,
      entregas: d.entregas.map((e) =>
        e.tipo === "grupal" ? { ...e, titularNombre: "5A-G2 Repostería" } : e,
      ),
    };
    const grupal = filasMisNotas(sinEquipo).find(
      (f) => f.id === "logo-y-paleta",
    );
    expect(grupal?.nota).toBe(19);
    expect(grupal?.detalle).toBe("5A-G2 Repostería");

    // En otro equipo, la grupal del viejo no lleva el nombre del nuevo
    const otro = datosDe(RAQUEL, { usuario: { equipoId: "5a-g6" } });
    const fila = filasMisNotas(otro).find((f) => f.id === "logo-y-paleta");
    expect(fila?.nota).toBe(19);
    expect(fila?.detalle).toBeUndefined();
  });
});

describe("«No participó» en sus vistas (D365, D367)", () => {
  // Raquel marcada «No participó» en la grupal «logo-y-paleta» (19/20 del equipo), con base 15
  const marcada = (): DatosAlumno => {
    const d = datosDe(RAQUEL, { usuario: { base: 15 } });
    return {
      ...d,
      entregas: d.entregas.map((e) =>
        e.tipo === "grupal" && e.evaluacion
          ? { ...e, evaluacion: { ...e.evaluacion, noParticiparon: [RAQUEL] } }
          : e,
      ),
    };
  };

  test("Mis notas: 1 fija, sin chip de base, con la línea que lo explica", () => {
    const fila = filasMisNotas(marcada()).find((f) => f.id === "logo-y-paleta");
    expect(fila?.nota).toBe(NOTA_MIN);
    expect(fila?.base).toBeUndefined();
    expect(fila?.aviso).toBe(NO_PARTICIPASTE);
    // La individual no cambia
    const ind = filasMisNotas(marcada()).find(
      (f) => f.id === "identidad-de-marca",
    );
    expect(ind?.aviso).toBeUndefined();
    expect(ind?.base).toBe(15);
  });

  test("Detalle: final 1 y `noParticipo`; el puntaje sigue siendo el del equipo", () => {
    const d = detalleNota(marcada(), "logo-y-paleta");
    if (d.estado !== "ok") throw new Error(d.estado);
    expect(d.final).toBe(NOTA_MIN);
    expect(d.noParticipo).toBe(true);
    expect(d.puntaje).toBe(19);
    const sin = detalleNota(datosDe(RAQUEL), "logo-y-paleta");
    expect(sin.estado === "ok" && sin.noParticipo).toBe(false);
  });
});

describe("detalleNota", () => {
  test("tarea de otra sección o inexistente → no-existe", () => {
    expect(detalleNota(datosDe(RAQUEL), "nada").estado).toBe("no-existe");
  });

  test("sin evaluar → sin-detalle", () => {
    const d = detalleNota(
      datosDe(RAQUEL, { tareas: [abierta] }),
      "presentacion",
    );
    expect(d).toEqual({
      estado: "sin-detalle",
      tipo: "grupal",
      titulo: "Presentación del producto",
    });
  });

  test("con desglose: puntos por pregunta sin escalar y respuesta faltante marcada", () => {
    const d = detalleNota(datosDe(ELSA), "identidad-de-marca");
    if (d.estado !== "ok") throw new Error(d.estado);
    expect(d.puntaje).toBe(18.5);
    expect(d.final).toBe(18.5);
    expect(d.preguntas).toHaveLength(tareaJson.preguntas.length);
    const ev = tareaJson.evaluaciones.find((e) => e.cedula === ELSA);
    expect(d.preguntas.map((p) => p.obtenido)).toEqual(ev?.puntos ?? []);
    expect(d.preguntas[0]?.respuesta).toBe(RESPUESTA_SIN_REGISTRO);
    expect(d.eyebrow).toBe("Individual · evaluada el 06/11/2026");
  });

  test("respuestas de texto e imagen, comentarios del profe", () => {
    const entrega: ConId<Entrega> = {
      id: "presentacion__5a-g2",
      tareaId: "presentacion",
      tipo: "grupal",
      titularId: "5a-g2",
      seccion: "5A",
      integrantes: [RAQUEL],
      estado: "evaluada",
      respuestas: { p1: { imagenPath: "entregas/x.jpg" } },
      enviadaPor: RAQUEL,
      enviadaEn: AHORA,
      evaluacion: {
        puntos: { p1: 17 },
        comentarios: { p1: "  ¡Muy bien!  " },
        puntaje: 17,
        evaluadaPor: null,
        evaluadaEn: AHORA,
      },
    };
    const d = detalleNota(
      datosDe(RAQUEL, {
        tareas: [abierta],
        entregas: [entrega],
        usuario: { base: 15 },
      }),
      "presentacion",
    );
    if (d.estado !== "ok") throw new Error(d.estado);
    expect(d.preguntas[0]).toMatchObject({
      respuesta: RESPUESTA_IMAGEN,
      comentario: "¡Muy bien!",
      obtenido: 17,
    });
    // 17 × 15 / 20 = 12,75 → 12,8
    expect(d.final).toBe(12.8);
  });

  test("comentario general y quién evaluó (D445, D447): solo el nombre corto, nunca la cédula", () => {
    const PROFE = "45001237";
    const entrega = (
      evaluadaPor: string | null,
      comentarioGeneral?: string,
    ): ConId<Entrega> => ({
      id: "presentacion__5a-g2",
      tareaId: "presentacion",
      tipo: "grupal",
      titularId: "5a-g2",
      seccion: "5A",
      integrantes: [RAQUEL],
      estado: "evaluada",
      respuestas: {},
      enviadaPor: RAQUEL,
      enviadaEn: AHORA,
      evaluacion: {
        puntos: { p1: 17 },
        comentarios: {},
        puntaje: 17,
        evaluadaPor,
        evaluadaEn: AHORA,
        ...(comentarioGeneral === undefined ? {} : { comentarioGeneral }),
      },
    });
    const profes = new Map([
      [PROFE, { nombres: "Adela Juana", apellidos: "Pérez Iglesias" }],
    ]);
    const ver = (e: ConId<Entrega>, p = profes) => {
      const d = detalleNota(
        datosDe(RAQUEL, { tareas: [abierta], entregas: [e] }),
        "presentacion",
        p,
      );
      if (d.estado !== "ok") throw new Error(d.estado);
      return d;
    };

    const d = ver(entrega(PROFE, "  ¡Gran equipo! 🎉\nSigan así  "));
    expect(d.eyebrow).toBe("Grupal · evaluada el 06/11/2026 por Adela Pérez");
    expect(d.comentarioGeneral).toBe("¡Gran equipo! 🎉\nSigan así");
    expect(JSON.stringify(d)).not.toContain(PROFE);

    // Sin evaluador conocido (Excel, seed) o que ya no existe: como antes, sin «por»
    expect(ver(entrega(null)).eyebrow).toBe("Grupal · evaluada el 06/11/2026");
    expect(ver(entrega(PROFE), new Map()).eyebrow).toBe(
      "Grupal · evaluada el 06/11/2026",
    );
    // Sin comentario general (o solo espacios): ausente
    expect("comentarioGeneral" in ver(entrega(PROFE))).toBe(false);
    expect("comentarioGeneral" in ver(entrega(PROFE, "   "))).toBe(false);
  });

  test("nota importada sin desglose → ok sin preguntas", () => {
    const d = detalleNota(datosDe(RAQUEL), "logo-y-paleta");
    if (d.estado !== "ok") throw new Error(d.estado);
    expect(d.preguntas).toEqual([]);
    expect(d.final).toBe(19);
  });
});

describe("desgloseReal", () => {
  test("una de cada: el copy del lienzo", () => {
    expect(
      desgloseReal(
        [
          { nota: 18.5, tipo: "individual" },
          { nota: 19, tipo: "grupal" },
        ],
        [],
        true,
      ),
    ).toBe(
      "18,5 de tu nota individual + 19 de la grupal. Las notas menores de 10 no suman.",
    );
  });
  test("plurales, notas < 10 en 0 y conducta con signo", () => {
    expect(
      desgloseReal(
        [
          { nota: 12, tipo: "individual" },
          { nota: 8, tipo: "individual" },
          { nota: null, tipo: "grupal" },
        ],
        [{ valor: -1.5 }],
        false,
      ),
    ).toBe(
      "12 de tus notas individuales − 1,5 por conducta. Las notas menores de 10 no suman.",
    );
  });
});

describe("inicioVista", () => {
  test("puntos y puesto del ranking, pendientes y equipo", () => {
    const d = datosDe(RAQUEL, { tareas: [abierta] });
    const v = inicioVista(d, companerosDe("5a-g2"));
    // 18,5 individual + 19 grupal (D007)
    expect(v.puntos?.puntos).toBe(37.5);
    expect(v.puntos?.puesto).toBe(
      puestoAlumno(d.ranking, RAQUEL)?.puesto ?? -1,
    );
    expect(v.puntos?.deltaSemana).toBe(0);
    expect(v.saludo.titulo).toBe("¡Hola, Raquel!");
    expect(v.saludo.linea).toBe(
      "Tienes 1 tarea por entregar. Vence el 07/11/2026.",
    );
    expect(v.pendientes[0]).toMatchObject({
      id: "presentacion",
      entregasTu: true,
      avance: "sin-empezar",
      premio: "Salida al cine",
    });
    expect(v.notas).toHaveLength(2);
    expect(v.equipo?.capitan).toEqual({ etiqueta: "Capitán:", quien: "tú" });
    expect(v.equipo?.integrantes[0]?.id).toBe(RAQUEL);
  });

  test("una tarea ya entregada no está pendiente; un borrador sí, como «borrador»", () => {
    const entrega = (estado: "borrador" | "entregada"): ConId<Entrega> => ({
      id: `presentacion__5a-g2`,
      tareaId: "presentacion",
      tipo: "grupal",
      titularId: "5a-g2",
      seccion: "5A",
      integrantes: [RAQUEL],
      estado,
      respuestas: {},
      enviadaPor: null,
      enviadaEn: null,
      evaluacion: null,
    });
    const conEntrega = inicioVista(
      datosDe(RAQUEL, { tareas: [abierta], entregas: [entrega("entregada")] }),
      [],
    );
    expect(conEntrega.pendientes).toEqual([]);
    expect(conEntrega.saludo.linea).toBe("Estás al día.");
    const borrador = inicioVista(
      datosDe(RAQUEL, { tareas: [abierta], entregas: [entrega("borrador")] }),
      [],
    );
    expect(borrador.pendientes[0]?.avance).toBe("borrador");
  });

  test("evaluada por el profe sin respuestas: sigue pendiente mientras esté abierta", () => {
    const conNota: ConId<Entrega> = {
      id: "presentacion__5a-g2",
      tareaId: "presentacion",
      tipo: "grupal",
      titularId: "5a-g2",
      seccion: "5A",
      integrantes: [RAQUEL],
      estado: "evaluada",
      respuestas: {},
      enviadaPor: null,
      enviadaEn: null,
      evaluacion: {
        puntos: null,
        comentarios: {},
        puntaje: 16,
        evaluadaPor: "45001237",
        evaluadaEn: 1,
      },
    };
    const v = inicioVista(
      datosDe(RAQUEL, { tareas: [abierta], entregas: [conNota] }),
      [],
    );
    expect(v.pendientes.map((p) => p.id)).toEqual(["presentacion"]);
    const cerrada = inicioVista(
      datosDe(RAQUEL, {
        tareas: [{ ...abierta, estado: "evaluada" }],
        entregas: [conNota],
      }),
      [],
    );
    expect(cerrada.pendientes).toEqual([]);
  });

  test("sin ranking: sin tarjeta de puntos; sin equipo: sin resumen", () => {
    const d = { ...datosDe(HUGO), ranking: null };
    const v = inicioVista(d, []);
    expect(v.puntos).toBeNull();
    expect(v.equipo).toBeNull();
  });
});

describe("equipoVista", () => {
  test("capitana primero, puntos del ranking y nota del equipo sin base", () => {
    const d = datosDe(RAQUEL, { usuario: { base: 15 } });
    const grupales = seed.entregas
      .map((e) => e.data)
      .filter((e) => e.tipo === "grupal" && e.seccion === "5A");
    const v = equipoVista(d, companerosDe("5a-g2"), grupales);
    expect(v?.integrantes[0]).toMatchObject({
      id: RAQUEL,
      esTu: true,
      esCapitan: true,
    });
    expect(v?.notas[0]).toMatchObject({ id: "logo-y-paleta", nota: 19 });
    expect(v?.equipo.puntos).toBe(19);
    expect(v?.premios).toEqual([]); // la tarea importada no tiene premio
  });

  test("premio: solo el equipo con la mejor nota única", () => {
    const tarea: ConId<Tarea> = {
      ...abierta,
      estado: "evaluada",
      premio: "Cuenta Canva Pro",
    };
    const ent = (titularId: string, puntaje: number): Entrega => ({
      tareaId: "presentacion",
      tipo: "grupal",
      titularId,
      seccion: "5A",
      integrantes: [RAQUEL],
      estado: "evaluada",
      respuestas: {},
      enviadaPor: null,
      enviadaEn: null,
      evaluacion: {
        puntos: null,
        comentarios: {},
        puntaje,
        evaluadaPor: null,
        evaluadaEn: AHORA,
      },
    });
    const d = datosDe(RAQUEL, { tareas: [tarea] });
    const gana = equipoVista(d, [], [ent("5a-g2", 19), ent("5a-g1", 17)]);
    expect(gana?.premios).toEqual([
      {
        id: "presentacion",
        premio: "Cuenta Canva Pro",
        detalle: "Mejor nota en Presentación del producto · 19",
      },
    ]);
    const empate = equipoVista(d, [], [ent("5a-g2", 19), ent("5a-g1", 19)]);
    expect(empate?.premios).toEqual([]);
  });

  test("sin equipo → null", () => {
    expect(equipoVista(datosDe(HUGO), [], [])).toBeNull();
  });
});

describe("perfil, shell y topbar", () => {
  test("perfil: campos partidos, capitán y base", () => {
    const d = datosDe(RAQUEL, { usuario: { base: 15 } });
    const p = perfilVista(d.usuario, d.equipo);
    expect(p.cedula).toBe("C.I. 45.009.896");
    expect(p.capitan).toBe("Capitán · 5A-G2");
    expect(p.base).toBe("Base 15");
    expect(p.campos.map((c) => c.valor)).toEqual([
      "Raquel",
      "Leticia",
      "Figueroa",
      "Montes",
    ]);
  });

  test("usuario de la navegación con su avatar; estilo desconocido → el de defecto", () => {
    const u = seed.usuarios.find((x) => x.id === RAQUEL)?.data as Usuario;
    expect(
      navUsuarioDe({
        ...u,
        avatar: { estilo: "bottts-neutral", semilla: `${RAQUEL}-1-2` },
      }),
    ).toEqual({
      nombre: "Raquel Figueroa",
      estilo: "bottts-neutral",
      seed: `${RAQUEL}-1-2`,
    });
    expect(estiloDe("pixel-art")).toBe("adventurer-neutral");
  });

  test("títulos de la topbar por ruta", () => {
    expect(titulosTopbarDe([abierta])).toEqual({
      "/notas/presentacion": "Presentación del producto",
      "/tareas/presentacion": "Tarea grupal",
    });
  });
});
