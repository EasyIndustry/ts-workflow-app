import type { NodeTypes } from '@xyflow/react'
import { Decision, type NodoDecision } from './Decision'
import { Disparador, type NodoDisparador } from './Disparador'
import { Estado, type NodoEstado } from './Estado'
import { Funcion, type NodoFuncion } from './Funcion'
import { Subflujo, type NodoSubflujo } from './Subflujo'

export { Decision, Disparador, Estado, Funcion, Subflujo }
export { SALIDA_SI_NO } from './Decision'
export { NodoBase, type NodoBaseProps, type Salida } from './NodoBase'
export type { NodoDecision, NodoDisparador, NodoEstado, NodoFuncion, NodoSubflujo }

/** Cualquier nodo de un flujo. */
export type NodoDeFlujo = NodoDisparador | NodoFuncion | NodoDecision | NodoEstado | NodoSubflujo

/** Los tipos de nodo, para pasarle al lienzo en `nodeTypes`. */
export const TIPOS_DE_NODO = {
  disparador: Disparador,
  funcion: Funcion,
  decision: Decision,
  estado: Estado,
  subflujo: Subflujo,
} satisfies NodeTypes
