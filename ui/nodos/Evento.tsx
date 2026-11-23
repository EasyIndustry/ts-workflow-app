import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Fragment } from 'react'
import { useOrientacion } from '../canvas/orientacion'
import { puntoEnCirculo } from './geometria'
import { NodoBase, PuntoDeSalida, useRemedirPuntos } from './NodoBase'

/**
 * Un evento: algo que pasa afuera del flujo y que el flujo atrapa. Tres variantes:
 * - `inicio`: lo que arranca el flujo. Es el óvalo de «terminador», sin entrada.
 * - `fin`: donde termina. El mismo óvalo, sin salida. En un subflujo, su nombre es el resultado con el que sale.
 * - `espera`: el flujo se detiene acá hasta que pase uno de los `eventos` que escucha, y sale por el primero que ocurra. Es el
 *   único nodo donde el flujo queda parado. Es un círculo de borde doble, como el evento intermedio de BPMN.
 */
export type NodoEvento = Node<{ variante: 'inicio' | 'espera' | 'fin'; nombre: string; eventos?: readonly { id: string; nombre: string }[] }, 'evento'>

const UNA_SALIDA = [{ id: 'salida', unica: true }]
const SIN_SALIDAS: readonly { id: string; nombre?: string }[] = []

/**
 * La espera. La caja del nodo es invisible y abarca el círculo y el nombre, así ocupa su lugar real cuando se acomoda el lienzo.
 * Lo que se ve es el círculo, y ahí van los puntos de conexión.
 */
function Espera({ nombre, eventos }: { nombre: string; eventos: readonly { id: string; nombre?: string }[] }) {
  const horizontal = useOrientacion() === 'horizontal'
  useRemedirPuntos(`${horizontal}-${eventos.length}`)
  return (
    <div className={`wf-espera ${horizontal ? 'wf-nodo-horizontal' : 'wf-nodo-vertical'}`}>
      <div className="wf-espera-circulo">
        <Handle type="target" position={horizontal ? Position.Left : Position.Top} />
        {eventos.map((s, i) => {
          const { x, y, antes } = puntoEnCirculo(i, eventos.length, horizontal)
          const lugar = { left: `${x}%`, top: `${y}%` }
          return (
            <Fragment key={s.id}>
              <PuntoDeSalida
                salida={{ ...s, unica: true }}
                lado={horizontal ? Position.Right : Position.Bottom}
                style={{ ...lugar, right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' }}
              />
              {s.nombre && (
                <span className={`wf-espera-salida ${antes ? 'wf-rotulo-antes' : 'wf-rotulo-despues'}`} style={lugar}>
                  {s.nombre}
                </span>
              )}
            </Fragment>
          )
        })}
      </div>
      <div className="wf-espera-nombre">{nombre}</div>
    </div>
  )
}

export function Evento({ data }: NodeProps<NodoEvento>) {
  if (data.variante === 'espera') return <Espera nombre={data.nombre} eventos={data.eventos?.length ? data.eventos : UNA_SALIDA} />
  const inicio = data.variante === 'inicio'
  return <NodoBase clase="wf-nodo-terminal" tipo={inicio ? 'Inicio' : 'Fin'} nombre={data.nombre} entrada={!inicio} salidas={inicio ? UNA_SALIDA : SIN_SALIDAS} />
}
