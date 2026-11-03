// js/validaciones.js
// Funciones PURAS: reciben un valor y devuelven un mensaje de error, o null si está bien.
// No tocan el DOM ni el estado: por eso se pueden probar solas y reutilizar (sección 5.2 del TP).

export const MENSAJES = {
  marca: 'Elegí una marca',
  modelo: 'Ingresá el modelo del equipo',
  valor: 'El valor debe estar entre $100.000 y $2.500.000',
  antiguedad: 'Indicá la antigüedad',
  nombre: 'Ingresá tu nombre',
  apellido: 'Ingresá tu apellido',
  dni: 'El DNI debe tener 7 u 8 números',
  nacimiento: 'Tenés que ser mayor de edad',
  email: 'Ingresá un email válido',
  celular: 'Ej.: 11 5555-1234',
  terminos: 'Tenés que aceptar los términos',
  tarjeta: 'Número de tarjeta inválido',
  vencimiento: 'Vencimiento inválido',
  cvv: 'CVV inválido',
  titularTarjeta: 'Ingresá el nombre del titular',
};

const VALOR_MINIMO = 100000;
const VALOR_MAXIMO = 2500000;

// ---------- Paso 1: equipo ----------
export function validarMarca(valor) {
  return valor ? null : MENSAJES.marca;
}

export function validarModelo(valor) {
  const largo = (valor ?? '').trim().length;
  return largo >= 2 && largo <= 40 ? null : MENSAJES.modelo;
}

// Recibe un NÚMERO (el input devuelve texto: la conversión se hace antes de llamar acá).
export function validarValor(valor) {
  const esNumero = typeof valor === 'number' && Number.isFinite(valor);
  return esNumero && valor >= VALOR_MINIMO && valor <= VALOR_MAXIMO ? null : MENSAJES.valor;
}

export function validarAntiguedad(valor) {
  return ['menos-1', '1-2', 'mas-2'].includes(valor) ? null : MENSAJES.antiguedad;
}

// ---------- Paso 3: datos personales ----------
// Cuenta solo letras (con tildes y ñ): "Jo" sí, "J" no, "12" no.
const contarLetras = (texto) => (texto.match(/\p{L}/gu) ?? []).length;

export function validarNombre(valor) {
  return contarLetras(valor ?? '') >= 2 ? null : MENSAJES.nombre;
}

export function validarApellido(valor) {
  return contarLetras(valor ?? '') >= 2 ? null : MENSAJES.apellido;
}

export function validarDni(valor) {
  return /^\d{7,8}$/.test(valor ?? '') ? null : MENSAJES.dni;
}

// Recibe "AAAA-MM-DD" (lo que devuelve <input type="date">). `hoy` se puede pasar para probar.
export function validarNacimiento(valor, hoy = new Date()) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor ?? '');
  if (!partes) return MENSAJES.nacimiento;
  const [anio, mes, dia] = partes.slice(1).map(Number);

  // Si la fecha no existe (31/02), JavaScript la "corrige": lo detectamos comparando.
  const nacimiento = new Date(anio, mes - 1, dia);
  const existe = nacimiento.getFullYear() === anio && nacimiento.getMonth() === mes - 1 && nacimiento.getDate() === dia;
  if (!existe) return MENSAJES.nacimiento;

  const cumple18 = new Date(anio + 18, mes - 1, dia);   // el día del cumpleaños número 18 ya es mayor
  return cumple18 <= hoy ? null : MENSAJES.nacimiento;
}

export function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor ?? '') ? null : MENSAJES.email;
}

// 10 dígitos (característica + número), sin 0 adelante ni 15. Se ignoran espacios y guiones.
export function validarCelular(valor) {
  const limpio = (valor ?? '').replace(/[\s-]/g, '');
  const valido = /^\d{10}$/.test(limpio) && !limpio.startsWith('0') && !limpio.startsWith('15');
  return valido ? null : MENSAJES.celular;
}

export function validarTerminos(valor) {
  return valor === true ? null : MENSAJES.terminos;
}

// ---------- Paso 4: pago ----------
export function validarTarjeta(valor) {
  return /^\d{16}$/.test((valor ?? '').replace(/\s/g, '')) ? null : MENSAJES.tarjeta;
}

// MM/AA, mes 01-12. Vale hasta el último día de ese mes (la tarjeta del mes actual todavía sirve).
export function validarVencimiento(valor, hoy = new Date()) {
  const partes = /^(\d{2})\/(\d{2})$/.exec((valor ?? '').trim());
  if (!partes) return MENSAJES.vencimiento;
  const mes = Number(partes[1]);
  const anio = 2000 + Number(partes[2]);
  if (mes < 1 || mes > 12) return MENSAJES.vencimiento;

  const finDeMes = new Date(anio, mes, 0, 23, 59, 59);  // día 0 del mes siguiente = último día de este mes
  return finDeMes >= hoy ? null : MENSAJES.vencimiento;
}

export function validarCvv(valor) {
  return /^\d{3}$/.test(valor ?? '') ? null : MENSAJES.cvv;
}

export function validarTitularTarjeta(valor) {
  return (valor ?? '').trim().length > 0 ? null : MENSAJES.titularTarjeta;
}

// ---------- Tablas para usar las funciones desde afuera ----------

// Qué función valida cada campo (la clave es el `name` del input).
const VALIDADORES = {
  marca: validarMarca,
  modelo: validarModelo,
  valor: validarValor,
  antiguedad: validarAntiguedad,
  nombre: validarNombre,
  apellido: validarApellido,
  dni: validarDni,
  nacimiento: validarNacimiento,
  email: validarEmail,
  celular: validarCelular,
  terminos: validarTerminos,
  tarjeta: validarTarjeta,
  'titular-tarjeta': validarTitularTarjeta,
  vencimiento: validarVencimiento,
  cvv: validarCvv,
};

export function validarCampo(nombre, valor) {
  const validador = VALIDADORES[nombre];
  return validador ? validador(valor) : null;
}

// Campos que se validan en cada paso (el paso 2 no tiene: Plus ya viene elegido).
const CAMPOS_POR_PASO = {
  1: ['marca', 'modelo', 'valor', 'antiguedad'],
  2: [],
  3: ['nombre', 'apellido', 'dni', 'nacimiento', 'email', 'celular', 'terminos'],
  4: ['tarjeta', 'titular-tarjeta', 'vencimiento', 'cvv'],
};

export function camposDelPaso(paso) {
  return CAMPOS_POR_PASO[paso] ?? [];
}

// Nombres legibles para decirle al usuario qué falta.
export const ETIQUETAS = {
  marca: 'Marca',
  modelo: 'Modelo',
  valor: 'Valor del equipo',
  antiguedad: 'Antigüedad',
  nombre: 'Nombre',
  apellido: 'Apellido',
  dni: 'DNI',
  nacimiento: 'Fecha de nacimiento',
  email: 'Email',
  celular: 'Celular',
  terminos: 'Términos y condiciones',
  tarjeta: 'Número de tarjeta',
  'titular-tarjeta': 'Titular',
  vencimiento: 'Vencimiento',
  cvv: 'CVV',
};
