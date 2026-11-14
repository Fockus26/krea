// Editar la entrega mientras no esté evaluada (D395–D397): reglas puras.
import { describe, expect, test } from "bun:test";
import {
  imagenesSinUso,
  inicialEdicion,
  mensajeErrorEntrega,
  modoEnvio,
  puedeEditar,
} from "@/lib/entregas";
import { errorEvaluarTexto, zGuardarEvaluacion } from "@/lib/evaluar-datos";
import { idEntrega, type Usuario } from "@/lib/modelo";
import { clasificar, mensajeRechazoEntrega } from "@/lib/offline/cola";

const ALUMNO = "39000003";
const CAPITAN = "39000001";
const INTEGRANTE = "39000002";
const EQUIPO = "w5-g1";

const usuario = (cedula: string, equipoId: string | null = null) =>
  ({
    cedula,
    rol: "estudiante",
    seccion: "5A",
    equipoId,
  }) satisfies Pick<Usuario, "cedula" | "rol" | "seccion" | "equipoId">;

const tarea = (
  tipo: "individual" | "grupal",
  estado: "abierta" | "evaluada" = "abierta",
) => ({ tipo, estado, secciones: ["5A" as const] });

const equipo = { id: EQUIPO, seccion: "5A" as const, capitanId: CAPITAN };
const preguntas = [{ id: "p1" }, { id: "p2" }];

describe("modoEnvio (D395)", () => {
  test("sin entrega o borrador: nueva", () => {
    expect(modoEnvio(null, preguntas)).toEqual({ ok: true, modo: "nueva" });
    expect(
      modoEnvio({ estado: "borrador", respuestas: {} }, preguntas),
    ).toEqual({ ok: true, modo: "nueva" });
  });
  test("entregada sin evaluar: reenvío", () => {
    expect(
      modoEnvio(
        { estado: "entregada", respuestas: { p1: {}, p2: {} } },
        preguntas,
      ),
    ).toEqual({ ok: true, modo: "reenvio" });
  });
  test("evaluada con respuestas: ya-evaluada", () => {
    expect(
      modoEnvio(
        { estado: "evaluada", respuestas: { p1: {}, p2: {} } },
        preguntas,
      ),
    ).toEqual({ ok: false, error: "ya-evaluada" });
  });
  test("evaluada sin respuestas (faltanRespuestas): completar, como antes", () => {
    expect(
      modoEnvio({ estado: "evaluada", respuestas: { p1: {} } }, preguntas),
    ).toEqual({ ok: true, modo: "completar" });
  });
});

describe("puedeEditar (D395)", () => {
  const propia = (titular: string, tareaId = "t1") => ({
    id: idEntrega(tareaId, titular),
    estado: "entregada" as const,
  });

  test("individual: el alumno, su entrega sin evaluar y la tarea abierta", () => {
    expect(
      puedeEditar(
        usuario(ALUMNO),
        tarea("individual"),
        "t1",
        null,
        propia(ALUMNO),
      ),
    ).toBe(true);
  });
  test("evaluada o tarea cerrada: no", () => {
    expect(
      puedeEditar(usuario(ALUMNO), tarea("individual"), "t1", null, {
        ...propia(ALUMNO),
        estado: "evaluada",
      }),
    ).toBe(false);
    expect(
      puedeEditar(
        usuario(ALUMNO),
        tarea("individual", "evaluada"),
        "t1",
        null,
        propia(ALUMNO),
      ),
    ).toBe(false);
    expect(
      puedeEditar(usuario(ALUMNO), tarea("individual"), "t1", null, null),
    ).toBe(false);
  });
  test("grupal: el capitán sí; un integrante no (D012, D248)", () => {
    expect(
      puedeEditar(
        usuario(CAPITAN, EQUIPO),
        tarea("grupal"),
        "t1",
        equipo,
        propia(EQUIPO),
      ),
    ).toBe(true);
    expect(
      puedeEditar(
        usuario(INTEGRANTE, EQUIPO),
        tarea("grupal"),
        "t1",
        equipo,
        propia(EQUIPO),
      ),
    ).toBe(false);
  });
  test("grupal: la entrega del equipo viejo no es la suya (D221)", () => {
    expect(
      puedeEditar(
        usuario(CAPITAN, EQUIPO),
        tarea("grupal"),
        "t1",
        equipo,
        propia("otro-equipo"),
      ),
    ).toBe(false);
  });
});

