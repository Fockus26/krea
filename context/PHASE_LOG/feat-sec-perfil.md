# F04 ola 2 — Perfil (cloud, 2026-10-30)

- `components/sections/perfil/`: ProfileIdentity, ProfileData, AvatarPicker, AppearanceSettings, SecuritySettings.
- `lib/perfil.ts` y `lib/apariencia.ts` (el selector de `/secciones` ahora lo usa) con pruebas (`tests/unit/perfil.test.ts`); `lib/demo/perfil.ts`.
- Tokens del bloque Perfil (`--swatch-*`, `shadow-swatch`, `shadow-avatar-opt`); `cn` conoce `done`/`swatch`/`avatar-opt` (también arregla el orden de `shadow-done` de Tareas).
- Vista: `/secciones/perfil`.
- Decisión D090 (D091–D093 libres). Filas 71–73.
