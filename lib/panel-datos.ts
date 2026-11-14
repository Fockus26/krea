// Panel del profesor con datos de Firestore (fase 07 W7, D208). Puro: la cola «Por evaluar», los
// últimos ajustes y el avance de la tarea evaluada más reciente, en la forma de `DatosPanel` (la
// misma que `lib/demo/panel.ts` para la vista previa).
import type { DatosPanel } from "@/components/sections/profe-panel/panel-view";
import type { FilaEvaluar } from "@/components/sections/profe-panel/pending-reviews";
import type { FilaAjuste } from "@/components/sections/profe-panel/recent-adjustments";
import {
  type MapasEvaluar,
  nombreTitular,
  TITULAR_DESCONOCIDO,
  tituloTarea,
} from "@/lib/evaluar-datos";
import { diaDeInstante, formatFecha, isoLocalDeInstante } from "@/lib/fecha";
import { NOTA_APROBATORIA } from "@/lib/grades";
import type { Ajuste, Entrega, SeccionId, Usuario } from "@/lib/modelo";
import { entregaMetaTexto } from "@/lib/panel";
import { motivoTexto, nombreDestino } from "@/lib/puntos";
import { primerApellido } from "@/lib/ranking";
import { notaDeIntegrante } from "@/lib/ranking-datos";
import { ordenarSecciones } from "@/lib/secciones";
import { estiloDe, nombreCorto } from "@/lib/vistas-estudiante";

type ConId<T> = { id: string } & T;

/** Cuántos ajustes muestra «Últimos ajustes» (lienzo Panel.dc.html: 4). */
export const AJUSTES_RECIENTES = 4;

/** PROVISIONAL (CONTENT_CHECKLIST fila 134): «Evaluados · …» sin ninguna tarea evaluada. */
export const SIN_TAREA_EVALUADA = "Ninguna tarea todavía";

const primerNombre = (nombres: string) => nombres.trim().split(/\s+/)[0] ?? "";

export function filaEvaluar(e: ConId<Entrega>, m: MapasEvaluar): FilaEvaluar {
  const tarea = tituloTarea(e, m);
  const fecha =
    e.enviadaEn === null ? "" : formatFecha(diaDeInstante(e.enviadaEn));
  const nombre = nombreTitular(e, m);
  const seccion = e.seccion;
  if (e.tipo === "grupal") {
    const eq = m.equipos.get(e.titularId);
    const autor = e.enviadaPor ? m.usuarios.get(e.enviadaPor) : undefined;
    return {
      id: e.id,
      seccion,
      tipo: "grupal",
      nombre,
      nombreCorto: nombre,
      visual: {
        tipo: "equipo",
        teamId: e.titularId,
        tema: eq?.tema ?? eq?.nombre ?? nombre,
      },
      meta: entregaMetaTexto({
        tarea,
        tipo: "grupal",
        fecha,
        entrego: autor ? primerNombre(autor.nombres) : undefined,
      }),
    };
  }
  const u = m.usuarios.get(e.titularId);
  return {
    id: e.id,
    seccion,
    tipo: "individual",
    nombre: `${nombre} · ${e.seccion}`,
    nombreCorto: nombre,
    visual: {
      tipo: "alumno",
      estilo: estiloDe(u?.avatar.estilo ?? ""),
      seed: u?.avatar.semilla ?? e.titularId,
      nombre,
    },
    meta: entregaMetaTexto({ tarea, tipo: "individual", fecha }),
  };
}

function filaAjuste(a: ConId<Ajuste>, m: MapasEvaluar): FilaAjuste {
  const u = a.destino === "alumno" ? m.usuarios.get(a.destinoId) : undefined;
  const eq = a.destino === "equipo" ? m.equipos.get(a.destinoId) : undefined;
  const nombre =
    a.destino === "equipo"
      ? nombreDestino("equipo", eq?.nombre ?? TITULAR_DESCONOCIDO)
      : u
        ? nombreCorto(u)
        : TITULAR_DESCONOCIDO;
  return {
    id: a.id,
    seccion: a.seccion,
    nombre,
    valor: a.valor,
    motivo: motivoTexto({ motivo: a.motivo, detalle: a.nota ?? undefined }),
    fecha: isoLocalDeInstante(a.en),
  };
}

/** La tarea con la evaluación más reciente (la que miden «Evaluados» y «Raspados»). */
function tareaMasReciente(entregas: ReadonlyArray<Entrega>): string | null {
  let id: string | null = null;
  let en = -1;
  for (const e of entregas) {
    if (
      e.estado === "evaluada" &&
      e.evaluacion &&
      e.evaluacion.evaluadaEn > en
    ) {
      en = e.evaluacion.evaluadaEn;
      id = e.tareaId;
    }
  }
  return id;
}

/**
 * Datos del Panel: la cola entera (el Panel enseña 5 y «Ver las N»), los últimos ajustes, y de
 * la tarea evaluada más reciente cuántos alumnos de cada sección tienen nota y quiénes sacaron
 * menos de 10 con su base (D006, D177). `secciones`: las del catálogo (las opciones del filtro);
 * el avance sale para cada una y para cualquier otra con alumnos, nunca `undefined` (D323).
 */
export function panelDatosDe({
  cola,
  entregas,
  ajustes,
  mapas,
  secciones = [],
}: {
  cola: ReadonlyArray<ConId<Entrega>>;
  entregas: ReadonlyArray<Entrega>;
  ajustes: ReadonlyArray<ConId<Ajuste>>;
  mapas: MapasEvaluar;
  secciones?: readonly SeccionId[];
}): DatosPanel {
  const tareaId = tareaMasReciente(entregas);
  const tarea = tareaId ? mapas.tareas.get(tareaId) : undefined;
  const alumnos = [...mapas.usuarios.values()].filter(
    (u): u is Usuario & { seccion: SeccionId } =>
      u.rol === "estudiante" && u.seccion !== null,
  );

  const avance: Record<SeccionId, { evaluados: number; total: number }> = {};
  const raspados: Array<DatosPanel["raspados"][number]> = [];
  const todas = ordenarSecciones([
    ...secciones,
    ...alumnos.map((u) => u.seccion),
  ]);
  for (const s of todas) {
    const enSeccion = tarea?.secciones.includes(s)
      ? alumnos.filter((u) => u.seccion === s)
      : [];
    let evaluados = 0;
    for (const u of enSeccion) {
      const e = entregas.find(
        (x) =>
          x.tareaId === tareaId &&
          x.estado === "evaluada" &&
          x.integrantes.includes(u.cedula),
      );
      const nota = e ? notaDeIntegrante(e, u.base, u.cedula) : null;
      if (nota === null) continue;
      evaluados++;
      if (nota < NOTA_APROBATORIA) {
        raspados.push({
          seccion: s,
          nombre: `${u.nombres} ${primerApellido(u.apellidos)}`,
          nota,
        });
      }
    }
    avance[s] = { evaluados, total: enSeccion.length };
  }

  return {
    entregas: cola.map((e) => filaEvaluar(e, mapas)),
    ajustes: [...ajustes]
      .sort((a, b) => b.en - a.en)
      .slice(0, AJUSTES_RECIENTES)
      .map((a) => filaAjuste(a, mapas)),
    tareaEvaluada: tarea?.titulo ?? SIN_TAREA_EVALUADA,
    tareaId: tarea ? tareaId : null,
    secciones: [...secciones],
    avance,
    raspados: raspados.sort((a, b) => a.nota - b.nota),
  };
}
