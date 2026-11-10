/**
 * Alta en lote de alumnos y sus equipos desde el seed del Excel (`data/seed/alumnos.json` y
 * `grupos.json`, los genera `scripts/import-excel.py` de la hoja «Alumnos»). SIN notas: solo
 * cuentas, equipos, capitanes y ranking (los alumnos entran con 0 puntos).
 *
 *   bun scripts/importar-alumnos.ts --salida <archivo.csv> [--ensayo]
 *
 * Usa DATABASE_URL del entorno (`.env.development.local` si no está puesta): OJO, con la URL de
 * producción (`ssh kit-vps kit-db url krea`) es la base REAL (D327). Hace lo mismo que «Agregar
 * alumno» (D232, D267): `crearCuentaCon` con contraseña temporal + `incorporarAlumnoEnTransaccion`.
 * Los equipos que falten se crean con `crearEquipoEnTransaccion`; el capitán del Excel entra
 * primero a su equipo, así queda de capitán (D111).
 *
 * Idempotente: una cédula que ya tiene cuenta no se toca (ni su contraseña) y un equipo con el
 * mismo nombre en la sección se reutiliza. Las contraseñas temporales se escriben UNA vez en
 * `--salida` (CSV): no se guardan en ningún otro lado. Ponlo fuera del repo o en una ruta
 * ignorada (`context/plans/`). `--ensayo` solo dice lo que haría.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { and, eq } from "drizzle-orm";
import { ErrorCuenta, zEntradaCuenta } from "@/lib/cuentas-datos";
import { incorporarAlumnoEnTransaccion } from "@/lib/data/alumnos-alta";
import { crearCuentaCon } from "@/lib/data/cuentas";
import { crearEquipoEnTransaccion } from "@/lib/data/equipos";
import { baseDeDatos } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { zCrearEquipo } from "@/lib/equipos-gestion";
import { DOC_SECCIONES } from "@/lib/modelo";
import { catalogoDeDocumento, seccionEnCatalogo } from "@/lib/secciones";
import type { AlumnoSeed, GrupoSeed } from "@/lib/seed-firestore";

function valor(nombre: string): string | undefined {
  const i = process.argv.indexOf(nombre);
  return i === -1 ? undefined : process.argv[i + 1];
}

const salida = valor("--salida");
const ensayo = process.argv.includes("--ensayo");
if (!salida && !ensayo) {
  console.error(
    "Uso: bun scripts/importar-alumnos.ts --salida <archivo.csv> [--ensayo]",
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

const leer = <T>(ruta: string): T =>
  JSON.parse(readFileSync(ruta, "utf8")) as T;
const alumnos = leer<AlumnoSeed[]>("data/seed/alumnos.json");
const grupos = leer<GrupoSeed[]>("data/seed/grupos.json");

// Las secciones tienen que existir en el catálogo (D323)
const [doc] = await db
  .select()
  .from(schema.config)
  .where(eq(schema.config.id, DOC_SECCIONES));
const catalogo = catalogoDeDocumento(doc !== undefined, doc?.datos);
if (!catalogo) {
  console.error("✗ El catálogo de secciones no valida.");
  process.exit(1);
}
const faltan = [...new Set(alumnos.map((a) => a.seccion))].filter(
  (s) => !seccionEnCatalogo(s, catalogo),
);
if (faltan.length) {
  console.error(
    `✗ Secciones que no están en el catálogo: ${faltan.join(", ")}. Créalas en Años y secciones.`,
  );
  process.exit(1);
}

// Equipos: el id del seed («5a-g1») → id real en la base (existente o nuevo)
const ahora = Date.now();
const idEquipo = new Map<string, string>();
for (const g of grupos) {
  const [existe] = await db
    .select({ id: schema.equipos.id })
    .from(schema.equipos)
    .where(
      and(
        eq(schema.equipos.nombre, g.nombre),
        eq(schema.equipos.seccion, g.seccion),
      ),
    );
  if (existe) {
    idEquipo.set(g.id, existe.id);
    console.log(`• Equipo ${g.nombre}: ya existía.`);
    continue;
  }
  if (ensayo) {
    idEquipo.set(g.id, `(nuevo ${g.id})`);
    console.log(`+ Equipo ${g.nombre} (${g.tema ?? "sin tema"})`);
    continue;
  }
  const d = zCrearEquipo.parse({
    nombre: g.nombre,
    tema: g.tema ?? "",
    seccion: g.seccion,
  });
  const r = await crearEquipoEnTransaccion(db, d, ahora);
  if (!r.ok) {
    console.error(`✗ Equipo ${g.nombre}: ${r.error}`);
    process.exit(1);
  }
  idEquipo.set(g.id, r.id);
  console.log(`+ Equipo ${g.nombre}`);
}

// El capitán del Excel entra primero a su equipo (D111); los sin equipo, al final
const capitanes = new Set(grupos.map((g) => g.capitanCedula).filter(Boolean));
const orden = [...alumnos].sort(
  (a, b) =>
    Number(capitanes.has(b.cedula)) - Number(capitanes.has(a.cedula)) ||
    Number(a.grupoId === null) - Number(b.grupoId === null),
);
const nombreGrupo = new Map(grupos.map((g) => [g.id, g.nombre]));

type Fila = {
  cedula: string;
  seccion: string;
  nombres: string;
  apellidos: string;
  equipo: string;
  capitan: boolean;
  password: string;
};
const filas: Fila[] = [];
let existentes = 0;
let sinEquipo = 0;
for (const a of orden) {
  const equipoId = a.grupoId ? (idEquipo.get(a.grupoId) ?? null) : null;
  const base = {
    cedula: a.cedula,
    seccion: a.seccion,
    nombres: a.nombres,
    apellidos: a.apellidos,
    equipo: a.grupoId ? (nombreGrupo.get(a.grupoId) ?? "") : "Sin equipo",
    capitan: capitanes.has(a.cedula),
  };
  if (ensayo) {
    filas.push({ ...base, password: "(ensayo)" });
    continue;
  }
  const cuenta = zEntradaCuenta.parse({
    rol: "estudiante",
    cedula: a.cedula,
    nombres: a.nombres,
    apellidos: a.apellidos,
    seccion: a.seccion,
    email: "",
  });
  let password: string;
  try {
    ({ passwordTemporal: password } = await crearCuentaCon(db, cuenta, ahora));
  } catch (e) {
    if (e instanceof ErrorCuenta && e.codigo === "existe") {
      existentes++;
      console.log(`• ${a.cedula} ya tiene cuenta: no se tocó.`);
      continue;
    }
    throw e;
  }
  const r = await incorporarAlumnoEnTransaccion(
    db,
    a.cedula,
    equipoId,
    Date.now(),
  );
  if (!r.ok) {
    sinEquipo++;
    console.error(
      `! ${a.cedula}: cuenta creada, pero no entró a su equipo (${r.error}).`,
    );
  }
  filas.push({ ...base, password });
}

const csv = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
const lineas = [
  "Sección,Cédula,Apellidos,Nombres,Equipo,Capitán,Contraseña temporal",
  ...[...filas]
    .sort(
      (x, y) =>
        x.seccion.localeCompare(y.seccion) ||
        x.apellidos.localeCompare(y.apellidos, "es"),
    )
    .map((f) =>
      [
        f.seccion,
        f.cedula,
        f.apellidos,
        f.nombres,
        f.equipo,
        f.capitan ? "sí" : "",
        f.password,
      ]
        .map(csv)
        .join(","),
    ),
];
if (salida) writeFileSync(salida, `﻿${lineas.join("\n")}\n`, "utf8");
console.log(
  `✓ ${filas.length} alumnos ${ensayo ? "por crear" : "creados"}, ${existentes} ya tenían cuenta, ` +
    `${sinEquipo} sin equipo por error, ${idEquipo.size} equipos.` +
    (salida ? ` Lista: ${salida}` : ""),
);
process.exit(0);
