"use client";
// Presencia al editar un alumno (W14, D275, D277, D327). La lista de Alumnos pregunta cada
// SONDEO_MS a /api/presencia (una sola consulta para todas las filas) y el diálogo abierto marca SU
// entrada con un latido. Si la ruta falla (sin sesión, sin red), la presencia se apaga en
// silencio: guardar sigue igual.
import { useEffect, useMemo, useState } from "react";
import {
  type EntradaPresencia,
  editoresVigentes,
  LATIDO_MS,
  porAlumno,
  RELOJ_PRESENCIA_MS,
  zEntradaPresencia,
} from "@/lib/presencia";
import { SONDEO_MS, useSondeo } from "@/lib/sondeo";

const RUTA = "/api/presencia";

/** El profe que mira la lista: su cédula (uid) y cómo lo ven los demás. */
export type YoPresencia = { uid: string; nombre: string };

export type Presencia = YoPresencia & {
  /** Los OTROS profes que editan a ese alumno ahora (vigentes, en orden de llegada). */
  editoresDe: (cedula: string) => EntradaPresencia[];
};

const NADIE: EntradaPresencia[] = [];

/** Suscripción a toda la presencia por sondeo. `null` sin `yo` (vista previa). */
export function usePresenciaAlumnos(yo?: YoPresencia): Presencia | null {
  const uid = yo?.uid;
  const nombre = yo?.nombre ?? "";
  const [entradas, setEntradas] = useState<Map<string, EntradaPresencia[]>>(
    () => new Map(),
  );
  // Reloj del SERVIDOR (lo trae cada respuesta) más lo que pasó desde entonces aquí
  const [base, setBase] = useState({ servidor: 0, local: 0 });
  const [, setTic] = useState(0);

  useSondeo(
    async (senal) => {
      try {
        const res = await fetch(RUTA, { cache: "no-store", signal: senal });
        if (!res.ok) throw new Error(String(res.status));
        const cuerpo = (await res.json()) as {
          ahora: number;
          entradas: Array<{ alumnoId: string; entrada: unknown }>;
        };
        const docs = cuerpo.entradas.flatMap((d) => {
          const e = zEntradaPresencia.safeParse(d.entrada);
          return e.success ? [{ alumnoId: d.alumnoId, entrada: e.data }] : [];
        });
        setEntradas(porAlumno(docs));
        setBase({ servidor: cuerpo.ahora, local: Date.now() });
      } catch {
        // Sin permiso o sin red: nadie a la vista, en silencio
        if (!senal.aborted) setEntradas(new Map());
      }
    },
    SONDEO_MS,
    Boolean(uid),
  );

  useEffect(() => {
    if (!uid) return;
    const reloj = setInterval(() => setTic((n) => n + 1), RELOJ_PRESENCIA_MS);
    return () => clearInterval(reloj);
  }, [uid]);

  return useMemo(() => {
    if (!uid) return null;
    const ahora = base.servidor + (Date.now() - base.local);
    return {
      uid,
      nombre,
      editoresDe: (cedula: string) => {
        const lista = entradas.get(cedula);
        return lista ? editoresVigentes(lista, ahora, uid) : NADIE;
      },
    };
  }, [uid, nombre, entradas, base]);
}

function enviar(accion: "marcar" | "quitar", cedula: string): Promise<unknown> {
  return fetch(RUTA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion, cedula }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Mientras el diálogo de `cedula` está abierto: marca la entrada propia, la renueva cada
 * LATIDO_MS y la quita al cerrar, al desmontar y en `pagehide` (con `sendBeacon`, que sobrevive al
 * cierre de la pestaña).
 */
export function useMarcarPresencia(
  presencia: Presencia | null | undefined,
  cedula: string,
): void {
  const uid = presencia?.uid;
  useEffect(() => {
    if (!uid) return;
    const quitarAlSalir = () => {
      const cuerpo = new Blob([JSON.stringify({ accion: "quitar", cedula })], {
        type: "application/json",
      });
      if (!navigator.sendBeacon?.(RUTA, cuerpo)) void enviar("quitar", cedula);
    };
    void enviar("marcar", cedula);
    const latido = setInterval(() => void enviar("marcar", cedula), LATIDO_MS);
    window.addEventListener("pagehide", quitarAlSalir);
    return () => {
      clearInterval(latido);
      window.removeEventListener("pagehide", quitarAlSalir);
      void enviar("quitar", cedula);
    };
  }, [uid, cedula]);
}
