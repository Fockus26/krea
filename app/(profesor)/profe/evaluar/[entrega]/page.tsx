import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import {
  type QuestionAnswer,
  QuestionCardDetail,
} from "@/components/krea/question-card-detail";
import { AccionesEntrega } from "@/components/sections/evaluar/acciones-entrega";
import { PresenciaEvaluar } from "@/components/sections/evaluar/presencia-evaluar";
import { ReviewForm } from "@/components/sections/evaluar/review-form";
import { ReviewHeader } from "@/components/sections/evaluar/review-header";
import { Card } from "@/components/ui/card";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import { analizarTextoIA } from "@/lib/acciones/analisis-ia";
import {
  devolverAlAlumno,
  eliminarEntrega,
} from "@/lib/acciones/devolver-entrega";
import { deshacerEvaluacion, guardarEvaluacion } from "@/lib/acciones/evaluar";
import { verificarSesion } from "@/lib/dal";
import { analisisIAEntrega } from "@/lib/datos/analisis-ia";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import {
  colaEvaluar,
  entregaProfe,
  mapasProfe,
  profesorActual,
} from "@/lib/datos/profesor";
import { puedeDevolver } from "@/lib/devolver-entrega";
import {
  basesIntegrantesTexto,
  colaFiltradaCon,
  filtrosDeParams,
  IMAGEN_NO_DISPONIBLE,
  nombreTitular,
  rutaEntrega,
  vistaEvaluar,
} from "@/lib/evaluar-datos";
import { formatNota } from "@/lib/grades";
import { idEntrega } from "@/lib/modelo";
import { nombrePresencia } from "@/lib/presencia";
import { respuestaFirmada } from "@/lib/question";

type Props = PageProps<"/profe/evaluar/[entrega]">;

const TITULO_ID = "entrega-titulo";

const ACCIONES = { guardar: guardarEvaluacion, deshacer: deshacerEvaluacion };
const ACCIONES_ENTREGA = {
  devolver: devolverAlAlumno,
  eliminar: eliminarEntrega,
};

// `cacheComponents` pide al menos un parámetro para validar el shell: una entrega del seed. Las
// demás se renderizan al pedirlas (como /profe/tareas/[id]).
export function generateStaticParams() {
  const cedula = tareaSeed.evaluaciones[0]?.cedula ?? "0000000";
  return [{ entrega: idEntrega(tareaSeed.id, cedula) }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entrega } = await params;
  const s = await verificarSesion();
  if (s?.rol !== "profesor")
    return { title: "Evaluar", robots: { index: false } };
  const [e, mapas] = await Promise.all([entregaProfe(entrega), mapasProfe()]);
  return {
    title: e ? `Evaluar · ${nombreTitular(e, mapas)}` : "Evaluar",
    robots: { index: false },
  };
}

