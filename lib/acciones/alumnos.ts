"use server";
// Server Actions de Alumnos (fase 07 W8, D175, D209; W12, D267–D269). El autor sale SIEMPRE de la
// sesión (`exigirSesion("profesor")`), nunca del body; la cédula del body es el DESTINO y cada
// acción comprueba que sea un estudiante (un profe no se crea ni se borra por aquí, D234).
// Editar: perfil, historial de base (D176), email y `ranking/{seccion}` en UNA transacción; con la
// versión que vio el diálogo, un guardado de otro profe en medio responde `conflicto` (W14, D276).
// Agregar: `crearCuenta` (contraseña temporal, D232) + equipo y ranking en una transacción.
// Eliminar: Auth primero (ya no puede entrar), luego sus datos y el ranking en una transacción.
import { refresh } from "next/cache";
import { almacenB2 } from "@/lib/almacen/b2";
import {
  type ErrorBorrarAlumno,
  type ResultadoBorrarAlumno,
  type ResultadoCrearAlumno,
  type ResultadoResumenBorrado,
  type ResultadoResumenLote,
  type ResumenBorrado,
  sumarResumenes,
  zCrearAlumno,
} from "@/lib/alumnos-alta";
import { type ResultadoAlumno, zEditarAlumno } from "@/lib/alumnos-datos";
import { crearCuenta, ErrorCuenta } from "@/lib/cuentas";
import { exigirSesion } from "@/lib/dal";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { editarAlumnoEnTransaccion } from "@/lib/firebase/alumnos";
import {
  borrarAuthAlumno,
  eliminarAlumnoEnTransaccion,
  equipoValidoPara,
  incorporarAlumnoEnTransaccion,
  resumenBorradoCon,
} from "@/lib/firebase/alumnos-alta";
import { sincronizarClaims } from "@/lib/firebase/equipos";
import { borrarPresenciaAlumno } from "@/lib/firebase/presencia";
import { borrarEnLote, type ResultadoLote, zCedulasLote } from "@/lib/lote";
import { zCedula } from "@/lib/modelo";
import { seccionEnCatalogo } from "@/lib/secciones";

export type {
  ResultadoAlumno,
  ResultadoBorrarAlumno,
  ResultadoCrearAlumno,
  ResultadoResumenBorrado,
  ResultadoResumenLote,
};

const registrar = (accion: string, e: unknown) =>
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");

export async function editarAlumno(entrada: unknown): Promise<ResultadoAlumno> {
  const sesion = await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const d = zEditarAlumno.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await editarAlumnoEnTransaccion(
      admin.db,
      sesion.uid,
      d.data,
      Date.now(),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("editarAlumno", e);
    return { ok: false, error: "red" };
  }
}

/**
 * Agrega un alumno: cuenta con contraseña temporal (se devuelve UNA vez, D232), su equipo si se
 * eligió y el ranking de su sección. El equipo se valida antes de crear la cuenta; si la cuenta
 * se creó pero la transacción del equipo falla, responde `ok` con `sinEquipo` (la cuenta ya existe
 * y su contraseña no se puede volver a ver).
 */
export async function crearAlumno(
  entrada: unknown,
): Promise<ResultadoCrearAlumno> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const d = zCrearAlumno.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  const { equipoId, ...cuenta } = d.data;
  let passwordTemporal: string;
  try {
    // `zSeccion` valida la forma; la sección además tiene que existir en el catálogo (D323)
    if (!seccionEnCatalogo(cuenta.seccion, await catalogoSecciones()))
      return { ok: false, error: "seccion" };
    if (
      equipoId !== null &&
      !(await equipoValidoPara(admin.db, equipoId, cuenta.seccion))
    )
      return { ok: false, error: "equipo" };
    ({ passwordTemporal } = await crearCuenta({
      rol: "estudiante",
      ...cuenta,
    }));
  } catch (e) {
    if (e instanceof ErrorCuenta && e.codigo === "existe")
      return { ok: false, error: "existe" };
    registrar("crearAlumno", e);
    return { ok: false, error: "red" };
  }
  let sinEquipo = false;
  try {
    const r = await incorporarAlumnoEnTransaccion(
      admin.db,
      cuenta.cedula,
      equipoId,
      Date.now(),
    );
    if (!r.ok) sinEquipo = true;
    // Sus claims nacieron con `equipoId: null`; si falla aquí, «Crea tu contraseña» las rehace
    // desde el perfil en su primer ingreso (D232)
    else if (r.afectados.length) {
      const fallidas = await sincronizarClaims(
        admin.auth,
        admin.db,
        r.afectados,
      );
      if (fallidas.length) console.error("[crearAlumno] claims sin poner");
    }
  } catch (e) {
    registrar("crearAlumno", e);
    sinEquipo = true;
  }
  refresh();
  return sinEquipo
    ? { ok: true, passwordTemporal, sinEquipo: true }
    : { ok: true, passwordTemporal };
}

/**
 * Cuenta lo que se perdería al eliminar al alumno (notas individuales, entregas sin nota, ajustes
 * y si era capitán). Solo lee: el diálogo lo muestra antes de confirmar (D268).
 */
