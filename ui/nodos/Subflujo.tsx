import type { Node, NodeProps } from '@xyflow/react'
import { NodoBase } from './NodoBase'

/**
 * Otro flujo usado como un nodo: corre de punta a punta y termina por una de sus salidas con nombre. Se referencia con una versión
 * fija, así publicar el subflujo no cambia los flujos que ya lo usan.
 */
export type NodoSubflujo = Node<{ nombre: string; flujo: string; version: number; salidas: readonly { id: string; nombre: string }[] }, 'subflujo'>

export function Subflujo({ data }: NodeProps<NodoSubflujo>) {
  return <NodoBase tipo="Subflujo" nombre={data.nombre} detalle={`${data.flujo} · versión ${data.version}`} salidas={data.salidas.map((s) => ({ ...s, unica: true }))} />
}
