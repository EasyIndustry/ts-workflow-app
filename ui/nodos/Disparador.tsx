import type { Node, NodeProps } from '@xyflow/react'
import { NodoBase } from './NodoBase'

/** Lo que arranca el flujo: una persona, un evento o un horario. No recibe flechas y tiene una sola salida. */
export type NodoDisparador = Node<{ nombre: string; detalle?: string }, 'disparador'>

const SALIDAS = [{ id: 'salida', unica: true }]

export function Disparador({ data }: NodeProps<NodoDisparador>) {
  return <NodoBase tipo="Disparador" nombre={data.nombre} detalle={data.detalle} entrada={false} salidas={SALIDAS} />
}
