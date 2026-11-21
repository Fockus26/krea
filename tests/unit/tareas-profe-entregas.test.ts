import { describe, expect, test } from "bun:test";
import type { Entrega, Equipo, Usuario } from "@/lib/modelo";
import { rutaEntregasTarea, rutaEvaluarTarea } from "@/lib/tareas-profe";
import {
  accionLabel,
  conteoEntregas,
  conteoEntregasTexto,
  filasDeSeccion,
  filasEntregasTarea,
  puntajeTexto,
  seccionElegida,
  seccionesDeFilas,
} from "@/lib/tareas-profe-entregas";

const PROFE = "45001237";

const alumno = (cedula: string, o: Partial<Usuario> = {}): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Adela",
  apellidos: `Pérez ${cedula}`,
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "lorelei", semilla: `s-${cedula}` },
  actualizadoEn: 1,
  ...o,
});

const equipo = (
  id: string,
  seccion: "5A" | "5C" = "5A",
): { id: string } & Equipo => ({
  id,
  nombre: `Equipo ${id}`,
  seccion,
  tema: null,
  capitanId: null,
  logoPath: null,
});

const entrega = (
  id: string,
  tareaId: string,
  titularId: string,
  o: Partial<Entrega> = {},
  tipo: Entrega["tipo"] = "individual",
): { id: string } & Entrega => ({
  id,
  tareaId,
  tipo,
  titularId,
  seccion: "5A",
  integrantes: [titularId],
  estado: "entregada",
  respuestas: {},
  enviadaPor: titularId,
  enviadaEn: 1,
  evaluacion: null,
  ...o,
});

const evaluacion = (puntaje: number, noParticiparon?: string[]) => ({
  estado: "evaluada" as const,
  evaluacion: {
    puntos: null,
    comentarios: {},
    puntaje,
    evaluadaPor: PROFE,
    evaluadaEn: 5,
    ...(noParticiparon ? { noParticiparon } : {}),
  },
});

describe("rutas (D398)", () => {
  test("el «Evaluar N» de la tarjeta filtra la cola por tarea", () => {
    expect(rutaEvaluarTarea("t-1")).toBe("/profe/evaluar?tarea=t-1");
    expect(rutaEntregasTarea("t-1")).toBe("/profe/tareas/t-1/entregas");
  });
});

describe("filasEntregasTarea · individual", () => {
  const usuarios = [
    alumno("1111111", { nombres: "Zoe", base: 15 }),
    alumno("2222222", { nombres: "Adela" }),
    alumno("3333333", { nombres: "Bea" }),
    alumno("4444444", { nombres: "Cris", seccion: "5C" }),
    alumno("5555555", { nombres: "Fuera", seccion: "5C" }),
  ];
  const tarea = {
    id: "t1",
    tipo: "individual" as const,
    secciones: ["5A", "5C"],
  };
  const filas = filasEntregasTarea({
    tarea,
    entregas: [
      entrega("t1__1111111", "t1", "1111111", evaluacion(16)),
      entrega("t1__2222222", "t1", "2222222"),
      // Un borrador no es una entrega; otra tarea no cuenta
      entrega("t1__3333333", "t1", "3333333", { estado: "borrador" }),
      entrega("t2__4444444", "t2", "4444444", evaluacion(20)),
    ],
    usuarios,
    equipos: [],
  });

  test("evaluada: puntaje, base y nota con la base vigente (D013)", () => {
    const f = filas.find((x) => x.titularId === "1111111");
    expect(f).toMatchObject({
      estado: "evaluada",
      puntaje: 16,
      base: 15,
      nota: 12,
      accion: "corregir",
      accionHref: "/profe/evaluar/t1__1111111",
      verHref: "/profe/evaluar/t1__1111111?ver",
    });
  });

  test("por evaluar: sin puntaje ni nota (Pendiente), con «Evaluar»", () => {
    const f = filas.find((x) => x.titularId === "2222222");
    expect(f).toMatchObject({
      estado: "por-evaluar",
      puntaje: null,
      nota: null,
      accion: "evaluar",
      accionHref: "/profe/evaluar/t1__2222222",
    });
  });

  test("sin entregar: borrador y quien no tiene entrega; sin enlaces", () => {
    for (const c of ["3333333", "4444444", "5555555"]) {
      const f = filas.find((x) => x.titularId === c);
      expect(f).toMatchObject({
        estado: "sin-entregar",
        entregaId: null,
        verHref: null,
        accion: null,
        accionHref: null,
        nota: null,
      });
    }
    expect(filas).toHaveLength(5);
  });

  test("orden por sección y nombre; solo alumnos de las secciones de la tarea", () => {
    expect(filas.map((f) => f.nombre.split(" ")[0])).toEqual([
      "Adela",
      "Bea",
      "Zoe",
      "Cris",
      "Fuera",
    ]);
    const solo5A = filasEntregasTarea({
      tarea: { ...tarea, secciones: ["5A"] },
      entregas: [],
      usuarios,
      equipos: [],
    });
    expect(solo5A.map((f) => f.seccion)).toEqual(["5A", "5A", "5A"]);
  });

  test("un profesor no aparece como alumno sin entregar", () => {
    const r = filasEntregasTarea({
      tarea,
      entregas: [],
      usuarios: [alumno(PROFE, { rol: "profesor", seccion: null })],
      equipos: [],
    });
    expect(r).toEqual([]);
  });
});

