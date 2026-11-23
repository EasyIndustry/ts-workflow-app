import { useEdges, useNodes } from '@xyflow/react'
import { useEffect, useRef } from 'react'
import type { NodoDeFlujo } from '../nodos'
import { contenidoDe, type ContenidoDeFlujo } from './almacen'

export interface AutoguardadoProps {
  /** Lo último guardado, como texto (`JSON.stringify` de un `contenidoDe`). */
  guardado: string
  /** Avisa si lo que hay en el lienzo es distinto de lo guardado. */
  onPendiente: (pendiente: boolean) => void
  /** Se llama cuando la persona dejó de tocar por un rato, con lo que hay que guardar. */
  onGuardar: (contenido: ContenidoDeFlujo) => void
  /** Cuánto esperar sin cambios antes de guardar, en milisegundos. */
  espera?: number
}

/**
 * Mira el lienzo y pide guardar cuando su contenido cambia y la persona deja de tocar. Seleccionar o medir un nodo no es un cambio:
 * compara solo lo que se guarda. No dibuja nada. Va adentro del lienzo.
 */
export function Autoguardado({ guardado, onPendiente, onGuardar, espera = 700 }: AutoguardadoProps) {
  const actual = JSON.stringify(contenidoDe(useNodes<NodoDeFlujo>(), useEdges()))
  const avisos = useRef({ onPendiente, onGuardar })
  avisos.current = { onPendiente, onGuardar }

  useEffect(() => {
    const pendiente = actual !== guardado
    avisos.current.onPendiente(pendiente)
    if (!pendiente) return
    const reloj = setTimeout(() => avisos.current.onGuardar(JSON.parse(actual) as ContenidoDeFlujo), espera)
    return () => clearTimeout(reloj)
  }, [actual, guardado, espera])

  return null
}
