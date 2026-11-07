// Del seed del Excel (`data/seed/`, scripts/import-excel.py) a los documentos de Firestore
// (D174). Puro: lo usan `scripts/seed-emulator.ts` y las pruebas. Solo datos reales del Excel,
// salvo lo marcado PLACEHOLDER.
import { NOTA_MAX } from "@/lib/grades";
import {
  type Ajuste,
  type Entrega,
  type Equipo,
  idEntrega,
  type Privado,
  type SeccionId,
  type Tarea,
  type Usuario,
  zAjuste,
  zEntrega,
  zEquipo,
  zSeccion,
  zTarea,
  zUsuario,
} from "@/lib/modelo";
import { CATALOGO_INICIAL, seccionesDe } from "@/lib/secciones";

export type AlumnoSeed = {
  cedula: string;
  seccion: string;
  nombres: string;
  apellidos: string;
  notaIndividual: number | null;
  grupoId: string | null;
  baseEvaluacion: number;
};

export type GrupoSeed = {
  id: string;
  nombre: string;
  seccion: string;
  tema: string | null;
  capitanCedula: string;
  ajusteCapitan: number;
  notaGrupal: number | null;
};

export type TareaSeed = {
  id: string;
  titulo: string;
  tipo: string;
  preguntas: ReadonlyArray<{
    id: string;
    enunciado: string;
    formato: string;
    valor: number;
  }>;
  evaluaciones: ReadonlyArray<{
    cedula: string;
    puntos: ReadonlyArray<number>;
    nota: number;
  }>;
};

export type DocsSeed = {
  usuarios: Array<{ id: string; data: Usuario }>;
  privados: Array<{ id: string; data: Privado }>;
  equipos: Array<{ id: string; data: Equipo }>;
  tareas: Array<{ id: string; data: Tarea }>;
  entregas: Array<{ id: string; data: Entrega }>;
  ajustes: Array<{ id: string; data: Ajuste }>;
};

/** Estilo de avatar por defecto hasta que el alumno elija el suyo en Perfil (D010). */
export const ESTILO_AVATAR_DEFECTO = "adventurer-neutral";

/**
 * Tarea grupal que contiene las notas grupales del Excel. PLACEHOLDER: el Excel no dice de qué
 * tarea son; el título es el del prototipo (CONTENT_CHECKLIST fila 53). Sin preguntas: la nota
 * vino sin desglose.
 */
export const TAREA_GRUPAL_SEED = {
  id: "logo-y-paleta",
  titulo: "Logo y paleta de la marca",
  fechaEntrega: "2026-10-17",
} as const;

/** PLACEHOLDER (fila 53): el Excel no trae la fecha de «Identidad de marca»; la del prototipo. */
export const FECHA_IDENTIDAD_SEED = "2026-10-10";

const seccion = (s: string): SeccionId => zSeccion.parse(s);

