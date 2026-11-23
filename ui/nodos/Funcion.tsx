import type { Node, NodeProps } from '@xyflow/react'
import { NodoBase } from './NodoBase'

/** Una función del registro: hace algo y sigue. `capacidad` es su id en el registro. Una sola salida. */
export type NodoFuncion = Node<{ nombre: string; capacidad?: string }, 'funcion'>

const SALIDAS = [{ id: 'salida', unica: true }]

export function Funcion({ data }: NodeProps<NodoFuncion>) {
  return <NodoBase tipo="Función" nombre={data.nombre} detalle={data.capacidad} salidas={SALIDAS} />
}
