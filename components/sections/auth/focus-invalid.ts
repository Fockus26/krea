/**
 * Tras un envío con errores, lleva el foco al primer campo inválido: el lector lee su etiqueta y
 * el error por `aria-describedby`. Por eso los `Field` de estos formularios van con
 * `announce={false}`: el mensaje cambia mientras se corrige y no debe anunciarse en cada tecla.
 * Espera un cuadro para que React haya pintado `aria-invalid`.
 */
export function focusPrimerInvalido(form: HTMLFormElement) {
  requestAnimationFrame(() => {
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}
