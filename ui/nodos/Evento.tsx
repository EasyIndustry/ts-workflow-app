import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Fragment } from 'react'
import { useOrientacion } from '../canvas/orientacion'
import { puntoEnCirculo } from './geometria'
import { PuntoDeSalida, useRemedirPuntos } from './NodoBase'

/**
 * Un evento: algo que pasa afuera del flujo y que el flujo atrapa. Es un círculo, como en BPMN, con tres variantes:
 * - `inicio` (borde fino): lo que arranca el flujo. No recibe flechas.
 * - `espera` (borde doble): el flujo se detiene acá hasta que pase uno de los `eventos` que escucha, y sale por el primero que
 *   ocurra. Es el único nodo donde el flujo queda parado.
 * - `fin` (borde grueso): donde termina. En un subflujo, su nombre es el resultado con el que sale.
 */
export type NodoEvento = Node<{ variante: 'inicio' | 'espera' | 'fin'; nombre: string; eventos?: readonly { id: string; nombre: string }[] }, 'evento'>

const UNA_SALIDA = [{ id: 'salida' }]

export function Evento({ data }: NodeProps<NodoEvento>) {
  const horizontal = useOrientacion() === 'horizontal'
  const salidas: readonly { id: string; nombre?: string }[] = data.variante === 'fin' ? [] : data.variante === 'espera' && data.eventos?.length ? data.eventos : UNA_SALIDA
  useRemedirPuntos(`${horizontal}-${data.variante}-${salidas.length}`)

  return (
    <div className={`wf-evento wf-evento-${data.variante} ${horizontal ? 'wf-nodo-horizontal' : 'wf-nodo-vertical'}`}>
      {data.variante !== 'inicio' && <Handle type="target" position={horizontal ? Position.Left : Position.Top} />}
      <div className="wf-evento-nombre">{data.nombre}</div>
      {salidas.map((s, i) => {
        const { x, y, antes } = puntoEnCirculo(i, salidas.length, horizontal)
        const lugar = { left: `${x}%`, top: `${y}%` }
        return (
          <Fragment key={s.id}>
            <PuntoDeSalida
              salida={{ ...s, unica: true }}
              lado={horizontal ? Position.Right : Position.Bottom}
              style={{ ...lugar, right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' }}
            />
            {s.nombre && (
              <span className={`wf-evento-salida ${antes ? 'wf-rotulo-antes' : 'wf-rotulo-despues'}`} style={lugar}>
                {s.nombre}
              </span>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
