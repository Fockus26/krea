import { Crown } from "lucide-react";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DicebearEstilo } from "@/lib/dicebear";

/**
 * Identidad de Perfil (HANDOFF §3 Perfil §1): card hero; avatar 96 con anillo; eyebrow
 * "Mi perfil"; el `<h1>` (tamaño h2, envuelve) con el nombre completo; chips C.I. (con puntos
 * de miles), Sección, Capitán si aplica y Base si ≠ 20.
 */
export function ProfileIdentity({
  nombre,
  estilo,
  seed,
  cedula,
  seccion,
  capitan,
  base,
}: {
  nombre: string;
  estilo: DicebearEstilo;
  seed: string;
  /** "C.I. 45.009.896". */
  cedula: string;
  /** "Sección 5A". */
  seccion: string;
  /** Texto del chip ("Capitán · 5A-G2", D075) o nada si no es capitán. */
  capitan?: string;
  /** "Base 15" o nada. */
  base?: string | null;
}) {
  return (
    <Card variant="hero" className="flex flex-wrap items-center gap-5">
      <UserAvatar
        estilo={estilo}
        seed={seed}
        nombre={nombre}
        size={96}
        ring
        className="shrink-0"
      />
      <div className="flex min-w-[min(--spacing(50),100%)] flex-1 flex-col gap-2">
        <p className="text-eyebrow text-text-2">Mi perfil</p>
        <h1 className="text-h2 text-text">{nombre}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral" className="nums">
            {cedula}
          </Badge>
          <Badge variant="neutral">{seccion}</Badge>
          {capitan ? (
            <Badge variant="cap">
              <Crown aria-hidden="true" />
              {capitan}
            </Badge>
          ) : null}
          {base ? <Badge variant="base">{base}</Badge> : null}
        </div>
      </div>
    </Card>
  );
}
