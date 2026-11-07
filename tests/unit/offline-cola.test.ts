// Cola sin conexión (D292–D295): orden, reemplazo por clave, idempotencia por opId, conflicto de
// tarea cerrada, avance parcial (imagen subida, entrega no) y candado entre pestañas simulado.
import { describe, expect, test } from "bun:test";
import {
  type AlmacenCola,
  ARRIENDO_MS,
  candadoEnMemoria,
  candadoPorArriendo,
  clasificar,
  claveEntrega,
  claveTarea,
  drenar,
  type Ejecucion,
  encolar,
  mensajeRechazoEntrega,
  type OpCola,
  type OpEntrega,
  opDe,
  pendientesDe,
  type Registro,
} from "@/lib/offline/cola";
import { operacionPrevia, registroOperacion } from "@/lib/offline/operacion";

const ALUMNO = "33272397";
const OTRO = "32828381";

function almacen(inicial: OpCola[] = []): AlmacenCola & {
  datos: Map<string, OpCola>;
} {
  const datos = new Map(inicial.map((o) => [o.opId, o]));
  return {
    datos,
    todas: async () => [...datos.values()].map((o) => structuredClone(o)),
    guardar: async (op) => {
      datos.set(op.opId, structuredClone(op));
    },
    quitar: async (id) => {
      datos.delete(id);
    },
  };
}

const entrega = (o: Partial<OpEntrega> = {}): OpEntrega => ({
  tipo: "entrega",
  opId: "op-1",
  clave: claveEntrega("t1", ALUMNO),
  usuario: ALUMNO,
  creadaEn: 1,
  titulo: "Identidad de marca",
  estado: "pendiente",
  tareaId: "t1",
  respuestas: { p1: { texto: "Hola" } },
  imagenes: [],
  ...o,
});

/** El «servidor»: registra cada opId que ya entró y devuelve lo mismo si se repite. */
function servidor(cerradas: Set<string> = new Set()) {
  const hechas = new Map<string, string>();
  const escrituras: string[] = [];
  return {
    escrituras,
    async enviar(op: OpCola): Promise<Ejecucion> {
      if (hechas.has(op.opId)) return { tipo: "hecha" };
      if (op.tipo === "entrega" && cerradas.has(op.tareaId))
        return clasificar(
          "entrega",
          { ok: false, error: "cerrada" },
          mensajeRechazoEntrega,
        );
      hechas.set(op.opId, op.opId);
      escrituras.push(op.opId);
      return { tipo: "hecha" };
    },
  };
}

