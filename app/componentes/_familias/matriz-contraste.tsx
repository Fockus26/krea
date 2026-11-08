"use client";

import { Check, LogOut, Trash2, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { GradePill } from "@/components/krea/grade-pill";
import { Button } from "@/components/ui/button";
import { contrasteSobrePila, formatRazon, pasaAA } from "@/lib/contraste-color";
import { Familia } from "./familia";

/*
 * Matriz de contraste (D331): botones y escala de píldoras en los 4 acentos × claro/oscuro a la
 * vez. Cada celda es un contenedor con `data-theme` + `data-accent` (D016, D026; siempre
 * `data-theme` explícito, ver escenario.tsx). El contraste se mide en vivo con `getComputedStyle`
 * del texto y de la pila de fondos hasta la celda, así que muestra los tokens tal como están.
 */
const ACENTOS = [
  ["azul", "Azul"],
  ["rojo", "Rojo"],
  ["verde", "Verde"],
  ["morado", "Morado"],
] as const;

const TEMAS = [
  ["light", "Claro"],
  ["dark", "Oscuro"],
] as const;

const BOTONES = [
  { variant: "primary", titulo: "Primario", etiqueta: "Entrar" },
  { variant: "secondary", titulo: "Secundario", etiqueta: "Ver equipo" },
  { variant: "ghost", titulo: "Fantasma", etiqueta: "Ver todas" },
  {
    variant: "ghost-danger",
    titulo: "Fantasma de peligro",
    etiqueta: "Eliminar",
    icono: "eliminar",
  },
  {
    variant: "danger",
    titulo: "Peligro",
    etiqueta: "Cerrar sesión",
    icono: "salir",
  },
] as const;

const NOTAS: readonly (number | null)[] = [
  1,
  5,
  9.5,
  10,
  12,
  14,
  16,
  18,
  20,
  null,
];

type Medida = { razon: number } | "ilegible" | null;

/** Contraste del texto de `el` contra los fondos de sus ancestros hasta la celda. */
function medir(el: Element, celda: Element): Medida {
  const texto = getComputedStyle(el).color;
  const fondos: string[] = [];
  for (let n: Element | null = el; n; n = n.parentElement) {
    fondos.push(getComputedStyle(n).backgroundColor);
    if (n === celda) break;
  }
  const razon = contrasteSobrePila(texto, fondos);
  return razon === null ? "ilegible" : { razon };
}

function Resultado({ medida }: { medida: Medida }) {
  if (medida === null)
    return (
      <span className="text-small text-text-2" aria-hidden="true">
        …
      </span>
    );
  if (medida === "ilegible")
    return <span className="text-small text-text-2">Sin medir</span>;
  const ok = pasaAA(medida.razon);
  return (
    <span className="text-small-b inline-flex items-center gap-1 whitespace-nowrap text-text">
      {ok ? (
        <Check aria-hidden="true" className="size-4 shrink-0" />
      ) : (
        <X aria-hidden="true" className="size-4 shrink-0" />
      )}
      {formatRazon(medida.razon)} · {ok ? "AA" : "No AA"}
    </span>
  );
}

/** Una muestra con su medida; mide el elemento que lleva `data-medir` dentro de `children`. */
function Fila({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState<Medida>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const objetivo = raiz.querySelector(
      "[data-medir], [data-slot='grade-pill']",
    );
    const celda = raiz.closest("[data-matriz-celda]");
    if (objetivo && celda) setMedida(medir(objetivo, celda));
  }, []);

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <div ref={ref} className="flex min-w-0 flex-col items-start gap-1">
        <span className="text-small text-text-2">{etiqueta}</span>
        {children}
      </div>
      <Resultado medida={medida} />
    </li>
  );
}

function Celda({
  tema,
  acento,
  nombreTema,
  nombreAcento,
}: {
  tema: (typeof TEMAS)[number][0];
  acento: (typeof ACENTOS)[number][0];
  nombreTema: string;
  nombreAcento: string;
}) {
  const titulo = `${nombreAcento} · ${nombreTema}`;
  const id = `matriz-${acento}-${tema}`;
  return (
    <section
      aria-labelledby={id}
      data-matriz-celda=""
      data-theme={tema}
      data-accent={acento}
      className="flex min-w-0 flex-col gap-4 rounded-lg border border-divider bg-bg p-4 text-text"
    >
      <h3 id={id} className="text-h4">
        {titulo}
      </h3>

      <div className="flex flex-col gap-2">
        <h4 className="text-label">Botones</h4>
        <ul className="flex flex-col gap-2">
          {BOTONES.map((b) => {
            const contenido = (
              <>
                {"icono" in b ? (
                  b.icono === "salir" ? (
                    <LogOut aria-hidden="true" />
                  ) : (
                    <Trash2 aria-hidden="true" />
                  )
                ) : null}
                {b.etiqueta}
              </>
            );
            return (
              <Fragment key={b.variant}>
                <Fila etiqueta={`${b.titulo} · reposo`}>
                  <Button variant={b.variant} size="sm" data-medir="">
                    {contenido}
                  </Button>
                </Fila>
                <Fila etiqueta={`${b.titulo} · deshabilitado`}>
                  <Button variant={b.variant} size="sm" disabled data-medir="">
                    {contenido}
                  </Button>
                </Fila>
              </Fragment>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-label">Notas (de rojo a verde)</h4>
        <ul className="flex flex-col gap-2">
          {NOTAS.map((n) => (
            <Fila
              key={n ?? "pendiente"}
              etiqueta={n === null ? "Pendiente" : `Nota ${n}`}
            >
              <GradePill nota={n} size="md" />
            </Fila>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function MatrizContraste() {
  return (
    <Familia
      id="matriz-contraste"
      title="Matriz de contraste"
      description="Botones y escala de notas en los 4 acentos, en claro y oscuro, a la vez. Cada muestra lleva su contraste medido en vivo (texto contra el fondo que ve). AA = 4,5:1; los botones deshabilitados están exentos de WCAG, pero se miden igual."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ACENTOS.flatMap(([acento, nombreAcento]) =>
          TEMAS.map(([tema, nombreTema]) => (
            <Celda
              key={`${acento}-${tema}`}
              tema={tema}
              acento={acento}
              nombreTema={nombreTema}
              nombreAcento={nombreAcento}
            />
          )),
        )}
      </div>
    </Familia>
  );
}
