import { useNodes, useReactFlow } from '@xyflow/react'
import type { NodoDeFlujo } from '../nodos'
import { salidasDe } from '../nodos/descripcion'

/**
 * El nodo que se está inspeccionando, cómo guardarle cambios y cómo quitarlo. Hay nodo solo cuando hay exactamente uno
 * seleccionado: sin selección o con varios, no hay nada que inspeccionar. Tiene que usarse adentro del lienzo o de un
 * `ReactFlowProvider` que lo envuelva.
 */
export function useNodoSeleccionado(): { nodo: NodoDeFlujo | undefined; cambiar: (datos: Record<string, unknown>) => void; eliminar: () => void } {
  const seleccionados = useNodes<NodoDeFlujo>().filter((n) => n.selected)
  const { updateNodeData, getEdges, deleteElements } = useReactFlow<NodoDeFlujo>()
  const nodo = seleccionados.length === 1 ? seleccionados[0] : undefined
  return {
    nodo,
    cambiar: (datos) => {
      if (!nodo) return
      updateNodeData(nodo.id, datos)
      // Si el cambio le sacó una salida al nodo (una rama, un evento), se van las flechas que salían de ella.
      const salidas = new Set(salidasDe({ ...nodo, data: { ...nodo.data, ...datos } } as NodoDeFlujo).map((s) => s.id))
      const sueltas = getEdges().filter((f) => f.source === nodo.id && f.sourceHandle && !salidas.has(f.sourceHandle))
      if (sueltas.length) void deleteElements({ edges: sueltas })
    },
    eliminar: () => {
      if (nodo) void deleteElements({ nodes: [{ id: nodo.id }] })
    },
  }
}
