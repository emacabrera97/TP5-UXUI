// js/cotizador.js
// Lógica del cálculo de la cuota. UNA sola función para toda la app:
// si calculás la cuota en dos lugares, tarde o temprano van a dar distinto.

// Factor según la antigüedad del equipo (sección 5.1 del TP).
// Las claves son los "value" de los radios del formulario.
export const FACTORES_ANTIGUEDAD = {
  'menos-1': 1.0,   // menos de 1 año
  '1-2': 1.1,       // 1 a 2 años
  'mas-2': 1.25,    // más de 2 años
};

// cuota = Math.round(valor × tasaAnual / 12 × factorAntiguedad)
export function calcularCuota(valor, tasaAnual, factorAntiguedad) {
  return Math.round((valor * tasaAnual) / 12 * factorAntiguedad);
}

// Formato de moneda argentina: 3000 -> "$ 3.000"
const formatoARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});
export function formatearMoneda(numero) {
  return formatoARS.format(numero);
}
