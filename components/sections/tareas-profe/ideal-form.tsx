"use client";
// Formulario de la entrega ideal (tanda 11-14 Z2, D430–D435). Dos formas: parte de la entrega de un
// alumno o equipo con 20 / 20 (sus respuestas se leen, no se editan) o el profe escribe la
// respuesta ideal de cada pregunta. En las dos: el porqué general (obligatorio) y uno opcional por
// pregunta. Con la de un alumno, guardar pide confirmar que la sección verá su nombre y avatar
// (D435). Si falla, el error queda a la vista y no se pierde lo escrito (D171).
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { QuestionHeader } from "@/components/krea/question-header";
import {
  AutorFila,
  IdealRespuesta,
} from "@/components/sections/tareas/ideal-respuesta";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  type AutorIdeal,
  avisoAutorTexto,
  avisoAutorTitulo,
  type ErrorIdeal,
  errorIdealTexto,
  GUARDAR_IDEAL_TEXTO,
  type GuardarIdeal,
  IDEAL_GUARDADA_TEXTO,
  NOTA_GENERAL_AYUDA,
  NOTA_GENERAL_LABEL,
  NOTA_IDEAL_MAX,
  NOTA_PREGUNTA_LABEL,
  RESPUESTA_IDEAL_MAX,
  RESPUESTA_IMAGEN_AYUDA,
  RESPUESTA_PROFE_LABEL,
  type RespuestaIdeal,
  type ResultadoIdeal,
} from "@/lib/ideal";

export type PreguntaFormIdeal = {
  id: string;
  numero: number;
  enunciado: string;
  valor: number;
  formato: "texto" | "imagen";
  /** Solo en la forma «entrega»: la respuesta del autor. */
  respuesta: RespuestaIdeal | null;
};

export type FormaIdeal =
  | { tipo: "entrega"; entregaId: string; autor: AutorIdeal }
  | { tipo: "profe" };

