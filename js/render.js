// js/render.js
// Pinta la pantalla a partir del estado. No decide nada: solo muestra.
import {
  solicitud, catalogo, tocados, planElegido, cuotaDe,
  esCampo, leerCampo, mensajeDe, camposInvalidos,
} from './estado.js';
import { formatearMoneda } from './cotizador.js';
import { camposDelPaso, ETIQUETAS } from './validaciones.js';

const $ = (selector) => document.querySelector(selector);

// Textos que cambian según el paso (salen del Figma).
const PASOS = {
  1: { titulo: 'Contanos sobre tu celular', tituloMovil: 'Cotizá tu seguro', boton: 'Ver planes' },
  2: { titulo: 'Elegí tu plan',             tituloMovil: 'Elegí tu plan',    boton: 'Continuar' },
  3: { titulo: 'Tus datos',                 tituloMovil: 'Tus datos',        boton: 'Continuar al pago' },
  4: { titulo: 'Pago',                      tituloMovil: 'Pago',             boton: 'Pagar y contratar' },
};
const ETAPAS = ['Cotizar', 'Plan', 'Datos', 'Pago'];

// Se llama cada vez que cambia el paso (o llegan los planes).
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
  if (paso === 2) renderPlanes();
  renderFormularios();      // rellena los inputs desde el estado (así "Volver" no pierde datos)
  renderErrores();          // errores de los campos que ya se tocaron
  renderResumen();
  if (paso === 5) renderExito();

  window.scrollTo(0, 0);    // cada paso arranca arriba de todo
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
    const marca = estado === 'completo' ? iconoSvg('i-check', 12, 3) : n;
    const actual = estado === 'activo' ? ' aria-current="step"' : '';
    const barra = n < ETAPAS.length
      ? `<li class="barra" aria-hidden="true"${n < paso ? ' data-completa' : ''}></li>`
      : '';
    return `<li class="paso" data-estado="${estado}"${actual}><span class="dot">${marca}</span><span>${nombre}</span></li>${barra}`;
  }).join('');

  $('#stepper').innerHTML = html;
}

// Botón principal: texto según el paso y, en los pasos 1 y 3, deshabilitado hasta que todo sea válido.
// Un botón deshabilitado necesita una explicación: se lista qué campos faltan.
const lista = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });

export function renderBoton() {
  const paso = solicitud.paso;
  const config = PASOS[paso];
  if (!config) return;

  const { procesando } = solicitud;
  const boton = $('#btn-siguiente');
  boton.textContent = procesando ? 'Procesando…' : config.boton;

  const faltan = paso === 1 || paso === 3 ? camposInvalidos(paso) : [];
  boton.disabled = procesando || faltan.length > 0;
  boton.setAttribute('aria-busy', String(procesando));
  // Mientras se procesa el pago tampoco se puede volver atrás.
  document.querySelectorAll('[data-accion="volver"]').forEach((b) => { b.disabled = procesando; });

  const ayuda = faltan.length > 0
    ? `Falta completar: ${lista.format(faltan.map((nombre) => ETIQUETAS[nombre]))}`
    : '';
  document.querySelectorAll('[data-ayuda-boton]').forEach((el) => {
    el.hidden = faltan.length === 0;
    el.textContent = ayuda;
  });
}

// ---------- Errores en línea ----------
// Muestra u oculta el error de UN campo. Solo lo muestra si el campo ya se tocó.
// Cada mensaje tiene id="<name>-error" y vive dentro del .field del campo.
export function renderCampo(nombre) {
  const aviso = document.getElementById(`${nombre}-error`);
  if (!aviso) return;

  const mensaje = mensajeDe(nombre);
  const mostrar = tocados.has(nombre) && mensaje !== null;
  const campo = aviso.closest('.field');

  campo.toggleAttribute('data-invalid', mostrar);       // Basecoat pinta borde y texto en rojo
  aviso.hidden = !mostrar;
  if (mostrar) aviso.textContent = mensaje;
  campo.querySelectorAll('[name]').forEach((el) => {
    if (mostrar) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  });

  // Si el campo tiene texto de ayuda (ej.: rango del valor), se oculta mientras hay error.
  const ayuda = document.getElementById(`${nombre}-ayuda`);
  if (ayuda) ayuda.hidden = mostrar;
}

// Repinta los errores de todos los campos del paso actual.
export function renderErrores() {
  camposDelPaso(solicitud.paso).forEach(renderCampo);
}

// Lleva el foco a un campo (para que el teclado y los lectores de pantalla vayan al error).
export function enfocarCampo(nombre) {
  const el = document.querySelector(`#checkout [name="${nombre}"]`);
  if (!el) return;
  el.focus();
  el.scrollIntoView?.({ block: 'center' });
}

