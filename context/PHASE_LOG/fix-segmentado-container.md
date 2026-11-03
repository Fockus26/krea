# fix/segmentado-container (fase 05, ola 1, W1)
Causa medida: `@container` en ToggleGroup/Tabs segmentado no-block colapsaba el grupo a 8 px (también el de acentos de Perfil: `flex` pisa `inline-flex` pero `w-fit` queda). Arreglo: `@container` solo con `block`. Script `qa:segmentado`: 6 FAIL en main, todo PASS en la rama. D126–D127.
