// Alumnos del profesor con datos de Firestore (fase 07 W8, D209). Puro (sin Firebase ni reloj):
// qué manda el diálogo Editar, qué documentos se escriben (perfil, historial de base D176,
// email de recuperación) y las filas de la tabla. La base cambia las notas derivadas (nota =
// puntaje × base / 20, D013) y por eso el ranking; nunca toca una entrega ni un ajuste (D007).
import { z } from "zod";
import type { FilaAlumno } from "@/lib/alumnos";
import {
  type CambioBase,
  type Entrega,
  type Equipo,
  type RankingSeccion,
  type SeccionId,
  type Usuario,
  zBase,
  zCambioBase,
  zCedula,
  zPrivado,
  zUsuario,
} from "@/lib/modelo";
import { notaDeIntegrante } from "@/lib/ranking-datos";
import { estiloDe } from "@/lib/vistas-estudiante";

type ConId<T> = { id: string } & T;

/* ---------- Entrada de la Server Action ---------- */

/** Email vacío = quitarlo (`null`); si no, un email válido (se guarda en minúsculas). */
const zEmailEntrada = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .refine((v) => v === "" || z.email().safeParse(v).success, "Email inválido");

export const zEditarAlumno = z.object({
  cedula: zCedula,
  nombres: zUsuario.shape.nombres,
  apellidos: zUsuario.shape.apellidos,
  base: zBase,
  /** Obligatorio solo si la base cambia (lo mira `armarEdicion`). */
  motivo: z.string().trim().max(300),
  /** Ausente: no se toca el email (la vista previa no lo manda). */
  email: zEmailEntrada.optional(),
});
export type EditarAlumno = z.infer<typeof zEditarAlumno>;

export type ErrorAlumno = "invalida" | "no-existe" | "motivo" | "red";
export type ResultadoAlumno = { ok: true } | { ok: false; error: ErrorAlumno };

/** Mensaje bajo el formulario cuando el servidor no guardó (copy provisional, fila 135). */
export function errorAlumnoTexto(e: ErrorAlumno): string {
  switch (e) {
    case "no-existe":
      return "Este alumno ya no está en la lista. Recarga la página.";
    case "motivo":
      return "Escribe por qué cambias la base: el alumno lo verá.";
    case "invalida":
      return "Revisa los datos: algo no se pudo guardar así.";
    case "red":
      return "Se perdió la conexión. No borramos nada: vuelve a intentarlo.";
  }
}

/* ---------- Qué se escribe ---------- */

export type Edicion = {
  /** Perfil nuevo; `null` si nombres, apellidos y base no cambian. */
  usuario: Usuario | null;
  /** Fila de `historialBase`; `null` si la base no cambia. */
  cambioBase: CambioBase | null;
  /** Email nuevo (`null` = sin email); `undefined` si no cambia. */
  email: string | null | undefined;
};

/**
 * Decide qué documentos escribir. Motivo obligatorio solo si la base cambia (D108); el autor
 * sale de la sesión. Un alumno que no es estudiante no se edita aquí.
 */
export function armarEdicion({
  actual,
  emailActual,
  entrada,
  autorId,
  ahora,
}: {
  actual: Usuario;
  emailActual: string | null;
  entrada: EditarAlumno;
  autorId: string;
  ahora: number;
}): { ok: true; edicion: Edicion } | { ok: false; error: ErrorAlumno } {
  if (actual.rol !== "estudiante") return { ok: false, error: "invalida" };
  const cambiaBase = entrada.base !== actual.base;
  if (cambiaBase && entrada.motivo === "")
    return { ok: false, error: "motivo" };

  const cambiaPerfil =
    cambiaBase ||
    entrada.nombres !== actual.nombres ||
    entrada.apellidos !== actual.apellidos;
  let usuario: Usuario | null = null;
  if (cambiaPerfil) {
    const u = zUsuario.safeParse({
      ...actual,
      nombres: entrada.nombres,
      apellidos: entrada.apellidos,
      base: entrada.base,
      actualizadoEn: ahora,
    });
    if (!u.success) return { ok: false, error: "invalida" };
    usuario = u.data;
  }

  let cambioBase: CambioBase | null = null;
  if (cambiaBase) {
    const c = zCambioBase.safeParse({
      alumnoId: actual.cedula,
      de: actual.base,
      a: entrada.base,
      motivo: entrada.motivo,
      autorId,
      en: ahora,
    });
    if (!c.success) return { ok: false, error: "invalida" };
    cambioBase = c.data;
  }

  let email: string | null | undefined;
  if (entrada.email !== undefined) {
    const nuevo = entrada.email === "" ? null : entrada.email;
    if (nuevo !== emailActual) {
      const p = zPrivado.safeParse({ email: nuevo });
      if (!p.success) return { ok: false, error: "invalida" };
      email = p.data.email;
    }
  }
  return { ok: true, edicion: { usuario, cambioBase, email } };
}

