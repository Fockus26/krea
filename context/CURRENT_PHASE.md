# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 06 — Estados · **Ola:** 2 de 2 (2026-11-03) · fase 05 cerrada (46 páginas, D126–D159) · **Track:** Product
Plan: `context/plans/phase-06-estados.md` · main @ 5f443ba
**Sin QA hasta el final** (César, 2026-10-29) · **sin servidor, solo build** (César, 2026-11-03).

| Unit | Branch | Status |
|---|---|---|
| Fase 05 completa (olas 1–3) | #35–#43 | merged (d4ea99f) |
| W1 pantallas de estado (404/500/sin conexión, galería) | #44 | merged (d2e2213) |
| W2 banner sin conexión | #45 | merged (5f443ba) |
| W3 skeletons (`loading.tsx` por ruta) | claude/busy-pascal-q9x6zf | PR |
| W4 vacíos, errores en pantalla y cierre | — | pendiente |

## Blocked (actions for César or external)

- Contraste de la tarjeta de puntos de Inicio (axe: 4,1:1 y 4,26:1 en desglose y chip, fase 04): decisión de diseño de César (backlog, alta).
- Perfil en la hoja Menú del profe (fila 97) y avatar/Menú junto al chip «En vivo» en Ranking móvil: confirmar.

- Género del capitán: el seed no lo trae; hoy «Capitán» por defecto (D075). ¿Campo editable por el profe o texto neutro?
- Enunciados de «Identidad de marca» sin tildes en el Excel (fila 64): ¿corregir en el Excel o en el import?
- Empate en la mejor nota de una tarea con premio (HANDOFF §9 #3): al estudiante no se le muestra ganador (D086, fila 69); el profe da el premio o lo comparte (D123–D124, «Compartido» provisional, fila 96).
- Confirmar si la base aplica a notas grupales por integrante (provisional: no, D014).
- Seed de 5C sin notas evaluadas: ranking 5C todo empatado en 0. ¿Datos de ejemplo para 5C o esperar a datos reales?
- HANDOFF §9 restantes (#3–#12: empates de premio, borrador compartido, entrega tardía…): se preguntan al llegar a su fase.
- Crear el proyecto Firebase (Auth, Firestore, Storage) y cargar las claves en Vercel.
- Emails reales de los estudiantes para "Olvidé mi contraseña" (checklist #3).
- Confirmar: indexación solo `/ingresar` (D023, provisional) y descripción de metadata (fila 22).
- Fijar `NEXT_PUBLIC_SITE_URL` en Vercel cuando haya dominio (fila 21).
- Instalar Java (emuladores de Firebase para `qa:local`).

## Next

- Fase 06: ola 2 (skeletons; vacíos y errores). Fase 09: bloquear o borrar `/secciones`, `/componentes`, `/tokens` (y comprobar que `/estados` da 404 en producción).
- Fase 07: esquema Firestore desde `data/seed/` + reglas de seguridad por rol.

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | Tokens | closed |
| 02 | Base layout | closed |
| 03 | Components | closed |
| 04 | Sections | closed |
| 05 | Pages | closed |
| 06 | States | in progress |
| 07 | Backend | pending |
| 08 | Responsive and polish | pending |
| 09 | Final QA | pending |
