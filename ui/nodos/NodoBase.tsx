import { Handle, Position, useNodeConnections } from '@xyflow/react'
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
  /** Si recibe flechas (arriba). Un disparador no recibe. */
  entrada?: boolean
  /** Las salidas (abajo), repartidas a lo ancho. Sin salidas, el nodo es un final. */
  salidas?: readonly Salida[]
}

function PuntoDeSalida({ salida, izquierda }: { salida: Salida; izquierda: string }) {
  const conexiones = useNodeConnections({ handleType: 'source', handleId: salida.id })
  return (
    <Handle
      type="source"
      id={salida.id}
      position={Position.Bottom}
      style={{ left: izquierda }}
      isConnectable={!salida.unica || conexiones.length === 0}
      isValidConnection={(c) => c.source !== c.target}
    />
  )
}

/** El cuerpo común de todos los nodos: tipo, nombre, detalle, la entrada arriba y las salidas abajo. */
export function NodoBase({ tipo, nombre, detalle, entrada = true, salidas = [] }: NodoBaseProps) {
  const conNombre = salidas.some((s) => s.nombre)
  return (
    <div className="wf-nodo">
      {entrada && <Handle type="target" position={Position.Top} />}
      <div className="wf-nodo-tipo">{tipo}</div>
      <div className="wf-nodo-nombre">{nombre}</div>
      {detalle && <div className="wf-nodo-detalle">{detalle}</div>}
      {conNombre && (
        <div className="wf-nodo-salidas">
          {salidas.map((s) => (
            <span key={s.id}>{s.nombre}</span>
          ))}
        </div>
      )}
      {salidas.map((s, i) => (
        <PuntoDeSalida key={s.id} salida={s} izquierda={`${((i + 0.5) / salidas.length) * 100}%`} />
      ))}
    </div>
  )
}
