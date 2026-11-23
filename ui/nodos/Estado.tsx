import type { Node, NodeProps } from '@xyflow/react'
import { NodoBase } from './NodoBase'

/**
 * Un estado: donde la entidad queda esperando. De un estado pueden salir varias flechas, una por cada cosa que se puede hacer
 * desde ahí. Un estado final no tiene salida.
 */
export type NodoEstado = Node<{ nombre: string; inicial?: boolean; final?: boolean }, 'estado'>

const SALIDAS = [{ id: 'salida' }]

export function Estado({ data }: NodeProps<NodoEstado>) {
  const detalle = data.inicial ? 'inicial' : data.final ? 'final' : undefined
  return <NodoBase tipo="Estado" nombre={data.nombre} detalle={detalle} salidas={data.final ? [] : SALIDAS} />
}
