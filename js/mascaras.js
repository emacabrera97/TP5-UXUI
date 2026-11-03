// js/mascaras.js
// Máscaras de input (bonus): le dan formato al texto mientras el usuario escribe.
// Son funciones puras: reciben lo que hay en el campo y devuelven el texto con formato.

const soloDigitos = (texto) => texto.replace(/\D/g, '');

export const mascaras = {
  // 4111111111111111 -> 4111 1111 1111 1111
  tarjeta: (texto) => soloDigitos(texto).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '),

  // 1228 -> 12/28. La barra aparece recién al escribir el 3.er número:
  // si la pusiéramos después del 2.º, no se podría borrar con la tecla de retroceso.
  vencimiento: (texto) => {
    const digitos = soloDigitos(texto).slice(0, 4);
    return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
  },

  cvv: (texto) => soloDigitos(texto).slice(0, 3),
  dni: (texto) => soloDigitos(texto).slice(0, 8),
};

// Aplica la máscara del campo `nombre`; si ese campo no tiene máscara, devuelve el texto igual.
export function aplicarMascara(nombre, texto) {
  const mascara = mascaras[nombre];
  return mascara ? mascara(texto) : texto;
}
