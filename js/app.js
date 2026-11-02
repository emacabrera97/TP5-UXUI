// js/app.js
// Punto de arranque: conecta los eventos y pinta el primer paso.
import { irAPaso } from './estado.js';
import { render } from './render.js';

// Botones temporales de desarrollo (los borramos al final).
document.querySelectorAll('[data-ir]').forEach((boton) => {
  boton.addEventListener('click', () => irAPaso(Number(boton.dataset.ir)));
});

// Un solo "oyente" para todos los clics con data-accion (delegación de eventos).
document.addEventListener('click', (evento) => {
  // Los links de ejemplo (href="#") no tienen que saltar al inicio de la página.
  const link = evento.target.closest('a[href="#"]');
  if (link) evento.preventDefault();

  const elemento = evento.target.closest('[data-accion]');
  if (!elemento) return;

  switch (elemento.dataset.accion) {
    case 'iniciar': irAPaso(1); break;   // CTA del catálogo -> Paso 1
    case 'inicio':  irAPaso(0); break;   // logo -> inicio
    // Más adelante (H2): 'volver', 'siguiente', 'reintentar', 'cambiar-medio'...
  }
});

// Primer pintado al cargar la página.
render();
