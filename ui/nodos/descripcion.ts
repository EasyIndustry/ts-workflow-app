import type { NodoDeFlujo } from './index'

/**
 * Lo que se puede decir de un nodo sin dibujarlo: cómo se llama su tipo y qué salidas tiene. Sin React, para usarlo al comparar y
 * al verificar un flujo.
 */

export const SALIDA_UNICA = 'salida'

const VARIANTES = { inicio: 'Inicio', fin: 'Fin', espera: 'Espera', interrupcion: 'Interrupción' }
const TIPOS = { funcion: 'Función', decision: 'Decisión', subflujo: 'Subflujo' }

/** El nombre del tipo de nodo, como se le dice a una persona. */
export function tipoDeNodo(nodo: NodoDeFlujo): string {
  return nodo.type === 'evento' ? VARIANTES[nodo.data.variante] : TIPOS[nodo.type ?? 'funcion']
}

/** Cómo nombrar un nodo en una frase: «Función «Avisar al responsable»». */
export function rotuloDeNodo(nodo: NodoDeFlujo): string {
  return `${tipoDeNodo(nodo)} «${nodo.data.nombre}»`
}

/** Las salidas de un nodo, en orden. Una salida sin nombre es la única que tiene. Un fin no tiene ninguna. */
export function salidasDe(nodo: NodoDeFlujo): readonly { id: string; nombre?: string }[] {
  switch (nodo.type) {
    case 'evento':
      if (nodo.data.variante === 'fin') return []
      return nodo.data.variante === 'espera' && nodo.data.eventos?.length ? nodo.data.eventos : [{ id: SALIDA_UNICA }]
    case 'decision':
      return [...nodo.data.ramas, { id: 'sino', nombre: 'si no' }]
    case 'subflujo':
      return nodo.data.salidas
    default:
      return [{ id: SALIDA_UNICA }]
  }
}

/** Si al nodo le pueden llegar flechas. Un inicio y una interrupción no reciben: son por donde se entra al flujo. */
export function esEntrada(nodo: NodoDeFlujo): boolean {
  return nodo.type === 'evento' && (nodo.data.variante === 'inicio' || nodo.data.variante === 'interrupcion')
}

export function esFin(nodo: NodoDeFlujo): boolean {
  return nodo.type === 'evento' && nodo.data.variante === 'fin'
}
