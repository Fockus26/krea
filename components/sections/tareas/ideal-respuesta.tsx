// Piezas de la entrega ideal (tanda 11-14 Z2, D430–D435) que comparten la página del alumno y el
// formulario del profe: la respuesta (texto o imágenes ya firmadas, D195) y el recuadro del porqué.
// Sin estado ni efectos: valen en servidor y en cliente.
import { Sparkles } from "lucide-react";
import { RespuestaEnlace } from "@/components/krea/respuesta-enlace";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import {
  type AutorIdeal,
  autorIdealTexto,
  IMAGEN_NO_DISPONIBLE,
  type RespuestaIdeal,
  SIN_RESPUESTA_TEXTO,
} from "@/lib/ideal";
import { answerImageAlt } from "@/lib/question";
import { estiloDe } from "@/lib/vistas-estudiante";

/**
 * Avatar (alumno) o logo (equipo) con «Entrega de …», como el aviso del capitán; los profes, solo
 * el texto. El avatar es decorativo: el nombre va al lado.
 */
export function AutorFila({
  autor,
  logoUrl,
}: {
  autor: AutorIdeal;
  logoUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      {autor.tipo === "alumno" && autor.avatar ? (
        <UserAvatar
          estilo={estiloDe(autor.avatar.estilo)}
          seed={autor.avatar.semilla}
          nombre={autor.nombre}
          size={40}
          className="shrink-0"
        />
      ) : autor.tipo === "equipo" ? (
        <TeamLogo
          teamId={autor.equipoId}
          tema={autor.tema}
          src={logoUrl}
          size={40}
        />
      ) : null}
      <p className="text-label min-w-0 text-text">{autorIdealTexto(autor)}</p>
    </div>
  );
}

export function IdealRespuesta({
  respuesta,
  urls,
  nombre,
  numero,
}: {
  respuesta: RespuestaIdeal | null;
  /** Ruta → URL firmada (solo las de esta respuesta hacen falta). */
  urls: Readonly<Record<string, string>>;
  /** Autor, para el `alt` de las imágenes. */
  nombre: string;
  numero: number;
}) {
  if (!respuesta) {
    return <p className="text-small text-text-2">{SIN_RESPUESTA_TEXTO}</p>;
  }
  if (respuesta.tipo === "url") return <RespuestaEnlace url={respuesta.url} />;
  if (respuesta.tipo === "texto") {
    return (
      <p className="whitespace-pre-line rounded-nav bg-surface-2 px-3.5 py-3 text-callout text-text">
        {respuesta.texto}
      </p>
    );
  }
  const de = respuesta.rutas.length;
  const imagenes = respuesta.rutas.flatMap((ruta, i) => {
    const src = urls[ruta];
    return src
      ? [{ src, alt: answerImageAlt(nombre, numero, { n: i + 1, de }) }]
      : [];
  });
  if (imagenes.length === 0) {
    return <p className="text-small text-text-2">{IMAGEN_NO_DISPONIBLE}</p>;
  }
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {imagenes.map((img) => (
        <li key={img.src} className="max-w-full">
          {/* biome-ignore lint/performance/noImgElement: URLs firmadas de B2 (D046) */}
          <img
            src={img.src}
            alt={img.alt}
            className="aspect-4/3 w-55 max-w-full rounded-nav bg-surface-2 object-cover"
          />
        </li>
      ))}
    </ul>
  );
}

/** Recuadro del porqué (como el comentario del profe en el detalle de la nota). */
export function IdealPorque({
  titulo,
  children,
}: {
  titulo: string;
  children: string;
}) {
  return (
    <div className="icono-linea flex gap-2.5 rounded-nav bg-accent-soft px-3.5 py-3 text-callout text-text">
      <Sparkles
        aria-hidden="true"
        className="size-5 shrink-0 text-accent-ink"
      />
      <div className="min-w-0 flex-1">
        <p className="text-small-b">{titulo}</p>
        <p className="whitespace-pre-line">{children}</p>
      </div>
    </div>
  );
}
