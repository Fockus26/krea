import "server-only";
// Lectura de las opciones fijas de Ajustes de puntos (D375): Postgres detrás de
// `exigirSesion("profesor")`, una vez por request. Sin fila `config/motivos` vale
// `MOTIVOS_INICIALES`; si no valida, se registra y también. Con la versión que el diálogo manda
// al editar o borrar (D509).
import { cache } from "react";
import { exigirSesion } from "@/lib/dal";
import {
  leerMotivosConVersion,
  type MotivosConVersion,
} from "@/lib/data/motivos";
import { db } from "@/lib/datos/comun";
import { DOC_MOTIVOS } from "@/lib/modelo";
import { MOTIVOS_INICIALES, VERSION_MOTIVOS_INICIAL } from "@/lib/motivos";

export const catalogoMotivos = cache(async (): Promise<MotivosConVersion> => {
  await exigirSesion("profesor");
  const leidos = await leerMotivosConVersion(db());
  if (leidos) return leidos;
  console.error(`[datos] config/${DOC_MOTIVOS} no valida con el modelo`);
  // Una fila que no valida tampoco se puede editar (`invalida`): la versión da igual
  return { motivos: MOTIVOS_INICIALES, version: VERSION_MOTIVOS_INICIAL };
});
