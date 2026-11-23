import { Campo, Entrada, Lista } from '../formulario/Campo'
import type { NodoDeFlujo } from '../nodos'
import './inspector.css'

export { tipoDeNodo } from '../nodos/descripcion'

/** Una capacidad del registro, como la describe el core: lo que un nodo de función puede ejecutar. */
export interface Capacidad {
  id: string
  nombre: string
  descripcion?: string
}

export interface InspectorProps {
  nodo: NodoDeFlujo
  /** Las capacidades entre las que se elige qué hace una función. Las pasa quien monta la app; salen del registro. */
  capacidades: readonly Capacidad[]
  /** Los datos que cambiaron. Quien monta el inspector los guarda en el nodo. */
  onCambio: (datos: Record<string, unknown>) => void
}

/**
 * El formulario de un nodo: lo que se puede configurar, según su tipo. No sabe dónde está montado (una barra lateral, una tarjeta
 * flotante) ni guarda nada: avisa cada cambio con `onCambio`.
 */
export function Inspector({ nodo, capacidades, onCambio }: InspectorProps) {
  const capacidad = nodo.type === 'funcion' ? capacidades.find((c) => c.id === nodo.data.capacidad) : undefined
  return (
    <div className="wf-inspector">
      <Campo etiqueta="Nombre">{(id) => <Entrada id={id} value={nodo.data.nombre} onChange={(e) => onCambio({ nombre: e.target.value })} />}</Campo>
      {nodo.type === 'funcion' && (
        <Campo etiqueta="Qué hace" ayuda={capacidad?.descripcion}>
          {(id) => (
            <Lista id={id} value={nodo.data.capacidad ?? ''} onChange={(e) => onCambio({ capacidad: e.target.value || undefined })}>
              <option value="">Elegí una capacidad…</option>
              {capacidades.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Lista>
          )}
        </Campo>
      )}
    </div>
  )
}
