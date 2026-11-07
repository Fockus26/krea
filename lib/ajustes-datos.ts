// Ajustes de puntos con datos de Firestore (fase 07 W7, D207). Puro (sin Firebase ni reloj): qué
// manda el formulario, qué ajuste (o anulación, D121) se escribe, y el historial y los
// destinatarios que pinta /profe/puntos. Un ajuste mueve puntos del ranking, NUNCA la nota (D007):
// aquí no se toca ninguna entrega.
import { z } from "zod";
import { zIdDocumento } from "@/lib/evaluar-datos";
import { isoLocalDeInstante } from "@/lib/fecha";
import {
  type Ajuste,
  type Equipo,
  type RankingSeccion,
  SECCIONES,
  type SeccionId,
  type Usuario,
  zAjuste,
} from "@/lib/modelo";
import { fechaAjusteTexto } from "@/lib/panel";
import {
  type Candidato,
  type FilaHistorial,
  MOTIVO_ANULACION,
  MOTIVOS,
  type MotivoId,
  motivoPorId,
  nombreDestino,
} from "@/lib/puntos";
import { primerApellido } from "@/lib/ranking";
import { estiloDe, nombreCorto } from "@/lib/vistas-estudiante";

type ConId<T> = { id: string } & T;

/** `motivoId` del ajuste inverso que crea «Anular ajuste» (D121). */
export const MOTIVO_ID_ANULACION = "anulacion";

const MOTIVO_IDS = MOTIVOS.map((m) => m.id) as [MotivoId, ...MotivoId[]];

/* ---------- Entrada de las Server Actions ---------- */

export const zAplicarAjuste = z.object({
  destino: z.enum(["alumno", "equipo"]),
  destinoId: zIdDocumento,
  motivoId: z.enum(MOTIVO_IDS),
  valor: zAjuste.shape.valor,
  /** Detalle escrito: obligatorio con «Otro», opcional en el resto. */
  nota: z.string().trim().max(300),
});
export type AplicarAjuste = z.infer<typeof zAplicarAjuste>;

export const zAnularAjuste = z.object({ ajusteId: zIdDocumento });

export type ErrorAjuste =
  | "invalida"
  | "no-existe"
  | "detalle"
  | "anulado"
  | "red";

export type ResultadoAjuste =
  | { ok: true; id: string }
  | { ok: false; error: ErrorAjuste };

/** Toast de error al aplicar o anular. PROVISIONAL (CONTENT_CHECKLIST fila 134). */
export function errorAjusteTexto(e: ErrorAjuste): string {
  switch (e) {
    case "red":
      return "No se pudo guardar el ajuste. Revisa tu conexión e inténtalo de nuevo.";
    case "anulado":
      return "Ese ajuste ya estaba anulado.";
    case "detalle":
      return "En «Otro», explica el motivo en el detalle.";
    case "no-existe":
      return "Ese alumno, equipo o ajuste ya no existe. Recarga la página.";
    default:
      return "No se pudo guardar el ajuste. Recarga la página e inténtalo de nuevo.";
  }
}

/* ---------- Escritura ---------- */

/**
 * Ajuste nuevo. La sección sale del documento del destino (nunca del body), la etiqueta del
 * motivo se guarda (el catálogo puede cambiar) y «Otro» exige detalle (D007).
 */
export function armarAjuste({
  entrada,
  seccion,
  autorId,
  ahora,
}: {
  entrada: AplicarAjuste;
  seccion: SeccionId;
  autorId: string;
  ahora: number;
}): { ok: true; ajuste: Ajuste } | { ok: false; error: ErrorAjuste } {
  const nota = entrada.nota.trim();
  if (entrada.motivoId === "otro" && !nota) {
    return { ok: false, error: "detalle" };
  }
  return {
    ok: true,
    ajuste: {
      destino: entrada.destino,
      destinoId: entrada.destinoId,
      seccion,
      motivoId: entrada.motivoId,
      motivo: motivoPorId(entrada.motivoId).etiqueta,
      valor: entrada.valor,
      nota: nota || null,
      autorId,
      en: ahora,
      anulaA: null,
    },
  };
}

/** Id fijo de la anulación de un ajuste: dos anulaciones a la vez chocan en el mismo documento. */
export function idAnulacion(ajusteId: string): string {
  return `${ajusteId}__anulacion`;
}

export function esAnulacion(a: Pick<Ajuste, "anulaA" | "motivoId">): boolean {
  return a.anulaA !== null || a.motivoId === MOTIVO_ID_ANULACION;
}

/**
 * Ajuste inverso «Anulación» (D121): mismo destino y sección, valor opuesto, y en el detalle
 * qué anula: ««Participación destacada» del 25/10/2026, 10:15 a. m.». El original no se borra.
 */
