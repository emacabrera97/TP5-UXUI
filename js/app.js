// js/app.js
// Arranque, eventos y navegación. Acá solo se "escucha": la lógica vive en los otros archivos.
import {
  irAPaso, volver, siguiente, reiniciar,
  guardarCampo, leerCampo, esCampo, marcarTocado, cargarPlanes, restaurarGuardado,
} from './estado.js';
import { render, renderResumen, renderBoton, renderCampo } from './render.js';
import { formatearMoneda } from './cotizador.js';
import { aplicarMascara } from './mascaras.js';

// ---------- Clics: un solo "oyente" para todo el documento (delegación de eventos) ----------
document.addEventListener('click', (evento) => {
  // Los links de ejemplo (href="#") no tienen que saltar al inicio de la página.
  const link = evento.target.closest('a[href="#"]');
  if (link) evento.preventDefault();

  const elemento = evento.target.closest('[data-accion]');
  if (!elemento) return;

  switch (elemento.dataset.accion) {
    case 'iniciar':   irAPaso(1); break;       // CTA del catálogo -> Paso 1
    case 'inicio':    irAPaso(0); break;       // logo -> inicio (conserva los datos)
    case 'volver':    volver(); break;
    case 'siguiente': siguiente(); break;
    case 'reiniciar': reiniciar(); break;      // "Volver al inicio": borra todo
    case 'imprimir':  window.print(); break;
    case 'reintentar': irAPaso(4); break;      // error -> pago, con los datos cargados
    case 'cambiar-medio':
      irAPaso(4);
      document.querySelector('input[name="metodo"]:checked')?.focus();
      break;
  }
});

// ---------- Formularios: cada cambio actualiza el estado ----------
const checkout = document.getElementById('checkout');

// Los inputs devuelven strings: el valor del equipo hay que convertirlo a número.
function leerDelInput(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.name === 'valor') return Number(el.value.replace(/\D/g, ''));
  return el.value;
}

// Campos de texto: el error se muestra al SALIR del campo. Selects, radios y checkbox
// no tienen un "salir" útil, así que se consideran tocados apenas cambian.
const esTexto = (el) => el.matches('input:not([type="radio"]):not([type="checkbox"])');

checkout.addEventListener('input', (evento) => {
  const el = evento.target;
  if (!esCampo(el.name)) return;

  // Máscaras (tarjeta, vencimiento, CVV, DNI): se formatea el texto antes de guardarlo.
  if (esTexto(el)) {
    const conFormato = aplicarMascara(el.name, el.value);
    if (conFormato !== el.value) el.value = conFormato;
  }

  guardarCampo(el.name, leerDelInput(el));
  if (!esTexto(el)) marcarTocado(el.name);
  renderCampo(el.name);       // solo muestra error si el campo ya fue tocado (y lo borra apenas se corrige)
  renderResumen();            // solo el resumen: repintar todo movería el cursor al escribir
  renderBoton();              // habilita o deshabilita el botón
});

checkout.addEventListener('focusout', (evento) => {
  const el = evento.target;
  if (!esCampo(el.name)) return;

  // Al salir del campo "valor" lo mostramos con formato: 600000 -> $ 600.000
  if (el.name === 'valor') {
    const valor = leerCampo('valor');
    el.value = valor ? formatearMoneda(valor) : '';
  }
  if (esTexto(el)) {
    marcarTocado(el.name);
    renderCampo(el.name);
  }
});

// Enter dentro de un campo = intentar avanzar (valida todo y lleva el foco al primer error).
checkout.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter' && esTexto(evento.target)) {
    evento.preventDefault();
    siguiente();
  }
});

// Ningún formulario tiene que recargar la página.
document.addEventListener('submit', (evento) => evento.preventDefault());

// ---------- Arranque ----------
restaurarGuardado();      // si había una solicitud a medias (F5), se recupera
render();                 // primer pintado: pantalla de inicio
await cargarPlanes();     // fetch de data/planes.json
render();                 // repinta con los planes ya cargados
