import { Image as ImageIcon, Lock, Type } from "lucide-react";
import { type ReactNode, useId } from "react";
import {
  ImageUpload,
  type ImageUploadProps,
} from "@/components/krea/image-upload";
import { QuestionHeader } from "@/components/krea/question-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ANSWER_MAX_LENGTH,
  imagenesAyuda,
  lockedMessage,
} from "@/lib/question";

type QuestionCardAnswerBase = {
  numero: number;
  enunciado: string;
  /** Puntos que vale la pregunta ("4 pts"). */
  valor: number;
  /**
   * Nombre del capitán cuando quien mira no lo es (tarea grupal, D012): la tarjeta muestra
   * "Solo {Nombre} puede responder." con candado y ningún campo.
   */
  bloqueadaPor?: string;
  /** Otro motivo de bloqueo, con su texto (una parte ya aceptada, D422): mismo candado. */
  bloqueo?: string;
  level?: 2 | 3 | 4;
  /** Debajo del campo, dentro de la tarjeta: estado y acción de una parte (D422). */
  children?: ReactNode;
};

type QuestionCardAnswerProps = QuestionCardAnswerBase &
  (
    | {
        formato: "texto";
        value: string;
        onValueChange: (value: string) => void;
      }
    | { formato: "imagen"; upload: ImageUploadProps }
    | {
        /** Pregunta «Varias imágenes» (D373): una zona por imagen y otra para añadir. */
        formato: "imagenes";
        /** Las ya elegidas (subiendo o listas), cada una con su `key` estable. */
        uploads: ReadonlyArray<ImageUploadProps & { key: string }>;
        /** Zona vacía para añadir otra; `null` al llegar al límite. */
        agregar: ImageUploadProps | null;
        limite: number;
      }
  );

/*
 * Tarjeta de pregunta, variante responder — HANDOFF §2.16, §3 "Tareas y entrega". Cuerpo propio,
 * SIN cuerpo común con detalle ni evaluar (§8). Va dentro de un `<ol>`: la raíz es un `<li>`.
 * El campo se nombra con el enunciado (`aria-labelledby`).
 */
export function QuestionCardAnswer(props: QuestionCardAnswerProps) {
  const { numero, enunciado, valor, bloqueadaPor, bloqueo, level, formato } =
    props;
  const titleId = useId();
  const helpId = useId();
  const FormatIcon = formato === "texto" ? Type : ImageIcon;
  return (
    <li className="list-none">
      <Card className="flex flex-col gap-3">
        <QuestionHeader
          numero={numero}
          enunciado={enunciado}
          valor={valor}
          variant="responder"
          level={level}
          titleId={titleId}
        />
        <Badge variant="acc" className="self-start">
          <FormatIcon aria-hidden="true" />
          {formato === "texto"
            ? "Texto"
            : formato === "imagen"
              ? "Imagen"
              : "Imágenes"}
        </Badge>
        {bloqueo || bloqueadaPor ? (
          <p className="text-small-b flex icono-linea gap-2 rounded-nav bg-surface-2 px-3.5 py-3 text-text-2">
            <Lock aria-hidden="true" className="size-4 shrink-0" />
            {bloqueo ?? lockedMessage(bloqueadaPor ?? "")}
          </p>
        ) : props.formato === "texto" ? (
          <Textarea
            aria-labelledby={titleId}
            counter
            autoGrow
            maxLength={ANSWER_MAX_LENGTH}
            placeholder="Escribe tu respuesta aquí"
            value={props.value}
            onChange={(event) => props.onValueChange(event.currentTarget.value)}
          />
        ) : props.formato === "imagen" ? (
          <ImageUpload {...props.upload} />
        ) : (
          // Nombrado por el enunciado; la ayuda dice cuántas lleva y el tope (D373)
          <fieldset
            aria-labelledby={titleId}
            aria-describedby={helpId}
            className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
          >
            <p id={helpId} className="text-small text-text-2">
              {imagenesAyuda(props.uploads.length, props.limite)}
            </p>
            {props.uploads.map(({ key, ...u }) => (
              <ImageUpload key={key} {...u} />
            ))}
            {props.agregar ? <ImageUpload {...props.agregar} /> : null}
          </fieldset>
        )}
        {props.children}
      </Card>
    </li>
  );
}
