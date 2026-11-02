// js/app.js
// Arranque, eventos y navegación. Acá solo se "escucha": la lógica vive en los otros archivos.
import {
  irAPaso, volver, siguiente, reiniciar,
  guardarCampo, leerCampo, esCampo, cargarPlanes,
} from './estado.js';
import { render, renderResumen } from './render.js';
import { formatearMoneda } from './cotizador.js';

// ---------- Botones temporales de desarrollo (los borramos al final) ----------
document.querySelectorAll('[data-ir]').forEach((boton) => {
  boton.addEventListener('click', () => irAPaso(Number(boton.dataset.ir)));
});

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

checkout.addEventListener('input', (evento) => {
  const el = evento.target;
  if (!esCampo(el.name)) return;
  guardarCampo(el.name, leerDelInput(el));
  renderResumen();            // solo el resumen: repintar todo movería el cursor al escribir
});

// Al salir del campo "valor" lo mostramos con formato: 600000 -> $ 600.000
checkout.addEventListener('focusout', (evento) => {
  if (evento.target.name !== 'valor') return;
  const valor = leerCampo('valor');
  evento.target.value = valor ? formatearMoneda(valor) : '';
});

// Enter dentro de un formulario no tiene que recargar la página.
document.addEventListener('submit', (evento) => evento.preventDefault());

// ---------- Arranque ----------
render();                 // primer pintado: pantalla de inicio
await cargarPlanes();     // fetch de data/planes.json
render();                 // repinta con los planes ya cargados
