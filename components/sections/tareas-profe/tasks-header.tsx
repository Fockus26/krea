import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { VistaToggle } from "@/components/sections/shared/vista-toggle";
import { Button } from "@/components/ui/button";
import { CLAVE_VISTA_TAREAS } from "@/lib/vista";

/**
 * Encabezado de Tareas del profesor (HANDOFF §3; lienzo TareasProfe): eyebrow, `<h1>`, el
 * interruptor Tarjetas / Lista (D313) y "Nueva tarea"; envuelven si no caben.
 */
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
        <>
          <VistaToggle clave={CLAVE_VISTA_TAREAS} />
          <Button asChild>
            <Link href={nuevaHref}>
              <Plus aria-hidden="true" />
              Nueva tarea
            </Link>
          </Button>
        </>
      }
    />
  );
}
