import { Sparkles } from "lucide-react";
import { QuestionBar } from "@/components/krea/question-bar";
import { QuestionHeader } from "@/components/krea/question-header";
import { Card } from "@/components/ui/card";

/** Respuesta ya entregada: texto, o imagen con su `alt` real (§8; D046 usa `<img>`). */
export type QuestionAnswer =
  | { tipo: "texto"; texto: string }
  | { tipo: "imagen"; src: string; alt: string };

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
            <p className="rounded-nav bg-surface-2 px-3.5 py-3 text-callout text-text">
              {respuesta.texto}
            </p>
          ) : (
            // biome-ignore lint/performance/noImgElement: blobs locales y remotos (D046)
            <img
              src={respuesta.src}
              alt={respuesta.alt}
              className="aspect-4/3 w-55 max-w-full rounded-nav bg-surface-2 object-cover"
            />
          )}
        </div>
        {comentario ? (
          <div className="flex gap-2.5 rounded-nav bg-accent-soft px-3.5 py-3 text-callout text-text">
            <Sparkles
              aria-hidden="true"
              className="mt-px size-5 shrink-0 text-accent-ink"
            />
            <div className="min-w-0 flex-1">
              <p className="text-small-b">Comentario de tu profe</p>
              <p>{comentario}</p>
            </div>
          </div>
        ) : null}
      </Card>
    </li>
  );
}
