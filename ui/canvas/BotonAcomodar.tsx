import { useReactFlow } from '@xyflow/react'
import { useState } from 'react'
import { acomodar } from './acomodo'
import { useOrientacion } from './orientacion'

/** El botón que acomoda solos los nodos del lienzo, según sus flechas y la orientación. Va adentro del lienzo. */
export function BotonAcomodar() {
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow()
  const orientacion = useOrientacion()
  const [ocupado, setOcupado] = useState(false)

  async function alAcomodar() {
    setOcupado(true)
    try {
      const cajas = getNodes().map((n) => ({ id: n.id, ancho: n.measured?.width ?? n.width ?? 150, alto: n.measured?.height ?? n.height ?? 40 }))
      const flechas = getEdges().map((e) => ({ id: e.id, desde: e.source, hacia: e.target }))
      const posiciones = await acomodar(cajas, flechas, orientacion)
      setNodes((nodos) => nodos.map((n) => ({ ...n, position: posiciones[n.id] ?? n.position })))
      requestAnimationFrame(() => void fitView({ duration: 200 }))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <button type="button" onClick={() => void alAcomodar()} disabled={ocupado}>
      Acomodar
    </button>
  )
}
