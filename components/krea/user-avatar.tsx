import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarSize,
} from "@/components/ui/avatar";
import { avatarUrl, type DicebearEstilo } from "@/lib/dicebear";
import { initials } from "@/lib/identity";
import { cn } from "@/lib/utils";

export type UserAvatarProps = {
  /** `{estilo, seed}` del perfil (D010). */
  estilo: DicebearEstilo;
  seed: string;
  /** Nombre completo: da las iniciales del respaldo y, si `labelled`, el nombre accesible. */
  nombre: string;
  size?: AvatarSize;
  /** Anillo "tú/elegido". */
  ring?: boolean;
  /**
   * `false` (por defecto): el nombre está al lado, el avatar es decorativo (`alt` vacío).
   * `true`: el avatar es el único portador del nombre (p. ej. en una pila).
   */
  labelled?: boolean;
  className?: string;
};

/** Avatar de usuario: imagen DiceBear remota y, mientras carga o si falla, iniciales. */
export function UserAvatar({
  estilo,
  seed,
  nombre,
  size,
  ring,
  labelled = false,
  className,
}: UserAvatarProps) {
  return (
    <Avatar
      size={size}
      ring={ring}
      className={cn(className)}
      {...(labelled
        ? { role: "img", "aria-label": nombre }
        : { "aria-hidden": true })}
    >
      <AvatarImage src={avatarUrl({ estilo, seed })} alt="" />
      <AvatarFallback delayMs={0}>{initials(nombre)}</AvatarFallback>
    </Avatar>
  );
}
