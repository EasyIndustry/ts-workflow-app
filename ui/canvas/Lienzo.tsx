import { Background, ReactFlow, type Edge, type Node, type ReactFlowProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export type LienzoProps<N extends Node = Node, E extends Edge = Edge> = ReactFlowProps<N, E>

/**
 * El lienzo: React Flow con su comportamiento de fábrica y todas sus props. Lo único propio es cancelar el menú del click derecho.
 * Ocupa el alto y el ancho de su contenedor, que tiene que tener tamaño.
 */
export function Lienzo<N extends Node = Node, E extends Edge = Edge>({ children, onContextMenu, ...resto }: LienzoProps<N, E>) {
  return (
    <ReactFlow<N, E>
      {...resto}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu?.(e)
      }}
    >
      <Background />
      {children}
    </ReactFlow>
  )
}
