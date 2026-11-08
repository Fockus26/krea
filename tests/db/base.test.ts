import { describe, expect, test } from "bun:test";
import { leerUsuario } from "@/lib/data/usuarios";
import { user, usuarios } from "@/lib/db/schema";
import { baseNueva } from "./base";

describe("base en memoria", () => {
  test("migra y lee un usuario", async () => {
    const db = await baseNueva();
    await db.insert(user).values({
      id: "10000000",
      name: "Profe Prueba",
      email: "10000000@alumnos.krea.app",
    });
    await db.insert(usuarios).values({
      cedula: "10000000",
      rol: "profesor",
      nombres: "Profe",
      apellidos: "Prueba",
      seccion: null,
      equipoId: null,
      base: 20,
      avatar: { estilo: "lorelei", semilla: "10000000" },
      actualizadoEn: 1,
    });
    const u = await leerUsuario(db, "10000000");
    expect(u?.rol).toBe("profesor");
    expect(u?.admin).toBeUndefined();
  });
});
