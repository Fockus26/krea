# D126 · UI · `@container` de `ToggleGroup` y `Tabs` segmentado solo en modo `block` · Implemented

**Decision:** la raíz de `ToggleGroup` y de `Tabs variant="segmented"` lleva `@container` (`container-type: inline-size`) únicamente con `block`; el modo de ancho propio (`inline-flex w-fit`) no lo lleva. La regla `@max-seg` que oculta íconos solo aplica con `data-block`, así que no cambia nada en block.
**Why:** medido en Chromium con el CSS compilado: con `container-type: inline-size` el grupo `w-fit` colapsa a su padding (8 px) y las opciones de Tema y Acento (`/secciones` y Perfil) se desbordan y se solapan con el grupo vecino. Reportado por César.
**Discarded alternative:** quitar `@container` también de block — rompe el ocultado de íconos bajo 400 px (HANDOFF §8).
