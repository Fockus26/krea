import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Encabezado de pantalla (HANDOFF §3): eyebrow, el único `<h1>` de la página, ayuda opcional y,
 * a la derecha, acciones o segmentados que envuelven debajo cuando no caben. Gap 8.
 * `adornment` va pegado al título (p. ej. el chip "En vivo" del ranking).
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  adornment,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  adornment?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow ? <p className="text-eyebrow text-text-2">{eyebrow}</p> : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-h1 text-text">{title}</h1>
          {adornment}
        </div>
        {description ? (
          <p className="text-body text-text-2">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
