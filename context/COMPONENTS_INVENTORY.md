# Components Inventory — KREA

> Which components already exist, where they live, and what uses them. Check this table
> before creating a new component — one may already solve the same thing.

| Component | Path | Used in | Phase that closed it | Notes |
|---|---|---|---|---|
| Card (default/hero/flat) + CardHeader, CardTitle (`level`), CardDescription | `components/ui/card.tsx` | /componentes | F03 ola 2 (#10) | oscuro: borde sin sombra (`dark:`) |
| CardList / CardListItem | `components/ui/card.tsx` | /componentes | F03 ola 2 (#10) | `asChild` para fila enlace |
| Alert | `components/ui/alert.tsx` | /componentes | F03 ola 2 (#10) | info/ok/warn/err; rol en `lib/alert.ts` |
| Skeleton | `components/ui/skeleton.tsx` | /componentes | F03 ola 2 (#10) | `aria-hidden`, `animate-skeleton` |
| Table | `components/ui/table.tsx` | /componentes | F03 ola 2 (#10) | región nombrada (`label`), sticky, `numeric`, pista < 1024 |
| Separator | `components/ui/separator.tsx` | /componentes | F03 ola 2 (#10) | decorativo por defecto |
| EmptyState | `components/krea/empty-state.tsx` | /componentes | F03 ola 2 (#10) | `headingLevel` configurable |
| Badge | `components/ui/badge.tsx` | /componentes | F03 ola 2 (#11) | 9 variantes, `asChild` |
| StatusBadge / CaptainBadge | `components/krea/status-badge.tsx` | /componentes | F03 ola 2 (#11) | mapa puro de estados de tarea y entrega |
| GradePill | `components/krea/grade-pill.tsx` (lógica `lib/grade-pill.ts`) | /componentes | F03 ola 2 (#11) | sm/md/lg/xl + `total` 88×64/32 y `raspado` chip/icono/ninguno (D102, F04 ola 3, #30), Pendiente, Base, modo tabla |
| Tabs | `components/ui/tabs.tsx` | /componentes | F03 ola 2 (#11) | variantes line y segmented (+block) |
| ToggleGroup | `components/ui/toggle-group.tsx` | /componentes | F03 ola 2 (#11) | radiogroup, `block`; `Toggle` suelto en `toggle.tsx` sin uso |
| Avatar | `components/ui/avatar.tsx` | /componentes | F03 ola 2 (#12) | Radix; 8 tamaños, `ring`, `AVATAR_SIZES` |
| UserAvatar | `components/krea/user-avatar.tsx` | /componentes | F03 ola 2 (#12) | DiceBear (`lib/dicebear.ts`) + iniciales |
| AvatarStack | `components/krea/avatar-stack.tsx` | /componentes | F03 ola 2 (#12) | máx. 5, +n con texto accesible |
| TeamLogo | `components/krea/team-logo.tsx` | /componentes | F03 ola 2 (#12) | respaldo por hash → `--team-N` |
| Logo / Isotipo | `components/krea/logo.tsx` | /componentes | F03 ola 2 (#12) | máscara CSS, sigue el acento |
| Label | `components/ui/label.tsx` | Field | F03 ola 2 (#13) | 14/20 700 |
| Input | `components/ui/input.tsx` | /componentes | F03 ola 2 (#13) | `leading`/`trailing`/`success`, estados por atributo |
| Textarea | `components/ui/textarea.tsx` | /componentes | F03 ola 2 (#13) | `compact`, `counter` |
| Select | `components/ui/select.tsx` | /componentes | F03 ola 2 (#13) | popper, `animate-pop-*`, `z-popover`; portal sin tema del escenario |
| Field | `components/ui/field.tsx` | /componentes | F03 ola 2 (#13) | id y ARIA por contexto, `announce` |
| PasswordInput | `components/krea/password-input.tsx` | /componentes | F03 ola 2 (#13) | `autoComplete` obligatorio |
| CedulaInput | `components/krea/cedula-input.tsx` | /componentes | F03 ola 2 (#13) | `lib/cedula.ts` |
| NumberStepper | `components/krea/number-stepper.tsx` | /componentes | F03 ola 2 (#13) | `lib/stepper.ts`; lo reutiliza ScorePicker (ola 3) y Alumnos; `value: number \| null`, `aria-labelledby`, `emptyText` (D103, F04 ola 3, #30) |
| Dialog | `components/ui/dialog.tsx` | /componentes | F03 ola 2 (#14) | §2.13; < 768 arriba a 96; `overlayClasses` compartido (D037) |
| Sheet | `components/ui/sheet.tsx` | /componentes | F03 ola 2 (#14) | solo `side="bottom"` (D036); asa decorativa; zona segura |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | /componentes | F03 ola 2 (#14) | 240 px; `variant="destructive"`; casilla, radio y submenú |
| Toaster | `components/ui/sonner.tsx` | /componentes | F03 ola 2 (#14) | Sonner `unstyled` + tokens; montaje global en fase 05 (D035) |
| PortalScope | `components/ui/portal-scope.tsx` | dialog, sheet, dropdown-menu | F03 ola 2 (#14) | portales heredan tema y acento del contenedor (D034) |

| SideNav | `components/layout/side-nav.tsx` | /componentes; slot `sidebar` de AppShell | F03 ola 3 (#15) | logo, ítems del rol, contador Evaluar, UserCard |
| UserCard | `components/layout/user-card.tsx` | SideNav | F03 ola 3 (#15) | enlaza a Perfil, avatar 40 |
| TopBar | `components/layout/top-bar.tsx` | slot `topbar` | F03 ola 3 (#15) | logo o volver + título; avatar (est.) o Menú (prof.) |
| BottomNav | `components/layout/bottom-nav.tsx` | slot `bottomNav` | F03 ola 3 (#15) | 5 columnas, píldora de ícono |
| MenuSheet | `components/layout/menu-sheet.tsx` | TopBar del profesor | F03 ola 3 (#15) | Sheet bottom con botón «Menú»; `onSignOut` opcional |
| NavItemLink / NavIcon | `components/layout/{nav-item-link,nav-icon}.tsx` | SideNav, MenuSheet, BottomNav | F03 ola 3 (#15) | ítem con capa activa (opacidad 150 ms); tabla clave → lucide |
| RouteSideNav / RouteTopBar / RouteBottomNav | `components/layout/route-nav.tsx` | layouts fase 04+ | F03 ola 3 (#15) | cliente, `usePathname()` |
| nav (utilidad) | `lib/nav.ts` | navegación | F03 ola 3 (#15) | ítems por rol y superficie, `isActive`, `counterLabel`, `rolLabel` |
| QuestionHeader | `components/krea/question-header.tsx` | las 3 tarjetas de pregunta | F03 ola 3 (#16) | compartida; valor por variante (`lib/question.ts`); `level`; `titleId` |
| QuestionBar | `components/krea/question-bar.tsx` | QuestionCardDetail | F03 ola 3 (#16) | `aria-hidden`; `null` = Pendiente; `hideText`; `width` sin animar |
| QuestionCardDetail | `components/krea/question-card-detail.tsx` | `/notas/[tarea]` | F03 ola 3 (#16) | `<li>`; respuesta texto/imagen; comentario del profe |
| QuestionCardAnswer | `components/krea/question-card-answer.tsx` | `/tareas/[tarea]` | F03 ola 3 (#16) | `<li>`; texto /600 o ImageUpload; `bloqueadaPor` (D012) |
| QuestionCardReview | `components/krea/question-card-review.tsx` | `/profe/evaluar/[entrega]` | F03 ola 3 (#16) | `<li>`; slot `score` + `titleId`; comentario /280; imagen 280 + Ampliar |
| ImageViewer | `components/krea/image-viewer.tsx` | QuestionCardReview | F03 ola 3 (#16) | Dialog pantalla completa con disparador «Ampliar» propio |
| ImageUpload | `components/krea/image-upload.tsx` | QuestionCardAnswer | F03 ola 3 (#16) | controlada; valida y comprime (`lib/image.ts`); sin Storage (fase 07) |
| RankRow | `components/krea/rank-row.tsx` | RankList, /componentes | F03 ola 3 (#17) | estudiante y equipo vía `media`; top/normal/riesgo; `esTu`, `moving`, `efecto` |
| RankDelta | `components/krea/rank-delta.tsx` | RankRow | F03 ola 3 (#17) | chip 22, texto accesible «subió 2 puestos» |
| RankList | `components/krea/rank-list.tsx` | /componentes | F03 ola 3 (#17) | cliente; dos `<ol>` + separador de riesgo; FLIP interno |
| Podium | `components/krea/podium.tsx` | /componentes | F03 ola 3 (#17) | estudiantes y equipos; visual 2-1-3, DOM 1-2-3; empates |
| RankAnnouncer | `components/krea/rank-announcer.tsx` | /componentes (simulador) | F03 ola 3 (#17) | `<output aria-live>` único por página |
| useFlip | `components/krea/use-flip.ts` | RankList | F03 ola 3 (#17) | WAAPI solo transform; nada con reduced motion; math en `lib/flip.ts` |
| rank-row (utilidad) | `lib/rank-row.ts` | RankRow, RankList, Podium | F03 ola 3 (#17) | tipo de fila, textos accesibles, agrupación de anuncios |
| ScorePicker | `components/krea/score-picker.tsx` (+ `lib/score.ts`) | /componentes; QuestionCardReview (slot `score`) | F03 ola 3 (#18) | ≤ 6 radiogroup / > 6 stepper + atajos; teclas 0–9 y `,` con búfer 1 s |
| SumMeter | `components/krea/sum-meter.tsx` (+ `lib/meters.ts`) | /componentes; constructor | F03 ola 3 (#18) | `variant` bar/card; faltan/se pasó/exacta; `<output>` sr-only |
| LiveTotal | `components/krea/live-total.tsx` (+ `lib/meters.ts`) | /componentes; Evaluar entrega | F03 ola 3 (#18) | `scores[]` + `base`; `variant` bar/card; nota por `notaFinal`; tarjeta con `GradePill size="total"` y `raspado` ninguno/icono (#30) |
| MeterBar | `components/krea/meter-bar.tsx` | SumMeter, LiveTotal | F03 ola 3 (#18) | barra interna `aria-hidden`; lo único compartido (§8) |

<!-- One row per reusable component. Do not list single-section components that are not
     reused — those go in SECTION_INVENTORY.md as part of that section. -->
| Popover | `components/ui/popover.tsx` | /secciones/puntos (combobox «¿A quién?») | F04 ola 4 (W3, PR #34) | shadcn sobre Radix Popover; `PopoverAnchor` para comboboxes; panel del menú §2.13; respeta PortalScope (D034); el llamador previene el autofoco (D118) |
| StatusScreen + PantallaNotFound, Pantalla500, PantallaSinConexion | `components/estados/` | `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `/estados` | F06 W1 | HANDOFF §5b; D160–D162 |
| useEnLinea / useRutaActual | `components/krea/use-en-linea.ts` | `app/error.tsx`, `app/global-error.tsx`, 404 | F06 W1 | `useSyncExternalStore`; `true`/`null` en el servidor |
| OfflineBanner / OfflineBannerVista | `components/estados/offline-banner.tsx` | layouts de estudiante y profesor, `/estados` | F06 W2 | §5b; D164 |
| Cargando, SkEncabezado, SkPuntos, SkLista, SkRanking, SkTabla, SkPreguntas, SkMetricas | `components/estados/skeletons.tsx` | `components/estados/cargas.tsx` | F06 W3 | §2.14; D167 |
| CargaInicio, CargaLista, CargaDetalle, CargaRanking, CargaTabla, CargaPanel, CargaPerfil + CargaLenta | `components/estados/cargas.tsx`, `carga-lenta.tsx` | 19 `loading.tsx`, `/estados` | F06 W3 | D167 |
