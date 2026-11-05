import { useId } from "react";
import { QuestionCardDetail } from "@/components/krea/question-card-detail";
import { preguntasResumenTexto } from "@/lib/notas";

export type PreguntaDetalle = {
  id: string;
  enunciado: string;
  valor: number;
  obtenido: number;
  respuesta: string;
  /** Respuesta en imagen ya firmada (D195); sin ella se muestra `respuesta` en texto. */
  imagen?: { src: string; alt: string };
  comentario?: string;
};

/**
 * "Pregunta por pregunta" del Detalle de nota (HANDOFF §3 Detalle): h2 + resumen
 * ("8 preguntas · 2 con comentario") y un `<ol>` de `QuestionCardDetail`, gap 16.
 * Los puntos por pregunta son los originales, sin escalar por la base (§8).
 */
export function QuestionList({
  preguntas,
}: {
  preguntas: readonly PreguntaDetalle[];
}) {
  const titleId = useId();
  const conComentario = preguntas.filter((p) => p.comentario).length;
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id={titleId} className="text-h2 text-text">
          Pregunta por pregunta
        </h2>
        <p className="text-small text-text-2">
          {preguntasResumenTexto(preguntas.length, conComentario)}
        </p>
      </div>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {preguntas.map((p, i) => (
          <QuestionCardDetail
            key={p.id}
            numero={i + 1}
            enunciado={p.enunciado}
            valor={p.valor}
            obtenido={p.obtenido}
            respuesta={
              p.imagen
                ? { tipo: "imagen", ...p.imagen }
                : { tipo: "texto", texto: p.respuesta }
            }
            comentario={p.comentario}
            level={3}
          />
        ))}
      </ol>
    </section>
  );
}
