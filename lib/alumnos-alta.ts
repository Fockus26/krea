// Dar de alta y eliminar alumnos desde Alumnos (W12, D267–D269). Puro (sin Firebase ni reloj): lo
// que manda «Agregar alumno», el resumen de lo que se pierde al eliminar (se cuenta en el servidor
// antes de confirmar) y los textos. La cuenta se crea con `crearCuenta` (D232, D233); los
// documentos que se borran los decide `planBorradoAlumno`, que usan la transacción y las pruebas.
import { z } from "zod";
import { zEmailEntrada } from "@/lib/alumnos-datos";
import { type ErroresProfesor, validarProfesor } from "@/lib/cuentas-datos";
import { zIdDocumento } from "@/lib/evaluar-datos";
import {
  type Ajuste,
  type Entrega,
  type SeccionId,
  zCedula,
  zSeccion,
  zUsuario,
} from "@/lib/modelo";
import { MAX_ESCRITURAS_TX } from "@/lib/tareas-profe-datos";

/* ---------- Agregar alumno ---------- */

/** Lo que manda «Agregar alumno». La base nace en 20 (D006) y se cambia después en su ficha. */
export const zCrearAlumno = z.object({
  cedula: zCedula,
  nombres: zUsuario.shape.nombres,
  apellidos: zUsuario.shape.apellidos,
  seccion: zSeccion,
  /** Vacío = sin email de recuperación. */
  email: zEmailEntrada,
  /** Equipo de su sección; `null` = Sin equipo. */
  equipoId: zIdDocumento.nullable(),
});
export type CrearAlumno = z.input<typeof zCrearAlumno>;

export type ErrorCrearAlumno = "invalida" | "existe" | "equipo" | "red";

export type ResultadoCrearAlumno =
  | {
      ok: true;
      passwordTemporal: string;
      /**
       * La cuenta se creó, pero la transacción que la suma al ranking (y al equipo) falló: el
       * profe la asigna desde Equipos. La contraseña se muestra igual (la cuenta ya existe).
       */
      sinEquipo?: true;
    }
  | { ok: false; error: ErrorCrearAlumno };

/** Mismas reglas que Nuevo profesor (D233): cédula, primer nombre, primer apellido, email. */
export type ErroresAlumnoNuevo = ErroresProfesor;
export const validarAlumnoNuevo = (f: {
  cedula: string;
  primerNombre: string;
  primerApellido: string;
  email: string;
}): ErroresAlumnoNuevo => validarProfesor(f);

/** Mensaje bajo el formulario. PROVISIONAL (CONTENT_CHECKLIST fila 148). */
export function errorCrearAlumnoTexto(e: ErrorCrearAlumno): string {
  switch (e) {
    case "existe":
      return "Ya existe una cuenta con esa cédula.";
    case "equipo":
      return "Ese equipo ya no está en la sección. Elige otro o déjalo sin equipo.";
    case "invalida":
      return "Revisa los datos: algo no se pudo guardar así.";
    case "red":
      return "Se perdió la conexión. No creamos la cuenta: vuelve a intentarlo.";
  }
}

/** Aviso cuando la cuenta se creó sin entrar al ranking/equipo. PROVISIONAL (fila 148). */
export const ALTA_SIN_EQUIPO =
  "La cuenta se creó, pero no pudimos ponerla en su equipo. Asígnalo desde Equipos.";

/** Equipos que ofrece el formulario: los de la sección elegida. */
export type OpcionEquipo = { id: string; nombre: string; seccion: SeccionId };

export function equiposDeSeccion(
  equipos: readonly OpcionEquipo[],
  seccion: SeccionId,
): OpcionEquipo[] {
  return equipos.filter((e) => e.seccion === seccion);
}

/* ---------- Eliminar alumno ---------- */

/** Ids de los documentos que se borran con el alumno (D268). */
export type PlanBorradoAlumno = {
  /** Sus entregas individuales (`titularId` = su cédula), evaluadas o no. */
  entregas: string[];
  /** Sus ajustes de puntos (`destino: "alumno"`), anulaciones incluidas. */
  ajustes: string[];
  /** Notas que pierde: entregas individuales evaluadas. */
  notas: number;
  /** Entregas individuales aún sin evaluar (borrador o entregada). */
  sinNota: number;
  /** Ajustes que se ven en su historial (las anulaciones no se cuentan aparte). */
  ajustesVisibles: number;
};

type ConId<T> = { id: string } & T;

/**
 * Qué se borra de un alumno: sus entregas individuales y sus ajustes. Las grupales no se tocan
 * (el equipo conserva su nota, D268) aunque su cédula siga en `integrantes`.
 */
