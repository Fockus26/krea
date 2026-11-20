// Evaluar en vivo por sondeo (D441, D443): la huella de la cola, la ruta del endpoint y qué aviso
// merece la entrega abierta. Puro y sin dependencias de servidor: lo importan la ruta
// `/api/evaluar/version`, los componentes cliente y las pruebas.

/** Ruta del sondeo de Evaluar (solo profesores, como `/api/presencia`). */
export const RUTA_VERSION_EVALUAR = "/api/evaluar/version";

/** Lo que resume la cola: si cualquiera cambia, cambió algo que se ve en Evaluar. */
export type ResumenCola = {
  /** Entregas que no son borrador. */
  total: number;
  /** Entregadas sin evaluar (el contador del menú). */
  porEvaluar: number;
  /** El `enviadaEn` más reciente (`null` sin entregas). */
  maxEnviada: number | null;
  /** El `evaluadaEn` más reciente (`null` sin evaluaciones). */
  maxEvaluada: number | null;
};

/**
 * Huella barata de la cola (D441): cantidad, por evaluar y los máximos de `enviadaEn` y
 * `evaluadaEn`. Evaluar o corregir sube el máximo de `evaluadaEn`; entregar o editar, el de
 * `enviadaEn`; devolver o eliminar baja `total`; deshacer cambia `porEvaluar` o el máximo.
 */
export function huellaCola(r: ResumenCola): string {
  return [r.total, r.porEvaluar, r.maxEnviada ?? 0, r.maxEvaluada ?? 0].join(
    ".",
  );
}

/** Estado de la entrega abierta, para el aviso (sin cédulas: D380, D388). */
export type EntregaVivo = {
  estado: "borrador" | "entregada" | "evaluada";
  /** `evaluadaEn` de la evaluación vigente (`null` = Pendiente). */
  evaluadaEn: number | null;
  /** Nombre de quien la evaluó por última vez («Ana Pérez»); `null` si no se sabe. */
  por: string | null;
  /** ¿La evaluó quien pregunta? Entonces no se avisa. */
  porMi: boolean;
};

/** Respuesta 200 del sondeo. `entrega`: solo con `?entrega=`; `null` si ya no existe. */
export type VersionEvaluar = {
  version: string;
  porEvaluar: number;
  entrega?: EntregaVivo | null;
};

export function rutaVersionEvaluar(o: {
  desde?: string | null;
  entrega?: string;
}): string {
  const q = new URLSearchParams();
  if (o.entrega) q.set("entrega", o.entrega);
  if (o.desde) q.set("desde", o.desde);
  const s = q.toString();
  return s ? `${RUTA_VERSION_EVALUAR}?${s}` : RUTA_VERSION_EVALUAR;
}

/** Qué pasó con la entrega abierta desde que se abrió. */
export type AvisoEntrega =
  | { tipo: "evaluada"; clave: string; texto: string }
  | { tipo: "fuera"; clave: string; texto: string };

/** PROVISIONAL (CONTENT_CHECKLIST fila 246): avisos de la entrega abierta (D443). */
export const OTRA_PERSONA = "Otra persona";
export const VER_EVALUACION = "Ver la evaluación";
export const IR_A_LA_COLA = "Ir a la cola";

/**
 * ¿Hay que avisar? `abiertaCon` es el `evaluadaEn` con el que se abrió el formulario (la misma
 * versión que manda Guardar, D224). Se avisa si otro la evaluó, la corrigió o deshizo su
 * evaluación, o si la entrega ya no está (devuelta o eliminada). Lo propio no avisa. `clave`
 * distingue un aviso de otro, para no repetir el mismo en cada sondeo.
 */
export function avisoEntrega(
  abiertaCon: number | null,
  e: EntregaVivo | null | undefined,
): AvisoEntrega | null {
  if (e === undefined) return null;
  if (e === null || e.estado === "borrador")
    return {
      tipo: "fuera",
      clave: "fuera",
      texto:
        "Esta entrega se devolvió al alumno o se eliminó. Ya no se puede evaluar.",
    };
  if (e.evaluadaEn === abiertaCon || e.porMi) return null;
  const quien = e.por ?? OTRA_PERSONA;
  const clave = `ev-${e.evaluadaEn ?? 0}`;
  if (e.evaluadaEn === null)
    return {
      tipo: "evaluada",
      clave,
      texto: `${OTRA_PERSONA} deshizo la evaluación de esta entrega.`,
    };
  return {
    tipo: "evaluada",
    clave,
    texto:
      abiertaCon === null
        ? `${quien} acaba de evaluar esta entrega.`
        : `${quien} cambió la nota de esta entrega.`,
  };
}
