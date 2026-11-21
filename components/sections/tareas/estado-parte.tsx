import { Check, Clock, Hand, Inbox, Undo2, UserRound } from "lucide-react";
import type * as React from "react";
import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { EstadoParteId } from "@/lib/modelo";
import { ESTADO_PARTE_TEXTO, SIN_ASIGNAR_TEXTO } from "@/lib/partes";

const ESTADOS: Record<
  EstadoParteId | "sin-asignar",
  { variant: BadgeVariant; icon: React.ElementType; label: string }
> = {
  "sin-asignar": {
    variant: "neutral",
    icon: UserRound,
    label: SIN_ASIGNAR_TEXTO,
  },
  asignada: {
    variant: "neutral",
    icon: Clock,
    label: ESTADO_PARTE_TEXTO.asignada,
  },
  entregada: {
    variant: "acc",
    icon: Inbox,
    label: ESTADO_PARTE_TEXTO.entregada,
  },
  aceptada: { variant: "ok", icon: Check, label: ESTADO_PARTE_TEXTO.aceptada },
  devuelta: {
    variant: "warn",
    icon: Undo2,
    label: ESTADO_PARTE_TEXTO.devuelta,
  },
  // «La respondo yo» (D461): como sin asignar, pero con otra palabra e ícono
  tomada: {
    variant: "neutral",
    icon: Hand,
    label: ESTADO_PARTE_TEXTO.tomada,
  },
};

/**
 * Estado de una parte (D417) como chip: siempre ícono + palabra, nunca solo color (como
 * `StatusBadge`). `null` = sin asignar (la responde el capitán).
 */
export function EstadoParte({
  estado,
  className,
}: {
  estado: EstadoParteId | null;
  className?: string;
}) {
  const { variant, icon: Icon, label } = ESTADOS[estado ?? "sin-asignar"];
  return (
    <Badge variant={variant} className={className}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}

/** Lo que entregó un integrante, ya firmado: texto o imagen(es) con su `alt` (como el detalle). */
export function RespuestaParteVista({
  respuesta,
}: {
  respuesta: QuestionAnswer;
}) {
  if (respuesta.tipo === "texto") {
    return (
      <p className="rounded-nav bg-surface-2 px-3.5 py-3 text-callout text-text whitespace-pre-wrap break-words">
        {respuesta.texto}
      </p>
    );
  }
  const imagenes =
    respuesta.tipo === "imagen" ? [respuesta] : respuesta.imagenes;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {imagenes.map((img) => (
        <li key={img.src} className="max-w-full">
          {/* biome-ignore lint/performance/noImgElement: URL firmada de B2 (D046) */}
          <img
            src={img.src}
            alt={img.alt}
            className="aspect-4/3 w-55 max-w-full rounded-nav bg-surface-2 object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
