import { Background, Panel, ReactFlow, type Edge, type Node, type ReactFlowProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { ReactNode } from 'react'
import '../tema.css'
import './lienzo.css'
import { BotonAcomodar } from './BotonAcomodar'
import { ContextoOrientacion, type Orientacion } from './orientacion'

export type LienzoProps<N extends Node = Node, E extends Edge = Edge> = ReactFlowProps<N, E> & {
  /** Hacia dónde corre el flujo. Los nodos mueven sus puntos de conexión; las posiciones no cambian. */
  orientacion?: Orientacion
  /** Botones de quien monta el lienzo, que van junto a «Acomodar». */
  botones?: ReactNode
}

/**
 * El lienzo: React Flow con su comportamiento de fábrica y todas sus props. Lo propio es cancelar el menú del click derecho, el
 * botón «Acomodar», que ordena los nodos solos, y la orientación. Ocupa el alto y el ancho de su contenedor, que tiene que tener
 * tamaño.
 */
export function Lienzo<N extends Node = Node, E extends Edge = Edge>({ children, className, onContextMenu, orientacion = 'vertical', botones, ...resto }: LienzoProps<N, E>) {
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
          {botones}
        </Panel>
        {children}
      </ReactFlow>
    </ContextoOrientacion.Provider>
  )
}
