import { UserAvatar } from "@/components/krea/user-avatar";
import type { DicebearEstilo } from "@/lib/dicebear";
import { avisoCapitanTexto } from "@/lib/tareas";

/**
 * Aviso para quien no es capitán en una tarea grupal (HANDOFF §3, D012): alerta info con el
 * avatar 32 del capitán en lugar del ícono. Informativa y presente al cargar: sin `role`.
 */
export function CaptainNotice({
  capitan,
  femenino = false,
}: {
  capitan: { nombre: string; estilo: DicebearEstilo; seed: string };
  /** Género del capitán (D075): por defecto "capitán". */
  femenino?: boolean;
}) {
  const { titulo, texto } = avisoCapitanTexto(capitan.nombre, femenino);
  return (
    <div className="text-callout flex gap-3 rounded-md bg-accent-soft p-4 text-text">
      <UserAvatar
        estilo={capitan.estilo}
        seed={capitan.seed}
        nombre={capitan.nombre}
        size={32}
        className="shrink-0"
      />
      <p className="min-w-0">
        <strong className="font-bold">{titulo}</strong> {texto}
      </p>
    </div>
  );
}
