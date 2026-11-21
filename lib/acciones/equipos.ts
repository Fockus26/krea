"use server";
// Server Actions de Equipos del profesor (fase 07 W8, D175, D210, D212). Todo detrás de
// `exigirSesion("profesor")`; la sección sale de las filas, nunca del body. Mover y capitán:
// una transacción con el ranking (`lib/data/equipos.ts`); la sesión del alumno lee su equipo
// nuevo en el siguiente request, sin cerrarla (D327). Logo: firma de bytes + peso en el servidor, B2
// (`equipos/{equipoId}/{uuid}.webp`), la ruta en el equipo y el ranking, y se borra el anterior.
import { refresh } from "next/cache";
import { almacenB2 } from "@/lib/almacen/b2";
import { claveLogo, validarLogoSubido } from "@/lib/almacen/imagen";
import { exigirSesion } from "@/lib/dal";
import {
  cambiarCapitanEnTransaccion,
  cambiarLogoEnTransaccion,
  crearEquipoEnTransaccion,
  editarEquipoEnTransaccion,
  eliminarEquipoEnTransaccion,
  moverAlumnoEnTransaccion,
} from "@/lib/data/equipos";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { baseDeDatos, type Db } from "@/lib/db";
import {
  type ResultadoEquipos,
  type ResultadoLogo,
  zCambiarCapitan,
  zMoverAlumno,
} from "@/lib/equipos-datos";
import {
  type ErrorGestionEquipo,
  type ResultadoGestionEquipo,
  zCrearEquipo,
  zEditarEquipo,
} from "@/lib/equipos-gestion";
import { zIdDocumento } from "@/lib/evaluar-datos";
import { borrarEnLote, type ResultadoLote, zIdsLote } from "@/lib/lote";
import { seccionEnCatalogo } from "@/lib/secciones";

export type { ResultadoEquipos, ResultadoGestionEquipo, ResultadoLogo };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/** Mueve a un alumno a otro equipo de su sección o lo deja sin equipo (`destino: null`). */
export async function moverAlumnoDeEquipo(
  entrada: unknown,
): Promise<ResultadoEquipos> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zMoverAlumno.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await moverAlumnoEnTransaccion(db, d.data, Date.now());
    if (!r.ok) return r;
    refresh();
    return { ok: true };
  } catch (e) {
    registrar("moverAlumnoDeEquipo", e);
    return { ok: false, error: "red" };
  }
}

/** Cambia el capitán (D012). */
export async function cambiarCapitanDeEquipo(
  entrada: unknown,
): Promise<ResultadoEquipos> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zCambiarCapitan.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await cambiarCapitanEnTransaccion(db, d.data, Date.now());
    if (!r.ok) return r;
    refresh();
    return { ok: true };
  } catch (e) {
    registrar("cambiarCapitanDeEquipo", e);
    return { ok: false, error: "red" };
  }
}

/** Sube el logo ya recortado (FormData: `equipoId`, `logo`). Devuelve una URL firmada para pintarlo. */
export async function subirLogoEquipo(form: FormData): Promise<ResultadoLogo> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  const almacen = almacenB2();
  if (!db) return { ok: false, error: "red" };
  if (!almacen) {
    console.error(
      "[subirLogoEquipo] almacén sin configurar (faltan las variables B2_*)",
    );
    return { ok: false, error: "almacen" };
  }
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
    // B2 falló del lado del servidor: no es la conexión del profe (D229)
    if (!subida.ok) return { ok: false, error: "almacen" };

    const r = await cambiarLogoEnTransaccion(
      db,
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

/** Crea un equipo en la sección de la página (D270). Nombre repetido en la sección: `repetido`. */
export async function crearEquipo(
  entrada: unknown,
): Promise<ResultadoGestionEquipo> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zCrearEquipo.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    // `zSeccion` valida la forma; la sección además tiene que existir en el catálogo (D323)
    if (!seccionEnCatalogo(d.data.seccion, await catalogoSecciones()))
      return { ok: false, error: "seccion" };
    const r = await crearEquipoEnTransaccion(db, d.data, Date.now());
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("crearEquipo", e);
    return { ok: false, error: "red" };
  }
}

