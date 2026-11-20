import { ComentarioProfe } from "@/components/krea/comentario-profe";
import { QuestionBar } from "@/components/krea/question-bar";
import { QuestionHeader } from "@/components/krea/question-header";
import { Card } from "@/components/ui/card";

/** Imagen de una respuesta ya firmada, con su `alt` real. */
export type AnswerImage = { src: string; alt: string };

/**
 * Respuesta ya entregada: texto, una imagen con su `alt` real (§8; D046 usa `<img>`) o varias
 * (pregunta «Varias imágenes», D373).
 */
export type QuestionAnswer =
  | { tipo: "texto"; texto: string }
  | ({ tipo: "imagen" } & AnswerImage)
  | { tipo: "imagenes"; imagenes: readonly AnswerImage[] };

type QuestionCardDetailProps = {
  numero: number;
  enunciado: string;
  /** Puntos que vale la pregunta. */
  valor: number;
  /** Puntos obtenidos; `null` = Pendiente (D003). */
  obtenido: number | null;
  respuesta: QuestionAnswer;
  /** Comentario del profe, si lo dejó. */
  comentario?: string;
  level?: 2 | 3 | 4;
};

/*
 * Tarjeta de pregunta, variante detalle (estudiante) — HANDOFF §2.16, §3 "Detalle de nota".
 * Cuerpo propio, SIN cuerpo común con responder ni evaluar (§8). Va dentro de un `<ol>`:
 * la raíz es un `<li>`. La cifra "3,5 / 4" ya está en texto en la cabecera, así que la barra
 * no la repite (`hideText`).
 */
export function QuestionCardDetail({
  numero,
  enunciado,
  valor,
  obtenido,
  respuesta,
  comentario,
  level,
}: QuestionCardDetailProps) {
  return (
    <li className="list-none">
      <Card className="flex flex-col gap-3">
        <QuestionHeader
          numero={numero}
          enunciado={enunciado}
          valor={valor}
          variant="detalle"
          obtenido={obtenido}
          level={level}
        />
        <QuestionBar obtenido={obtenido} valor={valor} hideText />
        <div className="flex flex-col gap-1.5">
          <p className="text-eyebrow text-text-2">Tu respuesta</p>
          {respuesta.tipo === "texto" ? (
            <p className="rounded-nav bg-surface-2 px-3.5 py-3 text-callout text-text whitespace-pre-wrap break-words">
              {respuesta.texto}
            </p>
          ) : respuesta.tipo === "imagen" ? (
            // biome-ignore lint/performance/noImgElement: blobs locales y remotos (D046)
            <img
              src={respuesta.src}
              alt={respuesta.alt}
              className="aspect-4/3 w-55 max-w-full rounded-nav bg-surface-2 object-cover"
            />
          ) : (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {respuesta.imagenes.map((img) => (
                <li key={img.src} className="max-w-full">
                  {/* biome-ignore lint/performance/noImgElement: blobs locales y remotos (D046) */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="aspect-4/3 w-55 max-w-full rounded-nav bg-surface-2 object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        {comentario ? (
          <ComentarioProfe titulo="Comentario de tu profe" texto={comentario} />
        ) : null}
      </Card>
    </li>
  );
}
