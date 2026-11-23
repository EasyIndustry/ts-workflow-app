import { useEdges, useNodes } from '@xyflow/react'
import { useEffect, useRef } from 'react'
import type { NodoDeFlujo } from '../nodos'
import { contenidoDe, enTexto, type ContenidoDeFlujo } from './almacen'

export interface AutoguardadoProps {
  /** Lo último guardado, como texto (`enTexto` de un contenido). */
  guardado: string
  /** Avisa lo que hay en el lienzo cuando es distinto de lo guardado, o `null` cuando es igual. */
  onCambio: (sinGuardar: ContenidoDeFlujo | null) => void
  /** Se llama cuando la persona dejó de tocar por un rato, con lo que hay que guardar. Sin esta función no guarda solo. */
  onGuardar?: (contenido: ContenidoDeFlujo) => void
  /** Cuánto esperar sin cambios antes de guardar, en milisegundos. */
  espera?: number
}

/**
 * Mira el lienzo: avisa cuando su contenido deja de ser igual a lo guardado y, si se lo piden, guarda solo cuando la persona deja
 * de tocar. Seleccionar o medir un nodo no es un cambio: compara solo lo que se guarda. No dibuja nada. Va adentro del lienzo.
 */
export function Autoguardado({ guardado, onCambio, onGuardar, espera = 700 }: AutoguardadoProps) {
  const actual = enTexto(contenidoDe(useNodes<NodoDeFlujo>(), useEdges()))
  const avisos = useRef({ onCambio, onGuardar })
  avisos.current = { onCambio, onGuardar }
  const automatico = Boolean(onGuardar)

  useEffect(() => {
    if (actual === guardado) {
      avisos.current.onCambio(null)
      return
    }
    const contenido = JSON.parse(actual) as ContenidoDeFlujo
    avisos.current.onCambio(contenido)
    if (!automatico) return
    const reloj = setTimeout(() => avisos.current.onGuardar?.(contenido), espera)
    return () => clearTimeout(reloj)
  }, [actual, guardado, espera, automatico])

  return null
}
