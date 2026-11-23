import { Background, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export interface LienzoProps {
  className?: string
}

/**
 * El lienzo: React Flow con su comportamiento de fábrica. Lo único propio es cancelar el menú del click derecho.
 * Ocupa el alto y el ancho de su contenedor, que tiene que tener tamaño.
 */
export function Lienzo({ className }: LienzoProps) {
  return (
    <ReactFlow className={className} onContextMenu={(e) => e.preventDefault()}>
      <Background />
    </ReactFlow>
  )
}
