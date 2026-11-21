import { describe, expect, test } from "bun:test";
import {
  carpetaEntrega,
  carpetaEntregaLegada,
  carpetasDeEntrega,
  crearCarpetaEntrega,
} from "@/lib/carpeta-entrega";
import {
  armarEntrega,
  type Carpetas,
  claveImagen,
  comprobarImagenes,
  enOtraEntrega,
  esImagenDe,
  imagenesDe,
  mensajeErrorEntrega,
  permisoEntrega,
  respuestasValidas,
  yaEnviada,
  zEnvioEntrega,
} from "@/lib/entregas";
import { horaDeInstante } from "@/lib/fecha";
import {
  type Entrega,
  type Equipo,
  idEntrega,
  rutasSinUso,
  type Tarea,
  type Usuario,
  zEntrega,
} from "@/lib/modelo";
import { ANSWER_MAX_LENGTH } from "@/lib/question";
import { claveBorrador, leerBorrador } from "@/lib/tareas";
import {
  type ConId,
  detalleNota,
  entregaVista,
  SIN_FECHA_ENTREGA,
  tareasVista,
} from "@/lib/vistas-estudiante";

const AHORA = Date.UTC(2026, 10, 5, 20, 12); // 4:12 p. m. en Caracas
const UUID = "0b5c3a52-7d0e-4f53-9d0b-0f1e2d3c4b5a";

const usuario = (cedula: string, extra: Partial<Usuario> = {}): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Adela Juana",
  apellidos: "Pérez Iglesias",
  seccion: "5A",
  equipoId: "5a-g2",
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
  ...extra,
});

const CAPITAN = usuario("45009896", {
  nombres: "Raquel",
  apellidos: "Figueroa",
});
const INTEGRANTE = usuario("45021029", {
  nombres: "Paola",
  apellidos: "Padilla",
});
const SIN_EQUIPO = usuario("45019792", { equipoId: null });
const EQUIPO: ConId<Equipo> = {
  id: "5a-g2",
  nombre: "5A-G2 Repostería",
  seccion: "5A",
  tema: "Repostería",
  capitanId: CAPITAN.cedula,
  logoPath: null,
};

