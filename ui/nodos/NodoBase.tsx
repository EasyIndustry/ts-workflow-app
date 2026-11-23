import { Handle, Position, useNodeConnections, useNodeId, useUpdateNodeInternals } from '@xyflow/react'
import { useEffect } from 'react'
import { useOrientacion } from '../canvas/orientacion'
import './nodos.css'

/** Una salida del nodo. Con `unica`, admite una sola flecha: una vez conectada no deja sacar otra. */
export interface Salida {
  id: string
  nombre?: string
  unica?: boolean
}

export interface NodoBaseProps {
  /** El rótulo del tipo de nodo: «Función», «Decisión»… */
  tipo: string
  nombre: string
  detalle?: string
  /** Si recibe flechas. Un disparador no recibe. */
  entrada?: boolean
  /** Las salidas. Sin salidas, el nodo es un final. */
  salidas?: readonly Salida[]
}

function PuntoDeSalida({ salida, lado }: { salida: Salida; lado: Position }) {
  const conexiones = useNodeConnections({ handleType: 'source', handleId: salida.id })
  return (
    <Handle
      type="source"
      id={salida.id}
      position={lado}
      isConnectable={!salida.unica || conexiones.length === 0}
      isValidConnection={(c) => c.source !== c.target}
    />
  )
}

/**
 * El cuerpo común de todos los nodos: tipo, nombre y detalle. En vertical la entrada va arriba y las salidas abajo; en horizontal,
 * la entrada a la izquierda y las salidas a la derecha. Cada salida con nombre lleva su punto pegado al rótulo.
 */
export function NodoBase({ tipo, nombre, detalle, entrada = true, salidas = [] }: NodoBaseProps) {
  const horizontal = useOrientacion() === 'horizontal'
  const id = useNodeId()
  const actualizar = useUpdateNodeInternals()
  // Los puntos cambian de lado: React Flow tiene que volver a medirlos para redibujar las flechas.
  useEffect(() => {
    if (id) actualizar(id)
  }, [id, actualizar, horizontal, salidas.length])

  const ladoSalida = horizontal ? Position.Right : Position.Bottom
  const conNombre = salidas.some((s) => s.nombre)
  return (
    <div className={`wf-nodo ${horizontal ? 'wf-nodo-horizontal' : 'wf-nodo-vertical'}`}>
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
