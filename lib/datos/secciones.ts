import "server-only";
// Lecturas del catálogo de años y secciones (D317): Admin SDK detrás de `exigirSesion("profesor")`,
// una vez por request. Sin documento `config/secciones` vale `CATALOGO_INICIAL`; si no valida, se
// registra y también (como `parsear`). La pantalla Años y secciones (solo admin, D319) suma el uso
// de cada sección con los loaders del profe, ya cacheados.
import { cache } from "react";
import { exigirAdmin, exigirSesion } from "@/lib/dal";
import { db } from "@/lib/datos/comun";
import {
  ajustesTodos,
  entregasTodas,
  equiposTodos,
  tareasProfe,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { COL, DOC_SECCIONES } from "@/lib/modelo";
import {
  CATALOGO_INICIAL,
  type CatalogoSecciones,
  catalogoDeDocumento,
  type FilaAnio,
  filasSecciones,
  usoPorSeccion,
} from "@/lib/secciones";

export const catalogoSecciones = cache(async (): Promise<CatalogoSecciones> => {
  await exigirSesion("profesor");
  const snap = await db().collection(COL.config).doc(DOC_SECCIONES).get();
  const catalogo = catalogoDeDocumento(snap.exists, snap.data());
  if (catalogo) return catalogo;
  console.error(
    `[datos] ${COL.config}/${DOC_SECCIONES} no valida con el modelo`,
  );
  return CATALOGO_INICIAL;
});

/** Años y secciones con su uso (alumnos, profes, equipos, tareas, entregas, ajustes; D318). */
export const pantallaSecciones = cache(
  async (): Promise<{ catalogo: CatalogoSecciones; anios: FilaAnio[] }> => {
    await exigirAdmin();
    const [catalogo, usuarios, equipos, tareas, entregas, ajustes] =
      await Promise.all([
        catalogoSecciones(),
        usuariosTodos(),
        equiposTodos(),
        tareasProfe(),
        entregasTodas(),
        ajustesTodos(),
      ]);
    const usos = usoPorSeccion({
      usuarios,
      equipos,
      tareas,
      entregas,
      ajustes,
    });
    return { catalogo, anios: filasSecciones(catalogo, usos) };
  },
);
