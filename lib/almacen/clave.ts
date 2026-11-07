// Forma segura de una clave de objeto de B2 (D194). Aparte de `s3.ts` para que el modelo
// (`lib/modelo.ts`, que también corre en el cliente) la use sin arrastrar el cliente S3.

/** Clave de objeto segura: segmentos `[A-Za-z0-9._-]`, sin `..` ni barras sueltas. */
export function esClaveValida(clave: string): boolean {
  if (clave.length === 0 || clave.length > 512) return false;
  return clave
    .split("/")
    .every((s) => /^[A-Za-z0-9._-]+$/.test(s) && s !== "." && s !== "..");
}
