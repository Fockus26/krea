import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * EmptyState — HANDOFF §2.14 "Vacío"; medidas en design/canvas/krea.css:369-370.
 * El nivel del título lo elige el llamador para no romper la jerarquía de la página.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  headingLevel = 3,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** Normalmente un `Button`. */
  action?: React.ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-2 px-4 py-8 text-center",
        className,
      )}
      {...props}
    >
      <div className="mb-2 grid size-18 place-items-center rounded-lg bg-accent-soft text-accent-ink">
        <Icon aria-hidden="true" className="size-8" />
      </div>
      <Heading className="text-h4 text-text">{title}</Heading>
      {description ? (
        <p className="max-w-sm text-small text-text-2">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