describe("encolar y leer", () => {
  test("claves estables por tarea y alumno, y por tarea nueva del constructor", () => {
    expect(claveEntrega("t1", ALUMNO)).toBe(`entrega:t1:${ALUMNO}`);
    expect(claveTarea("abc", "local")).toBe("tarea:abc");
    expect(claveTarea(null, "local")).toBe("tarea-nueva:local");
  });

  test("encolar la misma clave reemplaza a la anterior (el profe guardó dos veces)", async () => {
    const a = almacen();
    await encolar(a, entrega({ opId: "op-1" }));
    await encolar(a, entrega({ opId: "op-2", creadaEn: 2 }));
    expect([...a.datos.keys()]).toEqual(["op-2"]);
    // Otra clave u otro alumno conviven
    await encolar(
      a,
      entrega({ opId: "op-3", clave: claveEntrega("t2", ALUMNO) }),
    );
    await encolar(a, entrega({ opId: "op-4", usuario: OTRO }));
    expect(a.datos.size).toBe(3);
  });

  test("pendientes: solo de este usuario, en orden de llegada, sin las rechazadas", () => {
    const ops = [
      entrega({ opId: "c", creadaEn: 30 }),
      entrega({ opId: "a", creadaEn: 10 }),
      entrega({ opId: "x", creadaEn: 5, usuario: OTRO }),
      entrega({ opId: "r", creadaEn: 1, estado: "rechazada" }),
      entrega({ opId: "b", creadaEn: 20 }),
    ];
    expect(pendientesDe(ops, ALUMNO).map((o) => o.opId)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(opDe(ops, claveEntrega("t1", OTRO), ALUMNO)).toBeNull();
  });
});

describe("drenar", () => {
  test("en orden; se quitan las hechas", async () => {
    const a = almacen([
      entrega({ opId: "b", creadaEn: 2, clave: "k2" }),
      entrega({ opId: "a", creadaEn: 1, clave: "k1" }),
    ]);
    const s = servidor();
    const d = await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar: (op) => s.enviar(op),
    });
    expect(s.escrituras).toEqual(["a", "b"]);
    expect(d.hechas.map((h) => h.op.opId)).toEqual(["a", "b"]);
    expect(a.datos.size).toBe(0);
  });

  test("sin red se para ahí y las siguientes esperan su turno", async () => {
    const a = almacen([
      entrega({ opId: "a", creadaEn: 1, clave: "k1" }),
      entrega({ opId: "b", creadaEn: 2, clave: "k2" }),
    ]);
    const llamadas: string[] = [];
    const d = await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar: async (op) => {
        llamadas.push(op.opId);
        return { tipo: "esperar", motivo: "red" };
      },
    });
    expect(llamadas).toEqual(["a"]);
    expect(d.detenido).toBe("red");
    expect(a.datos.size).toBe(2);
  });

  test("una excepción del ejecutor cuenta como red: no se pierde nada", async () => {
    const a = almacen([entrega()]);
    const d = await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar: async () => {
        throw new TypeError("Failed to fetch");
      },
    });
    expect(d.detenido).toBe("red");
    expect(a.datos.get("op-1")?.estado).toBe("pendiente");
  });

  test("sesión vencida: queda pendiente y se avisa", async () => {
    const a = almacen([entrega()]);
    const d = await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar: async (op) =>
        clasificar(op.tipo, { ok: false, error: "sesion" }, String),
    });
    expect(d.detenido).toBe("sesion");
    expect(a.datos.get("op-1")?.estado).toBe("pendiente");
  });

  test("tarea cerrada: no se envía, queda rechazada con el aviso y las respuestas", async () => {
    const a = almacen([entrega({ tareaId: "cerrada" })]);
    const s = servidor(new Set(["cerrada"]));
    const d = await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar: (op) => s.enviar(op),
    });
    expect(s.escrituras).toEqual([]);
    expect(d.rechazadas).toHaveLength(1);
    const guardada = a.datos.get("op-1");
    expect(guardada).toMatchObject({
      estado: "rechazada",
      motivo: "cerrada",
      mensaje: "No se pudo enviar: la tarea ya cerró.",
      respuestas: { p1: { texto: "Hola" } },
    });
    // Un segundo drenaje no la reintenta
    const otra = await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar: (op) => s.enviar(op),
    });
    expect(otra.hechas).toHaveLength(0);
    expect(otra.rechazadas).toHaveLength(0);
  });

  test("las de otro alumno (teléfono compartido) no se drenan con esta sesión", async () => {
    const a = almacen([entrega({ usuario: OTRO })]);
    const s = servidor();
    await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar: (op) => s.enviar(op),
    });
    expect(s.escrituras).toEqual([]);
    expect(a.datos.size).toBe(1);
  });

  test("éxito parcial: la imagen subida queda guardada y el reintento no la vuelve a subir", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });
    const a = almacen([
      entrega({
        respuestas: { p2: { texto: "Hola" } },
        imagenes: [{ preguntaId: "p1", imagenId: "img-1", blob }],
      }),
    ]);
    const subidas: string[] = [];
    let redEnEnvio = true;
    const ejecutar = async (
      op: OpCola,
      guardarAvance: (op: OpCola) => Promise<void>,
    ): Promise<Ejecucion> => {
      if (op.tipo !== "entrega") throw new Error("no");
      let actual = op;
      for (const img of op.imagenes) {
        subidas.push(img.imagenId);
        actual = {
          ...actual,
          respuestas: {
            ...actual.respuestas,
            [img.preguntaId]: {
              imagenPath: `entregas/t1/c/${img.imagenId}.jpg`,
            },
          },
          imagenes: [],
        };
        await guardarAvance(actual);
      }
      if (redEnEnvio) return { tipo: "esperar", motivo: "red" };
      return { tipo: "hecha" };
    };
    await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar,
    });
    const tras = a.datos.get("op-1") as OpEntrega;
    expect(tras.imagenes).toEqual([]);
    expect(tras.respuestas.p1).toEqual({
      imagenPath: "entregas/t1/c/img-1.jpg",
    });
    redEnEnvio = false;
    await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar,
    });
    expect(subidas).toEqual(["img-1"]);
    expect(a.datos.size).toBe(0);
  });

  test("respuesta perdida: el mismo opId reintentado no duplica (servidor idempotente)", async () => {
    const a = almacen([entrega()]);
    const s = servidor();
    let perder = true;
    const ejecutar = async (op: OpCola): Promise<Ejecucion> => {
      const r = await s.enviar(op);
      if (perder) {
        perder = false;
        throw new TypeError("Failed to fetch"); // entró, pero la respuesta no llegó
      }
      return r;
    };
    await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar,
    });
    expect(a.datos.size).toBe(1);
    const d = await drenar({
      almacen: a,
      candado: candadoEnMemoria(),
      usuario: ALUMNO,
      ejecutar,
    });
    expect(d.hechas).toHaveLength(1);
    expect(s.escrituras).toEqual(["op-1"]);
  });
});