export async function resumenEliminarAlumno(
  cedula: unknown,
): Promise<ResultadoResumenBorrado> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const c = zCedula.safeParse(cedula);
  if (!c.success) return { ok: false, error: "invalida" };
  try {
    return await resumenBorradoCon(admin.db, c.data);
  } catch (e) {
    registrar("resumenEliminarAlumno", e);
    return { ok: false, error: "red" };
  }
}

/**
 * Elimina a un alumno con todos sus datos (D268): primero su usuario de Auth (su sesión deja de
 * valer, como al moverlo de equipo, D210), luego en UNA transacción su perfil, `privados`, sus
 * entregas individuales, sus ajustes y su historial de base, y el ranking recalculado; sus
 * imágenes de B2 al final. Las grupales no se tocan. Idempotente: si Auth se borró y la
 * transacción no, repetir termina; un alumno que ya no existe responde `no-existe`.
 */
export async function eliminarAlumno(
  cedula: unknown,
): Promise<ResultadoBorrarAlumno> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const c = zCedula.safeParse(cedula);
  if (!c.success) return { ok: false, error: "invalida" };
  const r = await borrarUnAlumno(admin, c.data);
  // `a-medias`: Auth ya no está, la lista tiene que dejar de ofrecerle entrar
  if (r.ok || r.error === "a-medias") refresh();
  return r;
}

/**
 * Lo mismo para varios (W22, D298): hasta TOPE_LOTE cédulas por llamada, una tras otra (cada una
 * es su propia transacción con el ranking), con el resultado de cada cédula. Idempotente: un
 * alumno que ya no existe cuenta como borrado, así que repetir el lote (o dos profes a la vez) no
 * falla. Un fallo no corta el lote: los demás se borran y la UI dice cuáles no.
 */
export async function eliminarAlumnos(
  cedulas: unknown,
): Promise<ResultadoLote<ErrorBorrarAlumno>> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const d = zCedulasLote.safeParse(cedulas);
  if (!d.success) return { ok: false, error: "invalida" };
  const resultados = await borrarEnLote<ErrorBorrarAlumno>(
    d.data,
    async (cedula) => {
      const r = await borrarUnAlumno(admin, cedula);
      return !r.ok && r.error === "no-existe" ? { ok: true } : r;
    },
    "red",
  );
  refresh();
  return { ok: true, resultados };
}

/**
 * Suma de lo que se perdería al eliminar a varios (solo lee, como `resumenEliminarAlumno`). Los
 * que ya no existen o no se pueden borrar no suman: el lote los reporta al confirmar.
 */
export async function resumenEliminarAlumnos(
  cedulas: unknown,
): Promise<ResultadoResumenLote> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const d = zCedulasLote.safeParse(cedulas);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const resumenes: ResumenBorrado[] = [];
    for (const c of d.data) {
      // Un fallo de red lanza (y cae en el catch); los demás errores no suman
      const r = await resumenBorradoCon(admin.db, c);
      if (r.ok) resumenes.push(r.resumen);
    }
    return { ok: true, resumen: sumarResumenes(resumenes) };
  } catch (e) {
    registrar("resumenEliminarAlumnos", e);
    return { ok: false, error: "red" };
  }
}

/**
 * El borrado de uno, sin sesión ni `refresh()` (lo ponen `eliminarAlumno` y `eliminarAlumnos`).
 * No lanza: cualquier fallo vuelve como error.
 */
async function borrarUnAlumno(
  admin: NonNullable<ReturnType<typeof firebaseAdmin>>,
  cedula: string,
): Promise<ResultadoBorrarAlumno> {
  // Antes de tocar Auth: que exista, que sea un alumno y que quepa en una transacción
  try {
    const previo = await resumenBorradoCon(admin.db, cedula);
    if (!previo.ok) return previo;
    await borrarAuthAlumno(admin.auth, cedula);
  } catch (e) {
    registrar("eliminarAlumno", e);
    return { ok: false, error: "red" };
  }
  let imagenes: string[];
  try {
    const r = await eliminarAlumnoEnTransaccion(admin.db, cedula, Date.now());
    if (!r.ok) return r;
    imagenes = r.imagenes;
  } catch (e) {
    registrar("eliminarAlumno", e);
    return { ok: false, error: "a-medias" };
  }
  await borrarImagenes(imagenes).catch((e) =>
    registrar("eliminarAlumno:imagenes", e),
  );
  // Su presencia (D275): si falla, queda huérfana e inofensiva (nadie edita a un alumno que no está)
  await borrarPresenciaAlumno(admin.db, cedula).catch((e) =>
    registrar("eliminarAlumno:presencia", e),
  );
  return { ok: true };
}

/** Las imágenes de sus respuestas: si B2 falla se registra y quedan huérfanas, sin dueño (D229). */
async function borrarImagenes(claves: readonly string[]) {
  if (claves.length === 0) return;
  const almacen = almacenB2();
  if (!almacen) {
    console.error(
      `[eliminarAlumno] almacén sin configurar: ${claves.length} imágenes sin borrar`,
    );
    return;
  }
  const r = await Promise.allSettled(claves.map((c) => almacen.borrar(c)));
  const fallidas = r.filter((x) => x.status === "rejected" || !x.value.ok);
  if (fallidas.length > 0) {
    console.error(
      `[eliminarAlumno] almacén: ${fallidas.length} de ${claves.length} imágenes sin borrar`,
    );
  }
}
