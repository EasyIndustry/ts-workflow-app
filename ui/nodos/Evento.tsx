import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Fragment } from 'react'
import { salidasDe, type DatosEvento } from '../../modelo/nodos.js'
import { useOrientacion } from '../canvas/orientacion'
import { puntoEnCirculo } from './geometria'
import { NodoBase, PuntoDeSalida, useRemedirPuntos } from './NodoBase'

/**
 * Un evento: algo que pasa afuera del flujo y que el flujo atrapa. Tres variantes:
 * - `inicio`: lo que arranca el flujo. Es el óvalo de «terminador», sin entrada.
 * - `fin`: donde termina. El mismo óvalo, sin salida. En un subflujo, su nombre es el resultado con el que sale. Si es un
 *   `rechazo` (borde rojo), no termina el flujo: la acción no se permite, y su nombre es el motivo.
 * - `espera`: el flujo se detiene acá hasta que pase uno de los `eventos` que escucha, y sale por el primero que ocurra. Es el
 *   único nodo donde el flujo queda parado. Es un círculo de borde doble, como el evento intermedio de BPMN.
 * - `interrupcion`: un evento que puede llegar en cualquier momento, esté donde esté el flujo, y lo desvía. No crea una instancia
 *   nueva: actúa sobre la que está corriendo. Equivale a sumarle esa salida a todas las esperas, menos las de `excepto`. Es el
 *   mismo círculo de borde doble, sin entrada. Si es `lateral` (no desvía el flujo), el borde es punteado.
 */
export type NodoEvento = Node<DatosEvento, 'evento'>

const UNA_SALIDA = [{ id: 'salida', unica: true }]
const SIN_SALIDAS: readonly { id: string; nombre?: string }[] = []

/**
 * El círculo de la espera y de la interrupción. La caja del nodo es invisible y abarca el círculo y el nombre, así ocupa su lugar real cuando se acomoda el lienzo.
 * Lo que se ve es el círculo, y ahí van los puntos de conexión.
 */
function Circulo({ nombre, eventos, entrada, lateral = false }: { nombre: string; eventos: readonly { id: string; nombre?: string }[]; entrada: boolean; lateral?: boolean }) {
  const horizontal = useOrientacion() === 'horizontal'
  useRemedirPuntos(`${horizontal}-${entrada}-${eventos.length}`)
  return (
    <div className={`wf-espera ${horizontal ? 'wf-nodo-horizontal' : 'wf-nodo-vertical'}`}>
      <div className={lateral ? 'wf-espera-circulo wf-espera-lateral' : 'wf-espera-circulo'}>
        {entrada && <Handle type="target" position={horizontal ? Position.Left : Position.Top} />}
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

export function Evento(props: NodeProps<NodoEvento>) {
  const { data } = props
  if (data.variante === 'espera') return <Circulo entrada nombre={data.nombre} eventos={salidasDe({ id: props.id, type: 'evento', position: { x: 0, y: 0 }, data })} />
  if (data.variante === 'interrupcion') return <Circulo entrada={false} lateral={data.lateral} nombre={data.nombre} eventos={UNA_SALIDA} />
  const inicio = data.variante === 'inicio'
  const rechazo = !inicio && data.rechazo === true
  return <NodoBase clase={rechazo ? 'wf-nodo-terminal wf-nodo-rechazo' : 'wf-nodo-terminal'} tipo={inicio ? 'Inicio' : rechazo ? 'Rechazo' : 'Fin'} nombre={data.nombre} entrada={!inicio} salidas={inicio ? UNA_SALIDA : SIN_SALIDAS} />
}
