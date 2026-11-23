import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { salidasDe, type DatosEvento } from '../../modelo/nodos.js'
import { useOrientacion } from '../canvas/orientacion'
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
 * El círculo de la espera y de la interrupción. La caja del nodo abarca el círculo, el nombre y las salidas: es un rectángulo
 * translúcido que desenfoca lo que tiene detrás, para que las flechas que pasan por atrás no tapen el texto.
 *
 * Cada salida con nombre tiene su tramo recto, con el texto encima, y el punto de conexión al final: la flecha recién arranca
 * donde el texto terminó. Una sola salida sin nombre va directo sobre el círculo.
 */
function Circulo({ nombre, eventos, entrada, lateral = false }: { nombre: string; eventos: readonly { id: string; nombre?: string }[]; entrada: boolean; lateral?: boolean }) {
  const horizontal = useOrientacion() === 'horizontal'
  useRemedirPuntos(`${horizontal}-${entrada}-${eventos.map((e) => e.nombre ?? '').join('|')}`)
  const lado = horizontal ? Position.Right : Position.Bottom
  const conTramos = eventos.some((e) => e.nombre)
  return (
    <div className={`wf-espera ${horizontal ? 'wf-nodo-horizontal' : 'wf-nodo-vertical'}`}>
      <div className="wf-espera-nombre">{nombre}</div>
      <div className="wf-espera-cuerpo">
        <div className={lateral ? 'wf-espera-circulo wf-espera-lateral' : 'wf-espera-circulo'}>
          {entrada && <Handle type="target" position={horizontal ? Position.Left : Position.Top} />}
          {!conTramos && eventos.map((s) => <PuntoDeSalida key={s.id} salida={{ ...s, unica: true }} lado={lado} />)}
        </div>
        {conTramos && (
          <div className="wf-espera-tramos wf-dientes">
            {eventos.map((s) => (
              <span key={s.id} className="wf-peine-diente">
                <b>{s.nombre}</b>
                <PuntoDeSalida salida={{ ...s, unica: true }} lado={lado} />
              </span>
            ))}
          </div>
        )}
      </div>
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