/* ---------- Filas de la tabla ---------- */

const comparaNombre = new Intl.Collator("es", { sensitivity: "base" });

/**
 * Nota individual de la tabla: la de su tarea individual evaluada más reciente, con su base
 * vigente (D013, D209); sin ninguna, `null` = Pendiente (D003).
 */
export function notaIndividualVigente(
  alumno: Pick<Usuario, "cedula" | "base">,
  entregas: readonly Entrega[],
): number | null {
  let ultima: Entrega | null = null;
  for (const e of entregas) {
    if (e.tipo !== "individual" || e.titularId !== alumno.cedula) continue;
    if (e.estado !== "evaluada" || !e.evaluacion) continue;
    if (
      !ultima?.evaluacion ||
      e.evaluacion.evaluadaEn > ultima.evaluacion.evaluadaEn
    )
      ultima = e;
  }
  return ultima ? notaDeIntegrante(ultima, alumno.base) : null;
}

/**
 * Nota del alumno en cada tarea evaluada (individual o grupal: entra si es integrante), con su
 * base vigente. Si hubiera dos entregas de una tarea para él, queda la evaluada más reciente.
 */
export function notasPorTarea(
  alumno: Pick<Usuario, "cedula" | "base">,
  entregas: readonly Entrega[],
): Record<string, number> {
  const notas: Record<string, number> = {};
  const en: Record<string, number> = {};
  for (const e of entregas) {
    if (!e.integrantes.includes(alumno.cedula) || !e.evaluacion) continue;
    const nota = notaDeIntegrante(e, alumno.base);
    if (nota === null) continue;
    if (e.evaluacion.evaluadaEn >= (en[e.tareaId] ?? -1)) {
      en[e.tareaId] = e.evaluacion.evaluadaEn;
      notas[e.tareaId] = nota;
    }
  }
  return notas;
}

/** Filas de /profe/alumnos: los estudiantes de las dos secciones, por sección y nombre. */
export function filasAlumnos(datos: {
  usuarios: readonly Usuario[];
  equipos: ReadonlyArray<ConId<Equipo>>;
  entregas: readonly Entrega[];
  rankings: Readonly<Record<SeccionId, RankingSeccion | null>>;
  /** cédula → email de `privados` (sin entrada: sin email). */
  emails: ReadonlyMap<string, string | null>;
}): FilaAlumno[] {
  const equipos = new Map(datos.equipos.map((e) => [e.id, e.nombre]));
  return datos.usuarios
    .filter(
      (u): u is Usuario & { seccion: SeccionId } =>
        u.rol === "estudiante" && u.seccion !== null,
    )
    .map(
      (u): FilaAlumno => ({
        cedula: u.cedula,
        seccion: u.seccion,
        nombres: u.nombres,
        apellidos: u.apellidos,
        equipo: (u.equipoId && equipos.get(u.equipoId)) || null,
        base: u.base,
        nota: notaIndividualVigente(u, datos.entregas),
        notas: notasPorTarea(u, datos.entregas),
        puntos: datos.rankings[u.seccion]?.alumnos[u.cedula]?.puntos ?? 0,
        estilo: estiloDe(u.avatar.estilo),
        semilla: u.avatar.semilla,
        email: datos.emails.get(u.cedula) ?? null,
      }),
    )
    .sort(
      (a, b) =>
        a.seccion.localeCompare(b.seccion) ||
        comparaNombre.compare(
          `${a.nombres} ${a.apellidos}`,
          `${b.nombres} ${b.apellidos}`,
        ),
    );
}
