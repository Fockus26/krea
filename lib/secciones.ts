// Catálogo de años y secciones (D317–D319). Puro: sin Firebase ni reloj; lo usan el servidor
// (`lib/datos/secciones.ts`, `lib/firebase/secciones.ts`), la pantalla Años y secciones y las
// pruebas. El código de una sección es el número del año + su letra: «5A». El catálogo vive en
// `config/secciones`; si el documento no existe vale `CATALOGO_INICIAL` (lo que hay en producción).
//
// Renombrar un año o una sección cambia su código, que está guardado en usuarios, claims,
// equipos, tareas, entregas, ajustes y el ranking: por eso editar y eliminar exigen que esté
// vacía (D318). Aquí solo se transforma el catálogo; quien escribe comprueba el uso.
import { zCatalogoSecciones } from "@/lib/modelo";

/** Años con las letras de sus secciones, ordenados (años y letras). */
export type CatalogoSecciones = ReadonlyArray<{
  numero: number;
  letras: readonly string[];
}>;

/** Sin documento `config/secciones`: 5.º año con A y C (D317). */
export const CATALOGO_INICIAL: CatalogoSecciones = [
  { numero: 5, letras: ["A", "C"] },
];

/**
 * Catálogo de lo leído en `config/secciones`: ausente → `CATALOGO_INICIAL`; presente con
 * `anios: []` → sin secciones (no resucita el inicial); que no valida → `null` (quien lee decide).
 */
export function catalogoDeDocumento(
  existe: boolean,
  data: unknown,
): CatalogoSecciones | null {
  if (!existe) return CATALOGO_INICIAL;
  const r = zCatalogoSecciones.safeParse(data);
  return r.success ? normalizarCatalogo(r.data.anios) : null;
}

export const ANIO_MIN = 1;
export const ANIO_MAX = 9;
/** Las letras de la A a la Z. */
export const LETRAS: readonly string[] = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i),
);

const RE_CODIGO = /^([1-9])([A-Z])$/;
const RE_SLUG = /^[1-9][a-z]$/;

export const esNumeroAnio = (n: unknown): n is number =>
  typeof n === "number" &&
  Number.isInteger(n) &&
  n >= ANIO_MIN &&
  n <= ANIO_MAX;

export const esLetra = (l: unknown): l is string =>
  typeof l === "string" && /^[A-Z]$/.test(l);

/* ---------- Códigos ---------- */

export function codigoSeccion(numero: number, letra: string): string {
  return `${numero}${letra}`;
}

export function partesSeccion(
  codigo: string,
): { numero: number; letra: string } | null {
  const m = RE_CODIGO.exec(codigo);
  if (!m?.[1] || !m[2]) return null;
  return { numero: Number(m[1]), letra: m[2] };
}

/** ¿Tiene forma de código de sección («5A»)? No mira si existe en el catálogo. */
export function esCodigoSeccion(v: unknown): v is string {
  return typeof v === "string" && RE_CODIGO.test(v);
}

/** «5.º año». */
export function nombreAnio(n: number): string {
  return `${n}.º año`;
}

/** Segmento de URL de una sección: «5A» → «5a». */
export function slugSeccion(codigo: string): string {
  return codigo.toLowerCase();
}

/** Sección de un segmento de URL («5a»), solo si existe en el catálogo. */
export function seccionDeSlug(
  slug: string,
  catalogo: CatalogoSecciones,
): string | null {
  if (!RE_SLUG.test(slug)) return null;
  const codigo = slug.toUpperCase();
  return seccionesDe(catalogo).includes(codigo) ? codigo : null;
}

