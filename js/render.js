// js/render.js
// Pinta la pantalla a partir del estado. No decide nada: solo muestra.
import { solicitud } from './estado.js';

const $ = (selector) => document.querySelector(selector);

// Textos que cambian según el paso (salen del Figma).
const PASOS = {
  1: { titulo: 'Contanos sobre tu celular', tituloMovil: 'Cotizá tu seguro', boton: 'Ver planes' },
  2: { titulo: 'Elegí tu plan',             tituloMovil: 'Elegí tu plan',    boton: 'Continuar' },
  3: { titulo: 'Tus datos',                 tituloMovil: 'Tus datos',        boton: 'Continuar al pago' },
  4: { titulo: 'Pago',                      tituloMovil: 'Pago',             boton: 'Pagar y contratar' },
};
const ETAPAS = ['Cotizar', 'Plan', 'Datos', 'Pago'];

export function render() {
  const paso = solicitud.paso;
  const enCheckout = paso >= 1 && paso <= 4;

  // 1) Mostrar solo la <section> del paso actual.
  document.querySelectorAll('[data-paso]').forEach((s) => {
    s.hidden = Number(s.dataset.paso) !== paso;
  });

  // 2) Contenedores que existen solo en el checkout (pasos 1 a 4).
  $('#checkout').hidden = !enCheckout;
  $('#checkout').dataset.pasoActual = paso;       // el CSS lo usa para el resumen en mobile
  $('#stepper-wrap').hidden = !enCheckout;
  $('#encabezado-paso').hidden = !enCheckout;

  // 3) Elementos que solo se ven en ciertos pasos: data-solo-en="2 3 4".
  document.querySelectorAll('[data-solo-en]').forEach((el) => {
    el.hidden = !el.dataset.soloEn.split(' ').includes(String(paso));
  });

  renderTopbar();
  renderStepper();
  renderBoton();
}

// Barra superior mobile: logo (inicio) / flecha + título (pasos 1-4) / nada (éxito y error).
function renderTopbar() {
  const paso = solicitud.paso;
  $('#topbar-movil').hidden = paso >= 5;
  $('[data-topbar="logo"]').hidden = paso !== 0;
  $('[data-topbar="titulo"]').hidden = !(paso >= 1 && paso <= 4);
  if (PASOS[paso]) {
    $('#titulo-movil').textContent = PASOS[paso].tituloMovil;
    $('#titulo-desktop').textContent = PASOS[paso].titulo;
  }
}

// Stepper: cada etapa puede estar completa, activa o pendiente.
function renderStepper() {
  const paso = solicitud.paso;
  if (paso < 1 || paso > 4) return;

  const html = ETAPAS.map((nombre, i) => {
    const n = i + 1;
    const estado = n < paso ? 'completo' : n === paso ? 'activo' : 'pendiente';
    const marca = estado === 'completo'
      ? '<svg class="icon" width="12" height="12" viewBox="0 0 24 24" stroke-width="3" aria-hidden="true"><use href="#i-check"/></svg>'
      : n;
    const actual = estado === 'activo' ? ' aria-current="step"' : '';
    const barra = n < ETAPAS.length
      ? `<li class="barra" aria-hidden="true"${n < paso ? ' data-completa' : ''}></li>`
      : '';
    return `<li class="paso" data-estado="${estado}"${actual}><span class="dot">${marca}</span><span>${nombre}</span></li>${barra}`;
  }).join('');

  $('#stepper').innerHTML = html;
}

// Texto del botón principal según el paso.
function renderBoton() {
  const config = PASOS[solicitud.paso];
  if (config) $('#btn-siguiente').textContent = config.boton;
}
