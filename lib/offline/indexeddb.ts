// Adaptador IndexedDB de la cola sin conexión (D292). Una base `krea-offline` con un almacén
// `cola` (clave `opId`). Los Blob de las imágenes se guardan tal cual: IndexedDB los acepta en
// todos los navegadores de la app (Safari iOS 14+).
import type { AlmacenCola, OpCola } from "@/lib/offline/cola";

const BASE = "krea-offline";
const ALMACEN = "cola";
const VERSION = 1;

/** El navegador no deja guardar más (cuota llena): la UI avisa «No hay espacio» (D295). */
export class SinEspacioError extends Error {
  constructor() {
    super("Sin espacio para la cola");
    this.name = "SinEspacioError";
  }
}

function esCuota(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

let abierta: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  abierta ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(BASE, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(ALMACEN))
        req.result.createObjectStore(ALMACEN, { keyPath: "opId" });
    };
    req.onsuccess = () => {
      // Otra pestaña con una versión nueva pide cerrar: se cierra y la próxima vez se reabre
      req.result.onversionchange = () => {
        req.result.close();
        abierta = null;
      };
      resolve(req.result);
    };
    req.onerror = () => {
      abierta = null;
      reject(req.error);
    };
  });
  return abierta;
}

async function transaccion<T>(
  modo: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrir();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(ALMACEN, modo);
    const req = fn(tx.objectStore(ALMACEN));
    tx.oncomplete = () => resolve(req.result);
    const fallo = () => {
      const e = tx.error ?? req.error;
      reject(esCuota(e) ? new SinEspacioError() : e);
    };
    tx.onerror = fallo;
    tx.onabort = fallo;
  });
}

export function hayIndexedDB(): boolean {
  return typeof indexedDB !== "undefined";
}

export const almacenIndexedDB: AlmacenCola = {
  todas: () =>
    transaccion("readonly", (s) => s.getAll() as IDBRequest<OpCola[]>),
  guardar: async (op) => {
    await transaccion("readwrite", (s) => s.put(op));
  },
  quitar: async (opId) => {
    await transaccion("readwrite", (s) => s.delete(opId));
  },
};