// Rellena cada input con lo que dice el estado. Es lo que evita que
// "al volver atrás se borren los datos".
function renderFormularios() {
  document.querySelectorAll('#checkout [name]').forEach((el) => {
    if (!esCampo(el.name)) return;
    const valor = leerCampo(el.name);
    if (el.type === 'checkbox') el.checked = Boolean(valor);
    else if (el.type === 'radio') el.checked = el.value === valor;
    else if (el.name === 'valor') el.value = valor ? formatearMoneda(valor) : '';
    else el.value = valor ?? '';
  });
}

// ---------- Planes (paso 2) ----------
const iconoSvg = (id, tamano, trazo = 2) =>
  `<svg class="icon" width="${tamano}" height="${tamano}" viewBox="0 0 24 24" stroke-width="${trazo}" aria-hidden="true"><use href="#${id}"/></svg>`;

// Cada card lista 3 coberturas: con ✓ si el plan la incluye y con ✗ si no.
function filasCoberturas(plan) {
  const tiene = (cobertura) => plan.coberturas.includes(cobertura);
  const tieneRotura = tiene('Rotura total') || tiene('Rotura de pantalla');
  return [
    ['Robo con violencia', tiene('Robo con violencia')],
    [tiene('Rotura total') ? 'Rotura total' : 'Rotura de pantalla', tieneRotura],
    ['Hurto / pérdida', tiene('Hurto / pérdida')],
  ];
}

function renderPlanes() {
  const contenedor = $('#planes');
  const leyenda = '<legend class="sr-only">Elegí tu plan</legend>';

  if (catalogo.error || catalogo.planes.length === 0) {
    contenedor.innerHTML = leyenda + `
      <div class="alert alert-aviso lg:col-span-3" role="alert">
        <p>No pudimos cargar los planes. Abrí el sitio con Live Server (no con doble clic) e intentá de nuevo.</p>
      </div>`;
    return;
  }

  contenedor.innerHTML = leyenda + catalogo.planes.map((plan) => {
    const cuota = cuotaDe(plan);
    const precio = cuota === null ? '$ —' : formatearMoneda(cuota);
    const marcado = plan.id === solicitud.plan ? ' checked' : '';
    const insignia = plan.recomendado ? ' <span class="badge badge-recomendado">Recomendado</span>' : '';
    const coberturas = filasCoberturas(plan)
      .map(([texto, incluida]) =>
        `<li${incluida ? '' : ' data-no'}>${iconoSvg(incluida ? 'i-check' : 'i-x', 14, 3)}${texto}</li>`)
      .join('');

    return `
      <label class="plan-card">
        <input type="radio" name="plan" value="${plan.id}" class="sr-only"${marcado}>
        <span class="plan-head">
          <span class="plan-nombre">${plan.nombre}${insignia}</span>
          <span class="plan-radio" aria-hidden="true"></span>
        </span>
        <span class="plan-precio"><strong>${precio}</strong><span>/ mes</span></span>
        <ul class="plan-coberturas">${coberturas}</ul>
      </label>`;
  }).join('');
}

// ---------- Resumen (se genera UNA sola vez, desde el estado) ----------
// Escribe un texto en todos los elementos que tengan data-ref="nombre".
function escribir(ref, texto) {
  document.querySelectorAll(`[data-ref="${ref}"]`).forEach((el) => { el.textContent = texto; });
}

// Se exporta porque también se llama al escribir en un campo (sin repintar todo).
export function renderResumen() {
  const { equipo, titular } = solicitud;
  const plan = planElegido();
  const cuota = plan ? cuotaDe(plan) : null;

  const nombreEquipo = [equipo.marca, equipo.modelo].filter(Boolean).join(' ') || '—';
  const nombreTitular = [titular.nombre, titular.apellido].filter(Boolean).join(' ') || '—';
  const total = cuota === null ? '—' : formatearMoneda(cuota);
  const nombrePlan = plan ? plan.nombre : '—';

  escribir('seguro', 'Celular');
  escribir('seguro-plan', ` · Plan ${nombrePlan}`);
  escribir('equipo', nombreEquipo);
  escribir('valor', equipo.valor ? formatearMoneda(equipo.valor) : '—');
  escribir('plan', nombrePlan);
  escribir('titular', nombreTitular);
  escribir('total', total);
  // Barra de mobile (paso 2): "Plan Plus · Galaxy A55"  /  "$ 3.000/mes"
  escribir('barra-plan', `Plan ${nombrePlan} · ${equipo.modelo || '—'}`);
  escribir('barra-total', cuota === null ? '—' : `${total}/mes`);
}

// ---------- Pantalla de éxito ----------
function renderExito() {
  const { titular } = solicitud;
  escribir('nombre', titular.nombre || '—');
  escribir('email', titular.email || '—');
  escribir('poliza', solicitud.poliza ?? '—');
  escribir('vigencia', new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
}
