import { Inspector, tipoDeNodo } from './Inspector'
import { useNodoSeleccionado } from './seleccion'

/**
 * El inspector como barra lateral: aparece al lado del lienzo cuando hay un solo nodo seleccionado y desaparece al deseleccionar.
 * Va al lado del lienzo, los dos adentro de un `ReactFlowProvider`.
 */
export function BarraLateral() {
  const { nodo, cambiar, eliminar } = useNodoSeleccionado()
  if (!nodo) return null
  return (
    <aside className="wf-barra-lateral" aria-label="Inspector del nodo">
      <h2 className="wf-inspector-titulo">{tipoDeNodo(nodo)}</h2>
      <Inspector key={nodo.id} nodo={nodo} onCambio={cambiar} onEliminar={eliminar} />
    </aside>
  )
}
