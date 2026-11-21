/**
 * Mueve las imágenes de entrega a la carpeta con secreto (L75, D512–D515): de
 * `entregas/{tarea}/{sha256(id)}/…` a `entregas/{tarea}/{hmac(secreto, id)}/…`, y cambia las rutas
 * guardadas en `entregas.respuestas` y `partes.respuesta`. La lógica está en
 * `lib/data/migrar-carpetas.ts` (probada sobre PGlite).
 *
 *   bun --no-env-file scripts/migrar-carpetas-b2.ts --base <nombre> [--entorno <archivo>] [--apply]
 *
 * - Sin `--apply` es un ensayo: lista lo que movería, no escribe en la base ni llama a B2.
 * - `--base`: el nombre de la base de `DATABASE_URL` (`krea_preview`, `krea`); si no coincide, no
 *   corre.
 * - `--entorno`: archivo dotenv (p. ej. el de `vercel env pull`) con `DATABASE_URL`,
 *   `BETTER_AUTH_SECRET` y las cinco `B2_*`; pisa lo que haya en el entorno. El secreto TIENE que
 *   ser el de la app que usa esa base: con otro, la app no reconocería las carpetas nuevas.
 * - Registro: `data/privado/migrar-carpetas-<base>.jsonl` (fuera de git; lleva rutas viejas). Si
 *   una corrida se corta, la siguiente reanuda: lo ya movido no se toca y los objetos viejos que no
 *   se llegaron a borrar se borran.
 * - `--conservar-viejas`: copia y cambia rutas pero no borra los objetos viejos (si el bucket lo
 *   comparte otra base que todavía no se migró y pudiera usar las mismas rutas).
 * - Idempotente: termina cuando una corrida con `--apply` dice «0 rutas en la carpeta vieja».
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { configB2, crearAlmacen } from "@/lib/almacen/s3";
import { crearCarpetaEntrega } from "@/lib/carpeta-entrega";
import {
  type EventoMigracion,
  migrarCarpetas,
  pendientesDelRegistro,
} from "@/lib/data/migrar-carpetas";
import { baseDeDatos } from "@/lib/db";

const USO =
  "Uso: bun --no-env-file scripts/migrar-carpetas-b2.ts --base <nombre> [--entorno <archivo>] [--apply] [--conservar-viejas] [--aceptar-ajenas]";

function valor(nombre: string): string | undefined {
  const i = process.argv.indexOf(nombre);
  return i === -1 ? undefined : process.argv[i + 1];
}

/** Dotenv mínimo: `CLAVE=valor`, comillas opcionales, `#` comenta la línea. */
function leerEntorno(archivo: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const linea of readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(
      linea,
    );
    if (!m?.[1] || m[2] === undefined) continue;
    let v = m[2];
    if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1);
    out[m[1]] = v.replace(/\\n/g, "\n");
  }
  return out;
}

function salir(mensaje: string): never {
  console.error(`✗ ${mensaje}`);
  process.exit(1);
}

const base = valor("--base");
const aplicar = process.argv.includes("--apply");
const aceptarAjenas = process.argv.includes("--aceptar-ajenas");
const conservar = process.argv.includes("--conservar-viejas");
const entorno = valor("--entorno");
if (!base) salir(USO);

if (entorno) {
  if (!existsSync(entorno)) salir(`No existe ${entorno}.`);
  const env = leerEntorno(entorno);
  for (const k of [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "B2_KEY_ID",
    "B2_APPLICATION_KEY",
    "B2_BUCKET_NAME",
    "B2_ENDPOINT",
    "B2_REGION",
  ]) {
    if (env[k]) process.env[k] = env[k];
  }
}

const url = process.env.DATABASE_URL;
if (!url) salir("Falta DATABASE_URL.");
let nombre: string;
try {
  nombre = decodeURIComponent(new URL(url).pathname.slice(1));
} catch {
  salir("DATABASE_URL no es una URL.");
}
if (nombre !== base)
  salir(
    `DATABASE_URL apunta a «${nombre}», no a «${base}». No se corre: revisa el entorno.`,
  );
