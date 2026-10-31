# Current Phase — KREA

> **A board, not a diary.** ≤ 60 lines / 4 KB. Local file: backed up with
> `bun run context:backup` (branch `context-state`).

## Now

**Phase:** 05 — Páginas · **Ola:** sin empezar (se divide en olas con `orchestrate` §0) · **Track:** Product
**Fase 04 cerrada el 2026-10-30** (#20–#34, main @ 7146ff6; plan `context/plans/phase-04-secciones.md`, notas en «Para la fase 05»).
**Sin QA hasta el final del proyecto** (César, 2026-10-29). Pool wt1–wt5 libre.

| Unit | Branch | Status |
|---|---|---|
| Fase 04 · olas 1–4 (todas las secciones en `/secciones/*`) | varias | merged (#20–#34) |

## Blocked (actions for César or external)

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

- Fase 05 (páginas), en otra sesión: `/orchestrate fase 05 (páginas). Fase: phases/05-PAGES.md · notas en «Para la fase 05» de context/plans/phase-04-secciones.md`
- Fase 05: topbar móvil (chip «En vivo», X de Evaluar), Toaster global sin tapar la `ActionBar` (backlog).
- Fase 07: esquema Firestore desde `data/seed/` + reglas de seguridad por rol.

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | Tokens | closed |
| 02 | Base layout | closed |
| 03 | Components | closed |
| 04 | Sections | closed |
| 05 | Pages | next |
| 06 | States | pending |
| 07 | Backend | pending |
| 08 | Responsive and polish | pending |
| 09 | Final QA | pending |