function compararSecciones(a: string, b: string): number {
  const pa = partesSeccion(a);
  const pb = partesSeccion(b);
  if (pa && pb)
    return (
      pa.numero - pb.numero ||
      (pa.letra < pb.letra ? -1 : pa.letra > pb.letra ? 1 : 0)
    );
  // Lo que no es un código va al final, en orden de texto
  if (pa) return -1;
  if (pb) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Códigos ordenados por año y letra, sin repetir. */
export function ordenarSecciones(codigos: Iterable<string>): string[] {
  return [...new Set(codigos)].sort(compararSecciones);
}

/** Todas las secciones del catálogo, planas y ordenadas: `["4B", "5A", "5C"]`. */
export function seccionesDe(catalogo: CatalogoSecciones): string[] {
  return ordenarSecciones(
    catalogo.flatMap((a) => a.letras.map((l) => codigoSeccion(a.numero, l))),
  );
}

/** «4B, 5A y 5C» (ordenadas); una sola → «5A»; ninguna → «». */
export function listaSecciones(codigos: Iterable<string>): string {
  const xs = ordenarSecciones(codigos);
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

/* ---------- Transformar el catálogo ---------- */

export type ErrorSecciones =
  | "existe-anio"
  | "existe-seccion"
  | "no-existe"
  | "con-datos"
  | "invalida"
  | "red";

export type ResultadoSecciones =
  | { ok: true }
  | { ok: false; error: ErrorSecciones };

export type CambioCatalogo =
  | { ok: true; catalogo: CatalogoSecciones }
  | { ok: false; error: ErrorSecciones };

/** Años por número y letras de la A a la Z, sin repetir. Lo que no vale se descarta. */
export function normalizarCatalogo(
  catalogo: CatalogoSecciones,
): CatalogoSecciones {
  const porNumero = new Map<number, Set<string>>();
  for (const a of catalogo) {
    if (!esNumeroAnio(a.numero)) continue;
    const letras = porNumero.get(a.numero) ?? new Set<string>();
    for (const l of a.letras) if (esLetra(l)) letras.add(l);
    porNumero.set(a.numero, letras);
  }
  return [...porNumero.entries()]
    .sort(([a], [b]) => a - b)
    .map(([numero, letras]) => ({ numero, letras: [...letras].sort() }));
}

const anioDe = (catalogo: CatalogoSecciones, numero: number) =>
  catalogo.find((a) => a.numero === numero);

/** Año nuevo con sus letras iniciales (pueden ser ninguna). */
export function agregarAnio(
  catalogo: CatalogoSecciones,
  numero: number,
  letras: readonly string[] = [],
): CambioCatalogo {
  if (!esNumeroAnio(numero) || !letras.every(esLetra))
    return { ok: false, error: "invalida" };
  if (new Set(letras).size !== letras.length)
    return { ok: false, error: "invalida" };
  if (anioDe(catalogo, numero)) return { ok: false, error: "existe-anio" };
  return {
    ok: true,
    catalogo: normalizarCatalogo([...catalogo, { numero, letras }]),
  };
}

/** Cambia el número de un año: todas sus secciones cambian de código (5A → 4A). */
export function renombrarAnio(
  catalogo: CatalogoSecciones,
  de: number,
  a: number,
): CambioCatalogo {
  if (!esNumeroAnio(de) || !esNumeroAnio(a))
    return { ok: false, error: "invalida" };
  if (!anioDe(catalogo, de)) return { ok: false, error: "no-existe" };
  if (de === a) return { ok: true, catalogo: normalizarCatalogo(catalogo) };
  if (anioDe(catalogo, a)) return { ok: false, error: "existe-anio" };
  return {
    ok: true,
    catalogo: normalizarCatalogo(
      catalogo.map((x) => (x.numero === de ? { ...x, numero: a } : x)),
    ),
  };
}

export function quitarAnio(
  catalogo: CatalogoSecciones,
  numero: number,
): CambioCatalogo {
  if (!esNumeroAnio(numero)) return { ok: false, error: "invalida" };
  if (!anioDe(catalogo, numero)) return { ok: false, error: "no-existe" };
  return {
    ok: true,
    catalogo: normalizarCatalogo(catalogo.filter((x) => x.numero !== numero)),
  };
}

/** Sección nueva (letra sin usar) en un año que ya existe. */
export function agregarSeccion(
  catalogo: CatalogoSecciones,
  numero: number,
  letra: string,
): CambioCatalogo {
  if (!esNumeroAnio(numero) || !esLetra(letra))
    return { ok: false, error: "invalida" };
  const anio = anioDe(catalogo, numero);
  if (!anio) return { ok: false, error: "no-existe" };
  if (anio.letras.includes(letra))
    return { ok: false, error: "existe-seccion" };
  return {
    ok: true,
    catalogo: normalizarCatalogo(
      catalogo.map((x) =>
        x.numero === numero ? { ...x, letras: [...x.letras, letra] } : x,
      ),
    ),
  };
}

/** Cambia la letra de una sección dentro de su año (5B → 5D). */
export function renombrarSeccion(
  catalogo: CatalogoSecciones,
  codigo: string,
  letra: string,
): CambioCatalogo {
  const p = partesSeccion(codigo);
  if (!p || !esLetra(letra)) return { ok: false, error: "invalida" };
  const anio = anioDe(catalogo, p.numero);
  if (!anio?.letras.includes(p.letra)) return { ok: false, error: "no-existe" };
  if (letra === p.letra)
    return { ok: true, catalogo: normalizarCatalogo(catalogo) };
  if (anio.letras.includes(letra))
    return { ok: false, error: "existe-seccion" };
  return {
    ok: true,
    catalogo: normalizarCatalogo(
      catalogo.map((x) =>
        x.numero === p.numero
          ? { ...x, letras: x.letras.map((l) => (l === p.letra ? letra : l)) }
          : x,
      ),
    ),
  };
}

export function quitarSeccion(
  catalogo: CatalogoSecciones,
  codigo: string,
): CambioCatalogo {
  const p = partesSeccion(codigo);
  if (!p) return { ok: false, error: "invalida" };
  const anio = anioDe(catalogo, p.numero);
  if (!anio?.letras.includes(p.letra)) return { ok: false, error: "no-existe" };
  return {
    ok: true,
    catalogo: normalizarCatalogo(
      catalogo.map((x) =>
        x.numero === p.numero
          ? { ...x, letras: x.letras.filter((l) => l !== p.letra) }
          : x,
      ),
    ),
  };
}

/** Códigos de las secciones de un año (lo que se comprueba al renombrarlo o eliminarlo). */
export function seccionesDelAnio(
  catalogo: CatalogoSecciones,
  numero: number,
): string[] {
  return (anioDe(catalogo, numero)?.letras ?? []).map((l) =>
    codigoSeccion(numero, l),
  );
}

/** Números de año que aún no se usan (para «Nuevo año» y «Editar año»). */
export function numerosLibres(catalogo: CatalogoSecciones): number[] {
  const usados = new Set(catalogo.map((a) => a.numero));
  return Array.from({ length: ANIO_MAX }, (_, i) => i + ANIO_MIN).filter(
    (n) => !usados.has(n),
  );
}

/** Letras que aún no se usan en el año. */
export function letrasLibres(
  catalogo: CatalogoSecciones,
  numero: number,
): string[] {
  const usadas = new Set(anioDe(catalogo, numero)?.letras ?? []);
  return LETRAS.filter((l) => !usadas.has(l));
}

/* ---------- Operaciones de la pantalla (las Server Actions, D318) ---------- */

export type OperacionSecciones =
  | { tipo: "crearAnio"; numero: number; letras: readonly string[] }
  | { tipo: "editarAnio"; de: number; a: number }
  | { tipo: "eliminarAnio"; numero: number }
  | { tipo: "crearSeccion"; numero: number; letra: string }
  | { tipo: "editarSeccion"; codigo: string; letra: string }
  | { tipo: "eliminarSeccion"; codigo: string };

export function aplicarOperacion(
  catalogo: CatalogoSecciones,
  op: OperacionSecciones,
): CambioCatalogo {
  switch (op.tipo) {
    case "crearAnio":
      return agregarAnio(catalogo, op.numero, op.letras);
    case "editarAnio":
      return renombrarAnio(catalogo, op.de, op.a);
    case "eliminarAnio":
      return quitarAnio(catalogo, op.numero);
    case "crearSeccion":
      return agregarSeccion(catalogo, op.numero, op.letra);
    case "editarSeccion":
      return renombrarSeccion(catalogo, op.codigo, op.letra);
    case "eliminarSeccion":
      return quitarSeccion(catalogo, op.codigo);
  }
}

/**
 * Códigos que dejan de existir con la operación (antes de aplicarla): tienen que estar vacíos y
 * su `ranking/{codigo}` se borra (D318). Crear no quita ninguno; renombrar a lo mismo, tampoco.
 */
export function codigosQueSeVan(
  catalogo: CatalogoSecciones,
  op: OperacionSecciones,
): string[] {
  switch (op.tipo) {
    case "crearAnio":
    case "crearSeccion":
      return [];
    case "editarAnio":
      return op.de === op.a ? [] : seccionesDelAnio(catalogo, op.de);
    case "eliminarAnio":
      return seccionesDelAnio(catalogo, op.numero);
    case "editarSeccion":
      return partesSeccion(op.codigo)?.letra === op.letra ? [] : [op.codigo];
    case "eliminarSeccion":
      return [op.codigo];
  }
}

/** Lo que se guarda en `config/secciones` (sin el instante). */
export function anioDoc(catalogo: CatalogoSecciones): Array<{
  numero: number;
  letras: string[];
}> {
  return normalizarCatalogo(catalogo).map((a) => ({
    numero: a.numero,
    letras: [...a.letras],
  }));
}

/* ---------- Uso de una sección (D318) ---------- */

/** Qué hay guardado con el código de la sección. */
export type UsoSeccion = {
  alumnos: number;
  profesores: number;
  equipos: number;
  tareas: number;
  entregas: number;
  ajustes: number;
};

export const USO_VACIO: UsoSeccion = {
  alumnos: 0,
  profesores: 0,
  equipos: 0,
  tareas: 0,
  entregas: 0,
  ajustes: 0,
};

/** Solo una sección sin nada guardado se renombra o se elimina (D318). */
export function seccionVacia(uso: UsoSeccion): boolean {
  return Object.values(uso).every((n) => n === 0);
}

export function sumarUso(usos: Iterable<UsoSeccion>): UsoSeccion {
  const t = { ...USO_VACIO };
  for (const u of usos) {
    for (const k of Object.keys(t) as Array<keyof UsoSeccion>) t[k] += u[k];
  }
  return t;
}

const NOMBRES_USO: ReadonlyArray<readonly [keyof UsoSeccion, string, string]> =
  [
    ["alumnos", "alumno", "alumnos"],
    ["profesores", "profe asignado", "profes asignados"],
    ["equipos", "equipo", "equipos"],
    ["tareas", "tarea", "tareas"],
    ["entregas", "entrega", "entregas"],
    ["ajustes", "ajuste de puntos", "ajustes de puntos"],
  ];

/** Lo que tiene, en una línea: «12 alumnos, 3 equipos y 2 tareas»; vacía → «». */
export function usoPartes(uso: UsoSeccion): string {
  const partes = NOMBRES_USO.filter(([k]) => uso[k] > 0).map(
    ([k, uno, varios]) => `${uso[k]} ${uso[k] === 1 ? uno : varios}`,
  );
  if (partes.length <= 1) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

/** «Tiene 12 alumnos, 3 equipos y 2 tareas»; vacía → «Sin alumnos, equipos ni tareas». */
export function usoTexto(uso: UsoSeccion): string {
  return seccionVacia(uso)
    ? "Sin alumnos, equipos ni tareas"
    : `Tiene ${usoPartes(uso)}`;
}

/**
 * Uso de cada código con los documentos ya leídos (la pantalla, D318). Una tarea cuenta en cada
 * sección de su lista; un profe, en la que tenga asignada. Los códigos que no salen no tienen uso.
 */
export function usoPorSeccion(datos: {
  usuarios: ReadonlyArray<{ rol: string; seccion: string | null }>;
  equipos: ReadonlyArray<{ seccion: string }>;
  tareas: ReadonlyArray<{ secciones: readonly string[] }>;
  entregas: ReadonlyArray<{ seccion: string }>;
  ajustes: ReadonlyArray<{ seccion: string }>;
}): Map<string, UsoSeccion> {
  const m = new Map<string, UsoSeccion>();
  const sumar = (codigo: string, k: keyof UsoSeccion) => {
    const u = m.get(codigo) ?? { ...USO_VACIO };
    u[k] += 1;
    m.set(codigo, u);
  };
  for (const u of datos.usuarios) {
    if (u.seccion === null) continue;
    sumar(u.seccion, u.rol === "profesor" ? "profesores" : "alumnos");
  }
  for (const e of datos.equipos) sumar(e.seccion, "equipos");
  for (const t of datos.tareas)
    for (const s of new Set(t.secciones)) sumar(s, "tareas");
  for (const e of datos.entregas) sumar(e.seccion, "entregas");
  for (const a of datos.ajustes) sumar(a.seccion, "ajustes");
  return m;
}

export const usoDe = (usos: ReadonlyMap<string, UsoSeccion>, codigo: string) =>
  usos.get(codigo) ?? USO_VACIO;

/** Una sección en la pantalla Años y secciones. */
export type FilaSeccion = {
  codigo: string;
  letra: string;
  uso: UsoSeccion;
  vacia: boolean;
};

/** Un año en la pantalla: su uso es la suma del de sus secciones. */
export type FilaAnio = {
  numero: number;
  nombre: string;
  secciones: FilaSeccion[];
  uso: UsoSeccion;
  vacio: boolean;
};

/** Años y secciones del catálogo con su uso, en orden (D319). */
export function filasSecciones(
  catalogo: CatalogoSecciones,
  usos: ReadonlyMap<string, UsoSeccion>,
): FilaAnio[] {
  return normalizarCatalogo(catalogo).map((a) => {
    const secciones = a.letras.map((letra): FilaSeccion => {
      const codigo = codigoSeccion(a.numero, letra);
      const uso = usoDe(usos, codigo);
      return { codigo, letra, uso, vacia: seccionVacia(uso) };
    });
    const uso = sumarUso(secciones.map((s) => s.uso));
    return {
      numero: a.numero,
      nombre: nombreAnio(a.numero),
      secciones,
      uso,
      vacio: seccionVacia(uso),
    };
  });
}

/** Eyebrow: «2 años · 5 secciones». */
export function resumenCatalogo(catalogo: CatalogoSecciones): string {
  const anios = catalogo.length;
  const secciones = seccionesDe(catalogo).length;
  return `${anios} ${anios === 1 ? "año" : "años"} · ${secciones} ${secciones === 1 ? "sección" : "secciones"}`;
}

/* ---------- Textos (PROVISIONAL: CONTENT_CHECKLIST fila 166) ---------- */

export function errorSeccionesTexto(e: ErrorSecciones, que?: string): string {
  switch (e) {
    case "existe-anio":
      return `Ya existe ${que ?? "ese año"}.`;
    case "existe-seccion":
      return `Ya existe ${que ?? "esa sección"}.`;
    case "no-existe":
      return "Ya no existe. Recarga la página.";
    case "con-datos":
      return "Ya tiene datos guardados, así que no se puede cambiar. Recarga la página para ver cuáles.";
    case "invalida":
      return "Revisa los datos: algo no se pudo guardar así.";
    case "red":
      return "Se perdió la conexión. No cambiamos nada: vuelve a intentarlo.";
  }
}

/**
 * Letras iniciales de «Nuevo año» escritas a mano: «A, B, C», «a b c» o «ABC». Vacío = ninguna.
 * Ordenadas; repetidas o con algo que no sea una letra de la A a la Z → el error.
 */
export function letrasDeTexto(
  texto: string,
): { ok: true; letras: string[] } | { ok: false; error: string } {
  const trozos = texto
    .toUpperCase()
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (trozos.some((t) => !/^[A-Z]+$/.test(t)))
    return {
      ok: false,
      error:
        "Escribe solo letras de la A a la Z, separadas por comas: A, B, C.",
    };
  const letras = trozos.flatMap((t) => [...t]);
  const repetida = letras.find((l, i) => letras.indexOf(l) !== i);
  if (repetida)
    return { ok: false, error: `La letra ${repetida} está repetida.` };
  return { ok: true, letras: [...letras].sort() };
}

/** Por qué no se puede renombrar o eliminar: lo que tiene y la regla (D318). */
export function bloqueoTexto(uso: UsoSeccion, que: "año" | "sección"): string {
  return `${usoTexto(uso)}. Solo se cambia o se elimina ${que === "año" ? "un año cuyas secciones están vacías" : "una sección vacía"}: así no se pierde ni se desordena nada de lo guardado.`;
}
