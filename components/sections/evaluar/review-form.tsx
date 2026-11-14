"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ErrorGuardarNota } from "@/components/estados/errores";
import { LiveTotal } from "@/components/krea/live-total";
import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import { QuestionCardReview } from "@/components/krea/question-card-review";
import { ScorePicker } from "@/components/krea/score-picker";
import { ActionBar } from "@/components/sections/shared/action-bar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  activaTexto,
  conIndice,
  DESHACER_MS,
  esAtajoGuardar,
  estaCompleta,
  faltanCortoTexto,
  normalizarPuntajes,
  notaGuardada,
  notaGuardadaTexto,
  preguntaAncla,
  type SiguienteEntrega,
  sigueCortoTexto,
} from "@/lib/evaluar";
import {
  type DeshacerEvaluacion,
  errorEvaluarTexto,
  type GuardarEvaluacion,
  type ResultadoEvaluar,
} from "@/lib/evaluar-datos";
import { ReviewIndex } from "./review-index";
import { ReviewMembers } from "./review-members";

export type ReviewQuestion = {
  id: string;
  enunciado: string;
  valor: number;
  respuesta: QuestionAnswer;
};

type Estado = {
  puntajes: (number | null)[];
  comentarios: string[];
  /** Grupal: cédulas marcadas «No participó» (D364). */
  noParticiparon: string[];
};

/** Server Actions de Evaluar (W7); sin ellas (vista previa de /secciones) nada se guarda. */
export type AccionesEvaluar = {
  guardar: (e: GuardarEvaluacion) => Promise<ResultadoEvaluar>;
  deshacer: (e: DeshacerEvaluacion) => Promise<ResultadoEvaluar>;
};

/*
 * Evaluaciones deshechas desde el toast, por entrega: "Deshacer" vuelve a la entrega con sus
 * puntajes y comentarios (D105). Vive en el módulo, así sobrevive a la navegación del cliente.
 * Con `acciones`, antes devuelve en Firestore la evaluación anterior (D205).
 */
const deshechas = new Map<string, Estado>();
/** Tras guardar o deshacer, la entrega que se monta sube el scroll y lleva el foco a su `<h1>`. */
let enfocarAlMontar = false;

/**
 * Formulario de Evaluar entrega (HANDOFF §3; lienzo Evaluar.dc.html; D104–D105).
 * < 1024: `LiveTotal` barra sticky a 64 bajo la topbar, índice 1…n desde 6 preguntas, `<ol>`
 * de preguntas y `ActionBar` sobre la barra inferior. ≥ 1024: `g-side` con las preguntas y, en
 * la columna de 360 sticky a 24, la tarjeta Total en vivo, el índice, "Guardar nota y seguir"
 * y los atajos. Cada pregunta: `QuestionCardReview` con `ScorePicker` nombrado por su
 * enunciado (`titleId` = `labelledBy`). Guardar se activa con todas puntuadas (botón
 * deshabilitado con su motivo en `aria-describedby`); Ctrl/Cmd + Enter guarda desde cualquier
 * parte de la página (no dentro de un diálogo; Enter solo, nunca). Al guardar: toast
 * "Nota guardada · 18,5" con "Deshacer" (5 s) y la siguiente entrega, con el scroll arriba.
 */
