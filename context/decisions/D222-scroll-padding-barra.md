# D222 · Responsive · Por debajo de lg el documento reserva la barra inferior al desplazar el foco · Implemented

**Decision:** `html { scroll-padding-bottom: calc(var(--h-bnav) + env(safe-area-inset-bottom, 0px) + 1rem) }` con `(width < 64rem) and (height >= 30rem)`. Solo abajo: arriba ya están `scroll-margin-top` en `[id]` (anclas) y el sticky de la topbar, y un `scroll-padding-top` general bajaría las anclas el doble. Con poca altura la barra no es fija (D218). El constructor y Evaluar conservan su regla propia, más específica.
**Why:** QA de la versión 1 (D-M4): con Tab en móvil, «Aventurero» y «Sistema» de `/perfil` quedaban 100 % bajo la barra inferior. Falla WCAG 2.4.7 en la práctica, porque el foco no se ve.