export function armarAnulacion({
  original,
  autorId,
  ahora,
}: {
  original: ConId<Ajuste>;
  autorId: string;
  ahora: number;
}): { ok: true; ajuste: Ajuste } | { ok: false; error: ErrorAjuste } {
  if (esAnulacion(original)) return { ok: false, error: "invalida" };
  return {
    ok: true,
    ajuste: {
      destino: original.destino,
      destinoId: original.destinoId,
      seccion: original.seccion,
      motivoId: MOTIVO_ID_ANULACION,
      motivo: MOTIVO_ANULACION,
      valor: -original.valor,
      nota: `«${original.motivo}» del ${fechaAjusteTexto(isoLocalDeInstante(original.en))}`,
      autorId,
      en: ahora,
      anulaA: original.id,
    },
  };
}

/* ---------- Vistas ---------- */

/** PROVISIONAL (fila 134): autor o destino cuyo documento falta. */
export const SIN_NOMBRE = "Sin nombre";

export type NombresAjustes = {
  usuarios: ReadonlyMap<string, Usuario>;
  equipos: ReadonlyMap<string, ConId<Equipo>>;
};

function nombreDe(a: Ajuste, n: NombresAjustes): string {
  if (a.destino === "equipo") {
    return nombreDestino(
      "equipo",
      n.equipos.get(a.destinoId)?.nombre ?? SIN_NOMBRE,
    );
  }
  const u = n.usuarios.get(a.destinoId);
  return u ? nombreCorto(u) : SIN_NOMBRE;
}

/** Historial de /profe/puntos, del más reciente al más antiguo (D121: el anulado se queda). */
export function historialDe(
  ajustes: ReadonlyArray<ConId<Ajuste>>,
  n: NombresAjustes,
): FilaHistorial[] {
  const anulados = new Set(
    ajustes.flatMap((a) => (a.anulaA === null ? [] : [a.anulaA])),
  );
  return [...ajustes]
    .sort((a, b) => b.en - a.en || (a.id < b.id ? 1 : -1))
    .map((a): FilaHistorial => {
      const autor = a.autorId ? n.usuarios.get(a.autorId) : undefined;
      const fila: FilaHistorial = {
        id: a.id,
        tipo: a.destino,
        destinoId: a.destinoId,
        seccion: a.seccion,
        nombre: nombreDe(a, n),
        valor: a.valor,
        motivo: a.motivo,
        motivoId: a.motivoId,
        fecha: isoLocalDeInstante(a.en),
        profe: autor ? nombreCorto(autor) : SIN_NOMBRE,
        anulado: anulados.has(a.id),
        nuevo: false,
      };
      return {
        ...fila,
        ...(a.nota ? { detalle: a.nota } : {}),
        ...(a.anulaA === null ? {} : { anulaA: a.anulaA }),
      };
    });
}

export type CandidatosPorSeccion = Record<
  "alumno" | "equipo",
  Record<SeccionId, Candidato[]>
>;

const porNombre = new Intl.Collator("es", { sensitivity: "base" });

/** Destinatarios del combobox con los puntos actuales de `ranking/{seccion}`, por nombre. */
export function candidatosDe({
  usuarios,
  equipos,
  rankings,
}: {
  usuarios: ReadonlyArray<Usuario>;
  equipos: ReadonlyArray<ConId<Equipo>>;
  rankings: Readonly<Partial<Record<SeccionId, RankingSeccion | null>>>;
}): CandidatosPorSeccion {
  const c: CandidatosPorSeccion = {
    alumno: { "5A": [], "5C": [] },
    equipo: { "5A": [], "5C": [] },
  };
  for (const u of usuarios) {
    if (u.rol !== "estudiante" || u.seccion === null) continue;
    const nombre = nombreCorto(u);
    c.alumno[u.seccion].push({
      id: u.cedula,
      tipo: "alumno",
      seccion: u.seccion,
      nombre,
      puntos: rankings[u.seccion]?.alumnos[u.cedula]?.puntos ?? 0,
      primerApellido: primerApellido(u.apellidos),
      avatar: {
        tipo: "alumno",
        estilo: estiloDe(u.avatar.estilo),
        seed: u.avatar.semilla,
      },
    });
  }
  for (const e of equipos) {
    c.equipo[e.seccion].push({
      id: e.id,
      tipo: "equipo",
      seccion: e.seccion,
      nombre: e.nombre,
      puntos: rankings[e.seccion]?.equipos[e.id]?.puntos ?? 0,
      primerApellido: e.nombre,
      avatar: { tipo: "equipo", tema: e.tema ?? e.nombre, logo: null },
    });
  }
  for (const s of SECCIONES) {
    c.alumno[s].sort((x, y) => porNombre.compare(x.nombre, y.nombre));
    c.equipo[s].sort((x, y) => porNombre.compare(x.nombre, y.nombre));
  }
  return c;
}
