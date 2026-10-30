import type { ReactNode } from "react";

/** Eyebrow + h1 + bajada de las pantallas de auth (gap 8). */
export function AuthHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow ? <p className="text-eyebrow text-text-2">{eyebrow}</p> : null}
      <h1 className="text-h1 text-text">{title}</h1>
      {children ? <p className="text-body text-text-2">{children}</p> : null}
    </div>
  );
}
