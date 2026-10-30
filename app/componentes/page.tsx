import type { Metadata } from "next";
import { Botones } from "./_familias/botones";
import { Chips } from "./_familias/chips";
import { Contenedores } from "./_familias/contenedores";
import { Escenario } from "./_familias/escenario";
import { Evaluacion } from "./_familias/evaluacion";
import { Formularios } from "./_familias/formularios";
import { Identidad } from "./_familias/identidad";
import { Navegacion } from "./_familias/navegacion";
import { Overlays } from "./_familias/overlays";
import { Preguntas } from "./_familias/preguntas";
import { Ranking } from "./_familias/ranking";

// Página de referencia interna de los componentes (fase 03). No se indexa.
// Cada familia vive en su archivo de _familias/: las olas 2 y 3 solo editan el suyo.
export const metadata: Metadata = {
  title: "Componentes", // la plantilla del layout añade " · KREA"
  robots: { index: false, follow: false },
};

// Orden de la lámina design/canvas/Componentes.dc.html
const FAMILIES = [
  ["botones", "Botones"],
  ["formularios", "Campos de formulario"],
  ["chips", "Píldora de nota, chips y pestañas"],
  ["ranking", "Ranking y podio"],
  ["evaluacion", "Evaluación y puntaje"],
  ["identidad", "Avatares y logos"],
  ["contenedores", "Tarjetas, avisos y carga"],
  ["overlays", "Diálogos, hojas y menús"],
  ["preguntas", "Preguntas"],
  ["navegacion", "Navegación"],
] as const;

export default function ComponentesPage() {
  return (
    <main
      id="contenido"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8"
    >
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow text-text-2">Referencia interna</p>
        <h1 className="text-h1">Componentes de KREA</h1>
        <p className="text-body text-text-2">
          Todas las familias de HANDOFF §2 con sus estados. Elige tema y acento
          para verlas en las 8 combinaciones.
        </p>
      </header>

      <nav aria-label="Familias">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {FAMILIES.map(([id, title]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="text-label text-accent-ink underline underline-offset-4"
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Escenario>
        <Botones />
        <Formularios />
        <Chips />
        <Ranking />
        <Evaluacion />
        <Identidad />
        <Contenedores />
        <Overlays />
        <Preguntas />
        <Navegacion />
      </Escenario>
    </main>
  );
}
