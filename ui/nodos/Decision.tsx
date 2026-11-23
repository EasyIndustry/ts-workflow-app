import type { Node, NodeProps } from '@xyflow/react'
import { NodoBase } from './NodoBase'

/**
 * Una decisión: evalúa condiciones en orden y sale por la primera rama que se cumple. Solo lee, nunca escribe. Siempre tiene la
 * salida «si no», así una decisión nunca queda sin resolver.
 */
export type NodoDecision = Node<{ nombre: string; ramas: readonly { id: string; nombre: string }[] }, 'decision'>

export const SALIDA_SI_NO = 'sino'

export function Decision({ data }: NodeProps<NodoDecision>) {
  const salidas = [...data.ramas.map((r) => ({ ...r, unica: true })), { id: SALIDA_SI_NO, nombre: 'si no', unica: true }]
  return <NodoBase tipo="Decisión" nombre={data.nombre} salidas={salidas} />
}
