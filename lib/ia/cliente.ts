import "server-only";
// Cliente de la API de Claude para el % orientativo de IA (D425). La clave sale de
// `ANTHROPIC_API_KEY` (solo servidor; nunca en el código ni en los registros). Sin ella la función
// no existe: la página no la ofrece y la acción responde `sin-configurar` (D428).
import Anthropic from "@anthropic-ai/sdk";
import { estimarConCliente, type ResultadoEstimacion } from "@/lib/ia/peticion";

function clave(): string | null {
  return process.env.ANTHROPIC_API_KEY?.trim() || null;
}

/** Solo un booleano: la página no ve la clave ni nada de ella. */
export function iaConfigurada(): boolean {
  return clave() !== null;
}

let cliente: Anthropic | null = null;

/** `null` sin clave. */
function clienteIA(): Anthropic | null {
  const k = clave();
  if (!k) return null;
  // Un reintento y 20 s: el profe espera con el botón «Analizando…»
  cliente ??= new Anthropic({ apiKey: k, maxRetries: 1, timeout: 20_000 });
  return cliente;
}

export async function estimarUsoIA(
  texto: string,
): Promise<ResultadoEstimacion | null> {
  const c = clienteIA();
  if (!c) return null;
  return estimarConCliente((p) => c.messages.create(p), texto);
}
