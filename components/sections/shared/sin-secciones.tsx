import { School } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/krea/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SECCIONES_HREF } from "@/lib/nav";
import {
  CATALOGO_VACIO_ENLACE,
  CATALOGO_VACIO_TITULO,
  catalogoVacioTexto,
} from "@/lib/secciones";

/**
 * Vacío de una pantalla del profe cuando el catálogo no tiene secciones (D325): el admin va a
 * «Años y secciones» a crearlas; el resto se las pide. El título es `h2` (la página ya tiene su
 * `h1` en el encabezado). PROVISIONAL (CONTENT_CHECKLIST fila 169).
 */
export function SinSecciones({ admin }: { admin: boolean }) {
  return (
    <Card>
      <EmptyState
        icon={School}
        headingLevel={2}
        title={CATALOGO_VACIO_TITULO}
        description={catalogoVacioTexto(admin)}
        action={
          admin ? (
            <Button asChild>
              <Link href={SECCIONES_HREF}>{CATALOGO_VACIO_ENLACE}</Link>
            </Button>
          ) : undefined
        }
      />
    </Card>
  );
}
