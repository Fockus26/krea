"use client";

import { FilePen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import { RespuestaParteVista } from "@/components/sections/tareas/estado-parte";
import {
  avisoBorradorTexto,
  BORRADOR_ACTUALIZADO,
  BORRADOR_AYUDA,
  BORRADOR_ETIQUETA,
} from "@/lib/borrador-grupal";
import { horaTexto } from "@/lib/tareas";

/** Cada cuánto se vuelve a escribir «hace …» (no pide nada al servidor). */
const RELOJ_MS = 30_000;

/**
 * Aviso del borrador compartido para el integrante (D547): quién lo guardó y hace cuánto. El «hace
 * …» se recalcula en el cliente cada 30 s; el primer render usa el `ahora` del servidor para que la
 * hidratación coincida. La región viva solo cambia cuando llega un borrador nuevo (por el sondeo),
 * no con cada minuto que pasa.
 */
export function AvisoBorradorCapitan({
  nombre,
  actualizadoEn,
  ahora,
}: {
  nombre: string;
  actualizadoEn: number;
  ahora: number;
}) {
  const [reloj, setReloj] = useState(ahora);
  // Vacía al cargar (no hay nada que anunciar); se llena cuando llega un borrador más nuevo
  const [anuncio, setAnuncio] = useState("");
  const primero = useRef(actualizadoEn);
  useEffect(() => {
    setReloj(Date.now());
    if (actualizadoEn !== primero.current)
      setAnuncio(
        BORRADOR_ACTUALIZADO(nombre, horaTexto(new Date(actualizadoEn))),
      );
    const t = setInterval(() => setReloj(Date.now()), RELOJ_MS);
    return () => clearInterval(t);
  }, [actualizadoEn, nombre]);
  return (
    <div className="flex gap-3 rounded-md bg-surface-2 p-4 text-text">
      <FilePen aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-callout font-bold">
          {avisoBorradorTexto(nombre, actualizadoEn, reloj)}
        </p>
        <p className="text-small text-text-2">{BORRADOR_AYUDA}</p>
        {/* Educada: se anuncia cuando el sondeo trae un borrador nuevo, no cada minuto */}
        <output aria-live="polite" className="sr-only">
          {anuncio}
        </output>
      </div>
    </div>
  );
}

/** Dentro de la pregunta bloqueada del integrante: lo que el capitán tiene en el borrador. */
export function RespuestaBorrador({
  respuesta,
}: {
  respuesta: QuestionAnswer;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* PROVISIONAL (CONTENT_CHECKLIST fila 299) */}
      <p className="text-eyebrow text-text-2">{BORRADOR_ETIQUETA}</p>
      <RespuestaParteVista respuesta={respuesta} />
    </div>
  );
}
