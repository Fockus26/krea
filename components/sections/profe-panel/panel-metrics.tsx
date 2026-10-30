import {
  ChevronRight,
  CircleCheck,
  ClipboardList,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { MeterBar } from "@/components/krea/meter-bar";
import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DatosMetricas = {
  porEvaluar: { total: number; detalle: string };
  evaluados: {
    tarea: string;
    n: number;
    total: number;
    pct: number;
    /** "12 de 69 evaluados": lo que lee el lector de pantalla en lugar de "12 / 69". */
    texto: string;
  };
  raspados: { total: number; detalle: string };
};

// Tarjeta enlace entera (HANDOFF §3 Panel §2): un solo `<a>`, sin botones dentro; foco en toda la tarjeta
const TARJETA = cn(
  cardVariants(),
  "flex flex-col gap-2 text-text no-underline",
  "transition-colors duration-fast ease-krea hover:bg-surface-2",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
);

function Detalle({ children }: { children: string }) {
  return (
    <span className="flex items-center gap-2 text-small text-text-2">
      <span className="min-w-0 break-words">{children}</span>
      <ChevronRight aria-hidden="true" className="ml-auto size-4 shrink-0" />
    </span>
  );
}

/**
 * Métricas del Panel: `g3` (1 col < 768, 2 col 768–1023 con la 3.ª en la fila de abajo, 3 col ≥ 1024) de tarjetas
 * enlace. "Raspados" lleva el título en `--error` y TriangleAlert, además del texto (nunca solo color, D003).
 */
export function PanelMetrics({ datos }: { datos: DatosMetricas }) {
  const { porEvaluar, evaluados, raspados } = datos;
  return (
    <section aria-label="Métricas" className="g3">
      <Link href="/profe/evaluar" className={TARJETA}>
        <span className="flex items-center gap-2 text-small-b text-text-2">
          <ClipboardList
            aria-hidden="true"
            className="size-5 shrink-0 text-accent-ink"
          />
          Por evaluar
        </span>
        <span className="text-display text-text">{porEvaluar.total}</span>
        <Detalle>{porEvaluar.detalle}</Detalle>
      </Link>

      <Link href="/profe/alumnos" className={TARJETA}>
        <span className="flex items-center gap-2 text-small-b text-text-2">
          <CircleCheck
            aria-hidden="true"
            className="size-5 shrink-0 text-accent-ink"
          />
          Evaluados · {evaluados.tarea}
        </span>
        <span aria-hidden="true" className="flex items-baseline gap-2">
          <span className="text-display text-text">{evaluados.n}</span>
          <span className="text-h3 nums text-text-2">/ {evaluados.total}</span>
        </span>
        <span className="sr-only">{evaluados.texto}</span>
        <MeterBar pct={evaluados.pct} tone="accent" className="h-2" />
      </Link>

      <Link href="/profe/alumnos" className={TARJETA}>
        <span className="flex items-center gap-2 text-small-b text-error">
          <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
          Raspados
        </span>
        <span className="text-display text-text">{raspados.total}</span>
        <Detalle>{raspados.detalle}</Detalle>
      </Link>
    </section>
  );
}
