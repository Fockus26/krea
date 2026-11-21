// Carpeta de las imágenes de una entrega en B2 (D512): `entregas/{tareaId}/{carpeta}/{uuid}.jpg`.
// HMAC-SHA256 del id de la entrega con una clave derivada de `BETTER_AUTH_SECRET` (etiqueta propia,
// como el id público, D493). Antes era SHA-256 del id sin secreto (`carpetaEntregaLegada`): el id
// de una individual es `tarea__cédula`, así que quien veía la URL firmada de una imagen (la ideal
// la ven los compañeros) revertía la cédula probando sus 10⁸ valores (D388).
//
// Sin `server-only` para que `lib/data/` lo use en las pruebas sobre PGlite (el secreto lo pone
// `tests/preparar.ts`). Usa `node:crypto`: un componente cliente que lo importe no compila.
import { createHash, createHmac } from "node:crypto";
import { claveDerivada } from "@/lib/id-publico";

/** Etiqueta de la clave derivada. `v1`: cambiarla mueve todas las carpetas (hay que migrar, D513). */
export const ETIQUETA_CARPETA_ENTREGA = "krea:carpeta-entrega:v1";
/** 32 hex = 128 bits, el mismo largo que la carpeta vieja. */
export const LARGO_CARPETA = 32;

/** Id de entrega → carpeta. */
export type CarpetaDe = (entregaId: string) => string;

/** La carpeta con un secreto dado. */
export function crearCarpetaEntrega(secreto: string): CarpetaDe {
  if (!secreto) throw new Error("Falta el secreto de la carpeta de entrega");
  const clave = claveDerivada(secreto, ETIQUETA_CARPETA_ENTREGA);
  return (entregaId) =>
    createHmac("sha256", clave)
      .update(entregaId)
      .digest("hex")
      .slice(0, LARGO_CARPETA);
}

/**
 * La carpeta de antes (D195): SHA-256 del id, 32 hex, sin secreto. Solo para leer lo que aún no se
 * migró (D514) y para el script que mueve los objetos (`scripts/migrar-carpetas-b2.ts`, D513).
 */
export function carpetaEntregaLegada(entregaId: string): string {
  return createHash("sha256")
    .update(entregaId)
    .digest("hex")
    .slice(0, LARGO_CARPETA);
}

let calculo: CarpetaDe | null = null;

/**
 * Carpeta de la entrega con el secreto del servidor: donde se suben sus imágenes. Se crea en la
 * primera llamada, no al importar. Sin secreto no hay sesión (Better Auth no arranca) y aquí
 * tampoco hay plan B: nunca se cae a la carpeta sin secreto.
 */
export const carpetaEntrega: CarpetaDe = (entregaId) => {
  calculo ??= crearCarpetaEntrega(process.env.BETTER_AUTH_SECRET ?? "");
  return calculo(entregaId);
};

/**
 * Carpetas que valen al validar las rutas que manda el alumno (D514): la nueva y, mientras queden
 * objetos sin migrar o formularios abiertos con la ruta vieja, la vieja. Quitar la vieja cuando el
 * script haya corrido en producción y una segunda pasada no mueva nada.
 */
export function carpetasDeEntrega(entregaId: string): readonly string[] {
  return [carpetaEntrega(entregaId), carpetaEntregaLegada(entregaId)];
}
