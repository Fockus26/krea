# feat/ui-identidad — W6 (fase 03, ola 2)

2026-10-30 · PR #12 · Avatar (8 tamaños, anillo «tú», iniciales), `UserAvatar` (DiceBear + iniciales), `AvatarStack` (máx. 5, +n), `TeamLogo` (7 tamaños, 6 colores por hash FNV-1a → `--team-N`), `Logo` (4 anchos, `sobreAcento`) e `Isotipo` (5 tamaños) por máscara CSS sobre `public/brand/krea-logo-{ink,splash}.svg` · `lib/dicebear.ts`, `lib/identity.ts` (12 pruebas) · bloque «Identidad» en `globals.css` · D046–D049 · typecheck/lint/test (91)/build OK · sin QA visual.

Notas: sin `"use client"` en `avatar.tsx`/`team-logo.tsx` (con la directiva el build fallaba al importar `AVATAR_SIZES` desde servidor). `krea-logo.svg` sigue para favicon/OG, ya no lo usa `Logo`. Quitados del crudo: AvatarBadge, AvatarGroup, AvatarGroupCount.
