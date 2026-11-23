import { Background, Panel, ReactFlow, type Edge, type Node, type ReactFlowProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useState } from 'react'
import { ContextoOrientacion, type Orientacion } from './orientacion'

export type LienzoProps<N extends Node = Node, E extends Edge = Edge> = ReactFlowProps<N, E> & {
  /** Hacia dónde corre el flujo al abrir. Después se cambia con el botón del lienzo. */
  orientacionInicial?: Orientacion
}

/**
 * El lienzo: React Flow con su comportamiento de fábrica y todas sus props. Lo propio es cancelar el menú del click derecho y el
 * botón que cambia la orientación: los nodos mueven sus puntos de conexión, las posiciones no cambian. Ocupa el alto y el ancho de
 * su contenedor, que tiene que tener tamaño.
 */
export function Lienzo<N extends Node = Node, E extends Edge = Edge>({ children, onContextMenu, orientacionInicial = 'vertical', ...resto }: LienzoProps<N, E>) {
  const [orientacion, setOrientacion] = useState(orientacionInicial)
  const otra = orientacion === 'vertical' ? 'horizontal' : 'vertical'
  return (
    <ContextoOrientacion.Provider value={orientacion}>
      <ReactFlow<N, E>
        {...resto}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu?.(e)
        }}
      >
        <Background />
        <Panel position="top-right">
          <button type="button" onClick={() => setOrientacion(otra)}>
            Pasar a {otra}
          </button>
        </Panel>
        {children}
      </ReactFlow>
    </ContextoOrientacion.Provider>
  )
}
