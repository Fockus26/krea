import { ArrowRight, ClipboardCheck, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { ColaEnVivo } from "@/components/sections/evaluar/cola-en-vivo";
import { ColaFiltros } from "@/components/sections/evaluar/cola-filtros";
import { PorEvaluarFila } from "@/components/sections/profe-panel/pending-reviews";
import { PageHeader } from "@/components/sections/shared/page-header";
import { BOTON_LARGO, Button } from "@/components/ui/button";
import { Card, CardList } from "@/components/ui/card";
import {
  colaEvaluar,
  evaluadasProfe,
  mapasProfe,
  versionColaProfe,
} from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import {
  type EstadoCola,
  estadoDe,
  filtrarCola,
  filtrosDeParams,
  listaSegunEstado,
  opcionesFiltros,
  pideLaPrimera,
  queryFiltros,
  rutaCola,
  rutaEntrega,
} from "@/lib/evaluar-datos";
import { filaEvaluar, notaFilaEvaluar } from "@/lib/panel-datos";
import { seccionesDe } from "@/lib/secciones";

export const metadata: Metadata = {
  title: "Evaluar",
  robots: { index: false },
};

/**
 * PROVISIONAL (CONTENT_CHECKLIST fila 197; «Evaluadas» y «Todas»: fila 245): el conteo de la
 * lista filtrada según el estado (D439).
 */
const conteoTexto = (estado: EstadoCola, n: number) => {
  if (estado === "evaluadas")
    return n === 1 ? "1 entrega evaluada" : `${n} entregas evaluadas`;
  if (estado === "todas") return n === 1 ? "1 entrega" : `${n} entregas`;
  return n === 1 ? "1 entrega por evaluar" : `${n} entregas por evaluar`;
};

/** PROVISIONAL (CONTENT_CHECKLIST fila 245): la lista del estado elegido está vacía. */
const VACIO_ESTADO: Record<EstadoCola, { titulo: string; texto: string }> = {
  "por-evaluar": {
    titulo: "No hay entregas por evaluar",
    texto:
      "Cuando tus estudiantes entreguen una tarea, aparecerá aquí para evaluarla.",
  },
  evaluadas: {
    titulo: "Todavía no hay entregas evaluadas",
    texto:
      "Cuando evalúes una entrega, aparecerá aquí para verla o corregir la nota.",
  },
  todas: {
    titulo: "Todavía no hay entregas",
    texto: "Cuando tus estudiantes entreguen una tarea, aparecerá aquí.",
  },
};

// La cola de Evaluar (D148, D204: la más antigua primero), filtrable por la URL (D384): estado
// (por evaluar, evaluadas o todas, D439), tipo, sección, tarea y alumno. «Evaluar la primera» y
// cada fila abren la entrega con los mismos filtros, así que Anterior, Saltar y Guardar siguen
// esta lista y no la global (D385). `ColaEnVivo` la vuelve a pedir cuando otro profe evalúa o un
// alumno entrega (D441). `?ir=primera` («Cambiar» en una entrega, D442) salta a la primera.
export default async function EvaluarColaPage({
  searchParams,
}: PageProps<"/profe/evaluar">) {
  const params = await searchParams;
  const filtros = filtrosDeParams(params);
  const estado = estadoDe(filtros);
  const [cola, evaluadas, mapas, catalogo, version] = await Promise.all([
    colaEvaluar(),
    evaluadasProfe(),
    mapasProfe(),
    catalogoSecciones(),
    versionColaProfe(),
  ]);
  const lista = listaSegunEstado(estado, cola, evaluadas);
  const filtrada = filtrarCola(lista, filtros);
  const primera = filtrada[0];
  if (pideLaPrimera(params) && primera)
    redirect(rutaEntrega(primera.id, filtros));
  const query = queryFiltros(filtros);
  const opciones = opcionesFiltros(lista, filtros, mapas);
  const hayEntregas = cola.length + evaluadas.length > 0;
  const vacio = VACIO_ESTADO[estado];

  return (
    <>
      <ColaEnVivo version={version} />
      <PageHeader
        title="Evaluar"
        description={
          hayEntregas ? (
            <span aria-live="polite">
              {conteoTexto(estado, filtrada.length)}
            </span>
          ) : undefined
        }
        actions={
          primera && primera.estado === "entregada" ? (
            <Button asChild className={BOTON_LARGO}>
              <Link href={rutaEntrega(primera.id, filtros)}>
                Evaluar la primera
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : null
        }
      />
      {!hayEntregas ? (
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
            {lista.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                headingLevel={2}
                title={vacio.titulo}
                description={vacio.texto}
              />
            ) : filtrada.length === 0 ? (
              <EmptyState
                icon={SearchX}
                headingLevel={2}
                // PROVISIONAL (CONTENT_CHECKLIST fila 197)
                title="No hay entregas con esos filtros"
                description="Prueba con otra sección, tarea o alumno, o quita los filtros para ver toda la cola."
                action={
                  <Button asChild variant="secondary" size="sm">
                    {/* Quita los filtros, no el estado elegido */}
                    <Link href={rutaCola({ estado: filtros.estado })}>
                      Quitar filtros
                    </Link>
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
                    evaluada={
                      e.estado === "evaluada"
                        ? { nota: notaFilaEvaluar(e, mapas) }
                        : undefined
                    }
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