const tarea = (id: string, extra: Partial<Tarea> = {}): ConId<Tarea> => ({
  id,
  titulo: "Presentación del producto",
  tipo: "grupal",
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-07",
  premio: "Salida al cine",
  preguntas: [
    { id: "p1", enunciado: "Sube una foto", formato: "imagen", valor: 12 },
    { id: "p2", enunciado: "¿A qué precio?", formato: "texto", valor: 8 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
  ...extra,
});

const GRUPAL = tarea("presentacion");
const INDIVIDUAL = tarea("competencia", { tipo: "individual", premio: null });

describe("permisoEntrega (D012, D196)", () => {
  test("individual: cualquiera de la sección; titular = su cédula", () => {
    const r = permisoEntrega(
      SIN_EQUIPO,
      INDIVIDUAL,
      INDIVIDUAL.id,
      null,
      AHORA,
    );
    expect(r).toEqual({
      ok: true,
      permiso: {
        tipo: "individual",
        titularId: SIN_EQUIPO.cedula,
        entregaId: idEntrega("competencia", SIN_EQUIPO.cedula),
      },
    });
  });

  test("grupal: solo el capitán; titular = el equipo", () => {
    const r = permisoEntrega(CAPITAN, GRUPAL, GRUPAL.id, EQUIPO, AHORA);
    expect(r.ok && r.permiso.titularId).toBe("5a-g2");
    expect(
      permisoEntrega(INTEGRANTE, GRUPAL, GRUPAL.id, EQUIPO, AHORA),
    ).toEqual({
      ok: false,
      error: "no-capitan",
    });
    expect(permisoEntrega(SIN_EQUIPO, GRUPAL, GRUPAL.id, null, AHORA)).toEqual({
      ok: false,
      error: "sin-equipo",
    });
  });

  test("el equipo tiene que ser el suyo y de su sección", () => {
    const otro = { ...EQUIPO, id: "5a-g3" };
    expect(permisoEntrega(CAPITAN, GRUPAL, GRUPAL.id, otro, AHORA).ok).toBe(
      false,
    );
    const otraSeccion = { ...EQUIPO, seccion: "5C" as const };
    expect(
      permisoEntrega(CAPITAN, GRUPAL, GRUPAL.id, otraSeccion, AHORA).ok,
    ).toBe(false);
  });

  test("otra sección, borrador o inexistente → no-existe; evaluada → cerrada", () => {
    const deC = usuario("30000001", { seccion: "5C" });
    expect(permisoEntrega(deC, INDIVIDUAL, "x", null, AHORA)).toEqual({
      ok: false,
      error: "no-existe",
    });
    expect(
      permisoEntrega(
        CAPITAN,
        { ...INDIVIDUAL, estado: "borrador" },
        "x",
        null,
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
    expect(permisoEntrega(CAPITAN, null, "x", null, AHORA).ok).toBe(false);
    expect(
      permisoEntrega(
        CAPITAN,
        { ...INDIVIDUAL, estado: "evaluada" },
        "x",
        null,
        AHORA,
      ),
    ).toEqual({ ok: false, error: "cerrada" });
  });

  test("vencida → cerrada; con prórroga de su titular, abierta (D451, D452)", () => {
    // El 07/11 a las 23:59 en Caracas vence (sin hora)
    const despues = Date.UTC(2026, 10, 8, 12);
    expect(permisoEntrega(SIN_EQUIPO, INDIVIDUAL, "x", null, despues)).toEqual({
      ok: false,
      error: "cerrada",
    });
    const conProrroga = {
      ...INDIVIDUAL,
      prorrogas: {
        [SIN_EQUIPO.cedula]: { fecha: "2026-11-09", hora: "10:00" },
      },
    };
    expect(permisoEntrega(SIN_EQUIPO, conProrroga, "x", null, despues).ok).toBe(
      true,
    );
    // La prórroga es de otro titular: para este sigue cerrada
    expect(permisoEntrega(CAPITAN, conProrroga, "x", null, despues)).toEqual({
      ok: false,
      error: "cerrada",
    });
    // Grupal: la prórroga es del equipo; el capitán la usa
    const grupal = {
      ...GRUPAL,
      prorrogas: { [EQUIPO.id]: { fecha: "2026-11-09", hora: null } },
    };
    expect(permisoEntrega(CAPITAN, grupal, GRUPAL.id, EQUIPO, despues).ok).toBe(
      true,
    );
    expect(permisoEntrega(CAPITAN, GRUPAL, GRUPAL.id, EQUIPO, despues)).toEqual(
      {
        ok: false,
        error: "cerrada",
      },
    );
  });

  test("un profesor nunca entrega", () => {
    const profe = usuario("10000000", { rol: "profesor", seccion: null });
    expect(permisoEntrega(profe, INDIVIDUAL, "x", null, AHORA).ok).toBe(false);
  });

  test("yaEnviada: solo un borrador deja volver a enviar", () => {
    expect(yaEnviada(null)).toBe(false);
    expect(yaEnviada({ estado: "borrador" })).toBe(false);
    expect(yaEnviada({ estado: "entregada" })).toBe(true);
    expect(yaEnviada({ estado: "evaluada" })).toBe(true);
  });
});

describe("claves de imagen (D195, D512)", () => {
  test("carpeta sin la cédula a la vista, estable y de 32 hex", () => {
    const id = idEntrega("competencia", CAPITAN.cedula);
    const c = carpetaEntrega(id);
    expect(c).toMatch(/^[0-9a-f]{32}$/);
    expect(c).not.toContain(CAPITAN.cedula);
    expect(carpetaEntrega(id)).toBe(c);
    expect(carpetaEntrega(idEntrega("competencia", "1"))).not.toBe(c);
  });

  test("carpeta atada al secreto (D512): sin él no se calcula y no es el SHA-256 de antes", () => {
    const id = idEntrega("competencia", CAPITAN.cedula);
    const con = crearCarpetaEntrega("secreto-a");
    expect(con(id)).toMatch(/^[0-9a-f]{32}$/);
    expect(con(id)).toBe(crearCarpetaEntrega("secreto-a")(id));
    expect(crearCarpetaEntrega("secreto-b")(id)).not.toBe(con(id));
    expect(() => crearCarpetaEntrega("")).toThrow();
    // La de antes (sin secreto): SHA-256 del id, la que cualquiera recalcula con la tarea y la cédula
    const sha = new Bun.CryptoHasher("sha256")
      .update(id)
      .digest("hex")
      .slice(0, 32);
    expect(carpetaEntregaLegada(id)).toBe(sha);
    expect(con(id)).not.toBe(sha);
    expect(carpetaEntrega(id)).not.toBe(sha);
    // Al validar valen las dos mientras se migra (D514): la nueva y la vieja
    expect(carpetasDeEntrega(id)).toEqual([carpetaEntrega(id), sha]);
  });

  test("respuestas con la carpeta vieja mientras se migra (D514); la misma imagen no cuenta dos veces", () => {
    const id = idEntrega(GRUPAL.id, "5a-g2");
    const [nueva, vieja] = carpetasDeEntrega(id) as [string, string];
    const preguntas = [
      { id: "p1", formato: "imagen" as const, maxImagenes: 2 },
    ];
    const enNueva = claveImagen(GRUPAL.id, nueva, UUID);
    const enVieja = claveImagen(GRUPAL.id, vieja, UUID);
    const otra = claveImagen(GRUPAL.id, vieja, `${UUID.slice(0, -1)}9`);
    const validar = (
      rutas: string[],
      carpetas: Carpetas = carpetasDeEntrega(id),
    ) =>
      respuestasValidas(
        preguntas,
        { p1: { imagenPaths: rutas } },
        GRUPAL.id,
        carpetas,
      );
    expect(validar([enVieja, otra])).toEqual({
      p1: { imagenPaths: [enVieja, otra] },
    });
    expect(validar([enNueva, otra])).not.toBeNull();
    expect(validar([enNueva, enVieja])).toBeNull(); // la misma imagen dos veces
    expect(validar([enVieja], nueva)).toBeNull(); // solo la nueva: la vieja no entra
    const ajena = carpetaEntregaLegada(idEntrega(GRUPAL.id, "5a-g1"));
    expect(validar([claveImagen(GRUPAL.id, ajena, UUID)])).toBeNull();
  });

  test("rutasSinUso compara el archivo: la misma imagen en otra carpeta sigue en uso", () => {
    const a = `entregas/t/${"a".repeat(32)}/${UUID}.jpg`;
    const b = `entregas/t/${"b".repeat(32)}/${UUID}.jpg`;
    const c = `entregas/t/${"a".repeat(32)}/${UUID.slice(0, -1)}9.jpg`;
    expect(rutasSinUso([a, c], [b])).toEqual([c]);
    expect(rutasSinUso([a, a], [])).toEqual([a]);
    expect(rutasSinUso([], [a])).toEqual([]);
  });

  test("claveImagen / esImagenDe", () => {
    const c = carpetaEntrega("competencia__45009896");
    const k = claveImagen("competencia", c, UUID);
    expect(k).toBe(`entregas/competencia/${c}/${UUID}.jpg`);
    expect(esImagenDe(k, "competencia", c)).toBe(true);
    expect(esImagenDe(k, "otra", c)).toBe(false);
    expect(esImagenDe(k, "competencia", "f".repeat(32))).toBe(false);
    expect(
      esImagenDe(`entregas/competencia/${c}/x.jpg`, "competencia", c),
    ).toBe(false);
    expect(
      esImagenDe(`entregas/competencia/${c}/../${UUID}.jpg`, "competencia", c),
    ).toBe(false);
    expect(() => claveImagen("../x", c, UUID)).toThrow();
    expect(() => claveImagen("competencia", c, "no-uuid")).toThrow();
  });
});

describe("respuestas y entrega armada", () => {
  test("una por pregunta, del formato de la pregunta, textos recortados", async () => {
    const c = await carpetaEntrega(idEntrega(GRUPAL.id, "5a-g2"));
    const img = claveImagen(GRUPAL.id, c, UUID);
    expect(
      respuestasValidas(
        GRUPAL.preguntas,
        { p1: { imagenPath: img }, p2: { texto: "  A 2 dólares  " } },
        GRUPAL.id,
        c,
      ),
    ).toEqual({ p1: { imagenPath: img }, p2: { texto: "A 2 dólares" } });
    const mal = (
      r: Record<string, { texto: string } | { imagenPath: string }>,
    ) => respuestasValidas(GRUPAL.preguntas, r, GRUPAL.id, c);
    expect(mal({ p1: { imagenPath: img } })).toBeNull(); // falta p2
    expect(mal({ p1: { imagenPath: img }, p2: { texto: "  " } })).toBeNull();
    expect(mal({ p1: { texto: "no" }, p2: { texto: "a" } })).toBeNull();
    expect(
      mal({ p1: { imagenPath: img }, p2: { texto: "a" }, p9: { texto: "b" } }),
    ).toBeNull();
    expect(
      mal({
        p1: { imagenPath: img },
        p2: { texto: "a".repeat(ANSWER_MAX_LENGTH + 1) },
      }),
    ).toBeNull();
    // Imagen de otra entrega (otra carpeta)
    const ajena = claveImagen(GRUPAL.id, "a".repeat(32), UUID);
    expect(mal({ p1: { imagenPath: ajena }, p2: { texto: "a" } })).toBeNull();
  });

  test("varias imágenes (D373): de 1 al límite, sin repetir, se guarda `imagenPaths`", async () => {
    const c = await carpetaEntrega(idEntrega(GRUPAL.id, "5a-g2"));
    const img = (n: number) =>
      claveImagen(GRUPAL.id, c, `${UUID.slice(0, -1)}${n}`);
    const preguntas = [
      { id: "p1", formato: "imagen" as const, maxImagenes: 2 },
    ];
    const validar = (r: Parameters<typeof respuestasValidas>[1]) =>
      respuestasValidas(preguntas, r, GRUPAL.id, c);
    expect(validar({ p1: { imagenPaths: [img(1), img(2)] } })).toEqual({
      p1: { imagenPaths: [img(1), img(2)] },
    });
    // Una sola en una de varias: también vale, con la misma forma
    expect(validar({ p1: { imagenPath: img(1) } })).toEqual({
      p1: { imagenPaths: [img(1)] },
    });
    expect(validar({ p1: { imagenPaths: [img(1), img(2), img(3)] } })).toBe(
      null,
    );
    expect(validar({ p1: { imagenPaths: [img(1), img(1)] } })).toBeNull();
    expect(validar({ p1: { imagenPaths: [] } })).toBeNull();
    const ajena = claveImagen(GRUPAL.id, "a".repeat(32), UUID);
    expect(validar({ p1: { imagenPaths: [img(1), ajena] } })).toBeNull();
    // Una de una imagen sigue guardando `imagenPath`; dos no caben
    const una = [{ id: "p1", formato: "imagen" as const }];
    expect(
      respuestasValidas(una, { p1: { imagenPaths: [img(1)] } }, GRUPAL.id, c),
    ).toEqual({ p1: { imagenPath: img(1) } });
    expect(
      respuestasValidas(
        una,
        { p1: { imagenPaths: [img(1), img(2)] } },
        GRUPAL.id,
        c,
      ),
    ).toBeNull();
    expect(
      imagenesDe({ p1: { imagenPaths: [img(1), img(2)] }, p2: { texto: "a" } }),
    ).toEqual([img(1), img(2)]);
  });

  test("grupal: integrantes del equipo (con el capitán), valida con zEntrega", async () => {
    const p = permisoEntrega(CAPITAN, GRUPAL, GRUPAL.id, EQUIPO, AHORA);
    if (!p.ok) throw new Error(p.error);
    const carpeta = await carpetaEntrega(p.permiso.entregaId);
    const r = armarEntrega({
      tareaId: GRUPAL.id,
      tarea: GRUPAL,
      permiso: p.permiso,
      usuario: CAPITAN,
      integrantes: [INTEGRANTE.cedula],
      respuestas: {
        p1: { imagenPath: claveImagen(GRUPAL.id, carpeta, UUID) },
        p2: { texto: "A 2 dólares" },
      },
      carpeta,
      ahora: AHORA,
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.entrega).toMatchObject({
      tipo: "grupal",
      titularId: "5a-g2",
      seccion: "5A",
      integrantes: [CAPITAN.cedula, INTEGRANTE.cedula].sort(),
      estado: "entregada",
      enviadaPor: CAPITAN.cedula,
      enviadaEn: AHORA,
      evaluacion: null,
    });
    expect(zEntrega.safeParse(r.entrega).success).toBe(true);
  });

  test("grupal: quien ya está en otra entrega enviada de la tarea no entra (F-A2, D221)", async () => {
    const excluidos = enOtraEntrega(
      [
        // La del equipo viejo, ya enviada: el alumno movido sale de la nueva.
        {
          id: "t__5a-g1",
          entrega: { estado: "evaluada", integrantes: [INTEGRANTE.cedula] },
        },
        // Un borrador no cuenta.
        {
          id: "t__5a-g3",
          entrega: { estado: "borrador", integrantes: ["30000009"] },
        },
        // La propia (reenvío sobre un borrador) tampoco.
        {
          id: "t__5a-g2",
          entrega: { estado: "entregada", integrantes: [CAPITAN.cedula] },
        },
      ],
      "t__5a-g2",
    );
    expect([...excluidos]).toEqual([INTEGRANTE.cedula]);
    const p = permisoEntrega(CAPITAN, GRUPAL, GRUPAL.id, EQUIPO, AHORA);
    if (!p.ok) throw new Error(p.error);
    const carpeta = await carpetaEntrega(p.permiso.entregaId);
    const r = armarEntrega({
      tareaId: GRUPAL.id,
      tarea: GRUPAL,
      permiso: p.permiso,
      usuario: CAPITAN,
      integrantes: [INTEGRANTE.cedula, "30000009"],
      excluidos,
      respuestas: {
        p1: { imagenPath: claveImagen(GRUPAL.id, carpeta, UUID) },
        p2: { texto: "A 2 dólares" },
      },
      carpeta,
      ahora: AHORA,
    });
    expect(r.ok && r.entrega.integrantes).toEqual(
      [CAPITAN.cedula, "30000009"].sort(),
    );
  });

  test("individual: solo el titular; tarea sin preguntas → incompleta", async () => {
    const t = {
      ...INDIVIDUAL,
      preguntas: INDIVIDUAL.preguntas.filter((q) => q.formato === "texto"),
    };
    const p = permisoEntrega(SIN_EQUIPO, t, t.id, null, AHORA);
    if (!p.ok) throw new Error(p.error);
    const base = {
      tareaId: t.id,
      permiso: p.permiso,
      usuario: SIN_EQUIPO,
      integrantes: ["99999999"],
      respuestas: { p2: { texto: "Hola" } },
      carpeta: await carpetaEntrega(p.permiso.entregaId),
      ahora: AHORA,
    };
    const r = armarEntrega({ ...base, tarea: t });
    expect(r.ok && r.entrega.integrantes).toEqual([SIN_EQUIPO.cedula]);
    expect(
      armarEntrega({ ...base, tarea: { preguntas: [] }, respuestas: {} }),
    ).toEqual({
      ok: false,
      error: "incompleta",
    });
  });

  test("zEnvioEntrega rechaza ids que no sirven en una clave", () => {
    expect(
      zEnvioEntrega.safeParse({ tareaId: "a/b", respuestas: {} }).success,
    ).toBe(false);
    expect(
      zEnvioEntrega.safeParse({
        tareaId: "competencia",
        respuestas: { p1: { texto: "x" } },
      }).success,
    ).toBe(true);
  });

  test("cada error tiene su mensaje", () => {
    for (const e of [
      "no-existe",
      "cerrada",
      "sin-equipo",
      "no-capitan",
      "ya-entregada",
      "incompleta",
      "imagen-tipo",
      "imagen-peso",
      "almacen",
      "imagen-falta",
      "red",
    ] as const) {
      expect(mensajeErrorEntrega(e).length).toBeGreaterThan(10);
    }
  });

  test("el fallo del almacén no culpa a la conexión del alumno (F-B4, D229)", () => {
    expect(mensajeErrorEntrega("almacen")).toContain("no de tu internet");
    expect(mensajeErrorEntrega("almacen")).not.toContain("Revisa tu conexión");
    expect(mensajeErrorEntrega("imagen-falta")).toContain("Súbela otra vez");
  });

  test("comprobarImagenes: una ruta nunca subida no se entrega (F-B3, D229)", async () => {
    const enB2 = new Set(["entregas/t/c/si.jpg"]);
    const almacen = {
      existe: async (c: string) => ({ ok: true as const, existe: enB2.has(c) }),
    };
    const con = (path: string) => ({
      p1: { texto: "Hola" },
      p2: { imagenPath: path },
    });
    expect(
      await comprobarImagenes(almacen, con("entregas/t/c/si.jpg")),
    ).toBeNull();
    expect(
      await comprobarImagenes(almacen, con("entregas/t/c/inventada.jpg")),
    ).toBe("imagen-falta");
    // Sin imágenes no se llama al almacén (aunque no esté configurado)
    expect(await comprobarImagenes(null, { p1: { texto: "Hola" } })).toBeNull();
    expect(await comprobarImagenes(null, con("entregas/t/c/si.jpg"))).toBe(
      "almacen",
    );
    const caido = {
      existe: async () => ({ ok: false as const, error: "red" as const }),
    };
    expect(await comprobarImagenes(caido, con("entregas/t/c/si.jpg"))).toBe(
      "almacen",
    );
  });

  test("imagenesDe: solo las respuestas de imagen", () => {
    expect(
      imagenesDe({
        p1: { texto: "Hola" },
        p2: { imagenPath: "entregas/t/c/u.jpg" },
      }),
    ).toEqual(["entregas/t/c/u.jpg"]);
  });
});

describe("borrador del dispositivo (D196)", () => {
  test("guarda textos e imágenes subidas; descarta lo demás", () => {
    expect(
      leerBorrador(
        JSON.stringify({
          p1: "hola",
          p2: {
            imagenPath: "entregas/a/b/c.jpg",
            nombre: "foto.jpg",
            peso: 1200,
          },
          p3: { imagenPath: "", nombre: "x", peso: 1 },
          p4: { nombre: "x" },
          p5: 3,
        }),
      ),
    ).toEqual({
      p1: "hola",
      p2: { imagenPath: "entregas/a/b/c.jpg", nombre: "foto.jpg", peso: 1200 },
    });
  });

  test("varias imágenes (D373): la lista de las subidas, sin las incompletas", () => {
    const img = { imagenPath: "entregas/a/b/c.jpg", nombre: "a.jpg", peso: 9 };
    expect(
      leerBorrador(
        JSON.stringify({
          p1: [img, { nombre: "x" }],
          p2: [{ nombre: "x" }],
        }),
      ),
    ).toEqual({ p1: [img] });
  });

  test("clave por alumno", () => {
    expect(claveBorrador("competencia", "45009896")).toBe(
      "krea-borrador-competencia-45009896",
    );
  });
});

describe("horaDeInstante", () => {
  test("hora de Caracas, 12 horas", () => {
    expect(horaDeInstante(AHORA)).toBe("4:12 p. m.");
    expect(horaDeInstante(Date.UTC(2026, 10, 5, 4, 5))).toBe("12:05 a. m.");
    expect(horaDeInstante(Date.UTC(2026, 10, 5, 14, 30))).toBe("10:30 a. m.");
  });
});

/* ---------- Vistas ---------- */

const entrega = (
  t: ConId<Tarea>,
  extra: Partial<ConId<Entrega>> = {},
): ConId<Entrega> => ({
  id: idEntrega(t.id, "5a-g2"),
  tareaId: t.id,
  tipo: t.tipo,
  titularId: "5a-g2",
  seccion: "5A",
  integrantes: [CAPITAN.cedula, INTEGRANTE.cedula],
  estado: "entregada",
  respuestas: {
    p1: { imagenPath: "entregas/presentacion/abc/x.jpg" },
    p2: { texto: "A 2 dólares" },
  },
  enviadaPor: CAPITAN.cedula,
  enviadaEn: AHORA,
  evaluacion: null,
  ...extra,
});

const datos = (
  u: Usuario,
  tareas: ConId<Tarea>[],
  entregas: ConId<Entrega>[] = [],
) => ({
  usuario: u,
  equipo: u.equipoId ? EQUIPO : null,
  tareas,
  entregas,
});

describe("entregaVista", () => {
  const companeros = [CAPITAN, INTEGRANTE];

  test("capitán responde; integrante lee con el aviso del capitán", () => {
    const c = entregaVista(datos(CAPITAN, [GRUPAL]), GRUPAL.id, companeros);
    expect(c).toMatchObject({
      estado: "responder",
      autor: "Raquel",
      eyebrow: "Grupal · 5A-G2 Repostería",
      vence: "Vence 07/11/2026",
      puntos: "20 pts · 2 preguntas",
      premio: "Salida al cine",
    });
    const l = entregaVista(datos(INTEGRANTE, [GRUPAL]), GRUPAL.id, companeros);
    expect(l).toMatchObject({
      estado: "lector",
      capitan: { nombre: "Raquel Figueroa", corto: "Raquel" },
    });
  });

  test("sin equipo, cerrada, no-existe", () => {
    expect(
      entregaVista(datos(SIN_EQUIPO, [GRUPAL]), GRUPAL.id, []).estado,
    ).toBe("sin-equipo");
    const cerrada = { ...INDIVIDUAL, estado: "evaluada" as const };
    expect(entregaVista(datos(CAPITAN, [cerrada]), cerrada.id, []).estado).toBe(
      "cerrada",
    );
    expect(entregaVista(datos(CAPITAN, [GRUPAL]), "otra", []).estado).toBe(
      "no-existe",
    );
    expect(
      entregaVista(
        datos(CAPITAN, [{ ...INDIVIDUAL, fechaEntrega: null }]),
        INDIVIDUAL.id,
        [],
      ),
    ).toMatchObject({ estado: "responder", vence: SIN_FECHA_ENTREGA });
  });

  test("entregada: quién, cuándo (Caracas) y respuestas por pregunta", () => {
    const v = entregaVista(
      datos(INTEGRANTE, [GRUPAL], [entrega(GRUPAL)]),
      GRUPAL.id,
      companeros,
    );
    expect(v).toMatchObject({
      estado: "entregada",
      quien: "Raquel Figueroa",
      autor: "Raquel",
      fecha: "05/11/2026",
      hora: "4:12 p. m.",
      evaluada: false,
      respuestas: [
        { tipo: "imagen", imagenPaths: ["entregas/presentacion/abc/x.jpg"] },
        { tipo: "texto", texto: "A 2 dólares" },
      ],
    });
  });

  test("entregada del Excel: sin quién ni hora", () => {
    const v = entregaVista(
      datos(
        CAPITAN,
        [GRUPAL],
        [
          entrega(GRUPAL, {
            enviadaPor: null,
            enviadaEn: null,
            respuestas: {},
          }),
        ],
      ),
      GRUPAL.id,
      companeros,
    );
    expect(v).toMatchObject({
      estado: "entregada",
      quien: null,
      fecha: null,
      hora: null,
      respuestas: [null, null],
    });
  });

  test("un borrador del servidor no cuenta como enviada", () => {
    const v = entregaVista(
      datos(CAPITAN, [GRUPAL], [entrega(GRUPAL, { estado: "borrador" })]),
      GRUPAL.id,
      companeros,
    );
    expect(v.estado).toBe("responder");
  });
});

// D248: lo que ve cada quien en una grupal (capitán / integrante / ajeno × abierta / enviada / evaluada)
describe("entregaVista grupal por persona (D248)", () => {
  const companeros = [CAPITAN, INTEGRANTE];
  // Del mismo equipo pero que no figura en `integrantes` (entró después de la entrega)
  const TARDIO = usuario("33111222", { nombres: "Luis", apellidos: "Mora" });
  // De otro equipo de la sección
  const AJENO = usuario("33999000", { equipoId: "5a-g3" });
  const evaluada = (extra: Partial<ConId<Entrega>> = {}) =>
    entrega(GRUPAL, {
      estado: "evaluada",
      evaluacion: {
        puntos: { p1: 10, p2: 6 },
        comentarios: {},
        puntaje: 16,
        evaluadaPor: null,
        evaluadaEn: AHORA,
      },
      ...extra,
    });

  test("abierta sin enviar: el integrante ve las preguntas sin poder responder", () => {
    const v = entregaVista(datos(INTEGRANTE, [GRUPAL]), GRUPAL.id, companeros);
    if (v.estado !== "lector") throw new Error(v.estado);
    expect(v.preguntas.map((p) => [p.enunciado, p.formato, p.valor])).toEqual([
      ["Sube una foto", "imagen", 12],
      ["¿A qué precio?", "texto", 8],
    ]);
    expect(v.capitan).toMatchObject({ corto: "Raquel" });
  });

  test("enviada: el integrante ve las respuestas del capitán, no el formulario", () => {
    const v = entregaVista(
      datos(INTEGRANTE, [GRUPAL], [entrega(GRUPAL)]),
      GRUPAL.id,
      companeros,
    );
    if (v.estado !== "entregada") throw new Error(v.estado);
    expect(v).toMatchObject({
      quien: "Raquel Figueroa",
      autor: "Raquel",
      evaluada: false,
      notaHref: null,
    });
    expect(v.respuestas).toEqual([
      { tipo: "imagen", imagenPaths: ["entregas/presentacion/abc/x.jpg"] },
      { tipo: "texto", texto: "A 2 dólares" },
    ]);
  });

  test("evaluada: el integrante llega a su nota y al desglose", () => {
    const v = entregaVista(
      datos(INTEGRANTE, [GRUPAL], [evaluada()]),
      GRUPAL.id,
      companeros,
    );
    expect(v).toMatchObject({
      estado: "entregada",
      evaluada: true,
      notaHref: "/notas/presentacion",
    });
    const d = detalleNota(datos(INTEGRANTE, [GRUPAL], [evaluada()]), GRUPAL.id);
    if (d.estado !== "ok") throw new Error(d.estado);
    expect(d.final).toBe(16);
    expect(d.autor).toBe("tu equipo");
    expect(d.preguntas.map((p) => p.obtenido)).toEqual([10, 6]);
  });

  test("el capitán ve lo mismo una vez enviada", () => {
    const v = entregaVista(
      datos(CAPITAN, [GRUPAL], [evaluada()]),
      GRUPAL.id,
      companeros,
    );
    expect(v).toMatchObject({
      estado: "entregada",
      notaHref: "/notas/presentacion",
    });
  });

  test("quien no figura en la entrega no ve ni respuestas ni nota (como antes)", () => {
    const abierta = entregaVista(
      // `datosAlumno` solo trae las entregas donde figura: para TARDIO la lista llega vacía
      datos(TARDIO, [GRUPAL]),
      GRUPAL.id,
      [...companeros, TARDIO],
    );
    expect(abierta.estado).toBe("lector");
    const cerrada = { ...GRUPAL, estado: "evaluada" as const };
    expect(entregaVista(datos(TARDIO, [cerrada]), cerrada.id, []).estado).toBe(
      "cerrada",
    );
    expect(detalleNota(datos(TARDIO, [GRUPAL]), GRUPAL.id).estado).toBe(
      "sin-detalle",
    );
  });

  test("un alumno de otro equipo no responde la grupal de este", () => {
    const v = entregaVista(
      {
        ...datos(AJENO, [GRUPAL]),
        equipo: { ...EQUIPO, id: "5a-g3", capitanId: "otro" },
      },
      GRUPAL.id,
      [],
    );
    expect(v.estado).toBe("lector");
  });
});

describe("tareasVista", () => {
  test("Por entregar sin las enviadas; Entregadas con su fecha, la más reciente primero", () => {
    const otra = tarea("logo", { titulo: "Logo" });
    const vieja = entrega(otra, {
      id: "logo__5a-g2",
      enviadaEn: AHORA - 3 * 86_400_000,
    });
    const v = tareasVista(
      datos(CAPITAN, [GRUPAL, otra, INDIVIDUAL], [vieja, entrega(GRUPAL)]),
    );
    expect(v.pendientes.map((f) => f.id)).toEqual(["competencia"]);
    expect(v.entregadas).toEqual([
      {
        id: "presentacion",
        href: "/tareas/presentacion",
        titulo: "Presentación del producto",
        tipo: "grupal",
        fecha: "entregada el 05/11/2026",
      },
      {
        id: "logo",
        href: "/tareas/logo",
        titulo: "Logo",
        tipo: "grupal",
        fecha: "entregada el 02/11/2026",
      },
    ]);
  });

  test("nota del Excel sin envío: fecha de evaluación", () => {
    const evaluada = entrega(GRUPAL, {
      estado: "evaluada",
      enviadaEn: null,
      enviadaPor: null,
      evaluacion: {
        puntos: null,
        comentarios: {},
        puntaje: 18,
        evaluadaPor: null,
        evaluadaEn: AHORA,
      },
    });
    const v = tareasVista(datos(CAPITAN, [GRUPAL], [evaluada]));
    expect(v.entregadas[0]?.fecha).toBe("evaluada el 05/11/2026");
  });
});
