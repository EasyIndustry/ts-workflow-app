import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Fragment } from 'react'
import { SALIDA_SI_NO, type DatosDecision } from '../../modelo/nodos.js'
import { useOrientacion } from '../canvas/orientacion'
import { useEstiloDeDecision } from './estilo'
import { puntoEnRombo } from './geometria'
import { PuntoDeSalida, useRemedirPuntos } from './NodoBase'

/**
 * Una decisión: el rombo de siempre. Evalúa condiciones en orden y sale por la primera rama que se cumple. Solo lee, nunca
 * escribe. Siempre tiene la salida «si no», así una decisión nunca queda sin resolver.
 */
export type NodoDecision = Node<DatosDecision, 'decision'>

export { SALIDA_SI_NO }

type Salida = { id: string; nombre: string }
interface Dibujo {
  nombre: string
  salidas: readonly Salida[]
  horizontal: boolean
}

/** Cuánto lugar ocupa cada rama a lo largo del lado por donde salen, en el peine. */
const PASO = 22
/** El rombo del peine: lo que mide en el sentido en que corre el flujo. */
const FONDO = 110

const forma = (
  <svg className="wf-rombo-forma" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <polygon points="50,0 100,50 50,100 0,50" />
  </svg>
)

/**
 * El peine: de cada salida sale un tramo recto con el texto de la rama a lo largo, y el punto de conexión va al final del texto.
 * Así las flechas recién se curvan después de que el texto terminó, y los textos no se pisan aunque haya muchas ramas.
 */
function Peine({ nombre, salidas, horizontal }: Dibujo) {
  const largo = Math.max(horizontal ? 110 : 190, salidas.length * PASO)
  return (
    <div className={`wf-peine ${horizontal ? 'wf-nodo-horizontal' : 'wf-nodo-vertical'}`}>
      <div className="wf-peine-rombo" style={horizontal ? { width: 170, height: largo } : { width: largo, height: FONDO }}>
        {forma}
        <Handle type="target" position={horizontal ? Position.Left : Position.Top} />
        <div className="wf-rombo-nombre">{nombre}</div>
      </div>
      <div className="wf-peine-dientes wf-dientes">
        {salidas.map((s, i) => {
          // El rombo se va cerrando hacia las puntas: el tramo de cada rama se alarga hacia atrás hasta tocar su borde.
          const hueco = (horizontal ? 170 : FONDO) * Math.abs((i + 0.5) / salidas.length - 0.5)
          return (
            <span key={s.id} className="wf-peine-diente">
              <i style={horizontal ? { width: hueco } : { height: hueco }} />
              <b>{s.nombre}</b>
              <PuntoDeSalida salida={{ ...s, unica: true }} lado={horizontal ? Position.Right : Position.Bottom} />
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** La tarjeta: la pregunta arriba y una fila por rama, cada una con su punto a la derecha. */
function Tarjeta({ nombre, salidas, horizontal }: Dibujo) {
  return (
    <div className="wf-nodo wf-decision-tarjeta">
      <Handle type="target" position={horizontal ? Position.Left : Position.Top} />
      <div className="wf-nodo-tipo">Decisión</div>
      <div className="wf-nodo-nombre">{nombre}</div>
      <div className="wf-decision-filas">
        {salidas.map((s) => (
          <span key={s.id}>
            {s.nombre}
            <PuntoDeSalida salida={{ ...s, unica: true }} lado={Position.Right} />
          </span>
        ))}
      </div>
    </div>
  )
}

/** El rombo de tamaño fijo, con el texto de cada rama al costado de su punto. */
function Rombo({ nombre, salidas, horizontal }: Dibujo) {
  return (
    <div className={`wf-rombo ${horizontal ? 'wf-nodo-horizontal' : 'wf-nodo-vertical'}`}>
      {forma}
      <Handle type="target" position={horizontal ? Position.Left : Position.Top} />
      <div className="wf-rombo-nombre">{nombre}</div>
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

const DIBUJOS = { peine: Peine, tarjeta: Tarjeta, rombo: Rombo }

export function Decision({ data }: NodeProps<NodoDecision>) {
  const horizontal = useOrientacion() === 'horizontal'
  const estilo = useEstiloDeDecision()
  const salidas = [...data.ramas, { id: SALIDA_SI_NO, nombre: 'si no' }]
  useRemedirPuntos(`${estilo}-${horizontal}-${salidas.map((s) => s.nombre).join('|')}`)
  const Dibujo = DIBUJOS[estilo]
  return <Dibujo nombre={data.nombre} salidas={salidas} horizontal={horizontal} />
}
