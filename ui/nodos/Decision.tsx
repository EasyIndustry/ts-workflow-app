import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Fragment } from 'react'
import { SALIDA_SI_NO, type DatosDecision } from '../../modelo/nodos.js'
import { useOrientacion } from '../canvas/orientacion'
import { puntoEnRombo } from './geometria'
import { PuntoDeSalida, useRemedirPuntos } from './NodoBase'

/**
 * Una decisión: el rombo de siempre. Evalúa condiciones en orden y sale por la primera rama que se cumple. Solo lee, nunca
 * escribe. Siempre tiene la salida «si no», así una decisión nunca queda sin resolver.
 */
export type NodoDecision = Node<DatosDecision, 'decision'>

export { SALIDA_SI_NO }

export function Decision({ data }: NodeProps<NodoDecision>) {
  const horizontal = useOrientacion() === 'horizontal'
  const salidas = [...data.ramas, { id: SALIDA_SI_NO, nombre: 'si no' }]
  useRemedirPuntos(`${horizontal}-${salidas.length}`)

  return (
    <div className={`wf-rombo ${horizontal ? 'wf-nodo-horizontal' : 'wf-nodo-vertical'}`}>
      <svg className="wf-rombo-forma" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon points="50,0 100,50 50,100 0,50" />
      </svg>
      <Handle type="target" position={horizontal ? Position.Left : Position.Top} />
      <div className="wf-rombo-nombre">{data.nombre}</div>
      {salidas.map((s, i) => {
        const { x, y, antes } = puntoEnRombo(i, salidas.length, horizontal)
        const lugar = { left: `${x}%`, top: `${y}%` }
        return (
          <Fragment key={s.id}>
            <PuntoDeSalida
              salida={{ ...s, unica: true }}
              lado={horizontal ? Position.Right : Position.Bottom}
              style={{ ...lugar, right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' }}
            />
            <span className={`wf-rombo-salida ${antes ? 'wf-rombo-antes' : 'wf-rombo-despues'}`} style={lugar}>
              {s.nombre}
            </span>
          </Fragment>
        )
      })}
    </div>
  )
}
