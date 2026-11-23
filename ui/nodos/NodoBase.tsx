import { Handle, Position, useNodeConnections, useNodeId, useUpdateNodeInternals } from '@xyflow/react'
import { useEffect, type CSSProperties } from 'react'
import { useOrientacion } from '../canvas/orientacion'
import './nodos.css'

/** Una salida del nodo. Con `unica`, admite una sola flecha: una vez conectada no deja sacar otra. */
export interface Salida {
  id: string
  nombre?: string
  unica?: boolean
}

export interface NodoBaseProps {
  /** El rótulo del tipo de nodo: «Función», «Subflujo»… */
  tipo: string
  nombre: string
  detalle?: string
  /** Si recibe flechas. */
  entrada?: boolean
  /** Las salidas. Sin salidas, el nodo es un final. */
  salidas?: readonly Salida[]
  /** Una clase más para la tarjeta, cuando un tipo de nodo cambia su dibujo. */
  clase?: string
}

/** El punto de una salida. `style` lo ubica cuando el nodo no lo quiere en el medio del lado. */
export function PuntoDeSalida({ salida, lado, style }: { salida: Salida; lado: Position; style?: CSSProperties }) {
  const conexiones = useNodeConnections({ handleType: 'source', handleId: salida.id })
  return (
    <Handle
      type="source"
      id={salida.id}
      position={lado}
      style={style}
      isConnectable={!salida.unica || conexiones.length === 0}
      isValidConnection={(c) => c.source !== c.target}
    />
  )
}

/** Cuando los puntos de un nodo cambian de lugar, React Flow tiene que volver a medirlos para redibujar las flechas. */
export function useRemedirPuntos(clave: string) {
  const id = useNodeId()
  const actualizar = useUpdateNodeInternals()
  useEffect(() => {
    if (id) actualizar(id)
  }, [id, actualizar, clave])
}

/**
 * El cuerpo común de los nodos con forma de tarjeta: tipo, nombre y detalle. En vertical la entrada va arriba y las salidas abajo;
 * en horizontal, la entrada a la izquierda y las salidas a la derecha. Cada salida con nombre lleva su punto pegado al rótulo.
 */
export function NodoBase({ tipo, nombre, detalle, entrada = true, salidas = [], clase = '' }: NodoBaseProps) {
  const horizontal = useOrientacion() === 'horizontal'
  useRemedirPuntos(`${horizontal}-${salidas.length}`)

  const ladoSalida = horizontal ? Position.Right : Position.Bottom
  const conNombre = salidas.some((s) => s.nombre)
  return (
    <div className={`wf-nodo ${horizontal ? 'wf-nodo-horizontal' : 'wf-nodo-vertical'} ${clase}`}>
      {entrada && <Handle type="target" position={horizontal ? Position.Left : Position.Top} />}
      <div className="wf-nodo-tipo">{tipo}</div>
      <div className="wf-nodo-nombre">{nombre}</div>
      {detalle && <div className="wf-nodo-detalle">{detalle}</div>}
      {conNombre ? (
        <div className="wf-nodo-salidas">
          {salidas.map((s) => (
            <span key={s.id}>
              {s.nombre}
              <PuntoDeSalida salida={s} lado={ladoSalida} />
            </span>
          ))}
        </div>
      ) : (
        salidas.map((s) => <PuntoDeSalida key={s.id} salida={s} lado={ladoSalida} />)
      )}
    </div>
  )
}