export function planBorradoAlumno(
  cedula: string,
  entregas: ReadonlyArray<
    ConId<Pick<Entrega, "tipo" | "titularId" | "estado">>
  >,
  ajustes: ReadonlyArray<
    ConId<Pick<Ajuste, "destino" | "destinoId" | "anulaA">>
  >,
): PlanBorradoAlumno {
  const propias = entregas.filter(
    (e) => e.tipo === "individual" && e.titularId === cedula,
  );
  const suyos = ajustes.filter(
    (a) => a.destino === "alumno" && a.destinoId === cedula,
  );
  const notas = propias.filter((e) => e.estado === "evaluada").length;
  return {
    entregas: propias.map((e) => e.id),
    ajustes: suyos.map((a) => a.id),
    notas,
    sinNota: propias.length - notas,
    ajustesVisibles: suyos.filter((a) => a.anulaA === null).length,
  };
}

/**
 * Escrituras de la transacción: entregas + ajustes + historial de base + perfil + privado +
 * recuperación + ranking + el equipo cuyo capitán cambia. Tope de Firestore: 500.
 */
export function escriturasBorrado(
  plan: Pick<PlanBorradoAlumno, "entregas" | "ajustes">,
  historial: number,
  equiposCambiados: number,
): number {
  return (
    plan.entregas.length +
    plan.ajustes.length +
    historial +
    3 +
    1 +
    equiposCambiados
  );
}

export const cabeEnTransaccion = (escrituras: number) =>
  escrituras <= MAX_ESCRITURAS_TX;

/** Lo que el diálogo muestra antes de confirmar (lo cuenta el servidor). */
export type ResumenBorrado = {
  notas: number;
  sinNota: number;
  ajustes: number;
  /** Era capitán: el cargo pasa a `sucesor` (D111); `null` si el equipo queda vacío. */
  capitania: { equipo: string; sucesor: string | null } | null;
};

export type ErrorBorrarAlumno =
  | "invalida"
  | "no-existe"
  | "no-alumno"
  | "demasiados"
  /** Auth ya se borró y la transacción no: repetir la acción termina (idempotente). */
  | "a-medias"
  | "red";

export type ResultadoResumenBorrado =
  | { ok: true; resumen: ResumenBorrado }
  | { ok: false; error: ErrorBorrarAlumno };

export type ResultadoBorrarAlumno =
  | { ok: true }
  | { ok: false; error: ErrorBorrarAlumno };

/* Textos del diálogo. PROVISIONAL (CONTENT_CHECKLIST fila 149): no está en el lienzo */

const plural = (n: number, uno: string, varios: string) =>
  `${n} ${n === 1 ? uno : varios}`;

/** «Se borrarán 3 notas individuales y 1 ajuste.» / «No tiene notas individuales ni ajustes.» */
export function borradoTexto(r: Pick<ResumenBorrado, "notas" | "ajustes">) {
  if (r.notas === 0 && r.ajustes === 0)
    return "No tiene notas individuales ni ajustes de puntos.";
  return `Se borrarán ${plural(r.notas, "nota individual", "notas individuales")} y ${plural(r.ajustes, "ajuste", "ajustes")} de puntos.`;
}

/** Las entregas sin nota también se van: se dice aparte para que el número de notas sea exacto. */
export function sinNotaTexto(n: number): string | null {
  if (n === 0) return null;
  return n === 1
    ? "También se borra 1 entrega que aún no tiene nota."
    : `También se borran ${n} entregas que aún no tienen nota.`;
}

export function capitaniaTexto(c: ResumenBorrado["capitania"]): string | null {
  if (!c) return null;
  return c.sucesor
    ? `Es capitán de ${c.equipo}: el cargo pasa a ${c.sucesor}.`
    : `Es el único integrante de ${c.equipo}: el equipo queda vacío y sin capitán.`;
}

export const BORRADO_GRUPALES =
  "Sus notas en tareas grupales se quedan con su equipo. El ranking se recalcula.";
export const BORRADO_CUENTA =
  "Se borran su cuenta, su perfil y sus datos: ya no podrá entrar. No se puede deshacer.";

export function errorBorrarAlumnoTexto(e: ErrorBorrarAlumno): string {
  switch (e) {
    case "no-existe":
      return "Este alumno ya no existe. Recarga la página.";
    case "no-alumno":
      return "Esa cédula no es de un alumno: aquí solo se eliminan alumnos.";
    case "demasiados":
      return "Tiene demasiados datos para borrarlos de una vez. Avísale al administrador.";
    case "a-medias":
      return "Ya no puede entrar, pero sus notas siguen guardadas. Vuelve a intentarlo para terminar.";
    case "invalida":
      return "No se pudo eliminar así. Recarga la página e inténtalo otra vez.";
    case "red":
      return "Se perdió la conexión. No borramos nada: vuelve a intentarlo.";
  }
}
