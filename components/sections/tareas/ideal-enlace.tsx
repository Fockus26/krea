import { Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VER_IDEAL_AYUDA, VER_IDEAL_TEXTO } from "@/lib/ideal";

/**
 * Enlace a la entrega ideal en la tarea del alumno (tanda 11-14 Z2, D433): solo con la tarea ya
 * cerrada y una ideal vigente (lo decide la página en el servidor).
 */
export function IdealEnlace({ href }: { href: string }) {
  return (
    <Card variant="flat" className="flex flex-wrap items-center gap-3">
      <Star aria-hidden="true" className="size-5 shrink-0 text-accent-ink" />
      <p className="min-w-0 flex-1 text-callout text-text">{VER_IDEAL_AYUDA}</p>
      <Button asChild variant="secondary" size="sm">
        <Link href={href}>{VER_IDEAL_TEXTO}</Link>
      </Button>
    </Card>
  );
}
