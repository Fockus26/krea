import {
  UserAvatar,
  type UserAvatarProps,
} from "@/components/krea/user-avatar";
import { type AvatarSize, avatarCva } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type AvatarStackItem = Pick<
  UserAvatarProps,
  "estilo" | "seed" | "nombre"
> & {
  id: string;
};

/** Pila de avatares (§2.5): máx. 5 visibles, solapados −8 px, anillo de 2 px de superficie, luego "+n". */
export function AvatarStack({
  items,
  max = 5,
  size = 40,
  label = "Integrantes",
  className,
}: {
  items: readonly AvatarStackItem[];
  /** Visibles antes del "+n". */
  max?: number;
  size?: AvatarSize;
  /** Nombre accesible del grupo. */
  label?: string;
  className?: string;
}) {
  const visibles = items.slice(0, max);
  const resto = items.length - visibles.length;

  return (
    <ul
      aria-label={label}
      className={cn(
        "m-0 flex list-none items-center p-0 -space-x-2",
        className,
      )}
    >
      {visibles.map((it) => (
        <li key={it.id} className="flex rounded-pill shadow-avatar-sep">
          <UserAvatar
            estilo={it.estilo}
            seed={it.seed}
            nombre={it.nombre}
            size={size}
            labelled
          />
        </li>
      ))}
      {resto > 0 ? (
        <li
          className={cn(
            avatarCva({ size }),
            "items-center justify-center bg-accent-soft-2 text-stack-count text-text shadow-avatar-sep",
          )}
        >
          <span aria-hidden="true">+{resto}</span>
          <span className="sr-only">
            {resto === 1 ? "1 integrante más" : `${resto} integrantes más`}
          </span>
        </li>
      ) : null}
    </ul>
  );
}