export function docsDesdeSeed(
  alumnos: ReadonlyArray<AlumnoSeed>,
  grupos: ReadonlyArray<GrupoSeed>,
  tarea: TareaSeed,
  ahora: number,
): DocsSeed {
  const out: DocsSeed = {
    usuarios: [],
    privados: [],
    equipos: [],
    tareas: [],
    entregas: [],
    ajustes: [],
  };

  for (const a of alumnos) {
    out.usuarios.push({
      id: a.cedula,
      data: zUsuario.parse({
        cedula: a.cedula,
        rol: "estudiante",
        nombres: a.nombres,
        apellidos: a.apellidos,
        seccion: seccion(a.seccion),
        equipoId: a.grupoId,
        base: a.baseEvaluacion,
        avatar: { estilo: ESTILO_AVATAR_DEFECTO, semilla: a.cedula },
        actualizadoEn: ahora,
      }),
    });
    // El email real llega con la carga de César (checklist #3).
    out.privados.push({ id: a.cedula, data: { email: null } });
  }

  for (const g of grupos) {
    out.equipos.push({
      id: g.id,
      data: zEquipo.parse({
        nombre: g.nombre,
        seccion: seccion(g.seccion),
        tema: g.tema,
        capitanId: g.capitanCedula,
        logoPath: null,
      }),
    });
  }

  // Tarea individual real («Identidad de marca»), con el desglose de quien lo tiene.
  const individual: Tarea = zTarea.parse({
    titulo: tarea.titulo,
    tipo: "individual",
    secciones: seccionesDe(CATALOGO_INICIAL),
    estado: "evaluada",
    fechaEntrega: FECHA_IDENTIDAD_SEED,
    premio: null,
    preguntas: tarea.preguntas,
    autorId: null,
    actualizadoEn: ahora,
  });
  out.tareas.push({ id: tarea.id, data: individual });

  const desglose = new Map(tarea.evaluaciones.map((e) => [e.cedula, e.puntos]));
  for (const a of alumnos) {
    if (a.notaIndividual === null) continue; // Pendiente (D003): sin entrega
    const p = desglose.get(a.cedula);
    // El Excel guarda la nota sobre 20 con base 20: el puntaje es la nota (D006).
    const puntaje = (a.notaIndividual * NOTA_MAX) / a.baseEvaluacion;
    out.entregas.push({
      id: idEntrega(tarea.id, a.cedula),
      data: zEntrega.parse({
        tareaId: tarea.id,
        tipo: "individual",
        titularId: a.cedula,
        seccion: seccion(a.seccion),
        integrantes: [a.cedula],
        estado: "evaluada",
        respuestas: {},
        enviadaPor: a.cedula,
        enviadaEn: null,
        evaluacion: {
          puntos: p
            ? Object.fromEntries(
                tarea.preguntas.map((q, i) => [q.id, p[i] ?? 0]),
              )
            : null,
          comentarios: {},
          puntaje,
          evaluadaPor: null,
          evaluadaEn: ahora,
        },
      }),
    });
  }

  // Tarea grupal con las notas grupales del Excel (importada: sin preguntas).
  out.tareas.push({
    id: TAREA_GRUPAL_SEED.id,
    data: zTarea.parse({
      titulo: TAREA_GRUPAL_SEED.titulo,
      tipo: "grupal",
      secciones: seccionesDe(CATALOGO_INICIAL),
      estado: "evaluada",
      fechaEntrega: TAREA_GRUPAL_SEED.fechaEntrega,
      premio: null,
      preguntas: [],
      importada: true,
      autorId: null,
      actualizadoEn: ahora,
    }),
  });

  for (const g of grupos) {
    const integrantes = alumnos
      .filter((a) => a.grupoId === g.id)
      .map((a) => a.cedula);
    if (g.notaGrupal !== null && integrantes.length > 0) {
      out.entregas.push({
        id: idEntrega(TAREA_GRUPAL_SEED.id, g.id),
        data: zEntrega.parse({
          tareaId: TAREA_GRUPAL_SEED.id,
          tipo: "grupal",
          titularId: g.id,
          seccion: seccion(g.seccion),
          integrantes,
          estado: "evaluada",
          respuestas: {},
          enviadaPor: g.capitanCedula,
          enviadaEn: null,
          evaluacion: {
            puntos: null,
            comentarios: {},
            puntaje: g.notaGrupal,
            evaluadaPor: null,
            evaluadaEn: ahora,
          },
        }),
      });
    }
    if (g.ajusteCapitan !== 0) {
      out.ajustes.push({
        id: `importado-${g.id}-capitan`,
        data: zAjuste.parse({
          destino: "alumno",
          destinoId: g.capitanCedula,
          seccion: seccion(g.seccion),
          motivoId: "importado",
          motivo: "Ajuste del Excel",
          valor: g.ajusteCapitan,
          nota: null,
          autorId: null,
          en: ahora,
          anulaA: null,
        }),
      });
    }
  }

  return out;
}
