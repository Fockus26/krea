// Fila de `usuarios` ↔ `Usuario` de `lib/modelo` (D327). Las marcas que en Firestore estaban
// ausentes cuando eran falsas (`admin`, `debeCambiarPassword`, `apariencia`) se devuelven igual:
// ausentes, para que los esquemas y las vistas no cambien.
import { and, eq, inArray } from "drizzle-orm";
import type { Tx } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { type Usuario, zUsuario } from "@/lib/modelo";

export type FilaUsuario = typeof usuarios.$inferSelect;

export function usuarioDeFila(f: FilaUsuario): Usuario | null {
  const u = zUsuario.safeParse({
    cedula: f.cedula,
    rol: f.rol,
    nombres: f.nombres,
    apellidos: f.apellidos,
    seccion: f.seccion,
    equipoId: f.equipoId,
    base: f.base,
    avatar: f.avatar,
    ...(f.apariencia ? { apariencia: f.apariencia } : {}),
    ...(f.admin ? { admin: true } : {}),
    ...(f.debeCambiarPassword ? { debeCambiarPassword: true } : {}),
    actualizadoEn: f.actualizadoEn,
  });
  if (!u.success) console.error(`[usuarios] ${f.cedula} no valida`);
  return u.success ? u.data : null;
}

/**
 * `Usuario` → columnas, sin el email de recuperación ni el contacto del profe (D378): van aparte,
 * así que reescribir un perfil con esta fila nunca los borra.
 */
export function filaDeUsuario(
  u: Usuario,
): Omit<FilaUsuario, "emailRecuperacion" | "telefono" | "emailContacto"> {
  return {
    cedula: u.cedula,
    rol: u.rol,
    nombres: u.nombres,
    apellidos: u.apellidos,
    seccion: u.seccion,
    equipoId: u.equipoId,
    base: u.base,
    avatar: u.avatar,
    apariencia: u.apariencia ?? null,
    admin: u.rol === "profesor" && u.admin === true,
    debeCambiarPassword: u.debeCambiarPassword === true,
    actualizadoEn: u.actualizadoEn,
  };
}

export async function leerUsuario(
  db: Tx,
  cedula: string,
): Promise<Usuario | null> {
  const [f] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.cedula, cedula))
    .limit(1);
  return f ? usuarioDeFila(f) : null;
}

/** Fila con bloqueo para actualizar dentro de una transacción (lo que hacía `tx.get` en Firestore). */
export async function leerUsuarioParaActualizar(
  tx: Tx,
  cedula: string,
): Promise<Usuario | null> {
  const [f] = await tx
    .select()
    .from(usuarios)
    .where(eq(usuarios.cedula, cedula))
    .for("update")
    .limit(1);
  return f ? usuarioDeFila(f) : null;
}

/**
 * Nombres y apellidos de los profesores con esas cédulas (cédula → nombre), para que el alumno vea
 * quién lo evaluó (D447). Solo esas dos columnas: la cédula es la clave y no sale del servidor
 * (D380, D388). Una cédula que no es de un profesor no aparece.
 */
export async function nombresDeProfes(
  db: Tx,
  cedulas: readonly string[],
): Promise<Map<string, { nombres: string; apellidos: string }>> {
  if (cedulas.length === 0) return new Map();
  const filas = await db
    .select({
      cedula: usuarios.cedula,
      nombres: usuarios.nombres,
      apellidos: usuarios.apellidos,
    })
    .from(usuarios)
    .where(
      and(
        inArray(usuarios.cedula, [...new Set(cedulas)]),
        eq(usuarios.rol, "profesor"),
      ),
    );
  return new Map(
    filas.map((f) => [
      f.cedula,
      { nombres: f.nombres, apellidos: f.apellidos },
    ]),
  );
}

export async function leerUsuarios(
  db: Tx,
  cedulas: readonly string[],
): Promise<Usuario[]> {
  if (cedulas.length === 0) return [];
  const filas = await db
    .select()
    .from(usuarios)
    .where(inArray(usuarios.cedula, [...cedulas]));
  return filas.map(usuarioDeFila).filter((u): u is Usuario => u !== null);
}
