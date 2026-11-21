import { ComentarioProfe } from "@/components/krea/comentario-profe";
import { QuestionBar } from "@/components/krea/question-bar";
import { QuestionHeader } from "@/components/krea/question-header";
import { RespuestaEnlace } from "@/components/krea/respuesta-enlace";
import { Card } from "@/components/ui/card";

/** Imagen de una respuesta ya firmada, con su `alt` real. */
export type AnswerImage = { src: string; alt: string };

/**
 * Respuesta ya entregada: texto, una imagen con su `alt` real (§8; D046 usa `<img>`), varias
 * (pregunta «Varias imágenes», D373) o un enlace (D468; se pinta con `RespuestaEnlace`).
 */
export type QuestionAnswer =
  | { tipo: "texto"; texto: string }
  | { tipo: "url"; url: string }
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
  /**
   * Evaluada pero sin puntos de esta pregunta (D528): el texto que va en lugar de la barra
   * («Sin puntaje por pregunta», «No participaste…»). La cabecera dice solo «vale N», nunca
   * «Pendiente» (D003 es solo sin evaluación). Ignorado si hay `obtenido`.
   */
  sinPuntaje?: string;
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
  sinPuntaje,
  level,
}: QuestionCardDetailProps) {
  const sinPuntos = obtenido === null && sinPuntaje !== undefined;
  return (
    <li className="list-none">
      <Card className="flex flex-col gap-3">
        <QuestionHeader
          numero={numero}
          enunciado={enunciado}
          valor={valor}
          // Sin puntos: «vale N» (como al evaluar); el porqué va en texto debajo
          variant={sinPuntos ? "evaluar" : "detalle"}
          obtenido={obtenido}
          level={level}
        />
        {sinPuntos ? (
          <p className="text-small text-text-2">{sinPuntaje}</p>
        ) : (
          <QuestionBar obtenido={obtenido} valor={valor} hideText />
        )}
        <div className="flex flex-col gap-1.5">
          <p className="text-eyebrow text-text-2">Tu respuesta</p>
          {respuesta.tipo === "texto" ? (
            <p className="rounded-nav bg-surface-2 px-3.5 py-3 text-callout text-text whitespace-pre-wrap break-words">
              {respuesta.texto}
            </p>
          ) : respuesta.tipo === "url" ? (
            <RespuestaEnlace url={respuesta.url} />
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
