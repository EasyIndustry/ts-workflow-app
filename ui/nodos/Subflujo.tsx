import type { Node, NodeProps } from '@xyflow/react'
import { useEditor } from '../editor/contexto'
import { NodoBase } from './NodoBase'

/**
 * Otro flujo usado como un nodo: el rectángulo con doble barra de «proceso predefinido». Corre de punta a punta y termina por una
 * de sus salidas con nombre, que son los nodos de fin del subflujo. Se referencia con una versión fija, así publicar el subflujo
 * no cambia los flujos que ya lo usan.
 */
export type NodoSubflujo = Node<{ nombre: string; flujo: string; version: number; salidas: readonly { id: string; nombre: string }[] }, 'subflujo'>

export function Subflujo({ data }: NodeProps<NodoSubflujo>) {
  // Muestra el nombre del flujo que usa, no su id. Si todavía no eligió uno, lo dice.
  const { subflujos } = useEditor()
  const detalle = data.flujo ? `${subflujos.find((s) => s.id === data.flujo)?.nombre ?? data.flujo} · versión ${data.version}` : 'sin elegir'
  return <NodoBase clase="wf-nodo-subflujo" tipo="Subflujo" nombre={data.nombre} detalle={detalle} salidas={data.salidas.map((s) => ({ ...s, unica: true }))} />
}
