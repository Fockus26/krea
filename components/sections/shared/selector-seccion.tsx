"use client";

import { useRouter } from "next/navigation";
import { SegmentedLinks } from "@/components/sections/ranking/segmented-links";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { agruparPorAnio, usaSegmentado } from "@/lib/secciones";
import { cn } from "@/lib/utils";

type Comun = {
  /** Nombre accesible del control («Sección»). Con `labelledBy`, el id del rótulo visible. */
  label?: string;
  labelledBy?: string;
  /** Secciones del catálogo, ordenadas (`seccionesDe`). */
  secciones: readonly string[];
  /** La sección elegida (o el valor de `todas`). */
  valor: string;
  /** Opción que junta todas, antes de las secciones (Panel: «Todas», D322). */
  todas?: { valor: string; texto: string };
  /** Texto de cada opción; por defecto, el código («5A»). Alumnos: «5A · 35». */
  texto?: (seccion: string) => string;
  disabled?: boolean;
  /** Segmentado de ancho completo que reparte sus opciones (`ToggleGroup block`, D444). */
  block?: boolean;
  className?: string;
};

/**
 * Selector de sección compartido (D322): con hasta `MAX_SEGMENTADO` (4) secciones, el segmentado
 * de siempre; con más, un `Select` agrupado por año («5.º año»), que no desborda a 320 px.
 * `hrefs` (sección → ruta, armado en el servidor): cada sección es otra ruta (Ranking, Equipos):
 * segmentado de enlaces con `aria-current` (D095) o un `Select` que navega. `onCambio`: filtra
 * en la página (Alumnos, Puntos, Panel): radiogroup (`ToggleGroup`, D090) o `Select`.
 */
export function SelectorSeccion(
  props: Comun &
    (
      | { hrefs: Readonly<Record<string, string>>; onCambio?: never }
      | { onCambio: (valor: string) => void; hrefs?: never }
    ),
) {
  const {
    label,
    labelledBy,
    secciones,
    valor,
    todas,
    texto = (s: string) => s,
    disabled,
    block,
    className,
  } = props;
  const router = useRouter();
  const opciones = [
    ...(todas ? [{ valor: todas.valor, texto: todas.texto }] : []),
    ...secciones.map((s) => ({ valor: s, texto: texto(s) })),
  ];
  const elegir = (v: string) => {
    if (v === valor) return;
    const destino = props.hrefs?.[v];
    if (props.hrefs) {
      if (destino) router.push(destino);
    } else props.onCambio?.(v);
  };

  if (usaSegmentado(secciones.length)) {
    if (props.hrefs) {
      const { hrefs } = props;
      return (
        <SegmentedLinks
          label={label ?? "Sección"}
          actual={valor}
          className={className}
          opciones={opciones.flatMap((o) => {
            const href = hrefs[o.valor];
            return href ? [{ clave: o.valor, texto: o.texto, href }] : [];
          })}
        />
      );
    }
    return (
      <ToggleGroup
        aria-label={labelledBy ? undefined : (label ?? "Sección")}
        aria-labelledby={labelledBy}
        value={valor}
        onValueChange={elegir}
        disabled={disabled}
        block={block}
        className={className}
      >
        {opciones.map((o) => (
          <ToggleGroupItem key={o.valor} value={o.valor} className="nums">
            {o.texto}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  }

  return (
    <Select value={valor} onValueChange={elegir} disabled={disabled}>
      <SelectTrigger
        aria-label={labelledBy ? undefined : (label ?? "Sección")}
        aria-labelledby={labelledBy}
        className={cn("w-full min-w-0 sm:w-60", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {todas ? (
          <>
            <SelectItem value={todas.valor}>{todas.texto}</SelectItem>
            <SelectSeparator />
          </>
        ) : null}
        {agruparPorAnio(secciones).map((g) => (
          <SelectGroup key={g.numero}>
            <SelectLabel>{g.nombre}</SelectLabel>
            {g.secciones.map((s) => (
              <SelectItem key={s} value={s} className="nums">
                {texto(s)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