describe("filasEntregasTarea · grupal", () => {
  const usuarios = [
    alumno("1111111", { nombres: "Adela", base: 15, equipoId: "eq-2" }), // se mudó de equipo
    alumno("2222222", { nombres: "Beto" }),
    alumno("3333333", { nombres: "Cabrera", base: 18 }),
  ];
  const tarea = { id: "g1", tipo: "grupal" as const, secciones: ["5A"] };
  const grupal = entrega(
    "g1__eq-1",
    "g1",
    "eq-1",
    {
      integrantes: ["1111111", "2222222", "3333333"],
      ...evaluacion(16, ["2222222"]),
    },
    "grupal",
  );
  const filas = filasEntregasTarea({
    tarea,
    entregas: [grupal],
    usuarios,
    equipos: [equipo("eq-1"), equipo("eq-2"), equipo("eq-3", "5C")],
  });

  test("el equipo con el que se entregó, con la nota propia de cada integrante", () => {
    const f = filas.find((x) => x.titularId === "eq-1");
    expect(f).toMatchObject({
      nombre: "Equipo eq-1",
      estado: "evaluada",
      puntaje: 16,
      base: null,
      nota: null,
      accion: "corregir",
    });
    expect(
      f?.integrantes.map((i) => [i.cedula, i.base, i.nota, i.noParticipo]),
    ).toEqual([
      ["1111111", 15, 12, false], // sigue con eq-1 aunque ya esté en eq-2 (D221)
      ["2222222", 20, 1, true], // No participó = nota mínima (D365)
      ["3333333", 18, 14.4, false],
    ]);
  });

  test("los equipos de las secciones de la tarea sin entrega salen «sin entregar»", () => {
    const eq2 = filas.find((x) => x.titularId === "eq-2");
    expect(eq2).toMatchObject({ estado: "sin-entregar", integrantes: [] });
    // eq-3 es de 5C, que la tarea no incluye
    expect(filas.find((x) => x.titularId === "eq-3")).toBeUndefined();
  });

  test("equipo eliminado: usa el nombre que tenía; alumno borrado: nombre desconocido", () => {
    const r = filasEntregasTarea({
      tarea,
      entregas: [
        { ...grupal, titularNombre: "Los de antes", integrantes: ["9999999"] },
      ],
      usuarios: [],
      equipos: [],
    });
    expect(r[0]?.nombre).toBe("Los de antes");
    expect(r[0]?.integrantes[0]).toMatchObject({
      nombre: "Sin nombre",
      base: null,
      nota: null,
    });
  });

  test("grupal por evaluar: integrantes Pendiente", () => {
    const r = filasEntregasTarea({
      tarea,
      entregas: [
        entrega(
          "g1__eq-1",
          "g1",
          "eq-1",
          { integrantes: ["1111111"] },
          "grupal",
        ),
      ],
      usuarios,
      equipos: [equipo("eq-1")],
    });
    expect(r[0]).toMatchObject({ estado: "por-evaluar", accion: "evaluar" });
    expect(r[0]?.integrantes[0]?.nota).toBeNull();
  });
});

