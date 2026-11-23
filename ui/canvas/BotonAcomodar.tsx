import { useReactFlow } from '@xyflow/react'
import { useState } from 'react'
import { acomodar, type Puerto } from './acomodo'
import { useOrientacion } from './orientacion'

const idDePuerto = (nodo: string, tipo: 'source' | 'target', punto?: string | null) => `${nodo}/${tipo}/${punto ?? ''}`

/** El botón que acomoda solos los nodos del lienzo, según sus flechas, sus puntos de conexión y la orientación. Va adentro del lienzo. */
export function BotonAcomodar() {
  const { getNodes, getEdges, getInternalNode, setNodes, fitView } = useReactFlow()
  const orientacion = useOrientacion()
  const [ocupado, setOcupado] = useState(false)

  async function alAcomodar() {
    setOcupado(true)
    try {
      const primero: Record<string, string> = {}
      const cajas = getNodes().map((n) => {
        const puntos = getInternalNode(n.id)?.internals.handleBounds
        const puertos: Puerto[] = (['source', 'target'] as const).flatMap((tipo) =>
          (puntos?.[tipo] ?? []).map((p) => {
            const id = idDePuerto(n.id, tipo, p.id)
            primero[`${n.id}/${tipo}`] ??= id
            return { id, x: p.x, y: p.y, ancho: p.width, alto: p.height, tipo: tipo === 'source' ? ('salida' as const) : ('entrada' as const) }
          }),
        )
        return { id: n.id, ancho: n.measured?.width ?? n.width ?? 150, alto: n.measured?.height ?? n.height ?? 40, puertos }
      })
      // Una flecha sin punto declarado usa el primero del nodo.
      const flechas = getEdges().map((e) => ({
        id: e.id,
        desde: e.source,
        hacia: e.target,
        puertoDesde: e.sourceHandle ? idDePuerto(e.source, 'source', e.sourceHandle) : primero[`${e.source}/source`],
        puertoHacia: e.targetHandle ? idDePuerto(e.target, 'target', e.targetHandle) : primero[`${e.target}/target`],
      }))
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
