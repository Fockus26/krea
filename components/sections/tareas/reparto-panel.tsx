"use client";

import { Check, Undo2 } from "lucide-react";
import { useEffect, useId, useRef, useTransition } from "react";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import {
  EstadoParte,
  RespuestaParteVista,
} from "@/components/sections/tareas/estado-parte";
import {
  type AccionTomar,
  TomarParte,
} from "@/components/sections/tareas/tomar-parte";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import type { ResultadoParte } from "@/lib/acciones/partes";
import type { EstadoParteId } from "@/lib/modelo";
import {
  ACEPTAR_PARTE,
  DEVOLVER_PARTE,
  mensajeErrorParte,
  PARTE_ACEPTADA_TOAST,
  PARTE_DEVUELTA_TOAST,
  REPARTO_ASIGNAR_ETIQUETA,
  REPARTO_AYUDA,
  REPARTO_EN_VIVO_AYUDA,
  REPARTO_NADIE,
  REPARTO_TITULO,
  repartoTomadaOpcion,
} from "@/lib/partes";
import { relanzarSiEsDeploy } from "@/lib/recarga-deploy";

/** Server Actions del reparto (el capitán); sin ellas (galerías) los controles no hacen nada. */
export type AccionesReparto = {
  asignar: (e: {
    tareaId: string;
    preguntaId: string;
    /** Id público del integrante (D495), o `null` para quitarla. */
    asignado: string | null;
  }) => Promise<ResultadoParte>;
  aceptar: (e: {
    tareaId: string;
    preguntaId: string;
  }) => Promise<ResultadoParte>;
  devolver: (e: {
    tareaId: string;
    preguntaId: string;
  }) => Promise<ResultadoParte>;
  /** «La respondo yo» (D461). */
  tomar: AccionTomar;
};

export type FilaRepartoPanel = {
  preguntaId: string;
  numero: number;
  enunciado: string;
  /** Id público del integrante (D495): el servidor lo traduce a su cédula al asignar. */
  asignado: string | null;
  /** Nombre corto de `asignado` (`null` sin asignar). */
  nombre: string | null;
  estado: EstadoParteId | null;
  /** Lo que entregó el integrante, ya firmado; `null` si aún nada. */
  respuesta: QuestionAnswer | null;
};

const NADIE = "nadie";
/** Valor del Select de una parte tomada: el capitán la responde, sigue a nombre del integrante. */
const TOMADA = "tomada";

/**
 * Panel «Reparto» del capitán (D422), encima de su formulario: por pregunta, a quién está
 * asignada (Select con los integrantes, sin el capitán), su estado (ícono + palabra) y, si ya se
 * la entregaron, la respuesta con «Aceptar» y «Devolver»; si no se la entregaron, «La respondo yo»
 * (D461). Lista de tarjetas (a 320 px no cabe una tabla). Se actualiza solo (`RepartoEnVivo`,
 * D465). Cada acción es una Server Action con `refresh()`: el servidor es la fuente (D463).
 */
export function RepartoPanel({
  tareaId,
  filas,
  integrantes,
  acciones,
}: {
  tareaId: string;
  filas: readonly FilaRepartoPanel[];
  /** Los integrantes a los que se puede asignar (sin el capitán). */
  integrantes: ReadonlyArray<{ id: string; nombre: string }>;
  acciones?: AccionesReparto;
}) {
  const tituloId = useId();
  return (
    <Card>
      <section aria-labelledby={tituloId} className="flex flex-col gap-3">
        {/* «Lo que entregó»: PROVISIONAL (CONTENT_CHECKLIST fila 230) */}
        <h2 id={tituloId} className="text-h2 text-text">
          {REPARTO_TITULO}
        </h2>
        <p className="text-small text-text-2">{REPARTO_AYUDA}</p>
        <p className="text-small text-text-2">{REPARTO_EN_VIVO_AYUDA}</p>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {filas.map((f) => (
            <FilaParte
              key={f.preguntaId}
              tareaId={tareaId}
              fila={f}
              integrantes={integrantes}
              acciones={acciones}
            />
          ))}
        </ol>
      </section>
    </Card>
  );
}

