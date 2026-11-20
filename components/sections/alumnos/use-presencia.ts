"use client";
// Presencia al editar un alumno (W14, D275, D277, D327). La lista de Alumnos pregunta cada
// SONDEO_MS a /api/presencia (una sola consulta para todas las filas) y el diálogo abierto marca SU
// entrada con un latido. Si la ruta falla (sin sesión, sin red), la presencia se apaga en
// silencio: guardar sigue igual.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type EntradaPresencia,
  editoresVigentes,
  LATIDO_MS,
  porAlumno,
  RELOJ_PRESENCIA_MS,
  zEntradaPresencia,
} from "@/lib/presencia";
import { estaCortado, fallosTras, SONDEO_MS, useSondeo } from "@/lib/sondeo";

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
  const fallos = useRef(0);

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
        fallos.current = fallosTras(fallos.current, true);
        setEntradas(porAlumno(docs));
        setBase({ servidor: cuerpo.ahora, local: Date.now() });
      } catch {
        // Sin permiso o sin red: nadie a la vista, en silencio. Un fallo suelto no la apaga (D437):
        // lo que había caduca solo con el reloj (`editoresVigentes`)
        if (senal.aborted) return;
        fallos.current = fallosTras(fallos.current, false);
        if (estaCortado(fallos.current)) setEntradas(new Map());
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

/** Qué fila marca el pedido: un alumno («Editar alumno») o una entrega («Evaluar», D408). */
type Campo = "cedula" | "entrega";

function enviar(
  accion: "marcar" | "quitar",
  campo: Campo,
  id: string,
): Promise<unknown> {
  return fetch(RUTA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion, [campo]: id }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Mientras está montado (y hay `uid`): marca la entrada propia, la renueva cada LATIDO_MS y la
 * quita al desmontar y en `pagehide` (con `sendBeacon`, que sobrevive al cierre de la pestaña).
 */
function useLatido(uid: string | undefined, campo: Campo, id: string): void {
  useEffect(() => {
    if (!uid) return;
    const quitarAlSalir = () => {
      const cuerpo = new Blob(
        [JSON.stringify({ accion: "quitar", [campo]: id })],
        { type: "application/json" },
      );
      if (!navigator.sendBeacon?.(RUTA, cuerpo))
        void enviar("quitar", campo, id);
    };
    void enviar("marcar", campo, id);
    const latido = setInterval(
      () => void enviar("marcar", campo, id),
      LATIDO_MS,
    );
    window.addEventListener("pagehide", quitarAlSalir);
    return () => {
      clearInterval(latido);
      window.removeEventListener("pagehide", quitarAlSalir);
      void enviar("quitar", campo, id);
    };
  }, [uid, campo, id]);
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
  useLatido(presencia?.uid, "cedula", cedula);
}

/**
 * Presencia en «Evaluar entrega» (D408–D410): marca «estoy evaluando» `entregaId` mientras está
 * montado y sondea `?entrega=` cada SONDEO_MS. Devuelve los OTROS profes que la evalúan ahora
 * (vigentes, en orden de llegada); vacío sin `yo` o si la ruta falla (en silencio: guardar sigue
 * igual y el conflicto lo atrapa `cambio`, D224).
 */
export function usePresenciaEntrega(
  yo: YoPresencia | undefined,
  entregaId: string,
): EntradaPresencia[] {
  const uid = yo?.uid;
  const [entradas, setEntradas] = useState<EntradaPresencia[]>(NADIE);
  const [base, setBase] = useState({ servidor: 0, local: 0 });
  const [tic, setTic] = useState(0);
  const fallos = useRef(0);

  useLatido(uid, "entrega", entregaId);

  useSondeo(
    async (senal) => {
      try {
        const res = await fetch(
          `${RUTA}?entrega=${encodeURIComponent(entregaId)}`,
          { cache: "no-store", signal: senal },
        );
        if (!res.ok) throw new Error(String(res.status));
        const cuerpo = (await res.json()) as {
          ahora: number;
          entradas: unknown[];
        };
        fallos.current = fallosTras(fallos.current, true);
        setEntradas(
          cuerpo.entradas.flatMap((d) => {
            const e = zEntradaPresencia.safeParse(d);
            return e.success ? [e.data] : [];
          }),
        );
        setBase({ servidor: cuerpo.ahora, local: Date.now() });
      } catch {
        // Un fallo suelto no apaga el aviso (D437); lo que había caduca solo con el reloj
        if (senal.aborted) return;
        fallos.current = fallosTras(fallos.current, false);
        if (estaCortado(fallos.current)) setEntradas(NADIE);
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: `tic` vuelve a mirar la vigencia sin una respuesta nueva
  return useMemo(() => {
    if (!uid) return NADIE;
    const ahora = base.servidor + (Date.now() - base.local);
    return editoresVigentes(entradas, ahora, uid);
  }, [uid, entradas, base, tic]);
}
