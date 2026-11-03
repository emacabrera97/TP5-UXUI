// js/estado.js
// ÚNICA fuente de verdad: toda la información del flujo vive en el objeto `solicitud`.
// El HTML solo muestra lo que diga este objeto (nunca leas datos de un <span>).
import { render, renderBoton, renderErrores, enfocarCampo } from './render.js';
import { calcularCuota, FACTORES_ANTIGUEDAD } from './cotizador.js';
import { camposDelPaso, validarCampo } from './validaciones.js';
import { simularPago, generarPoliza } from './pago.js';

// Función que devuelve un estado "limpio". La usamos al arrancar y al reiniciar.
const estadoInicial = () => ({
  paso: 0,                 // 0 = inicio, 1..4 = checkout, 5 = éxito, 6 = error
  equipo: { marca: '', modelo: '', valor: 0, antiguedad: '' },
  plan: 'plus',
  titular: { nombre: '', apellido: '', dni: '', nacimiento: '',
             email: '', celular: '', terminos: false },
  pago: { metodo: 'credito', tarjeta: '', vencimiento: '', cvv: '', titular: '' },
  poliza: null,
  procesando: false,        // true mientras se espera la respuesta del pago
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
  guardarEnNavegador();
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
  if (paso < 1 || paso > 4 || solicitud.procesando) return;

  const invalidos = camposInvalidos(paso);
  if (invalidos.length > 0) {
    invalidos.forEach((nombre) => tocados.add(nombre));
    renderErrores();
    enfocarCampo(invalidos[0]);
    return;
  }

  if (paso <= 3) irAPaso(paso + 1);
  else pagar();
}

// Paso 4: pago simulado. El botón se deshabilita APENAS se hace clic (evita el doble pago)
// y solo vuelve a habilitarse si el pago falla y el usuario regresa al paso 4.
async function pagar() {
  solicitud.procesando = true;
  renderBoton();                                    // muestra "Procesando…" y deshabilita

  const resultado = await simularPago(solicitud.pago.tarjeta);
  solicitud.procesando = false;

  if (solicitud.paso !== 4) return;                 // el usuario se fue a otra pantalla mientras esperaba
  if (resultado.ok) {
    solicitud.poliza = generarPoliza();
    limpiarGuardado();                              // la solicitud terminó: no tiene sentido recuperarla
    irAPaso(5);                                     // éxito
  } else {
    irAPaso(6);                                     // error: los datos quedan guardados en `solicitud`
  }
}

// "Volver al inicio" desde el éxito: borra todo y arranca de cero.
export function reiniciar() {
  Object.assign(solicitud, estadoInicial());
  tocados.clear();
  limpiarGuardado();
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
  guardarEnNavegador();
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

// ---------- Persistencia (bonus) ----------
// La solicitud se guarda en localStorage para sobrevivir a un F5, y se borra al terminar.
// OJO: NUNCA se guardan número de tarjeta, vencimiento ni CVV. localStorage no está
// protegido: cualquier script de la página podría leerlo. Solo guardamos el medio de pago elegido.
const CLAVE_GUARDADO = 'cubri-solicitud';

function guardarEnNavegador() {
  try {
    if (solicitud.paso === 5) { limpiarGuardado(); return; }        // éxito: nada para recuperar
    const { paso, equipo, plan, titular, pago } = solicitud;
    const copia = {
      paso: paso === 6 ? 4 : paso,                                  // desde el error se retoma en el pago
      equipo, plan, titular,
      pago: { metodo: pago.metodo },
    };
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(copia));
  } catch {
    // Sin localStorage (modo privado, bloqueado): la app funciona igual, solo que sin guardar.
  }
}

export function limpiarGuardado() {
  try { localStorage.removeItem(CLAVE_GUARDADO); } catch { /* ver arriba */ }
}

// Copia solo las claves que ya existen en `destino` y que tienen el mismo tipo de dato.
function copiarConocidos(destino, origen) {
  if (!origen || typeof origen !== 'object') return;
  for (const clave of Object.keys(destino)) {
    if (typeof origen[clave] === typeof destino[clave]) destino[clave] = origen[clave];
  }
}

// Se llama una vez al arrancar. Devuelve true si había una solicitud guardada.
export function restaurarGuardado() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
    if (!guardado || typeof guardado !== 'object') return false;

    copiarConocidos(solicitud.equipo, guardado.equipo);
    copiarConocidos(solicitud.titular, guardado.titular);
    if (typeof guardado.plan === 'string') solicitud.plan = guardado.plan;
    if (['credito', 'debito'].includes(guardado.pago?.metodo)) solicitud.pago.metodo = guardado.pago.metodo;
    if (Number.isInteger(guardado.paso) && guardado.paso >= 0 && guardado.paso <= 4) solicitud.paso = guardado.paso;
    return true;
  } catch {
    return false;                                                    // JSON roto o sin acceso: se ignora
  }
}
