import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import {
  type QuestionAnswer,
  QuestionCardDetail,
} from "@/components/krea/question-card-detail";
import { ReviewForm } from "@/components/sections/evaluar/review-form";
import { ReviewHeader } from "@/components/sections/evaluar/review-header";
import { Card } from "@/components/ui/card";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import { deshacerEvaluacion, guardarEvaluacion } from "@/lib/acciones/evaluar";
import { verificarSesion } from "@/lib/dal";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import { colaEvaluar, entregaProfe, mapasProfe } from "@/lib/datos/profesor";
import {
  IMAGEN_NO_DISPONIBLE,
  nombreTitular,
  rutaEntrega,
  vistaEvaluar,
} from "@/lib/evaluar-datos";
import { formatNota } from "@/lib/grades";
import { idEntrega } from "@/lib/modelo";

type Props = PageProps<"/profe/evaluar/[entrega]">;

const TITULO_ID = "entrega-titulo";

const ACCIONES = { guardar: guardarEvaluacion, deshacer: deshacerEvaluacion };

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
  const soloVer = (await searchParams).ver !== undefined;
  const [entrega, cola, mapas] = await Promise.all([
    entregaProfe(id),
    colaEvaluar(),
    mapasProfe(),
  ]);
  const tarea = entrega ? mapas.tareas.get(entrega.tareaId) : undefined;
  // Un borrador del alumno todavía no es una entrega (D196)
  if (!entrega || !tarea || entrega.estado === "borrador") notFound();
  const v = vistaEvaluar({ entrega, tarea, cola, mapas });

  const urls = await urlsFirmadas(
    v.preguntas.flatMap((p) =>
      p.respuesta.tipo === "imagen" ? [p.respuesta.ruta] : [],
    ),
  );
  const preguntas = v.preguntas.map(({ respuesta, ...p }) => {
    let r: QuestionAnswer;
    if (respuesta.tipo === "texto") r = respuesta;
    else {
      const src = urls.get(respuesta.ruta);
      r = src
        ? { tipo: "imagen", src, alt: respuesta.alt }
        : { tipo: "texto", texto: IMAGEN_NO_DISPONIBLE };
    }
    return { ...p, respuesta: r };
  });

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
      />
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
          actualHref={rutaEntrega(v.entregaId)}
          acciones={ACCIONES}
          titular={v.titulo}
        />
      )}
    </>
  );
}
