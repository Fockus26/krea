// Cuentas sobre Postgres (D231–D233, D327). Sin `server-only` para que las pruebas y
// `scripts/admin-profesor.ts` las corran; la app las usa desde `lib/cuentas.ts` y las Server
// Actions, después de `exigirSesion` / `exigirAdmin`.
//
// Una cuenta son: `user` (id = cédula, email interno, D008), su `account` de credencial con el hash
// y `usuarios` (perfil, marcas y email de recuperación). Todo en una transacción: nunca queda una
// cuenta a medias. Revocar = borrar sus filas de `session` (el DAL valida cada request en la base).
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import {
  type CuentaNueva,
  type EditarProfesor,
  ErrorCuenta,
  type ErrorProfesor,
  generarPasswordTemporal,
  type MisDatos,
  usuarioNuevo,
} from "@/lib/cuentas-datos";
import { filaDeUsuario, leerUsuarioParaActualizar } from "@/lib/data/usuarios";
import type { Db, Tx } from "@/lib/db";
import { account, session, user, usuarios } from "@/lib/db/schema";
import { emailInterno } from "@/lib/modelo";
import { semillaAvatarNueva } from "@/lib/perfil";

/** Proveedor de Better Auth para email + contraseña. */
export const PROVEEDOR_CREDENCIAL = "credential";

/** Cierra todas las sesiones de la cuenta en todos sus equipos. */
export async function revocarSesiones(db: Tx, cedula: string): Promise<void> {
  await db.delete(session).where(eq(session.userId, cedula));
}

/** Pone el hash de la contraseña de la cuenta (ya hasheado o con el formato importado). */
export async function ponerHash(
  db: Tx,
  cedula: string,
  hash: string,
): Promise<void> {
  await db
    .update(account)
    .set({ password: hash })
    .where(
      and(
        eq(account.userId, cedula),
        eq(account.providerId, PROVEEDOR_CREDENCIAL),
      ),
    );
}

/** `user` + `account` de credencial (sin perfil): lo comparten el alta y la importación. */
export async function insertarCuentaAuth(
  tx: Tx,
  cedula: string,
  nombre: string,
  hash: string,
): Promise<void> {
  await tx.insert(user).values({
    id: cedula,
    name: nombre,
    email: emailInterno(cedula),
    emailVerified: true,
  });
  await tx.insert(account).values({
    id: crypto.randomUUID(),
    accountId: cedula,
    providerId: PROVEEDOR_CREDENCIAL,
    userId: cedula,
    password: hash,
  });
}

const esDuplicado = (e: unknown) =>
  (e as { code?: string; cause?: { code?: string } }).code === "23505" ||
  (e as { cause?: { code?: string } }).cause?.code === "23505";

/**
 * Crea la cuenta con una contraseña temporal y la devuelve (una sola vez: no se guarda ni se
 * registra). Cédula que ya tiene cuenta → `ErrorCuenta("existe")`, sin pisar nada.
 */
export async function crearCuentaCon(
  db: Db,
  cuenta: CuentaNueva,
  ahora: number,
  generar: () => string = generarPasswordTemporal,
): Promise<{ passwordTemporal: string }> {
  // Semilla opaca del avatar (D388): la URL de DiceBear la expone
  const usuario = usuarioNuevo(
    cuenta,
    ahora,
    semillaAvatarNueva(cuenta.cedula),
  );
  const passwordTemporal = generar();
  const hash = await hashPassword(passwordTemporal);
  try {
    await db.transaction(async (tx) => {
      await insertarCuentaAuth(
        tx,
        cuenta.cedula,
        `${usuario.nombres} ${usuario.apellidos}`,
        hash,
      );
      await tx.insert(usuarios).values({
        ...filaDeUsuario(usuario),
        emailRecuperacion: cuenta.email,
      });
    });
  } catch (e) {
    if (esDuplicado(e)) throw new ErrorCuenta("existe");
    throw e;
  }
  return { passwordTemporal };
}

