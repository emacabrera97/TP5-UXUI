// js/pago.js
// Pago simulado y número de póliza. No hay backend: la "respuesta" depende del número de tarjeta.
// IMPORTANTE: nunca uses datos de tarjetas reales, ni siquiera para probar (sección 5.3 del TP).

const TARJETA_RECHAZADA = '4000000000000002';

// Devuelve una Promise que se resuelve a los 1,5 s, como si el banco tardara en responder.
//   4111 1111 1111 1111  -> aprobado
//   4000 0000 0000 0002  -> rechazado
//   cualquier otra       -> aprobado
export function simularPago(numero) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const limpio = numero.replace(/\s/g, '');
      resolve(limpio === TARJETA_RECHAZADA
        ? { ok: false, motivo: 'Tarjeta rechazada' }
        : { ok: true });
    }, 1500);
  });
}

// Número de póliza: POL-AAAA-NNNNNN (año actual + contador de 6 dígitos).
// El contador vive acá: cada póliza emitida suma uno.
let contador = 122;

export function generarPoliza() {
  contador += 1;
  return `POL-${new Date().getFullYear()}-${String(contador).padStart(6, '0')}`;
}
