"use client";

import { FilePenLine } from "lucide-react";
import { useId, useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  type EditarRespuestas,
  errorRespuestasTexto,
  RESPUESTA_MAX,
  type ResultadoRespuestas,
} from "@/lib/respuestas-profe";

export type RespuestaEditable = {
  id: string;
  numero: number;
  enunciado: string;
  /** Lo que hay guardado; "" = sin respuesta. */
  texto: string;
};

/**
 * «Editar respuestas» de Evaluar: permiso TEMPORAL para pasar a la web las respuestas de tareas
 * hechas antes (`lib/respuestas-profe`). Un diálogo con un campo por pregunta de texto; al guardar
 * se refresca la página y las tarjetas de Evaluar muestran lo nuevo. No toca puntajes ni
 * comentarios (el formulario de la nota sigue con lo que tenía).
 */
export function AnswersEditor({
  entregaId,
  titular,
  preguntas,
  guardar,
}: {
  entregaId: string;
  /** Alumno o equipo de la entrega (descripción del diálogo). */
  titular: string;
  preguntas: readonly RespuestaEditable[];
  guardar: (e: EditarRespuestas) => Promise<ResultadoRespuestas>;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" className="self-start">
          <FilePenLine aria-hidden="true" />
          Editar respuestas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar respuestas</DialogTitle>
          <DialogDescription>
            {/* PROVISIONAL (CONTENT_CHECKLIST fila 176): permiso temporal de carga */}
            Respuestas de {titular}. Déjala vacía si no respondió esa pregunta.
          </DialogDescription>
        </DialogHeader>
        <Formulario
          entregaId={entregaId}
          preguntas={preguntas}
          guardar={guardar}
          onListo={() => setAbierto(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  entregaId,
  preguntas,
  guardar,
  onListo,
}: {
  entregaId: string;
  preguntas: readonly RespuestaEditable[];
  guardar: (e: EditarRespuestas) => Promise<ResultadoRespuestas>;
  onListo: () => void;
}) {
  const uid = useId();
  const [textos, setTextos] = useState(() => preguntas.map((p) => p.texto));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviando = useRef(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando.current) return;
    enviando.current = true;
    setGuardando(true);
    setError(null);
    const r = await guardar({
      entregaId,
      respuestas: Object.fromEntries(
        preguntas.map((p, i) => [p.id, textos[i] ?? ""]),
      ),
    }).catch((): ResultadoRespuestas => ({ ok: false, error: "red" }));
    enviando.current = false;
    setGuardando(false);
    if (r.ok) {
      toast.success("Respuestas guardadas");
      onListo();
    } else setError(errorRespuestasTexto(r.error));
  };

  return (
    <form
      method="post"
      noValidate
      onSubmit={enviar}
      className="flex flex-col gap-4"
    >
      {preguntas.map((p, i) => (
        <Field
          key={p.id}
          label={`${p.numero}. ${p.enunciado}`}
          controlId={`${uid}-${p.id}`}
        >
          <Textarea
            rows={3}
            maxLength={RESPUESTA_MAX}
            value={textos[i] ?? ""}
            onChange={(ev) => {
              const v = ev.currentTarget.value;
              setTextos((t) => t.map((x, j) => (j === i ? v : x)));
            }}
          />
        </Field>
      ))}
      {error ? (
        <ErrorEnPantalla titulo="No se guardaron las respuestas">
          {error}
        </ErrorEnPantalla>
      ) : null}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" loading={guardando} loadingLabel="Guardando…">
          Guardar respuestas
        </Button>
      </DialogFooter>
    </form>
  );
}
