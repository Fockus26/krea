import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Barra de estados de una vista previa (D066): una ruta estática por estado (`<base>/<estado>`) para ver cada variante de la
 * pantalla sin backend. Es andamiaje de /secciones, no parte de la sección.
 */
export function Estados({
  base,
  actual,
  estados,
}: {
  base: string;
  actual: string;
  estados: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <nav
      aria-label="Estados de la vista previa"
      className="border-b border-divider bg-surface-2 px-4 py-2"
    >
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {estados.map(([clave, texto]) => (
          <li key={clave}>
            <Link
              href={`${base}/${clave}`}
              aria-current={clave === actual ? "page" : undefined}
              className={cn(
                "text-small-b rounded-sm text-accent-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                "aria-[current=page]:text-text aria-[current=page]:underline",
              )}
            >
              {texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
