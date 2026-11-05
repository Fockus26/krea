import { describe, expect, test } from "bun:test";
import {
  cambiosEntre,
  conCambios,
  equiposProfeDatos,
  errorEquiposTexto,
  estadoDeDatos,
  zMoverAlumno,
} from "@/lib/equipos-datos";
import { cambiarCapitan, moverAlumno } from "@/lib/equipos-profe";
import type { Equipo, Usuario } from "@/lib/modelo";

const usuario = (
  cedula: string,
  nombres: string,
  equipoId: string | null,
  o: Partial<Usuario> = {},
): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres,
  apellidos: "Prueba",
  seccion: "5A",
  equipoId,
  base: 20,
  avatar: { estilo: "lorelei", semilla: `s-${cedula}` },
  actualizadoEn: 1,
  ...o,
});

const equipo = (
  id: string,
  capitanId: string | null,
  o: Partial<Equipo> = {},
): { id: string } & Equipo => ({
  id,
  nombre: `5A ${id}`,
  seccion: "5A",
  tema: null,
  capitanId,
  logoPath: null,
  ...o,
});

const USUARIOS = [
  usuario("1000001", "Carla", "g1"),
  usuario("1000002", "Ana", "g1"),
  usuario("1000003", "Beto", "g2"),
  usuario("1000004", "Dani", null),
  usuario("1000005", "Eva", "g-borrado"),
  usuario("1000009", "Otra", "g9", { seccion: "5C" }),
];
const EQUIPOS = [
  equipo("g1", "1000001"),
  equipo("g2", "1000003"),
  equipo("g9", null, { seccion: "5C" }),
];

describe("estadoDeDatos", () => {
  test("integrantes por equipoId (por nombre) y capitán del equipo", () => {
    const e = estadoDeDatos("5A", USUARIOS, EQUIPOS);
    expect(e.equipos).toEqual({
      g1: { miembros: ["1000002", "1000001"], capitan: "1000001" },
      g2: { miembros: ["1000003"], capitan: "1000003" },
    });
    // Un equipo que no existe cuenta como «Sin equipo»
    expect(e.sinEquipo).toEqual(["1000004", "1000005"]);
  });

  test("un capitán que ya no es integrante se descarta", () => {
    const e = estadoDeDatos("5A", USUARIOS, [equipo("g1", "1000003")]);
    expect(e.equipos.g1?.capitan).toBe("1000002");
  });
});

describe("cambiosEntre", () => {
  test("mover al capitán: cambia su equipo y el cargo pasa al siguiente", () => {
    const antes = estadoDeDatos("5A", USUARIOS, EQUIPOS);
    const despues = moverAlumno(antes, "1000001", "g2");
    expect(cambiosEntre(despues, USUARIOS, EQUIPOS, "5A")).toEqual({
      usuarios: [{ cedula: "1000001", equipoId: "g2" }],
      equipos: [{ id: "g1", capitanId: "1000002" }],
    });
  });

  test("quitar del equipo: equipoId null", () => {
    const antes = estadoDeDatos("5A", USUARIOS, EQUIPOS);
    const despues = moverAlumno(antes, "1000003", null);
    expect(cambiosEntre(despues, USUARIOS, EQUIPOS, "5A")).toEqual({
      usuarios: [{ cedula: "1000003", equipoId: null }],
      equipos: [{ id: "g2", capitanId: null }],
    });
  });

  test("el primero que llega a un equipo vacío es su capitán", () => {
    const eqs = [...EQUIPOS, equipo("g3", null)];
    const antes = estadoDeDatos("5A", USUARIOS, eqs);
    const despues = moverAlumno(antes, "1000004", "g3");
    expect(cambiosEntre(despues, USUARIOS, eqs, "5A")).toEqual({
      usuarios: [{ cedula: "1000004", equipoId: "g3" }],
      equipos: [{ id: "g3", capitanId: "1000004" }],
    });
  });

  test("cambiar capitán: solo el equipo", () => {
    const antes = estadoDeDatos("5A", USUARIOS, EQUIPOS);
    const despues = cambiarCapitan(antes, "g1", "1000002");
    expect(cambiosEntre(despues, USUARIOS, EQUIPOS, "5A")).toEqual({
      usuarios: [],
      equipos: [{ id: "g1", capitanId: "1000002" }],
    });
  });

  test("sin cambios: nada que escribir (el equipo huérfano se queda)", () => {
    const antes = estadoDeDatos("5A", USUARIOS, EQUIPOS);
    expect(cambiosEntre(antes, USUARIOS, EQUIPOS, "5A")).toEqual({
      usuarios: [],
      equipos: [],
    });
  });
});

describe("conCambios", () => {
  test("aplica equipo y capitán en memoria (para el ranking)", () => {
    const d = conCambios(
      { usuarios: USUARIOS, equipos: EQUIPOS },
      {
        usuarios: [{ cedula: "1000004", equipoId: "g2" }],
        equipos: [{ id: "g2", capitanId: "1000004" }],
      },
      99,
    );
    const dani = d.usuarios.find((u) => u.cedula === "1000004");
    expect(dani?.equipoId).toBe("g2");
    expect(dani?.actualizadoEn).toBe(99);
    expect(d.equipos.find((e) => e.id === "g2")?.capitanId).toBe("1000004");
    // Los demás, intactos
    expect(d.usuarios[0]).toBe(USUARIOS[0] as Usuario);
  });
});

describe("equiposProfeDatos", () => {
  test("orden del ranking, avatar del perfil y logo firmado", () => {
    const d = equiposProfeDatos("5A", {
      usuarios: USUARIOS,
      equipos: [
        ...EQUIPOS.slice(0, 1),
        equipo("g2", "1000003", { logoPath: "equipos/g2/a.webp" }),
      ],
      ranking: {
        alumnos: {},
        equipos: {
          g1: { nombre: "x", logoPath: null, puntos: 10 },
          g2: { nombre: "y", logoPath: "equipos/g2/a.webp", puntos: 15 },
        },
        actualizadoEn: 1,
      },
      logos: new Map([["equipos/g2/a.webp", "https://firmada/a"]]),
    });
    expect(d.equipos.map((e) => [e.id, e.puesto, e.logo])).toEqual([
      ["g2", 1, "https://firmada/a"],
      ["g1", 2, null],
    ]);
    expect(d.alumnos["1000002"]).toEqual({
      cedula: "1000002",
      nombre: "Ana Prueba",
      seed: "s-1000002",
      estilo: "lorelei",
    });
    expect(d.total).toBe(5);
  });

  test("sin documento de ranking: todos a 0 y empatados", () => {
    const d = equiposProfeDatos("5A", {
      usuarios: USUARIOS,
      equipos: EQUIPOS,
      ranking: null,
    });
    expect(d.equipos.every((e) => e.puntos === 0 && e.empate)).toBe(true);
  });
});

test("zMoverAlumno: destino null = quitar; id con barra, inválido", () => {
  expect(
    zMoverAlumno.safeParse({ cedula: "1000001", destino: null }).success,
  ).toBe(true);
  expect(
    zMoverAlumno.safeParse({ cedula: "1000001", destino: "a/b" }).success,
  ).toBe(false);
});

test("errorEquiposTexto: «sesiones» dice que el cambio sí se guardó", () => {
  expect(errorEquiposTexto("sesiones")).toContain("se guardó");
});
