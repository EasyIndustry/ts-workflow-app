import type { NodeTypes } from '@xyflow/react'
import { Decision, type NodoDecision } from './Decision'
import { Evento, type NodoEvento } from './Evento'
import { Funcion, type NodoFuncion } from './Funcion'
import { Subflujo, type NodoSubflujo } from './Subflujo'

export { Decision, Evento, Funcion, Subflujo }
export { SALIDA_SI_NO } from './Decision'
export { NodoBase, type NodoBaseProps, type Salida } from './NodoBase'
export type { NodoDecision, NodoEvento, NodoFuncion, NodoSubflujo }

/** Cualquier nodo de un flujo. */
export type NodoDeFlujo = NodoEvento | NodoFuncion | NodoDecision | NodoSubflujo

/** Los tipos de nodo, para pasarle al lienzo en `nodeTypes`. */
export const TIPOS_DE_NODO = {
  evento: Evento,
  funcion: Funcion,
  decision: Decision,
  subflujo: Subflujo,
} satisfies NodeTypes
