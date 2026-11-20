import "server-only";
// Lectura del % orientativo de IA para Evaluar entrega (D425–D429): solo el profesor.
import { exigirSesion } from "@/lib/dal";
import { leerAnalisis } from "@/lib/data/analisis-ia";
import { db, opcional } from "@/lib/datos/comun";
import { iaConfigurada } from "@/lib/ia/cliente";
import {
  type EstadoAnalisisIA,
  estadoAnalisis,
  huellaTexto,
} from "@/lib/ia-texto";

/**
 * El estado del análisis de cada respuesta de TEXTO de la entrega (pregunta → estado), o `null`
 * si la función no está configurada (sin `ANTHROPIC_API_KEY` no aparece, D428) o si su lectura
 * falla: es un complemento y Evaluar sigue sin el bloque (D436).
 */
export async function analisisIAEntrega(
  entregaId: string,
  textos: ReadonlyArray<{ preguntaId: string; texto: string }>,
): Promise<Record<string, EstadoAnalisisIA> | null> {
  await exigirSesion("profesor");
  if (!iaConfigurada()) return null;
  return opcional(
    "análisis de IA",
    async () => {
      const guardados = await leerAnalisis(db(), entregaId);
      const pares = await Promise.all(
        textos.map(
          async ({ preguntaId, texto }) =>
            [
              preguntaId,
              estadoAnalisis(
                texto,
                await huellaTexto(texto),
                guardados.get(preguntaId) ?? null,
              ),
            ] as const,
        ),
      );
      return Object.fromEntries(pares);
    },
    null,
  );
}