describe("imagenesSinUso (D396)", () => {
  test("las que estaban y ya no están; sin repetir", () => {
    expect(
      imagenesSinUso(
        {
          p1: { imagenPath: "entregas/t/c/a.jpg" },
          p2: { imagenPaths: ["entregas/t/c/b.jpg", "entregas/t/c/c.jpg"] },
          p3: { texto: "hola" },
        },
        {
          p1: { imagenPath: "entregas/t/c/d.jpg" },
          p2: { imagenPaths: ["entregas/t/c/c.jpg"] },
          p3: { texto: "chao" },
        },
      ),
    ).toEqual(["entregas/t/c/a.jpg", "entregas/t/c/b.jpg"]);
  });
  test("sin cambios de imagen: ninguna", () => {
    const r = { p1: { imagenPath: "entregas/t/c/a.jpg" } };
    expect(imagenesSinUso(r, r)).toEqual([]);
  });
});

describe("inicialEdicion (D395)", () => {
  test("texto tal cual; imagen única y varias con ruta y vista previa firmada", () => {
    const urls = new Map([["entregas/t/c/a.jpg", "https://firmada/a"]]);
    expect(
      inicialEdicion(
        [
          { id: "p1", formato: "texto" },
          { id: "p2", formato: "imagen" },
          { id: "p3", formato: "imagen", maxImagenes: 3 },
          { id: "p4", formato: "texto" },
        ],
        [
          { tipo: "texto", texto: "Mi respuesta" },
          { tipo: "imagen", imagenPaths: ["entregas/t/c/a.jpg"] },
          {
            tipo: "imagen",
            imagenPaths: ["entregas/t/c/b.jpg", "entregas/t/c/c.jpg"],
          },
          null,
        ],
        urls,
      ),
    ).toEqual({
      p1: "Mi respuesta",
      p2: {
        status: "lista",
        file: { name: "Imagen enviada", size: 0, src: "https://firmada/a" },
        path: "entregas/t/c/a.jpg",
      },
      p3: [
        {
          status: "lista",
          file: { name: "Imagen 1 enviada", size: 0, src: "" },
          path: "entregas/t/c/b.jpg",
        },
        {
          status: "lista",
          file: { name: "Imagen 2 enviada", size: 0, src: "" },
          path: "entregas/t/c/c.jpg",
        },
      ],
    });
  });
});

describe("errores nuevos", () => {
  test("ya-evaluada: texto del alumno y la cola no la reintenta", () => {
    expect(mensajeErrorEntrega("ya-evaluada")).toContain("Ya fue evaluada");
    const r = clasificar(
      "entrega",
      { ok: false, error: "ya-evaluada" },
      mensajeRechazoEntrega,
    );
    expect(r.tipo).toBe("rechazada");
  });
  test("editada: texto del profe; enviadaEn opcional en el envío (D397)", () => {
    expect(errorEvaluarTexto("editada")).toBe(
      "El alumno editó la entrega. Recarga para ver la versión nueva.",
    );
    const base = {
      entregaId: "t1__39000003",
      puntos: {},
      comentarios: {},
      version: null,
    };
    expect(zGuardarEvaluacion.safeParse(base).success).toBe(true);
    expect(
      zGuardarEvaluacion.safeParse({ ...base, enviadaEn: 1_700_000_000_000 })
        .success,
    ).toBe(true);
    expect(
      zGuardarEvaluacion.safeParse({ ...base, enviadaEn: null }).success,
    ).toBe(true);
  });
});