function FilaParte({
  tareaId,
  fila,
  integrantes,
  acciones,
}: {
  tareaId: string;
  fila: FilaRepartoPanel;
  integrantes: ReadonlyArray<{ id: string; nombre: string }>;
  acciones?: AccionesReparto;
}) {
  const etiquetaId = useId();
  const preguntaId = useId();
  const [pendiente, start] = useTransition();
  const clave = { tareaId, preguntaId: fila.preguntaId };
  // Aceptar o devolver quita el botón tocado: el foco pasa al nombre de la pregunta
  const enfocar = useRef(false);
  const estado = fila.estado;
  const previo = useRef(estado);
  useEffect(() => {
    if (previo.current === estado) return;
    previo.current = estado;
    if (!enfocar.current) return;
    enfocar.current = false;
    document.getElementById(preguntaId)?.focus();
  }, [estado, preguntaId]);

  /** Solo en línea (D424): sin red, el aviso y nada más. */
  function correr(accion: () => Promise<ResultadoParte>, exito?: string): void {
    if (!navigator.onLine) {
      toast.error(mensajeErrorParte("red"));
      return;
    }
    start(async () => {
      let r: ResultadoParte;
      try {
        r = await accion();
      } catch (fallo) {
        relanzarSiEsDeploy(fallo);
        r = { ok: false, error: "red" };
      }
      if (r.ok) {
        if (exito) {
          enfocar.current = true;
          toast.success(exito);
        }
      } else toast.error(mensajeErrorParte(r.error));
    });
  }

  const tomada = fila.estado === "tomada";
  // «La respondo yo» (D461): solo lo que no le entregaron
  const tomable =
    fila.asignado !== null &&
    (fila.estado === "asignada" || fila.estado === "devuelta");
  const conRespuesta =
    fila.respuesta !== null &&
    (fila.estado === "entregada" ||
      fila.estado === "aceptada" ||
      fila.estado === "devuelta");

  return (
    <li className="flex flex-col gap-3 rounded-md border border-divider p-3">
      {/* Nombra el Select y describe los botones: cada fila se distingue con lector de pantalla */}
      <p id={preguntaId} tabIndex={-1} className="text-small-b text-text">
        Pregunta {fila.numero}
        <span className="text-small block font-normal break-words text-text-2">
          {fila.enunciado}
        </span>
      </p>
      <div className="flex flex-col gap-1.5">
        <span id={etiquetaId} className="text-small-b text-text">
          {REPARTO_ASIGNAR_ETIQUETA}
        </span>
        <Select
          value={tomada ? TOMADA : (fila.asignado ?? NADIE)}
          disabled={pendiente || !acciones}
          onValueChange={(v) => {
            if (v === TOMADA || !acciones) return;
            const asignado = v === NADIE ? null : v;
            // Elegir otra vez al integrante de una tomada se la devuelve (D461)
            if (asignado === fila.asignado && !tomada) return;
            correr(() => acciones.asignar({ ...clave, asignado }));
          }}
        >
          <SelectTrigger
            aria-labelledby={`${etiquetaId} ${preguntaId}`}
            className="w-full min-w-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NADIE}>{REPARTO_NADIE}</SelectItem>
            {tomada ? (
              <SelectItem value={TOMADA}>
                {repartoTomadaOpcion(fila.nombre ?? "")}
              </SelectItem>
            ) : null}
            {integrantes.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <EstadoParte estado={fila.estado} />
      {conRespuesta && fila.respuesta ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-eyebrow text-text-2">Lo que entregó</p>
          <RespuestaParteVista respuesta={fila.respuesta} />
        </div>
      ) : null}
      {acciones && tomable ? (
        <div className="flex flex-wrap gap-2">
          <TomarParte
            {...clave}
            numero={fila.numero}
            nombre={fila.nombre ?? ""}
            accion={acciones.tomar}
          />
        </div>
      ) : null}
      {acciones &&
      (fila.estado === "entregada" || fila.estado === "aceptada") ? (
        <div className="flex flex-wrap gap-2">
          {fila.estado === "entregada" ? (
            <BotonEnLinea
              size="sm"
              disabled={pendiente}
              aria-describedby={preguntaId}
              onClick={() =>
                correr(() => acciones.aceptar(clave), PARTE_ACEPTADA_TOAST)
              }
            >
              <Check aria-hidden="true" />
              {ACEPTAR_PARTE}
            </BotonEnLinea>
          ) : null}
          <BotonEnLinea
            variant="secondary"
            size="sm"
            disabled={pendiente}
            aria-describedby={preguntaId}
            onClick={() =>
              correr(() => acciones.devolver(clave), PARTE_DEVUELTA_TOAST)
            }
          >
            <Undo2 aria-hidden="true" />
            {DEVOLVER_PARTE}
          </BotonEnLinea>
        </div>
      ) : null}
    </li>
  );
}