/**
 * Borra la cuenta: `user` (en cascada sus sesiones, su credencial y su perfil). Lo que la persona
 * hizo (tareas, ajustes, evaluaciones con su `autorId`) se queda. Idempotente.
 */
export async function eliminarCuentaCon(db: Tx, cedula: string): Promise<void> {
  await db.delete(user).where(eq(user.id, cedula));
}

/**
 * La persona creó su contraseña (D232): la cambia, quita la marca del perfil y revoca sus sesiones
 * (quien llama abre la sesión nueva con la contraseña nueva).
 */
export async function crearPasswordPropia(
  db: Db,
  cedula: string,
  nueva: string,
  ahora: number,
): Promise<void> {
  const hash = await hashPassword(nueva);
  await db.transaction(async (tx) => {
    const u = await leerUsuarioParaActualizar(tx, cedula);
    if (!u) throw new ErrorCuenta("no-existe");
    await ponerHash(tx, cedula, hash);
    await tx
      .update(usuarios)
      .set({ debeCambiarPassword: false, actualizadoEn: ahora })
      .where(eq(usuarios.cedula, cedula));
    await revocarSesiones(tx, cedula);
  });
}

/**
 * Marca a un profesor como admin (D231; solo el script) y cierra sus sesiones: la próxima vez que
 * entre ya ve Profesores. Idempotente.
 */
export async function hacerAdminCon(
  db: Db,
  cedula: string,
  ahora: number,
): Promise<{ ok: true } | { ok: false; error: "no-existe" | "no-profesor" }> {
  return db.transaction(async (tx) => {
    const u = await leerUsuarioParaActualizar(tx, cedula);
    if (!u) return { ok: false, error: "no-existe" } as const;
    if (u.rol !== "profesor")
      return { ok: false, error: "no-profesor" } as const;
    if (u.admin !== true)
      await tx
        .update(usuarios)
        .set({ admin: true, actualizadoEn: ahora })
        .where(eq(usuarios.cedula, cedula));
    await revocarSesiones(tx, cedula);
    return { ok: true } as const;
  });
}

/**
 * El admin edita a un profesor: nombres, apellidos y email de recuperación (la cédula es el id y
 * no cambia, D174). Un destino que no es profesor se rechaza: esta pantalla no toca alumnos.
 */
export async function editarProfesorEnTransaccion(
  db: Db,
  entrada: EditarProfesor,
  ahora: number,
): Promise<{ ok: true } | { ok: false; error: ErrorProfesor }> {
  return db.transaction(async (tx) => {
    const u = await leerUsuarioParaActualizar(tx, entrada.cedula);
    if (!u) return { ok: false, error: "no-existe" } as const;
    if (u.rol !== "profesor")
      return { ok: false, error: "no-profesor" } as const;
    await tx
      .update(usuarios)
      .set({
        nombres: entrada.nombres,
        apellidos: entrada.apellidos,
        emailRecuperacion: entrada.email === "" ? null : entrada.email,
        actualizadoEn: ahora,
      })
      .where(eq(usuarios.cedula, entrada.cedula));
    return { ok: true } as const;
  });
}

/**
 * El profesor cambia SUS nombres y apellidos en Perfil (la cédula sale de la sesión). Un alumno
 * no: sus datos los edita el profe (CLAUDE.md).
 */
export async function guardarMisDatosCon(
  db: Db,
  cedula: string,
  datos: MisDatos,
  ahora: number,
): Promise<{ ok: true } | { ok: false; error: "no-existe" | "no-profesor" }> {
  return db.transaction(async (tx) => {
    const u = await leerUsuarioParaActualizar(tx, cedula);
    if (!u) return { ok: false, error: "no-existe" } as const;
    if (u.rol !== "profesor")
      return { ok: false, error: "no-profesor" } as const;
    await tx
      .update(usuarios)
      .set({
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        actualizadoEn: ahora,
      })
      .where(eq(usuarios.cedula, cedula));
    return { ok: true } as const;
  });
}
