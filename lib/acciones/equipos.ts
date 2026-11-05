"use server";
// Server Actions de Equipos del profesor (fase 07 W8, D175, D210–D212). Todo detrás de
// `exigirSesion("profesor")`; la sección sale de los documentos, nunca del body. Mover y capitán:
// una transacción con el ranking (`lib/firebase/equipos.ts`) y, tras el commit, los claims de
// Auth del alumno movido + revocar sus tokens. Logo: firma de bytes + peso en el servidor, B2
// (`equipos/{equipoId}/{uuid}.webp`), la ruta en el equipo y el ranking, y se borra el anterior.
import { refresh } from "next/cache";
import { almacenB2 } from "@/lib/almacen/b2";
import { claveLogo, validarLogoSubido } from "@/lib/almacen/imagen";
import { exigirSesion } from "@/lib/dal";
import {
  type ResultadoEquipos,
  type ResultadoLogo,
  zCambiarCapitan,
  zMoverAlumno,
} from "@/lib/equipos-datos";
import { zIdDocumento } from "@/lib/evaluar-datos";
import { firebaseAdmin } from "@/lib/firebase/admin";
import {
  cambiarCapitanEnTransaccion,
  cambiarLogoEnTransaccion,
  moverAlumnoEnTransaccion,
  sincronizarClaims,
} from "@/lib/firebase/equipos";

export type { ResultadoEquipos, ResultadoLogo };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/** Mueve a un alumno a otro equipo de su sección o lo deja sin equipo (`destino: null`). */
export async function moverAlumnoDeEquipo(
  entrada: unknown,
): Promise<ResultadoEquipos> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const d = zMoverAlumno.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await moverAlumnoEnTransaccion(admin.db, d.data, Date.now());
    if (!r.ok) return r;
    refresh();
    // Siempre el alumno pedido, aunque no haya cambiado nada: reintentar repara un fallo a medias
    const fallidas = await sincronizarClaims(admin.auth, admin.db, [
      d.data.cedula,
      ...r.afectados,
    ]);
    return fallidas.length ? { ok: false, error: "sesiones" } : { ok: true };
  } catch (e) {
    registrar("moverAlumnoDeEquipo", e);
    return { ok: false, error: "red" };
  }
}

/** Cambia el capitán (D012). Los claims no llevan el capitán: no hay sesiones que cerrar. */
export async function cambiarCapitanDeEquipo(
  entrada: unknown,
): Promise<ResultadoEquipos> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const d = zCambiarCapitan.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await cambiarCapitanEnTransaccion(admin.db, d.data, Date.now());
    if (!r.ok) return r;
    refresh();
    const fallidas = await sincronizarClaims(admin.auth, admin.db, r.afectados);
    return fallidas.length ? { ok: false, error: "sesiones" } : { ok: true };
  } catch (e) {
    registrar("cambiarCapitanDeEquipo", e);
    return { ok: false, error: "red" };
  }
}

/** Sube el logo ya recortado (FormData: `equipoId`, `logo`). Devuelve una URL firmada para pintarlo. */
export async function subirLogoEquipo(form: FormData): Promise<ResultadoLogo> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  const almacen = almacenB2();
  if (!admin || !almacen) return { ok: false, error: "red" };
  const equipoId = zIdDocumento.safeParse(form.get("equipoId"));
  const logo = form.get("logo");
  if (!equipoId.success || !(logo instanceof Blob))
    return { ok: false, error: "invalida" };

  let clave: string | null = null;
  let guardado = false;
  try {
    const bytes = new Uint8Array(await logo.arrayBuffer());
    const v = validarLogoSubido(bytes);
    if (!v.ok)
      return {
        ok: false,
        error: v.error === "peso" ? "logo-peso" : "logo-tipo",
      };
    clave = claveLogo(equipoId.data, crypto.randomUUID(), v.extension);
    const subida = await almacen.subir(clave, bytes, v.tipo);
    if (!subida.ok) return { ok: false, error: "red" };

    const r = await cambiarLogoEnTransaccion(
      admin.db,
      equipoId.data,
      clave,
      Date.now(),
    );
    if (!r.ok) {
      // El equipo no existe o no valida: el objeto subido no lo usa nadie
      await almacen.borrar(clave).catch(() => null);
      return r;
    }
    guardado = true;
    if (r.anterior && r.anterior !== clave) {
      const b = await almacen.borrar(r.anterior).catch(() => null);
      if (!b?.ok)
        console.error("[subirLogoEquipo] no se borró el logo anterior");
    }
    refresh();
    const url = await almacen.urlFirmada(clave).catch(() => null);
    return { ok: true, url };
  } catch (e) {
    registrar("subirLogoEquipo", e);
    // Solo si el equipo no llegó a apuntar al objeto nuevo
    if (clave && !guardado) await almacen.borrar(clave).catch(() => null);
    return { ok: false, error: "red" };
  }
}
