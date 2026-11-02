// js/render.js
// Pinta la pantalla a partir del estado. No decide nada: solo muestra.
import { solicitud } from './estado.js';

export function render() {
  // Muestra la <section> del paso actual y oculta las demás.
  document.querySelectorAll('[data-paso]').forEach((s) => {
    s.hidden = Number(s.dataset.paso) !== solicitud.paso;
  });

  // Más adelante: renderStepper(); renderResumen();
  console.table({ paso: solicitud.paso });
}
