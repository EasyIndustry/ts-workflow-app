import { useRef, useState } from 'react'
import { Inspector, tipoDeNodo } from './Inspector'
import { useNodoSeleccionado } from './seleccion'

/**
 * El inspector como tarjeta flotante sobre el lienzo: aparece cuando hay un solo nodo seleccionado y se mueve arrastrándola del
 * título. Recuerda dónde quedó entre una selección y otra. Va adentro del lienzo.
 */
export function TarjetaFlotante() {
  const { nodo, cambiar, eliminar } = useNodoSeleccionado()
  const [lugar, setLugar] = useState({ x: 140, y: 16 })
  const agarre = useRef<{ dx: number; dy: number } | null>(null)
  if (!nodo) return null
  return (
    // nodrag, nopan y nowheel: lo que pasa sobre la tarjeta no mueve el lienzo.
    <section className="wf-tarjeta-flotante nodrag nopan nowheel" style={{ left: lugar.x, top: lugar.y }} aria-label="Inspector del nodo">
      <h2
        className="wf-inspector-titulo wf-tarjeta-flotante-agarre"
        onPointerDown={(e) => {
          agarre.current = { dx: e.clientX - lugar.x, dy: e.clientY - lugar.y }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (agarre.current) setLugar({ x: e.clientX - agarre.current.dx, y: e.clientY - agarre.current.dy })
        }}
        onPointerUp={() => {
          agarre.current = null
        }}
      >
        {tipoDeNodo(nodo)}
      </h2>
      <Inspector key={nodo.id} nodo={nodo} onCambio={cambiar} onEliminar={eliminar} />
    </section>
  )
}
