import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Button } from "@/components/ui/button";

/** Encabezado de Tareas del profesor (HANDOFF §3; lienzo TareasProfe): eyebrow, `<h1>` y "Nueva tarea". */
export function TasksHeader({
  eyebrow,
  nuevaHref,
}: {
  /** "5 tareas · 5A y 5C" (`eyebrowTareas`). */
  eyebrow: string;
  nuevaHref: string;
}) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title="Tareas"
      actions={
        <Button asChild>
          <Link href={nuevaHref}>
            <Plus aria-hidden="true" />
            Nueva tarea
          </Link>
        </Button>
      }
    />
  );
}
