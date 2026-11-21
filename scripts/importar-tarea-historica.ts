/**
 * Caso único (2026-11-10): sube la primera tarea, «Identidad de marca», que se evaluó en la hoja
 * «Notas» antes de la web. Crea la tarea publicada para 5A y 5C (cierra el viernes 13/11 a las
 * 17:00, individual, premio «Ir al Cine») y deja a los 12 alumnos de la hoja como entregados y
 * evaluados con su puntaje por pregunta, SIN respuestas (las pasa el profe desde Alumnos → Editar).
 * Los datos salen de `data/privado/tarea-identidad-marca.json` (lo genera `scripts/import-excel.py`).
 *
 *   bun scripts/importar-tarea-historica.ts --autor <cédula del profe> [--ensayo]
 *
 * Usa DATABASE_URL del entorno (`.env.development.local` si no está puesta): OJO, con la URL de
 * producción (`ssh kit-vps kit-db url krea`) es la base REAL (D327). Idempotente: la tarea que ya
 * existe no se pisa y la entrega que ya existe no se vuelve a evaluar. No manda el aviso push de
 * tarea nueva (eso lo hace publicar desde la app).
 */

import { existsSync, readFileSync } from "node:fs";
import { and, eq } from "drizzle-orm";
import { cargarTareaHistorica } from "@/lib/data/tarea-historica";
import { baseDeDatos } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import type { Tarea } from "@/lib/modelo";
import type { TareaSeed } from "@/lib/seed-firestore";

function valor(nombre: string): string | undefined {
  const i = process.argv.indexOf(nombre);
  return i === -1 ? undefined : process.argv[i + 1];
}

const autor = valor("--autor");
const ensayo = process.argv.includes("--ensayo");
if (!autor) {
  console.error(
    "Uso: bun scripts/importar-tarea-historica.ts --autor <cédula del profe> [--ensayo]",
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL && existsSync(".env.development.local"))
  process.loadEnvFile(".env.development.local");
const db = baseDeDatos();
if (!db) {
  console.error("✗ Sin DATABASE_URL en el entorno.");
  process.exit(1);
}
console.log(
  `→ base «${new URL(process.env.DATABASE_URL ?? "").pathname.slice(1)}»${ensayo ? " (ensayo)" : ""}`,
);

const [profe] = await db
  .select({ cedula: usuarios.cedula })
  .from(usuarios)
  .where(and(eq(usuarios.cedula, autor), eq(usuarios.rol, "profesor")));
if (!profe) {
  console.error(`✗ ${autor} no es un profesor de esta base.`);
  process.exit(1);
}

const seed = JSON.parse(
  readFileSync("data/privado/tarea-identidad-marca.json", "utf8"),
) as Omit<TareaSeed, "evaluaciones"> & {
  evaluaciones: ReadonlyArray<
    TareaSeed["evaluaciones"][number] & { alumno: string }
  >;
};
const ahora = Date.now();
const tarea: Tarea = {
  titulo: seed.titulo,
  tipo: "individual",
  secciones: ["5A", "5C"],
  estado: "abierta",
  fechaEntrega: "2026-11-13",
  horaEntrega: "17:00",
  premio: "Ir al Cine",
  premioFoto: null,
  preguntas: seed.preguntas.map((p) => ({
    ...p,
    formato: p.formato === "imagen" ? "imagen" : "texto",
  })),
  importada: false,
  autorId: autor,
  actualizadoEn: ahora,
};

// La nota de la hoja tiene que ser la suma de sus puntos (si no, algo se leyó mal)
for (const e of seed.evaluaciones) {
  const suma = e.puntos.reduce((s, p) => s + p, 0);
  if (suma !== e.nota) {
    console.error(
      `✗ ${e.alumno}: los puntos suman ${suma}, la hoja dice ${e.nota}.`,
    );
    process.exit(1);
  }
}

const r = await cargarTareaHistorica(db, {
  id: seed.id,
  tarea,
  notas: seed.evaluaciones.map((e) => ({ cedula: e.cedula, puntos: e.puntos })),
  autorId: autor,
  ahora,
  ensayo,
});

console.log(`Tarea «${tarea.titulo}» (${seed.id}): ${r.tarea}`);
const nombre = new Map(seed.evaluaciones.map((e) => [e.cedula, e.alumno]));
for (const a of r.alumnos) {
  const quien = `${nombre.get(a.cedula) ?? ""} (${a.cedula})`;
  if (a.estado === "evaluada") console.log(`  ✓ ${quien}: ${a.puntaje}/20`);
  else if (a.estado === "ya-estaba")
    console.log(`  · ${quien}: ya tenía entrega`);
  else console.log(`  ✗ ${quien}: ${a.motivo}`);
}
const errores = r.alumnos.filter((a) => a.estado === "error").length;
process.exit(errores ? 1 : 0);
