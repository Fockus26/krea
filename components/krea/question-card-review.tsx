import { useId } from "react";
import { ComentarioCampo } from "@/components/krea/comentario-campo";
import { ImageViewer } from "@/components/krea/image-viewer";
import type {
  AnswerImage,
  QuestionAnswer,
} from "@/components/krea/question-card-detail";
import { QuestionHeader } from "@/components/krea/question-header";
import { RespuestaEnlace } from "@/components/krea/respuesta-enlace";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
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
  /** Hueco opcional bajo la respuesta (el % orientativo de IA, D425); nada si falta. */
  bajoRespuesta?: React.ReactNode;
  /** `id` del enunciado (el `aria-labelledby` del puntaje). Si falta, se genera uno. */
  titleId?: string;
  /** Comentario opcional del profe. Controlado. */
  comentario: string;
  onComentarioChange: (value: string) => void;
  /** Ayuda bajo el comentario; provisional (CONTENT_CHECKLIST). */
  comentarioAyuda?: string;
  level?: 2 | 3 | 4;
};

/** Imagen de 280 con «Ampliar» abajo a la derecha (visor a pantalla completa). */
function ImagenRevision({
  imagen,
  enunciado,
}: {
  imagen: AnswerImage;
  enunciado: string;
}) {
  return (
    <div className="relative aspect-4/3 w-70 max-w-full overflow-hidden rounded-nav bg-surface-2">
      {/* biome-ignore lint/performance/noImgElement: blobs locales y remotos (D046) */}
      <img
        src={imagen.src}
        alt={imagen.alt}
        className="size-full object-cover"
      />
      <ImageViewer
        src={imagen.src}
        alt={imagen.alt}
        enunciado={enunciado}
        className="absolute right-2 bottom-2"
      />
    </div>
  );
}

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
  bajoRespuesta,
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
          <p className="rounded-nav bg-surface-2 px-3.5 py-3 text-callout text-text whitespace-pre-wrap break-words">
            {respuesta.texto}
          </p>
        ) : respuesta.tipo === "url" ? (
          <RespuestaEnlace url={respuesta.url} />
        ) : respuesta.tipo === "imagen" ? (
          <ImagenRevision imagen={respuesta} enunciado={enunciado} />
        ) : (
          // Varias imágenes (D373): cada una con su «Ampliar»
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            {respuesta.imagenes.map((img) => (
              <li key={img.src} className="max-w-full">
                <ImagenRevision imagen={img} enunciado={enunciado} />
              </li>
            ))}
          </ul>
        )}
        {bajoRespuesta}
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
          <ComentarioCampo
            value={comentario}
            onChange={onComentarioChange}
            maxLength={COMMENT_MAX_LENGTH}
            emojiEtiqueta={`Emoji en el comentario de la pregunta ${numero}`}
          />
        </Field>
      </Card>
    </li>
  );
}