export function IdealForm({
  tareaId,
  forma,
  preguntas,
  inicial,
  urls,
  logoUrl,
  guardar,
  volverHref,
}: {
  tareaId: string;
  forma: FormaIdeal;
  preguntas: readonly PreguntaFormIdeal[];
  inicial: {
    nota: string;
    notas: Readonly<Record<string, string>>;
    respuestas: Readonly<Record<string, string>>;
  };
  /** URLs firmadas de las imágenes del autor. */
  urls: Readonly<Record<string, string>>;
  /** Logo firmado del equipo autor, si tiene. */
  logoUrl: string | null;
  /** Server Action; sin ella (galería) solo se muestra el toast. */
  guardar?: (e: GuardarIdeal) => Promise<ResultadoIdeal>;
  volverHref: string;
}) {
  const router = useRouter();
  const [nota, setNota] = useState(inicial.nota);
  const [notas, setNotas] = useState<Record<string, string>>({
    ...inicial.notas,
  });
  const [respuestas, setRespuestas] = useState<Record<string, string>>({
    ...inicial.respuestas,
  });
  const [errorNota, setErrorNota] = useState(false);
  const [faltan, setFaltan] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const ocupado = useRef(false);

  const entrada = (): GuardarIdeal => ({
    tareaId,
    forma:
      forma.tipo === "entrega"
        ? { tipo: "entrega", entregaId: forma.entregaId }
        : { tipo: "profe", respuestas },
    nota,
    notas,
  });

  async function enviar() {
    if (ocupado.current) return;
    ocupado.current = true;
    setEnviando(true);
    setError(null);
    const r: ResultadoIdeal = guardar
      ? await guardar(entrada()).catch(
          (): ResultadoIdeal => ({ ok: false, error: "red" }),
        )
      : { ok: true };
    ocupado.current = false;
    setEnviando(false);
    if (!r.ok) {
      mostrarError(r.error);
      return;
    }
    setConfirmando(false);
    toast.success(IDEAL_GUARDADA_TEXTO);
    router.push(volverHref);
  }

  function mostrarError(e: ErrorIdeal) {
    setError(errorIdealTexto(e));
    if (e === "sin-nota") setErrorNota(true);
  }

  function alEnviar(ev: FormEvent) {
    ev.preventDefault();
    const sinNota = !nota.trim();
    const vacias =
      forma.tipo === "profe"
        ? new Set(
            preguntas.filter((p) => !respuestas[p.id]?.trim()).map((p) => p.id),
          )
        : new Set<string>();
    setErrorNota(sinNota);
    setFaltan(vacias);
    if (sinNota || vacias.size > 0) {
      setError(errorIdealTexto(sinNota ? "sin-nota" : "incompleta"));
      return;
    }
    setError(null);
    if (forma.tipo === "entrega") setConfirmando(true);
    else void enviar();
  }

  const autor = forma.tipo === "entrega" ? forma.autor : null;
  const nombreAutor =
    autor && autor.tipo !== "profe" ? autor.nombre : "los profesores";

  return (
    <form
      method="post"
      noValidate
      onSubmit={alEnviar}
      className="flex flex-col gap-4"
    >
      {autor ? (
        <Card variant="flat" className="flex flex-col gap-3">
          <AutorFila autor={autor} logoUrl={logoUrl} />
          <Alert variant="warn" role="status">
            {avisoAutorTexto(autor)}
          </Alert>
        </Card>
      ) : null}

      <Field
        label={NOTA_GENERAL_LABEL}
        help={NOTA_GENERAL_AYUDA}
        error={errorNota ? errorIdealTexto("sin-nota") : undefined}
        announce={false}
      >
        <Textarea
          value={nota}
          onChange={(e) => {
            setNota(e.target.value);
            if (e.target.value.trim()) setErrorNota(false);
          }}
          maxLength={NOTA_IDEAL_MAX}
          counter
          autoGrow
          required
        />
      </Field>

      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {preguntas.map((p) => (
          <li key={p.id} className="list-none">
            <Card className="flex flex-col gap-3">
              <QuestionHeader
                numero={p.numero}
                enunciado={p.enunciado}
                valor={p.valor}
                variant="evaluar"
                level={2}
              />
              {forma.tipo === "entrega" ? (
                <IdealRespuesta
                  respuesta={p.respuesta}
                  urls={urls}
                  nombre={nombreAutor}
                  numero={p.numero}
                />
              ) : (
                <Field
                  label={RESPUESTA_PROFE_LABEL}
                  help={
                    p.formato === "imagen" ? RESPUESTA_IMAGEN_AYUDA : undefined
                  }
                  error={
                    faltan.has(p.id) ? errorIdealTexto("incompleta") : undefined
                  }
                  announce={false}
                >
                  <Textarea
                    value={respuestas[p.id] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRespuestas((r) => ({ ...r, [p.id]: v }));
                      if (v.trim())
                        setFaltan((f) => {
                          const n = new Set(f);
                          n.delete(p.id);
                          return n;
                        });
                    }}
                    maxLength={RESPUESTA_IDEAL_MAX}
                    counter
                    autoGrow
                    required
                  />
                </Field>
              )}
              <Field label={NOTA_PREGUNTA_LABEL}>
                <Textarea
                  value={notas[p.id] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNotas((n) => ({ ...n, [p.id]: v }));
                  }}
                  maxLength={NOTA_IDEAL_MAX}
                  counter
                  compact
                  autoGrow
                />
              </Field>
            </Card>
          </li>
        ))}
      </ol>

      {error && !confirmando ? (
        <ErrorEnPantalla titulo="No se guardó">{error}</ErrorEnPantalla>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          loading={enviando && !confirmando}
          loadingLabel="Guardando…"
        >
          <Save aria-hidden="true" />
          {GUARDAR_IDEAL_TEXTO}
        </Button>
      </div>

      <Dialog
        open={confirmando}
        onOpenChange={(v) => {
          if (!v && !ocupado.current) setConfirmando(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {autor ? avisoAutorTitulo(autor) : GUARDAR_IDEAL_TEXTO}
            </DialogTitle>
            <DialogDescription>
              {autor ? avisoAutorTexto(autor) : null}
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <ErrorEnPantalla titulo="No se guardó">{error}</ErrorEnPantalla>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              loading={enviando}
              loadingLabel="Guardando…"
              onClick={enviar}
            >
              <Save aria-hidden="true" />
              {GUARDAR_IDEAL_TEXTO}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