describe("selector de sección y textos", () => {
  const filas = [
    { seccion: "5C" as const },
    { seccion: "5A" as const },
    { seccion: "5A" as const },
  ];

  test("secciones con filas, ordenadas; la pedida si existe, si no la primera", () => {
    expect(seccionesDeFilas(filas)).toEqual(["5A", "5C"]);
    expect(seccionElegida("5C", ["5A", "5C"])).toBe("5C");
    expect(seccionElegida("9Z", ["5A", "5C"])).toBe("5A");
    expect(seccionElegida(undefined, [])).toBeNull();
    expect(filasDeSeccion(filas, "5A")).toHaveLength(2);
    expect(filasDeSeccion(filas, null)).toEqual([]);
  });

  test("conteo en frase completa", () => {
    const c = conteoEntregas([
      { estado: "por-evaluar" },
      { estado: "evaluada" },
      { estado: "evaluada" },
      { estado: "sin-entregar" },
    ]);
    expect(c).toEqual({ porEvaluar: 1, evaluadas: 2, sinEntregar: 1 });
    expect(conteoEntregasTexto(c)).toBe(
      "1 por evaluar · 2 evaluadas · 1 sin entregar",
    );
  });

  test("puntaje con coma y nombre accesible con el titular", () => {
    expect(puntajeTexto(17.5)).toBe("17,5 / 20");
    expect(puntajeTexto(null)).toBe("—");
    expect(accionLabel("corregir", "Adela Pérez")).toBe(
      "Corregir la entrega de Adela Pérez",
    );
  });
});

describe("filasEntregasTarea · devolver y eliminar (D411, D413)", () => {
  const usuarios = [alumno("1111111"), alumno("2222222"), alumno("3333333")];
  const entregas = [
    entrega("t1__1111111", "t1", "1111111", evaluacion(16)),
    entrega("t1__2222222", "t1", "2222222", { enviadaEn: 7 }),
  ];
  const filasCon = (estado?: "abierta" | "evaluada") =>
    filasEntregasTarea({
      tarea: {
        id: "t1",
        tipo: "individual",
        secciones: ["5A"],
        ...(estado ? { estado } : {}),
      },
      entregas,
      usuarios,
      equipos: [],
    });
  const de = (filas: ReturnType<typeof filasCon>, c: string) =>
    filas.find((f) => f.titularId === c);

  test("tarea abierta: solo la evaluada se puede devolver; cada fila lleva lo que el profe ve", () => {
    const filas = filasCon("abierta");
    expect(de(filas, "1111111")).toMatchObject({
      puedeDevolver: true,
      enviadaEn: 1,
      evaluadaEn: 5,
    });
    expect(de(filas, "2222222")).toMatchObject({
      puedeDevolver: false,
      enviadaEn: 7,
      evaluadaEn: null,
    });
    expect(de(filas, "3333333")).toMatchObject({
      entregaId: null,
      puedeDevolver: false,
    });
  });

  test("tarea cerrada o sin estado: ninguna", () => {
    expect(filasCon("evaluada").some((f) => f.puedeDevolver)).toBe(false);
    expect(filasCon().some((f) => f.puedeDevolver)).toBe(false);
  });
});
