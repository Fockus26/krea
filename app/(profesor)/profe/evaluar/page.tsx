import { ArrowRight, ClipboardCheck, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/krea/empty-state";
import { ColaFiltros } from "@/components/sections/evaluar/cola-filtros";
import { PorEvaluarFila } from "@/components/sections/profe-panel/pending-reviews";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardList } from "@/components/ui/card";
import { colaEvaluar, mapasProfe } from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import {
  filtrarCola,
  filtrosDeParams,
  opcionesFiltros,
  queryFiltros,
  rutaCola,
  rutaEntrega,
} from "@/lib/evaluar-datos";
import { filaEvaluar } from "@/lib/panel-datos";
import { seccionesDe } from "@/lib/secciones";

export const metadata: Metadata = {
  title: "Evaluar",
  robots: { index: false },
};

/** PROVISIONAL (CONTENT_CHECKLIST fila 197) */
const conteoTexto = (n: number) =>
  n === 1 ? "1 entrega por evaluar" : `${n} entregas por evaluar`;

// La cola de Evaluar (D148, D204: la más antigua primero), filtrable por la URL (D384): tipo,
// sección, tarea y alumno. «Evaluar la primera» y cada fila abren la entrega con los mismos
// filtros, así que Anterior, Saltar y Guardar siguen esta cola y no la global (D385).
export default async function EvaluarColaPage({
  searchParams,
}: PageProps<"/profe/evaluar">) {
  const filtros = filtrosDeParams(await searchParams);
  const [cola, mapas, catalogo] = await Promise.all([
    colaEvaluar(),
    mapasProfe(),
    catalogoSecciones(),
  ]);
  const filtrada = filtrarCola(cola, filtros);
  const query = queryFiltros(filtros);
  const primera = filtrada[0];
  const opciones = opcionesFiltros(cola, filtros, mapas);

  return (
    <>
      <PageHeader
        title="Evaluar"
        description={
          cola.length > 0 ? (
            <span aria-live="polite">{conteoTexto(filtrada.length)}</span>
          ) : undefined
        }
        actions={
          primera ? (
            <Button asChild>
              <Link href={rutaEntrega(primera.id, filtros)}>
                Evaluar la primera
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : null
        }
      />
      {cola.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            headingLevel={2}
            title="No hay entregas por evaluar"
            description="Cuando tus estudiantes entreguen una tarea, aparecerá aquí para evaluarla."
          />
        </Card>
      ) : (
        <>
          <Card>
            <ColaFiltros
              filtros={filtros}
              secciones={seccionesDe(catalogo)}
              tareas={opciones.tareas}
              alumnos={opciones.alumnos}
            />
          </Card>
          <Card>
            {filtrada.length === 0 ? (
              <EmptyState
                icon={SearchX}
                headingLevel={2}
                // PROVISIONAL (CONTENT_CHECKLIST fila 197)
                title="No hay entregas con esos filtros"
                description="Prueba con otra sección, tarea o alumno, o quita los filtros para ver toda la cola."
                action={
                  <Button asChild variant="secondary" size="sm">
                    <Link href={rutaCola()}>Quitar filtros</Link>
                  </Button>
                }
              />
            ) : (
              <CardList>
                {filtrada.map((e) => (
                  <PorEvaluarFila
                    key={e.id}
                    fila={filaEvaluar(e, mapas)}
                    query={query}
                  />
                ))}
              </CardList>
            )}
          </Card>
        </>
      )}
    </>
  );
}
