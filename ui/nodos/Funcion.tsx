import type { Node, NodeProps } from '@xyflow/react'
import { NodoBase } from './NodoBase'

/**
 * Una función del registro: el rectángulo de «proceso». Hace algo y sigue. `capacidad` es su id en el registro y
 * `params`, los datos con los que la llama. Una sola salida.
 */
export type NodoFuncion = Node<{ nombre: string; capacidad?: string; params?: Record<string, unknown> }, 'funcion'>

const SALIDAS = [{ id: 'salida', unica: true }]

export function Funcion({ data }: NodeProps<NodoFuncion>) {
  return <NodoBase tipo="Función" nombre={data.nombre} detalle={data.capacidad} salidas={SALIDAS} />
}
