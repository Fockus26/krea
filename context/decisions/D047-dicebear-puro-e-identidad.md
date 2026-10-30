# D047 · Components · `lib/dicebear.ts` y `lib/identity.ts`: URL de DiceBear, hash FNV-1a para el color de equipo e inicial por grafema · Implemented

**Decision:** `avatarUrl({estilo, seed})` arma `https://api.dicebear.com/9.x/{estilo}/svg?seed={encodeURIComponent(seed)}` y lanza con un estilo fuera de los 4 de D010. El color de respaldo de `TeamLogo` es `hash(teamId) % 6 + 1` con FNV-1a de 32 bits (`teamColorIndex`). La inicial es el primer grafema que sea letra o dígito (`Intl.Segmenter`, «Ñandú» → «Ñ»; sin letras, el primer grafema).
**Why:** lógica pura y probada en `tests/unit/identity.test.ts`; FNV-1a no necesita dependencias y reparte bien ids cortos como `5a-g3` (120 ids: ningún color por debajo de 9 ni por encima de 34).
**Discarded alternative:** `charCodeAt` sumado (`sum % 6`) — ids con las mismas letras en otro orden chocan siempre.
