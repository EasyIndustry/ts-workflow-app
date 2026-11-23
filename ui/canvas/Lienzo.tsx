import { Background, Panel, ReactFlow, type Edge, type Node, type ReactFlowProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import '../tema.css'
import './lienzo.css'
import { useState, type ReactNode } from 'react'
import { BotonAcomodar } from './BotonAcomodar'
import { ContextoOrientacion, type Orientacion } from './orientacion'

export type LienzoProps<N extends Node = Node, E extends Edge = Edge> = ReactFlowProps<N, E> & {
  /** Hacia dónde corre el flujo al abrir. Después se cambia con el botón del lienzo. */
  orientacionInicial?: Orientacion
  /** Botones de quien monta el lienzo, que van junto a los propios. */
  botones?: ReactNode
}

/**
 * El lienzo: React Flow con su comportamiento de fábrica y todas sus props. Lo propio es cancelar el menú del click derecho y dos
 * botones: «Acomodar», que ordena los nodos solos, y el que cambia la orientación (mueve los puntos de conexión, no los nodos).
 * Ocupa el alto y el ancho de su contenedor, que tiene que tener tamaño.
 */
export function Lienzo<N extends Node = Node, E extends Edge = Edge>({ children, className, onContextMenu, orientacionInicial = 'vertical', botones, ...resto }: LienzoProps<N, E>) {
  const [orientacion, setOrientacion] = useState(orientacionInicial)
  const otra = orientacion === 'vertical' ? 'horizontal' : 'vertical'
  return (
    <ContextoOrientacion.Provider value={orientacion}>
      <ReactFlow<N, E>
        {...resto}
        className={className ? `wf-lienzo ${className}` : 'wf-lienzo'}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu?.(e)
        }}
      >
        <Background />
        <Panel position="top-right" className="wf-lienzo-botones">
          <BotonAcomodar />
          <button type="button" onClick={() => setOrientacion(otra)}>
            Pasar a {otra}
          </button>
          {botones}
        </Panel>
        {children}
      </ReactFlow>
    </ContextoOrientacion.Provider>
  )
}
