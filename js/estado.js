// js/estado.js
// ÚNICA fuente de verdad: toda la información del flujo vive en el objeto `solicitud`.
// El HTML solo muestra lo que diga este objeto (nunca leas datos de un <span>).
import { render, renderErrores, enfocarCampo } from './render.js';
import { calcularCuota, FACTORES_ANTIGUEDAD } from './cotizador.js';
import { camposDelPaso, validarCampo } from './validaciones.js';

// Función que devuelve un estado "limpio". La usamos al arrancar y al reiniciar.
const estadoInicial = () => ({
  paso: 0,                 // 0 = inicio, 1..4 = checkout, 5 = éxito, 6 = error
  equipo: { marca: '', modelo: '', valor: 0, antiguedad: '' },
  plan: 'plus',
  titular: { nombre: '', apellido: '', dni: '', nacimiento: '',
             email: '', celular: '', terminos: false },
  pago: { metodo: 'credito', tarjeta: '', vencimiento: '', cvv: '', titular: '' },
  poliza: null,
});

export const solicitud = estadoInicial();

// Los planes vienen de data/planes.json. No son parte de la solicitud: son el catálogo.
export const catalogo = { planes: [], error: null };

// Campos que ya "se tocaron" (el usuario salió de ellos o intentó avanzar).
// Un campo vacío NO muestra error hasta que entra en este conjunto.
export const tocados = new Set();

// ---------- Navegación ----------

// Cambia de paso y vuelve a pintar. Siempre: primero el estado, después render().
export function irAPaso(n) {
  solicitud.paso = n;
  render();
}

// "Volver" lleva al paso anterior SIN tocar los datos (por eso no se pierden).
export function volver() {
  const { paso } = solicitud;
  if (paso >= 1 && paso <= 4) irAPaso(paso - 1);
  else if (paso === 6) irAPaso(4);          // desde el error, de vuelta al pago
}

// Botón principal. Antes de avanzar se revalida TODO el paso:
// si hay errores, se muestran todos y el foco va al primero.
export function siguiente() {
  const { paso } = solicitud;
  if (paso < 1 || paso > 4) return;

  const invalidos = camposInvalidos(paso);
  if (invalidos.length > 0) {
    invalidos.forEach((nombre) => tocados.add(nombre));
    renderErrores();
    enfocarCampo(invalidos[0]);
    return;
  }

  if (paso <= 3) {
    irAPaso(paso + 1);
  } else {
    // H4: acá va el pago simulado. Por ahora salta directo a la pantalla de éxito.
    irAPaso(5);
  }
}

// "Volver al inicio" desde el éxito: borra todo y arranca de cero.
export function reiniciar() {
  Object.assign(solicitud, estadoInicial());
  tocados.clear();
  irAPaso(0);
}

// ---------- Guardar y leer campos ----------
// Cada campo del formulario tiene un `name`. Esta tabla dice dónde vive ese dato en `solicitud`.
// [grupo, clave]  ->  solicitud[grupo][clave]   (grupo null: está en la raíz)
const RUTAS = {
  marca: ['equipo', 'marca'],
  modelo: ['equipo', 'modelo'],
  valor: ['equipo', 'valor'],
  antiguedad: ['equipo', 'antiguedad'],
  plan: [null, 'plan'],
  nombre: ['titular', 'nombre'],
  apellido: ['titular', 'apellido'],
  dni: ['titular', 'dni'],
  nacimiento: ['titular', 'nacimiento'],
  email: ['titular', 'email'],
  celular: ['titular', 'celular'],
  terminos: ['titular', 'terminos'],
  metodo: ['pago', 'metodo'],
  tarjeta: ['pago', 'tarjeta'],
  vencimiento: ['pago', 'vencimiento'],
  cvv: ['pago', 'cvv'],
  'titular-tarjeta': ['pago', 'titular'],
};

export const esCampo = (nombre) => nombre in RUTAS;

export function leerCampo(nombre) {
  const [grupo, clave] = RUTAS[nombre];
  return grupo ? solicitud[grupo][clave] : solicitud[clave];
}

export function guardarCampo(nombre, valor) {
  const [grupo, clave] = RUTAS[nombre];
  if (grupo) solicitud[grupo][clave] = valor;
  else solicitud[clave] = valor;
}

// ---------- Validación ----------

export function marcarTocado(nombre) {
  tocados.add(nombre);
}

// Mensaje de error de un campo según lo que dice el estado (o null si está bien).
export function mensajeDe(nombre) {
  return validarCampo(nombre, leerCampo(nombre));
}

// Campos del paso que hoy tienen error (estén tocados o no).
export function camposInvalidos(paso = solicitud.paso) {
  return camposDelPaso(paso).filter((nombre) => mensajeDe(nombre) !== null);
}

// ---------- Consultas sobre el estado ----------

export function planElegido() {
  return catalogo.planes.find((p) => p.id === solicitud.plan) ?? null;
}

// Cuota mensual de un plan para el equipo cargado. Devuelve null si faltan datos.
// Es el ÚNICO lugar que llama a calcularCuota(): así el precio del resumen
// y el de las cards de plan nunca pueden diferir.
export function cuotaDe(plan) {
  const { valor, antiguedad } = solicitud.equipo;
  const factor = FACTORES_ANTIGUEDAD[antiguedad];
  if (!plan || !valor || !factor) return null;
  return calcularCuota(valor, plan.tasaAnual, factor);
}

// ---------- Carga de datos ----------
export async function cargarPlanes() {
  try {
    const respuesta = await fetch('data/planes.json');
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    catalogo.planes = await respuesta.json();
    catalogo.error = null;
  } catch (error) {
    catalogo.error = error.message;
    console.error('No se pudieron cargar los planes:', error);
  }
}
