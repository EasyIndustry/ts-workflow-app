import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Fragment } from 'react'
import { useOrientacion } from '../canvas/orientacion'
import { PuntoDeSalida, useRemedirPuntos } from './NodoBase'

/**
 * Una decisión: evalúa condiciones en orden y sale por la primera rama que se cumple. Solo lee, nunca escribe. Siempre tiene la
 * salida «si no», así una decisión nunca queda sin resolver.
 */
export type NodoDecision = Node<{ nombre: string; ramas: readonly { id: string; nombre: string }[] }, 'decision'>

export const SALIDA_SI_NO = 'sino'

/**
 * Dónde va cada salida sobre el rombo, en porcentaje de su caja. La entrada ocupa una punta y las salidas se reparten sobre los
 * dos lados opuestos: los de abajo en vertical, los de la derecha en horizontal. Con una sola salida, cae en la punta de enfrente.
 */
export function puntoDeRama(indice: number, total: number, horizontal: boolean): { x: number; y: number; antes: boolean } {
  const t = (indice + 0.5) / total
  const avance = 50 + (0.5 - Math.abs(t - 0.5)) * 100
  return horizontal ? { x: avance, y: t * 100, antes: t < 0.5 } : { x: t * 100, y: avance, antes: t < 0.5 }
}

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
        const { x, y, antes } = puntoDeRama(i, salidas.length, horizontal)
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
