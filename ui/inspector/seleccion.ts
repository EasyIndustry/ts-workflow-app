import { useNodes, useReactFlow } from '@xyflow/react'
import type { NodoDeFlujo } from '../nodos'

/**
 * El nodo que se está inspeccionando y cómo guardarle cambios. Hay nodo solo cuando hay exactamente uno seleccionado: sin selección
 * o con varios, no hay nada que inspeccionar. Tiene que usarse adentro del lienzo o de un `ReactFlowProvider` que lo envuelva.
 */
export function useNodoSeleccionado(): { nodo: NodoDeFlujo | undefined; cambiar: (datos: Record<string, unknown>) => void } {
  const seleccionados = useNodes<NodoDeFlujo>().filter((n) => n.selected)
  const { updateNodeData } = useReactFlow<NodoDeFlujo>()
  const nodo = seleccionados.length === 1 ? seleccionados[0] : undefined
  return {
    nodo,
    cambiar: (datos) => {
      if (nodo) updateNodeData(nodo.id, datos)
    },
  }
}
