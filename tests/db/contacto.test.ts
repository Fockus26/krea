// Contacto opcional del profesor sobre PGlite (D378–D380): lo guarda solo un profe, reescribir el
// perfil no lo borra y el alumno ve solo a sus profes con contacto, sin cédula ni email privado.
import { beforeAll, describe, expect, test } from "bun:test";
import { tarjetasProfes, zContacto } from "@/lib/contacto";
import {
  contactosDeProfes,
  guardarContactoCon,
  leerContacto,
} from "@/lib/data/contacto";
import type { Db } from "@/lib/db";
import type { Usuario } from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 13, 15);
const PROFE_TODAS = "30260001"; // ve todas las secciones
const PROFE_A = "30260002"; // solo 5A
const PROFE_C = "30260003"; // solo 5C
const PROFE_SIN = "30260004"; // sin contacto
const ALUMNO = "39260001"; // 5A

const persona = (
  cedula: string,
  rol: Usuario["rol"],
  seccion: string | null,
  nombres: string,
): Usuario => ({
  cedula,
  rol,
  nombres,
  apellidos: "Contacto",
  seccion,
  equipoId: null,
  base: 20,
  avatar: { estilo: "lorelei", semilla: cedula },
  actualizadoEn: 1,
});

const contacto = (telefono: string, email: string) =>
  zContacto.parse({ telefono, email });

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerUsuario(
    db(),
    persona(PROFE_TODAS, "profesor", null, "Ana"),
    "privado-ana@gmail.com",
  );
  await docs.ponerUsuario(db(), persona(PROFE_A, "profesor", "5A", "Beto"));
  await docs.ponerUsuario(db(), persona(PROFE_C, "profesor", "5C", "Carla"));
  await docs.ponerUsuario(db(), persona(PROFE_SIN, "profesor", null, "Dora"));
  await docs.ponerUsuario(db(), persona(ALUMNO, "estudiante", "5A", "Luis"));
}, 30_000);

describe("guardarContactoCon (D378)", () => {
  test("el profe guarda el suyo normalizado; vaciar lo borra", async () => {
    expect(
      await guardarContactoCon(
        db(),
        PROFE_TODAS,
        contacto("0412-123 4567", "Ana@Gmail.com"),
        AHORA,
      ),
    ).toEqual({ ok: true });
    expect(await leerContacto(db(), PROFE_TODAS)).toEqual({
      telefono: "584121234567",
      emailContacto: "ana@gmail.com",
    });
    await guardarContactoCon(db(), PROFE_TODAS, contacto("", ""), AHORA);
    expect(await leerContacto(db(), PROFE_TODAS)).toEqual({
      telefono: null,
      emailContacto: null,
    });
    // El email de recuperación es otra columna: no se toca
    expect(await docs.emailDe(db(), PROFE_TODAS)).toBe("privado-ana@gmail.com");
  });

  test("un alumno o una cédula sin perfil no guardan", async () => {
    expect(
      await guardarContactoCon(
        db(),
        ALUMNO,
        contacto("04141234567", ""),
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-profesor" });
    expect(await leerContacto(db(), ALUMNO)).toEqual({
      telefono: null,
      emailContacto: null,
    });
    expect(
      await guardarContactoCon(db(), "99999999", contacto("", ""), AHORA),
    ).toEqual({ ok: false, error: "no-existe" });
  });

  test("reescribir el perfil (filaDeUsuario) no borra el contacto", async () => {
    await guardarContactoCon(
      db(),
      PROFE_A,
      contacto("0424-1112233", ""),
      AHORA,
    );
    await docs.ponerUsuario(db(), persona(PROFE_A, "profesor", "5A", "Beto"));
    expect((await leerContacto(db(), PROFE_A))?.telefono).toBe("584241112233");
  });
});

describe("contactosDeProfes (D380)", () => {
  test("los profes de su sección y los de todas, con algún dato; solo esas columnas", async () => {
    await guardarContactoCon(
      db(),
      PROFE_TODAS,
      contacto("", "ana@gmail.com"),
      AHORA,
    );
    await guardarContactoCon(db(), PROFE_C, contacto("04165556677", ""), AHORA);
    const filas = await contactosDeProfes(db(), "5A");
    expect(filas.map((f) => f.nombres).sort()).toEqual(["Ana", "Beto"]);
    for (const f of filas)
      expect(Object.keys(f).sort()).toEqual([
        "apellidos",
        "emailContacto",
        "nombres",
        "telefono",
      ]);
    const tarjetas = tarjetasProfes(filas);
    expect(tarjetas.map((t) => t.nombre)).toEqual([
      "Ana Contacto",
      "Beto Contacto",
    ]);
    expect(JSON.stringify(tarjetas)).not.toContain("privado-ana");
    expect(JSON.stringify(tarjetas)).not.toContain(PROFE_TODAS);
    // 5C ve a Carla (y a Ana, que ve todas), no a Beto
    expect(
      (await contactosDeProfes(db(), "5C")).map((f) => f.nombres).sort(),
    ).toEqual(["Ana", "Carla"]);
  }, 30_000);
});
