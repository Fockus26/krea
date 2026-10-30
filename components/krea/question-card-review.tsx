import { useId } from "react";
import { ImageViewer } from "@/components/krea/image-viewer";
import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import { QuestionHeader } from "@/components/krea/question-header";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { COMMENT_MAX_LENGTH } from "@/lib/question";

type QuestionCardReviewProps = {
  numero: number;
  enunciado: string;
  /** Puntos que vale la pregunta ("vale 4"). */
  valor: number;
  respuesta: QuestionAnswer;
  /**
   * Los botones de puntaje (`ScorePicker`, ola 3 / W8), como slot: esta tarjeta no los importa.
   * Para nombrarlos con el enunciado, pásales el mismo `titleId`.
   */
  score: React.ReactNode;
  /** `id` del enunciado (el `aria-labelledby` del puntaje). Si falta, se genera uno. */
  titleId?: string;
  /** Comentario opcional del profe. Controlado. */
  comentario: string;
  onComentarioChange: (value: string) => void;
  /** Ayuda bajo el comentario; provisional (CONTENT_CHECKLIST). */
  comentarioAyuda?: string;
  level?: 2 | 3 | 4;
};

/*
 * Tarjeta de pregunta, variante evaluar (profesor) — HANDOFF §2.16, §3 "Evaluar entrega".
 * Cuerpo propio, SIN cuerpo común con detalle ni responder (§8). Va dentro de un `<ol>`: la raíz
 * es un `<li>`. La imagen mide 280 con el botón "Ampliar" abajo a la derecha (visor a pantalla
 * completa). El puntaje entra por el slot `score`.
 */
export function QuestionCardReview({
  numero,
  enunciado,
  valor,
  respuesta,
  score,
  titleId,
  comentario,
  onComentarioChange,
  comentarioAyuda = "El estudiante lo verá debajo de su respuesta.",
  level,
}: QuestionCardReviewProps) {
  const generated = useId();
  const headingId = titleId ?? generated;
  return (
    <li className="list-none">
      <Card className="flex flex-col gap-4">
        <QuestionHeader
          numero={numero}
          enunciado={enunciado}
          valor={valor}
          variant="evaluar"
          level={level}
          titleId={headingId}
        />
        {respuesta.tipo === "texto" ? (
          <p className="rounded-nav bg-surface-2 px-3.5 py-3 text-[0.9375rem] leading-[1.375rem] text-text">
            {respuesta.texto}
          </p>
        ) : (
          <div className="relative aspect-4/3 w-70 max-w-full overflow-hidden rounded-nav bg-surface-2">
            {/* biome-ignore lint/performance/noImgElement: blobs locales y remotos (D046) */}
            <img
              src={respuesta.src}
              alt={respuesta.alt}
              className="size-full object-cover"
            />
            <ImageViewer
              src={respuesta.src}
              alt={respuesta.alt}
              enunciado={enunciado}
              className="absolute right-2 bottom-2"
            />
          </div>
        )}
        {score}
        <Field
          label={
            <>
              Comentario{" "}
              <span className="font-normal text-text-2">(opcional)</span>
            </>
          }
          help={comentarioAyuda}
        >
          <Textarea
            compact
            counter
            maxLength={COMMENT_MAX_LENGTH}
            value={comentario}
            onChange={(event) => onComentarioChange(event.currentTarget.value)}
          />
        </Field>
      </Card>
    </li>
  );
}
