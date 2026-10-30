import { Image as ImageIcon, Lock, Type } from "lucide-react";
import { useId } from "react";
import {
  ImageUpload,
  type ImageUploadProps,
} from "@/components/krea/image-upload";
import { QuestionHeader } from "@/components/krea/question-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ANSWER_MAX_LENGTH, lockedMessage } from "@/lib/question";

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
  level?: 2 | 3 | 4;
};

type QuestionCardAnswerProps = QuestionCardAnswerBase &
  (
    | {
        formato: "texto";
        value: string;
        onValueChange: (value: string) => void;
      }
    | { formato: "imagen"; upload: ImageUploadProps }
  );

/*
 * Tarjeta de pregunta, variante responder — HANDOFF §2.16, §3 "Tareas y entrega". Cuerpo propio,
 * SIN cuerpo común con detalle ni evaluar (§8). Va dentro de un `<ol>`: la raíz es un `<li>`.
 * El campo se nombra con el enunciado (`aria-labelledby`).
 */
export function QuestionCardAnswer(props: QuestionCardAnswerProps) {
  const { numero, enunciado, valor, bloqueadaPor, level, formato } = props;
  const titleId = useId();
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
          {formato === "texto" ? "Texto" : "Imagen"}
        </Badge>
        {bloqueadaPor ? (
          <p className="text-small-b flex items-center gap-2 rounded-nav bg-surface-2 px-3.5 py-3 text-text-2">
            <Lock aria-hidden="true" className="size-4 shrink-0" />
            {lockedMessage(bloqueadaPor)}
          </p>
        ) : props.formato === "texto" ? (
          <Textarea
            aria-labelledby={titleId}
            counter
            maxLength={ANSWER_MAX_LENGTH}
            placeholder="Escribe tu respuesta aquí"
            value={props.value}
            onChange={(event) => props.onValueChange(event.currentTarget.value)}
          />
        ) : (
          <ImageUpload {...props.upload} />
        )}
      </Card>
    </li>
  );
}