export function ReviewForm({
  entregaId,
  tituloId,
  tipo,
  preguntas,
  inicial,
  version = null,
  base,
  siguiente,
  guardarHref,
  actualHref,
  acciones,
  titular,
  integrantes = [],
}: {
  /** Clave de la entrega (para deshacer). */
  entregaId: string;
  /** `id` del `<h1>` de la cabecera: recibe el foco al llegar desde Guardar/Deshacer. */
  tituloId: string;
  tipo: "individual" | "grupal";
  preguntas: readonly ReviewQuestion[];
  inicial: {
    /**
     * `enviadaEn` de la entrega en pantalla (D397). Va con Guardar: si el alumno la editó
     * mientras tanto, el servidor responde `editada` y no se guarda. Sin él (galería), no se mira.
     */
    enviadaEn?: number | null;
    puntajes: readonly (number | null)[];
    comentarios: readonly string[];
    /** Grupal: marcados «No participó» en la evaluación vigente (D364). */
    noParticiparon?: readonly string[];
  };
  /**
   * `evaluadaEn` de la evaluación vigente al abrir (`null` = Pendiente). Va con Guardar: si otro
   * la cambió mientras tanto, el servidor responde `cambio` y no se pisa (D224).
   */
  version?: number | null;
  /** Base con la que sale la nota (grupal: 20, D014). */
  base: number;
  siguiente: SiguienteEntrega;
  /** A dónde va "Guardar" (la siguiente entrega, o la lista al acabar la cola). */
  guardarHref: string;
  /** Esta entrega: a dónde vuelve "Deshacer". */
  actualHref: string;
  /** Guardar y deshacer en Firestore (W7). */
  acciones?: AccionesEvaluar;
  /** Alumno o equipo de la entrega (título del error al guardar, D171). */
  titular?: string;
  /** Grupal: integrantes de la entrega para marcar «No participó» (D366); vacío = sin bloque. */
  integrantes?: ReadonlyArray<{ cedula: string; nombre: string }>;
}) {
  const router = useRouter();
  const [falloRed, setFalloRed] = React.useState(false);
  const [estado, setEstado] = React.useState<Estado>(() => {
    const previo = deshechas.get(entregaId);
    deshechas.delete(entregaId);
    return (
      previo ?? {
        puntajes: [...inicial.puntajes],
        comentarios: [...inicial.comentarios],
        noParticiparon: [...(inicial.noParticiparon ?? [])],
      }
    );
  });
  // Pregunta con el foco (para el chip "actual" del índice)
  const [actual, setActual] = React.useState<number | null>(null);
  // Un guardado a la vez (doble clic o Ctrl+Enter repetido)
  const guardando = React.useRef(false);
  const motivoId = React.useId();
  const motivoMovilId = React.useId();

  const { puntajes, comentarios, noParticiparon } = estado;
  const conIntegrantes = tipo === "grupal" && integrantes.length > 0;
  const completo = estaCompleta(puntajes);
  const faltan = puntajes.filter((p) => p === null).length;
  const indice = conIndice(preguntas.length);
  const ayuda =
    tipo === "grupal"
      ? "El equipo lo verá debajo de su respuesta."
      : "El estudiante lo verá debajo de su respuesta.";

  React.useEffect(() => {
    if (!enfocarAlMontar) return;
    enfocarAlMontar = false;
    window.scrollTo({ top: 0 });
    document.getElementById(tituloId)?.focus({ preventScroll: true });
  }, [tituloId]);

  const guardar = async () => {
    if (!completo || guardando.current) return;
    const valores = preguntas.map((p) => p.valor);
    const finales = normalizarPuntajes(puntajes, valores);
    const guardado: Estado = {
      puntajes: finales,
      comentarios,
      noParticiparon,
    };
    let evaluadaEn: number | null = null;
    if (acciones) {
      guardando.current = true;
      const r = await acciones
        .guardar({
          entregaId,
          puntos: Object.fromEntries(
            preguntas.map((p, i) => [p.id, finales[i] ?? 0]),
          ),
          comentarios: Object.fromEntries(
            preguntas.map((p, i) => [p.id, comentarios[i] ?? ""]),
          ),
          version,
          ...(conIntegrantes ? { noParticiparon } : {}),
          ...(inicial.enviadaEn !== undefined
            ? { enviadaEn: inicial.enviadaEn }
            : {}),
        })
        .catch((): ResultadoEvaluar => ({ ok: false, error: "red" }));
      guardando.current = false;
      if (!r.ok) {
        // Sin red: el error en pantalla con «Reintentar guardar» (D171); lo demás, el toast
        if (r.error === "red") setFalloRed(true);
        else toast.error(errorEvaluarTexto(r.error));
        return;
      }
      setFalloRed(false);
      evaluadaEn = r.evaluadaEn;
    }
    toast.success(notaGuardadaTexto(notaGuardada(finales, base)), {
      duration: DESHACER_MS,
      action: {
        // Copy del handoff (§3)
        label: "Deshacer",
        onClick: async () => {
          if (acciones && evaluadaEn !== null) {
            const d = await acciones
              .deshacer({ entregaId, evaluadaEn })
              .catch((): ResultadoEvaluar => ({ ok: false, error: "red" }));
            if (!d.ok) {
              toast.error(errorEvaluarTexto(d.error));
              return;
            }
          }
          deshechas.set(entregaId, guardado);
          enfocarAlMontar = true;
          router.push(actualHref, { scroll: false });
        },
      },
    });
    enfocarAlMontar = true;
    router.push(guardarHref, { scroll: false });
  };

  // El atajo siempre llama al `guardar` del último render
  const guardarRef = React.useRef(guardar);
  guardarRef.current = guardar;
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !esAtajoGuardar(e)) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[role='dialog'], [role='alertdialog']")) return;
      e.preventDefault();
      void guardarRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const setPuntaje = (i: number, v: number) =>
    setEstado((s) => ({
      ...s,
      puntajes: s.puntajes.map((p, j) => (j === i ? v : p)),
    }));
  const setComentario = (i: number, v: string) =>
    setEstado((s) => ({
      ...s,
      comentarios: s.comentarios.map((c, j) => (j === i ? v : c)),
    }));
  const setNoParticipo = (cedula: string, marcado: boolean) =>
    setEstado((s) => ({
      ...s,
      noParticiparon: marcado
        ? [...s.noParticiparon.filter((c) => c !== cedula), cedula]
        : s.noParticiparon.filter((c) => c !== cedula),
    }));

  return (
    <div data-slot="review-form" className="page-stack">
      {/* < 1024: medidor sticky a 64 bajo la topbar (`.sticky-top` del lienzo) */}
      <LiveTotal
        scores={puntajes}
        base={base}
        variant="bar"
        className="sticky top-16 z-sticky bajo:static lg:hidden"
      />
      {indice ? (
        <ReviewIndex scores={puntajes} actual={actual} className="lg:hidden" />
      ) : null}

      <div className="g-side">
        <div className="flex min-w-0 flex-col gap-6">
          <ol
            className="flex flex-col gap-6"
            onFocus={(e) => {
              const li = (e.target as HTMLElement).closest("li");
              const i = li
                ? Array.prototype.indexOf.call(e.currentTarget.children, li)
                : -1;
              if (i >= 0) setActual(i);
            }}
          >
            {preguntas.map((p, i) => {
              const numero = i + 1;
              const titleId = preguntaAncla(numero);
              const puntaje = puntajes[i] ?? null;
              return (
                <QuestionCardReview
                  key={p.id}
                  numero={numero}
                  enunciado={p.enunciado}
                  valor={p.valor}
                  respuesta={p.respuesta}
                  titleId={titleId}
                  level={2}
                  comentario={comentarios[i] ?? ""}
                  onComentarioChange={(v) => setComentario(i, v)}
                  comentarioAyuda={ayuda}
                  score={
                    <div className="flex flex-col gap-2">
                      {/* Copy del lienzo: "Puntaje · sin puntuar" (el estado también en texto) */}
                      <p className="text-small-b text-text">
                        Puntaje
                        {puntaje === null ? (
                          <span className="font-normal text-text-2">
                            {" "}
                            · sin puntuar
                          </span>
                        ) : null}
                      </p>
                      <ScorePicker
                        value={puntaje}
                        onChange={(v) => setPuntaje(i, v)}
                        max={p.valor}
                        labelledBy={titleId}
                      />
                    </div>
                  }
                />
              );
            })}
          </ol>
          {conIntegrantes ? (
            <ReviewMembers
              integrantes={integrantes}
              marcados={noParticiparon}
              onCambio={setNoParticipo}
            />
          ) : null}
        </div>

        {/* ≥ 1024: columna de 360 sticky a 24 (en móvil, la barra y la ActionBar) */}
        <div className="sticky top-6 flex flex-col gap-6 max-lg:hidden">
          <LiveTotal
            scores={puntajes}
            base={base}
            variant="card"
            headingLevel={2}
          />
          {indice ? <ReviewIndex scores={puntajes} actual={actual} /> : null}
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="lg"
              block
              disabled={!completo}
              aria-describedby={motivoId}
              onClick={guardar}
            >
              <Check aria-hidden="true" />
              Guardar nota y seguir
            </Button>
            <p id={motivoId} className="text-center text-small text-text-2">
              {activaTexto(preguntas.length, completo, siguiente)}
            </p>
          </div>
          {/* Copy del lienzo */}
          <p className="text-small text-text-2">
            Atajos: <kbd>0</kbd>–<kbd>9</kbd> y <kbd>,</kbd> eligen el puntaje
            de la pregunta con foco · <kbd>Ctrl</kbd> + <kbd>Enter</kbd> guarda.
          </p>
        </div>
      </div>

      {falloRed ? (
        <ErrorGuardarNota
          equipo={titular ?? "esta entrega"}
          onReintentar={() => void guardar()}
          onCopiar={() => {
            const texto = preguntas
              .map((_p, i) => {
                const c = comentarios[i]?.trim();
                return c ? `Pregunta ${i + 1}: ${c}` : null;
              })
              .filter(Boolean)
              .join("\n");
            navigator.clipboard.writeText(texto).then(
              () => toast("Comentarios copiados"),
              () => toast.error("No se pudo copiar. Cópialos a mano."),
            );
          }}
        />
      ) : null}

      {/* < 1024: barra de acción sobre la barra inferior (§8: Evaluar sí la muestra) */}
      <ActionBar className="lg:hidden">
        <div id={motivoMovilId} className="flex min-w-0 flex-1 flex-col">
          <p className="text-small-b text-text">{faltanCortoTexto(faltan)}</p>
          <p className="text-small text-text-2">{sigueCortoTexto(siguiente)}</p>
        </div>
        <Button
          type="button"
          disabled={!completo}
          aria-describedby={motivoMovilId}
          onClick={guardar}
        >
          <Check aria-hidden="true" />
          Guardar y seguir
        </Button>
      </ActionBar>
    </div>
  );
}
