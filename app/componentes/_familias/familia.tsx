import type * as React from "react";

/** Una familia de /componentes: `<section>` con su `h2` y ancla (`#id`). */
export function Familia({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 id={id} className="text-h2">
          {title}
        </h2>
        {description ? (
          <p className="text-body text-text-2">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

/** Grupo de muestras dentro de una familia, con su `h3`. */
export function Muestra({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-h4">{title}</h3>
      {children}
    </div>
  );
}

/** Familia que llega en una ola posterior de la fase 03. */
export function Pendiente({
  id,
  title,
  wave,
}: {
  id: string;
  title: string;
  wave: 2 | 3;
}) {
  return (
    <Familia id={id} title={title}>
      <p className="text-body text-text-2">Pendiente — fase 03, ola {wave}</p>
    </Familia>
  );
}
