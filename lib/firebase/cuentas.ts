// Adaptadores del Admin SDK para las cuentas (D231–D233). Sin `server-only` para que las pruebas
// de tests/rules y `scripts/admin-profesor.ts` los corran; la app los usa desde `lib/cuentas.ts`
// y las Server Actions, después de `exigirSesion` / `exigirAdmin`.
//
// Una cuenta son tres piezas: el usuario de Auth (uid = cédula, email interno, D008), sus custom
// claims (D174) y los documentos `usuarios/{cedula}` + `privados/{cedula}`. Auth no entra en una
// transacción de Firestore: se crea primero y, si algo de lo demás falla, se borra (compensación),
// así nunca queda una cuenta a medias que impida reintentar.
import type { Auth } from "firebase-admin/auth";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  type CuentaNueva,
  type EditarProfesor,
  ErrorCuenta,
  type ErrorProfesor,
  generarPasswordTemporal,
  type MisDatos,
  usuarioNuevo,
} from "@/lib/cuentas-datos";
import {
  type Claims,
  COL,
  claimsDe,
  emailInterno,
  zUsuario,
} from "@/lib/modelo";

const codigo = (e: unknown) => (e as { code?: unknown }).code;

/**
 * Crea la cuenta con una contraseña temporal y la devuelve (una sola vez: no se guarda ni se
 * registra). Cédula que ya tiene perfil o cuenta de Auth → `ErrorCuenta("existe")`, sin pisar
 * nada: el perfil se crea con `create`, que falla si ya existe.
 */
export async function crearCuentaCon(
  auth: Auth,
  db: Firestore,
  cuenta: CuentaNueva,
  ahora: number,
  generar: () => string = generarPasswordTemporal,
): Promise<{ passwordTemporal: string }> {
  const ref = db.collection(COL.usuarios).doc(cuenta.cedula);
  if ((await ref.get()).exists) throw new ErrorCuenta("existe");
  const usuario = usuarioNuevo(cuenta, ahora);
  const passwordTemporal = generar();
  try {
    await auth.createUser({
      uid: cuenta.cedula,
      email: emailInterno(cuenta.cedula),
      password: passwordTemporal,
      displayName: `${usuario.nombres} ${usuario.apellidos}`,
    });
  } catch (e) {
    const c = codigo(e);
    if (c === "auth/uid-already-exists" || c === "auth/email-already-exists")
      throw new ErrorCuenta("existe");
    throw e;
  }
  try {
    await auth.setCustomUserClaims(cuenta.cedula, claimsDe(usuario));
    const lote = db.batch();
    lote.create(ref, usuario);
    // Un `privados` huérfano (sin perfil) no es de nadie: se reemplaza
    lote.set(db.collection(COL.privados).doc(cuenta.cedula), {
      email: cuenta.email,
    });
    await lote.commit();
  } catch (e) {
    await auth.deleteUser(cuenta.cedula).catch(() => {});
    // ALREADY_EXISTS (6): otro envío creó el perfil entre la lectura y el commit
    if (codigo(e) === 6) throw new ErrorCuenta("existe");
    throw e;
  }
  return { passwordTemporal };
}

/**
 * Borra la cuenta: Auth (sus sesiones dejan de valer en el DAL) y `usuarios` + `privados`. Lo que
 * la persona hizo (tareas, ajustes, evaluaciones con su `autorId`) se queda. Idempotente: una
 * cuenta que ya no está en Auth sigue y borra lo que quede.
 */
export async function eliminarCuentaCon(
  auth: Auth,
  db: Firestore,
  cedula: string,
): Promise<void> {
  try {
    await auth.deleteUser(cedula);
  } catch (e) {
    if (codigo(e) !== "auth/user-not-found") throw e;
  }
  const lote = db.batch();
  lote.delete(db.collection(COL.usuarios).doc(cedula));
  lote.delete(db.collection(COL.privados).doc(cedula));
  await lote.commit();
}

