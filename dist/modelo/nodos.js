/**
 * Los nodos de un flujo, como datos: qué guarda cada tipo y lo que se puede decir de un nodo sin dibujarlo (cómo se llama su tipo,
 * qué salidas tiene). Sin React ni librerías: lo usan la interfaz, el servidor y las herramientas para agentes.
 */
export const SALIDA_SI_NO = 'sino';
export const SALIDA_UNICA = 'salida';
const VARIANTES = { inicio: 'Inicio', fin: 'Fin', espera: 'Espera', interrupcion: 'Interrupción' };
const TIPOS = { funcion: 'Función', decision: 'Decisión', subflujo: 'Subflujo' };
/** El nombre del tipo de nodo, como se le dice a una persona. */
export function tipoDeNodo(nodo) {
    return nodo.type === 'evento' ? VARIANTES[nodo.data.variante] : TIPOS[nodo.type ?? 'funcion'];
}
/** Cómo nombrar un nodo en una frase: «Función «Avisar al responsable»». */
export function rotuloDeNodo(nodo) {
    return `${tipoDeNodo(nodo)} «${nodo.data.nombre}»`;
}
/** Las salidas de un nodo, en orden. Una salida sin nombre es la única que tiene. Un fin no tiene ninguna. */
export function salidasDe(nodo) {
    switch (nodo.type) {
        case 'evento':
            if (nodo.data.variante === 'fin')
                return [];
            // Una espera sale por sus eventos. Si no declara ninguno (lista vacía), no tiene salidas: se deja por una interrupción.
            return nodo.data.variante === 'espera' && nodo.data.eventos ? nodo.data.eventos : [{ id: SALIDA_UNICA }];
        case 'decision':
            return [...nodo.data.ramas, { id: SALIDA_SI_NO, nombre: 'si no' }];
        case 'subflujo':
            return nodo.data.salidas;
        default:
            return [{ id: SALIDA_UNICA }];
    }
}
/** Si al nodo le pueden llegar flechas. Un inicio y una interrupción no reciben: son por donde se entra al flujo. */
export function esEntrada(nodo) {
    return nodo.type === 'evento' && (nodo.data.variante === 'inicio' || nodo.data.variante === 'interrupcion');
}
export function esFin(nodo) {
    return nodo.type === 'evento' && nodo.data.variante === 'fin';
}