/** Cambia el nombre y el tema de un equipo (D270); con la versión del diálogo, `cambio` (D532). */
export async function editarEquipo(
  entrada: unknown,
): Promise<ResultadoGestionEquipo> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zEditarEquipo.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await editarEquipoEnTransaccion(db, d.data, Date.now());
    // `cambio` (D532): el tablero también pasa a lo de ahora; el diálogo conserva lo escrito
    if (r.ok || r.error === "cambio") refresh();
    return r;
  } catch (e) {
    registrar("editarEquipo", e);
    return { ok: false, error: "red" };
  }
}

/**
 * Elimina un equipo (D307): sus integrantes quedan «Sin equipo», sus entregas grupales se quedan
 * con `titularNombre` y sus ajustes se borran, en una transacción. Después del commit, su logo de
 * B2 (si B2 falla, se registra: queda huérfano, sin dueño).
 */
export async function eliminarEquipo(
  equipoId: unknown,
): Promise<ResultadoGestionEquipo> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const id = zIdDocumento.safeParse(equipoId);
  if (!id.success) return { ok: false, error: "invalida" };
  const r = await borrarUnEquipo(db, id.data);
  if (r.ok) refresh();
  return r;
}

/**
 * Lo mismo para varios (X4, D315): hasta TOPE_LOTE ids por llamada, uno tras otro, cada uno en SU
 * transacción con la regla de D307 (no una para todos: un equipo con demasiados datos no frena a
 * los demás). Idempotente: uno que ya no existe cuenta como borrado. `sesiones` es un fallo de ese
 * equipo (se eliminó, pero quedó alguna sesión abierta) y la UI lo dice con su texto.
 */
export async function eliminarEquipos(
  ids: unknown,
): Promise<ResultadoLote<ErrorGestionEquipo>> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zIdsLote(zIdDocumento).safeParse(ids);
  if (!d.success) return { ok: false, error: "invalida" };
  const resultados = await borrarEnLote<ErrorGestionEquipo>(
    d.data,
    async (id) => {
      const r = await borrarUnEquipo(db, id);
      return !r.ok && r.error === "no-existe" ? { ok: true } : r;
    },
    "red",
  );
  refresh();
  return { ok: true, resultados };
}

/**
 * El borrado de uno, sin sesión ni `refresh()` (lo ponen `eliminarEquipo` y `eliminarEquipos`):
 * la transacción de D307 y, después del commit, su logo y las imágenes de sus partes en B2 (D530).
 * No lanza: cualquier fallo vuelve como error.
 */
async function borrarUnEquipo(
  db: Db,
  id: string,
): Promise<ResultadoGestionEquipo> {
  let tx: Awaited<ReturnType<typeof eliminarEquipoEnTransaccion>>;
  try {
    tx = await eliminarEquipoEnTransaccion(db, id, Date.now());
  } catch (e) {
    registrar("eliminarEquipo", e);
    return { ok: false, error: "red" };
  }
  const { resultado, logo, imagenes } = tx;
  if (!resultado.ok) return resultado;
  if (logo) {
    const b = await almacenB2()
      ?.borrar(logo)
      .catch(() => null);
    if (!b?.ok) console.error("[eliminarEquipo] no se borró el logo");
  }
  await borrarImagenes(imagenes);
  return resultado;
}

/** Las imágenes de sus partes (D530): si B2 falla se registra y quedan huérfanas (D229). */
async function borrarImagenes(claves: readonly string[]): Promise<void> {
  if (claves.length === 0) return;
  const almacen = almacenB2();
  if (!almacen) {
    console.error(
      `[eliminarEquipo] almacén sin configurar: ${claves.length} imágenes sin borrar`,
    );
    return;
  }
  const r = await Promise.allSettled(claves.map((c) => almacen.borrar(c)));
  const fallidas = r.filter((x) => x.status === "rejected" || !x.value.ok);
  if (fallidas.length > 0) {
    console.error(
      `[eliminarEquipo] almacén: ${fallidas.length} de ${claves.length} imágenes sin borrar`,
    );
  }
}
