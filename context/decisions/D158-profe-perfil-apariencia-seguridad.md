# D158 · Pages · Perfil del profesor: Apariencia y Seguridad bajo un `<h1>` «Perfil» · Implemented

**Decision:** `/profe/perfil` monta `PageHeader title="Perfil"` + `AppearanceSettings` + `SecuritySettings salirHref="/ingresar"` (D135). Sin identidad, «Tus datos» ni avatar (decisión de César, fase 05). Título «Perfil del profesor».
**Why:** `ProfileIdentity` ponía el `<h1>` en el perfil del estudiante; sin ella la página quedaba sin `<h1>` (WCAG 2.4.6, `check:paginas`).
**Discarded alternative:** mostrar el nombre del profesor como `<h1>` — dato no definido para el profesor (`USUARIO_PROFESOR` es de demo).
