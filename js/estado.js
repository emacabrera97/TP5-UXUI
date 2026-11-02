// js/estado.js
// ÚNICA fuente de verdad: toda la información del flujo vive en este objeto.
// El HTML solo muestra lo que diga este objeto (nunca leas datos de un <span>).
import { render } from './render.js';

export const solicitud = {
  paso: 0,                 // 0 = inicio, 1..4 = checkout, 5 = éxito, 6 = error
  equipo: { marca: '', modelo: '', valor: 0, antiguedad: '' },
  plan: 'plus',
  titular: { nombre: '', apellido: '', dni: '', nacimiento: '',
             email: '', celular: '', terminos: false },
  pago: { metodo: 'credito', tarjeta: '', vencimiento: '', cvv: '', titular: '' },
  poliza: null,
};

// Cambia de paso y vuelve a pintar. Siempre: primero el estado, después render().
export function irAPaso(n) {
  solicitud.paso = n;
  render();
}
