import { describe, expect, test } from "bun:test";
import {
  CONFLICTO_TEXTO,
  conflictoDetalle,
  errorAlumnoTexto,
  hayConflicto,
  versionDe,
  zEditarAlumno,
} from "@/lib/alumnos-datos";
import {
  avisoPresencia,
  type EntradaPresencia,
  editoresVigentes,
  LATIDO_MS,
  NOMBRE_PRESENCIA_MAX,
  nombrePresencia,
  porAlumno,
  presenciaTexto,
  VIGENCIA_MS,
  vigente,
} from "@/lib/presencia";

const AHORA = 1_000_000;
const e = (
  profeId: string,
  nombre: string,
  latido = AHORA,
  desde = AHORA - 60_000,
): EntradaPresencia => ({ profeId, nombre, desde, latido });

describe("vigencia del latido (D277)", () => {
  test("dos latidos perdidos todavía no la matan; más de 45 s, sí", () => {
    expect(VIGENCIA_MS).toBeGreaterThan(2 * LATIDO_MS);
    expect(vigente(AHORA - VIGENCIA_MS, AHORA)).toBe(true);
    expect(vigente(AHORA - VIGENCIA_MS - 1, AHORA)).toBe(false);
  });

  test("un latido «en el futuro» (reloj atrasado) cuenta como vivo", () => {
    expect(vigente(AHORA + 10_000, AHORA)).toBe(true);
  });

  test("sin la entrada propia ni las vencidas, en orden de llegada", () => {
    const r = editoresVigentes(
      [
        e("3", "Carla Rubio", AHORA, AHORA - 1000),
        e("yo", "Yo Mismo"),
        e("2", "Luis Farías", AHORA - 50_000),
        e("1", "Adela Pérez", AHORA - 5000, AHORA - 9000),
      ],
      AHORA,
      "yo",
    );
    expect(r.map((x) => x.profeId)).toEqual(["1", "3"]);
  });
});

describe("texto de presencia", () => {
  test("uno, dos y más", () => {
    expect(presenciaTexto([])).toBe("");
    expect(presenciaTexto([e("1", "Adela Pérez")])).toBe(
      "Adela Pérez está editando",
    );
    expect(presenciaTexto([e("1", "Adela Pérez"), e("2", "Luis Farías")])).toBe(
      "Adela Pérez y Luis Farías están editando",
    );
    expect(
      presenciaTexto([
        e("1", "Adela Pérez"),
        e("2", "Luis Farías"),
        e("3", "Carla Rubio"),
      ]),
    ).toBe("Adela Pérez y 2 más están editando");
  });

  test("nombre del profe: primer nombre y primer apellido, nunca vacío", () => {
    expect(
      nombrePresencia({
        nombres: " Adela  Juana ",
        apellidos: "Pérez Iglesias",
      }),
    ).toBe("Adela Pérez");
    expect(nombrePresencia(null)).toBe("Otro profe");
    expect(nombrePresencia({ nombres: "", apellidos: "" })).toBe("Otro profe");
    expect(
      nombrePresencia({ nombres: "x".repeat(200), apellidos: "" }).length,
    ).toBe(NOMBRE_PRESENCIA_MAX);
  });

  test("agrupa por alumno", () => {
    const m = porAlumno([
      { alumnoId: "a", entrada: e("1", "Adela Pérez") },
      { alumnoId: "b", entrada: e("2", "Luis Farías") },
      { alumnoId: "a", entrada: e("3", "Carla Rubio") },
    ]);
    expect(m.get("a")?.map((x) => x.profeId)).toEqual(["1", "3"]);
    expect(m.get("b")?.length).toBe(1);
  });
});

describe("conflicto al guardar (D276)", () => {
  const abierto = versionDe(
    { nombres: "Luis", apellidos: "Farías", base: 20 },
    null,
  );

  test("sin versión (vista previa): nunca hay conflicto", () => {
    expect(hayConflicto(undefined, { ...abierto, nombres: "Otro" })).toBe(
      false,
    );
  });

  test("igual: no hay; nombre, apellido, base o email distintos: sí", () => {
    expect(hayConflicto(abierto, { ...abierto })).toBe(false);
    expect(hayConflicto(abierto, { ...abierto, nombres: "Luisa" })).toBe(true);
    expect(hayConflicto(abierto, { ...abierto, apellidos: "Iglesias" })).toBe(
      true,
    );
    expect(hayConflicto(abierto, { ...abierto, base: 15 })).toBe(true);
    expect(hayConflicto(abierto, { ...abierto, email: "l@gmail.com" })).toBe(
      true,
    );
  });

  test("sin email en la versión, el email no se compara", () => {
    const sinEmail = versionDe({
      nombres: "Luis",
      apellidos: "Farías",
      base: 20,
    });
    expect("email" in sinEmail).toBe(false);
    expect(hayConflicto(sinEmail, { ...sinEmail, email: "l@gmail.com" })).toBe(
      false,
    );
  });

  test("la entrada acepta la versión y sigue valiendo sin ella", () => {
    const sin = {
      cedula: "45009896",
      nombres: "Luis",
      apellidos: "Farías",
      base: 20,
      motivo: "",
    };
    expect(zEditarAlumno.safeParse(sin).success).toBe(true);
    const con = zEditarAlumno.safeParse({ ...sin, version: abierto });
    expect(con.success && con.data.version).toEqual(abierto);
  });

  test("el texto dice qué pasó y qué hacer", () => {
    expect(errorAlumnoTexto("conflicto")).toBe(CONFLICTO_TEXTO);
    expect(CONFLICTO_TEXTO).toContain("vuelve a guardar");
  });

  test("el detalle muestra lo vigente, con coma decimal y el email solo si se editaba", () => {
    expect(
      conflictoDetalle({
        nombres: "Luis",
        apellidos: "Farías",
        base: 15.5,
        email: null,
      }),
    ).toBe(
      "Ahora está guardado: Luis Farías · base 15,5 · sin email de recuperación.",
    );
    expect(
      conflictoDetalle({ nombres: "Luis", apellidos: "Farías", base: 20 }),
    ).toBe("Ahora está guardado: Luis Farías · base 20.");
  });
});

describe("aviso del diálogo", () => {
  test("no bloquea: avisa y dice qué pasa si el otro guarda antes", () => {
    expect(avisoPresencia("")).toBe("");
    expect(avisoPresencia("Adela Pérez está editando")).toBe(
      "Adela Pérez está editando a este alumno. Si guarda antes que tú, te avisaremos.",
    );
  });
});
