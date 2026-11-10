# D348 · Data · Años de 1.º a 6.º (antes 1.º a 9.º) · Implementado

**Decisión:** `ANIO_MAX` pasa de 9 a 6; un año válido es 1–6 (`esNumeroAnio`, `zNumeroAnio`, `numerosLibres`).
**Por qué:** pedido de César (liceo de 6 años). Los datos guardados solo tienen 5A y 5C, caben.
**Alternativa descartada:** migrar documentos con años 7–9: no existen. `normalizarCatalogo` descartaría uno si apareciera.