const secreto = process.env.BETTER_AUTH_SECRET;
if (!secreto) salir("Falta BETTER_AUTH_SECRET (el de la app de esta base).");
const config = configB2(process.env);
if (aplicar && !config) salir("Para --apply faltan las cinco variables B2_*.");
const db = baseDeDatos();
if (!db) salir("Sin base de datos.");

const registro = `data/privado/migrar-carpetas-${base}.jsonl`;
const previos: EventoMigracion[] = existsSync(registro)
  ? readFileSync(registro, "utf8")
      .split("\n")
      .filter((l) => l.trim() !== "")
      .map((l) => JSON.parse(l) as EventoMigracion)
  : [];
const pendientes = pendientesDelRegistro(previos);

console.log(
  `→ base «${base}» · ${aplicar ? "APLICAR (escribe en la base y en B2)" : "ensayo (no escribe)"}`,
);
if (pendientes.length > 0)
  console.log(
    `→ ${pendientes.length} objeto(s) viejo(s) de una corrida anterior por borrar`,
  );

const carpetaNueva = crearCarpetaEntrega(secreto);
const almacen = config ? crearAlmacen(config, { fetch }) : null;

if (aplicar) {
  // Antes de escribir nada: un ensayo para ver si hay rutas en carpetas que no son ni la vieja ni
  // la nueva (lo normal si el secreto no es el de la app)
  const previo = await migrarCarpetas({
    db,
    almacen,
    carpetaNueva,
    aplicar: false,
  });
  if (previo.ajenas > 0 && !aceptarAjenas)
    salir(
      `${previo.ajenas} ruta(s) en una carpeta que no es ni la vieja ni la nueva: ¿el secreto es el de la app de «${base}»? No se aplica. Si lo es, repite con --aceptar-ajenas (esas rutas no se tocan).`,
    );
}

if (aplicar) mkdirSync(dirname(registro), { recursive: true });
let n = 0;
const resumen = await migrarCarpetas({
  db,
  almacen,
  carpetaNueva,
  aplicar,
  pendientes,
  borrar: !conservar,
  registrar(e) {
    if (aplicar)
      appendFileSync(
        registro,
        `${JSON.stringify({ ...e, en: new Date().toISOString() })}\n`,
      );
    // En la consola, sin el id de la entrega (lleva la cédula del titular)
    if (e.tipo === "plan")
      console.log(
        `  ${++n}. ${e.tareaId}: ${e.movidas.length} imagen(es)${aplicar ? "" : " se moverían"}`,
      );
    else if (e.tipo === "actualizada" && e.faltaban.length > 0)
      console.log(
        `     ${e.faltaban.length} no estaban en B2 (ni vieja ni nueva): la ruta pasa a la nueva igual`,
      );
    else if (e.tipo === "error") console.log(`     ✗ ${e.motivo}`);
  },
});

console.log(`
Entregas con imágenes: ${resumen.entregas}
Rutas en la carpeta vieja: ${resumen.viejas} (en ${resumen.conViejas} entregas)
Rutas ya en la carpeta nueva: ${resumen.enNueva}${resumen.enNueva > 0 ? " (el secreto coincide con el de la app)" : ""}
Rutas en otra carpeta: ${resumen.ajenas}`);
if (aplicar)
  console.log(`Entregas actualizadas: ${resumen.actualizadas}
Imágenes que ya no estaban en B2: ${resumen.faltaban}
Objetos viejos borrados: ${resumen.borradas}
Objetos viejos sin borrar (la próxima corrida los reintenta): ${resumen.sinBorrar.length}
Errores (la próxima corrida los reintenta): ${resumen.errores}
Registro: ${registro}`);
else
  console.log(
    "\nEnsayo: nada cambió. Para hacerlo, repite con --apply (y las variables B2_*).",
  );

process.exit(resumen.errores > 0 || resumen.sinBorrar.length > 0 ? 1 : 0);