/** Claims de la cuenta mezcladas con las del perfil, sin arrastrar marcas viejas. */
async function ponerClaims(
  auth: Auth,
  cedula: string,
  claims: Claims,
): Promise<void> {
  const cuenta = await auth.getUser(cedula);
  const {
    admin: _admin,
    debeCambiarPassword: _debe,
    ...resto
  } = (cuenta.customClaims ?? {}) as Record<string, unknown>;
  await auth.setCustomUserClaims(cedula, { ...resto, ...claims });
}

/**
 * La persona creó su contraseña (D232): la cambia en Auth, quita la marca del perfil y de las
 * claims y revoca los tokens (quien llama abre la sesión nueva con la contraseña nueva).
 */
export async function crearPasswordPropia(
  auth: Auth,
  db: Firestore,
  cedula: string,
  nueva: string,
  ahora: number,
): Promise<void> {
  const ref = db.collection(COL.usuarios).doc(cedula);
  const snap = await ref.get();
  const u = zUsuario.safeParse(snap.data());
  if (!u.success) throw new ErrorCuenta("no-existe");
  await auth.updateUser(cedula, { password: nueva });
  await ref.update({
    debeCambiarPassword: FieldValue.delete(),
    actualizadoEn: ahora,
  });
  await ponerClaims(
    auth,
    cedula,
    claimsDe({ ...u.data, debeCambiarPassword: false }),
  );
  await auth.revokeRefreshTokens(cedula);
}

/**
 * Marca a un profesor como admin (D231; solo el script). Pone la marca en el perfil y en las
 * claims y revoca sus tokens: la próxima vez que entre ya ve Profesores. Idempotente.
 */
export async function hacerAdminCon(
  auth: Auth,
  db: Firestore,
  cedula: string,
  ahora: number,
): Promise<{ ok: true } | { ok: false; error: "no-existe" | "no-profesor" }> {
  const ref = db.collection(COL.usuarios).doc(cedula);
  const u = zUsuario.safeParse((await ref.get()).data());
  if (!u.success) return { ok: false, error: "no-existe" };
  if (u.data.rol !== "profesor") return { ok: false, error: "no-profesor" };
  if (u.data.admin !== true)
    await ref.update({ admin: true, actualizadoEn: ahora });
  await ponerClaims(auth, cedula, claimsDe({ ...u.data, admin: true }));
  await auth.revokeRefreshTokens(cedula);
  return { ok: true };
}

/**
 * El admin edita a un profesor: nombres, apellidos y email de recuperación (la cédula es el uid y
 * no cambia, D174). Un destino que no es profesor se rechaza: esta pantalla no toca alumnos.
 */
export async function editarProfesorEnTransaccion(
  db: Firestore,
  entrada: EditarProfesor,
  ahora: number,
): Promise<{ ok: true } | { ok: false; error: ErrorProfesor }> {
  const ref = db.collection(COL.usuarios).doc(entrada.cedula);
  const privadoRef = db.collection(COL.privados).doc(entrada.cedula);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: "no-existe" } as const;
    const u = zUsuario.safeParse(snap.data());
    if (!u.success) return { ok: false, error: "invalida" } as const;
    if (u.data.rol !== "profesor")
      return { ok: false, error: "no-profesor" } as const;
    tx.update(ref, {
      nombres: entrada.nombres,
      apellidos: entrada.apellidos,
      actualizadoEn: ahora,
    });
    tx.set(privadoRef, { email: entrada.email === "" ? null : entrada.email });
    return { ok: true } as const;
  });
}

/**
 * El profesor cambia SUS nombres y apellidos en Perfil (la cédula sale de la sesión). Un alumno
 * no: sus datos los edita el profe (CLAUDE.md).
 */
export async function guardarMisDatosCon(
  db: Firestore,
  cedula: string,
  datos: MisDatos,
  ahora: number,
): Promise<{ ok: true } | { ok: false; error: "no-existe" | "no-profesor" }> {
  const ref = db.collection(COL.usuarios).doc(cedula);
  return db.runTransaction(async (tx) => {
    const u = zUsuario.safeParse((await tx.get(ref)).data());
    if (!u.success) return { ok: false, error: "no-existe" } as const;
    if (u.data.rol !== "profesor")
      return { ok: false, error: "no-profesor" } as const;
    tx.update(ref, {
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      actualizadoEn: ahora,
    });
    return { ok: true } as const;
  });
}