// Evaluar entrega (HANDOFF §3; W7): una entrega de Firestore, en la cola o ya evaluada (se
// corrige, D204). Guardar escribe la evaluación y el ranking en una transacción (D175); la nota
// la calcula `lib/` (D013). Solo se firman las imágenes de esta entrega (D195). La topbar móvil
// sale de lib/topbar.ts; el Toaster es el global (D131).
export default async function EvaluarEntregaPage({
  params,
  searchParams,
}: Props) {
  const { entrega: id } = await params;
  // `?ver`: desde la ficha del alumno (Editar alumno) se abre solo para ver, sin corregir
  const query = await searchParams;
  const soloVer = query.ver !== undefined;
  // Filtros de la cola (D384): Anterior, Saltar y Guardar siguen la cola filtrada (D385)
  const filtros = filtrosDeParams(query);
  const [entrega, cola, mapas, profe] = await Promise.all([
    entregaProfe(id),
    colaEvaluar(),
    mapasProfe(),
    profesorActual(),
  ]);
  const tarea = entrega ? mapas.tareas.get(entrega.tareaId) : undefined;
  // Un borrador del alumno todavía no es una entrega (D196)
  if (!entrega || !tarea || entrega.estado === "borrador") notFound();
  const v = vistaEvaluar({
    entrega,
    tarea,
    cola: colaFiltradaCon(cola, filtros, entrega.id),
    mapas,
    filtros,
  });

  const urls = await urlsFirmadas(
    v.preguntas.flatMap((p) =>
      p.respuesta.tipo === "imagen"
        ? p.respuesta.imagenes.map((i) => i.ruta)
        : [],
    ),
  );
  const preguntas = v.preguntas.map(({ respuesta, ...p }) => {
    let r: QuestionAnswer;
    if (respuesta.tipo === "texto") r = respuesta;
    else {
      const imagenes = respuestaFirmada(respuesta.imagenes, urls);
      r = imagenes ?? { tipo: "texto", texto: IMAGEN_NO_DISPONIBLE };
    }
    return { ...p, respuesta: r };
  });
  // % orientativo de IA (D425–D429): solo respuestas de texto; sin clave, `null` y no aparece
  const porPreguntaIA = soloVer
    ? null
    : await analisisIAEntrega(
        entrega.id,
        v.preguntas.flatMap((p) => {
          const r = entrega.respuestas[p.id];
          return r && "texto" in r
            ? [{ preguntaId: p.id, texto: r.texto }]
            : [];
        }),
      );

  return (
    <>
      <ReviewHeader
        eyebrow={v.eyebrow}
        titulo={v.titulo}
        tituloId={TITULO_ID}
        identidad={v.identidad}
        linea={v.linea}
        chips={v.chips}
        anteriorHref={soloVer ? null : v.anteriorHref}
        saltarHref={soloVer ? null : v.saltarHref}
        filtroTexto={soloVer ? null : v.filtroTexto}
        colaHref={v.colaHref}
      />
      {/* Devolver al alumno y Eliminar entrega (D411–D415), también en «Solo ver» */}
      <AccionesEntrega
        variante="botones"
        entregaId={v.entregaId}
        titular={{
          nombre: v.titulo,
          tipo: v.tipo,
          evaluada: entrega.estado === "evaluada",
        }}
        enviadaEn={entrega.enviadaEn}
        evaluadaEn={entrega.evaluacion?.evaluadaEn ?? null}
        puedeDevolver={puedeDevolver(entrega, tarea)}
        tareaCerrada={tarea.estado !== "abierta"}
        acciones={ACCIONES_ENTREGA}
        despuesHref={v.colaHref}
      />
      {soloVer || preguntas.length === 0 ? null : (
        <PresenciaEvaluar
          key={v.entregaId}
          entregaId={v.entregaId}
          yo={{ uid: profe.sesion.uid, nombre: nombrePresencia(profe.usuario) }}
        />
      )}
      {preguntas.length === 0 ? (
        // Nota importada del Excel sin preguntas (D136): no hay nada que puntuar aquí
        <Card>
          <EmptyState
            icon={ClipboardList}
            headingLevel={2}
            // PROVISIONAL (CONTENT_CHECKLIST fila 133)
            title="Esta nota se cargó sin preguntas"
            description="Vino del registro de notas sin el puntaje de cada pregunta, así que no se puede corregir desde aquí."
          />
        </Card>
      ) : soloVer ? (
        <section aria-labelledby={TITULO_ID} className="flex flex-col gap-4">
          <p className="text-body text-text">
            Puntaje:{" "}
            <span className="text-body-strong">
              {entrega.evaluacion
                ? `${formatNota(entrega.evaluacion.puntaje)} / 20`
                : "Pendiente"}
            </span>
          </p>
          {v.tipo === "grupal" && entrega.evaluacion ? (
            // La base de cada integrante en esta tarea (D403); en individual, el chip
            <p className="text-body text-text">
              {basesIntegrantesTexto(
                v.integrantes,
                v.inicial.bases,
                v.inicial.noParticiparon,
              )}
            </p>
          ) : null}
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {preguntas.map((p, i) => (
              <QuestionCardDetail
                key={p.id}
                numero={i + 1}
                enunciado={p.enunciado}
                valor={p.valor}
                obtenido={entrega.evaluacion?.puntos?.[p.id] ?? null}
                respuesta={p.respuesta}
                comentario={entrega.evaluacion?.comentarios[p.id]}
                level={3}
              />
            ))}
          </ol>
        </section>
      ) : (
        <ReviewForm
          key={v.entregaId}
          entregaId={v.entregaId}
          tituloId={TITULO_ID}
          tipo={v.tipo}
          preguntas={preguntas}
          inicial={v.inicial}
          version={entrega.evaluacion?.evaluadaEn ?? null}
          base={v.base}
          siguiente={v.siguiente}
          guardarHref={v.guardarHref}
          actualHref={rutaEntrega(v.entregaId, filtros)}
          acciones={ACCIONES}
          titular={v.titulo}
          integrantes={v.integrantes}
          ia={
            porPreguntaIA
              ? { analizar: analizarTextoIA, porPregunta: porPreguntaIA }
              : undefined
          }
        />
      )}
    </>
  );
}
