import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/**
 * Migas de las pantallas de detalle en escritorio ("‹ Mis notas", "‹ Tareas", HANDOFF §3). En móvil el volver vive
 * en la topbar, así que aquí solo aparece ≥ 1024.
 */
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <nav aria-label="Ruta" className="hidden lg:block">
      <Link
        href={href}
        className="text-small-b inline-flex icono-linea gap-1 rounded-sm text-accent-ink no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
        {children}
      </Link>
    </nav>
  );
}
