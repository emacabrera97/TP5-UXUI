// js/app.js
// Punto de arranque: conecta los eventos y pinta el primer paso.
import { irAPaso } from './estado.js';
import { render } from './render.js';

// Botones temporales de desarrollo (los borramos al final).
document.querySelectorAll('[data-ir]').forEach((boton) => {
  boton.addEventListener('click', () => irAPaso(Number(boton.dataset.ir)));
});

// Primer pintado al cargar la página.
render();
