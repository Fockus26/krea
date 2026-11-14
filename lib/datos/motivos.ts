import "server-only";
// Lectura de las opciones fijas de Ajustes de puntos (D375): Postgres detrás de
// `exigirSesion("profesor")`, una vez por request. Sin fila `config/motivos` vale
// `MOTIVOS_INICIALES`; si no valida, se registra y también.
import { cache } from "react";
import { exigirSesion } from "@/lib/dal";
import { leerMotivos } from "@/lib/data/motivos";
import { db } from "@/lib/datos/comun";
import { DOC_MOTIVOS } from "@/lib/modelo";
import { type CatalogoMotivos, MOTIVOS_INICIALES } from "@/lib/motivos";

export const catalogoMotivos = cache(async (): Promise<CatalogoMotivos> => {
  await exigirSesion("profesor");
  const motivos = await leerMotivos(db());
  if (motivos) return motivos;
  console.error(`[datos] config/${DOC_MOTIVOS} no valida con el modelo`);
  return MOTIVOS_INICIALES;
});