describe("candado entre pestañas", () => {
  test("dos pestañas con Web Locks simulado: una drena, la otra no hace nada", async () => {
    const a = almacen([
      entrega({ opId: "a", clave: "k1" }),
      entrega({ opId: "b", clave: "k2", creadaEn: 2 }),
    ]);
    const s = servidor();
    const compartido = candadoEnMemoria(); // el mismo candado = el mismo nombre en Web Locks
    let soltar = () => {};
    const espera = new Promise<void>((r) => {
      soltar = r;
    });
    const lenta = async (op: OpCola) => {
      await espera;
      return s.enviar(op);
    };
    const p1 = drenar({
      almacen: a,
      candado: compartido,
      usuario: ALUMNO,
      ejecutar: lenta,
    });
    const d2 = await drenar({
      almacen: a,
      candado: compartido,
      usuario: ALUMNO,
      ejecutar: lenta,
    });
    soltar();
    const d1 = await p1;
    expect(d2.tomado).toBe(false);
    expect(d1.hechas).toHaveLength(2);
    expect(s.escrituras).toEqual(["a", "b"]);
  });

  function registro(): Registro & { m: Map<string, string> } {
    const m = new Map<string, string>();
    return {
      m,
      getItem: (k) => m.get(k) ?? null,
      setItem: (k, v) => {
        m.set(k, v);
      },
      removeItem: (k) => {
        m.delete(k);
      },
    };
  }

  test("arriendo en localStorage: la segunda pestaña no entra mientras la primera drena", async () => {
    const r = registro();
    let ahora = 1000;
    const reloj = () => ahora;
    const t1 = candadoPorArriendo(r, "pestana-1", reloj);
    const t2 = candadoPorArriendo(r, "pestana-2", reloj);
    let dentro: Promise<unknown> = Promise.resolve();
    const fuera = await t1(async () => {
      dentro = t2(async () => "no debería");
      return "ok";
    });
    expect(fuera).toEqual({ valor: "ok" });
    expect(await dentro).toBeNull();
    // Al terminar se suelta y la otra puede
    expect(await t2(async () => 2)).toEqual({ valor: 2 });
    // Un arriendo de una pestaña que se cerró a medias vence
    r.setItem(
      "krea-cola-candado",
      JSON.stringify({ dueno: "cerrada", vence: ahora + ARRIENDO_MS }),
    );
    expect(await t1(async () => 1)).toBeNull();
    ahora += ARRIENDO_MS + 1;
    expect(await t1(async () => 1)).toEqual({ valor: 1 });
  });
});

describe("clasificar (D294)", () => {
  const msj = (e: string) => e;
  test("éxito, con y sin id", () => {
    expect(clasificar("tarea", { ok: true, id: "x" }, msj)).toEqual({
      tipo: "hecha",
      id: "x",
    });
    expect(clasificar("entrega", { ok: true }, msj)).toEqual({ tipo: "hecha" });
  });
  test("se reintenta: red y almacén caído; sesión espera", () => {
    for (const error of ["red", "almacen"])
      expect(clasificar("entrega", { ok: false, error }, msj)).toEqual({
        tipo: "esperar",
        motivo: "red",
      });
    expect(clasificar("tarea", { ok: false, error: "sesion" }, msj)).toEqual({
      tipo: "esperar",
      motivo: "sesion",
    });
  });
  test("no se reintenta: cerrada, ya evaluada o entregada, no es capitán (D012), fecha pasada", () => {
    for (const error of ["cerrada", "ya-entregada", "no-capitan", "no-existe"])
      expect(clasificar("entrega", { ok: false, error }, msj).tipo).toBe(
        "rechazada",
      );
    for (const error of ["cerrada", "fecha-pasada", "invalida"])
      expect(clasificar("tarea", { ok: false, error }, msj).tipo).toBe(
        "rechazada",
      );
  });
  test("el aviso dice qué pasó", () => {
    expect(mensajeRechazoEntrega("cerrada")).toBe(
      "No se pudo enviar: la tarea ya cerró.",
    );
    expect(mensajeRechazoEntrega("ya-entregada")).toContain("evaluada");
  });
});

describe("registro de operaciones (D293)", () => {
  test("nueva, repetida, ajena", () => {
    const r = registroOperacion(ALUMNO, "tarea", "t9", 100);
    expect(r.expiraEn.getTime()).toBeGreaterThan(100);
    expect(operacionPrevia(undefined, ALUMNO, "tarea")).toEqual({
      tipo: "nueva",
    });
    expect(operacionPrevia(r, ALUMNO, "tarea")).toEqual({
      tipo: "repetida",
      id: "t9",
    });
    expect(operacionPrevia(r, OTRO, "tarea")).toEqual({ tipo: "ajena" });
    expect(operacionPrevia(r, ALUMNO, "entrega")).toEqual({ tipo: "ajena" });
    expect(operacionPrevia({ basura: 1 }, ALUMNO, "tarea")).toEqual({
      tipo: "ajena",
    });
  });
});
