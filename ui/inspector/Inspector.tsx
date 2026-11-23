import { useEditor } from '../editor/contexto'
import { Campo, Entrada, Lista } from '../formulario/Campo'
import { FormularioDeEsquema } from '../formulario/FormularioDeEsquema'
import type { NodoDeFlujo } from '../nodos'
import './inspector.css'

export { tipoDeNodo } from '../nodos/descripcion'
export type { Capacidad } from '../editor/contexto'

export interface InspectorProps {
  nodo: NodoDeFlujo
  /** Los datos que cambiaron. Quien monta el inspector los guarda en el nodo. */
  onCambio: (datos: Record<string, unknown>) => void
  /** Quita el nodo del flujo. Sin esta función, no se ofrece. */
  onEliminar?: () => void
}

type Item = { id: string; nombre: string }
const idNuevo = () => `s-${Math.random().toString(36).slice(2, 8)}`

/** Una lista de nombres que se agregan, se renombran y se quitan: las ramas de una decisión o los eventos de una espera. */
function ListaDeNombres({ titulo, items, onCambio, agregar, nota }: { titulo: string; items: readonly Item[]; onCambio: (items: Item[]) => void; agregar: string; nota?: string }) {
  return (
    <fieldset className="wf-grupo">
      <legend>{titulo}</legend>
      {items.map((item, i) => (
        <div key={item.id} className="wf-inspector-fila">
          <Entrada aria-label={`${titulo}: ${i + 1}`} value={item.nombre} onChange={(e) => onCambio(items.map((x) => (x.id === item.id ? { ...x, nombre: e.target.value } : x)))} />
          <button type="button" className="wf-inspector-boton" onClick={() => onCambio(items.filter((x) => x.id !== item.id))} aria-label={`Quitar «${item.nombre}»`}>
            Quitar
          </button>
        </div>
      ))}
      <button type="button" className="wf-inspector-boton" onClick={() => onCambio([...items, { id: idNuevo(), nombre: '' }])}>
        {agregar}
      </button>
      {nota && <p className="wf-campo-ayuda">{nota}</p>}
    </fieldset>
  )
}

/** Elegir qué subflujo usa el nodo y en qué versión. Las salidas del nodo son los fines de esa versión. */
function Subflujo({ nodo, onCambio }: { nodo: Extract<NodoDeFlujo, { type: 'subflujo' }>; onCambio: InspectorProps['onCambio'] }) {
  const { subflujos, onAbrirFlujo } = useEditor()
  const elegido = subflujos.find((s) => s.id === nodo.data.flujo)
  const ultima = elegido?.versiones.at(-1)
  const usar = (id: string, version?: number) => {
    const contrato = subflujos.find((s) => s.id === id)
    const v = contrato?.versiones.find((x) => x.version === version) ?? contrato?.versiones.at(-1)
    onCambio({ flujo: id, version: v?.version ?? 0, salidas: v?.salidas ?? [] })
  }
  return (
    <>
      <Campo etiqueta="Qué flujo usa" ayuda={subflujos.length === 0 ? 'Todavía no hay subflujos publicados.' : undefined}>
        {(id) => (
          <Lista id={id} value={nodo.data.flujo} onChange={(e) => usar(e.target.value)}>
            <option value="">Elegí un subflujo…</option>
            {nodo.data.flujo && !elegido && <option value={nodo.data.flujo}>{nodo.data.flujo} (no está publicado)</option>}
            {subflujos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </Lista>
        )}
      </Campo>
      {elegido && (
        <Campo etiqueta="Versión" ayuda={ultima && ultima.version !== nodo.data.version ? `Hay una más nueva: la ${ultima.version}. Este nodo sigue con la suya hasta que la cambies.` : undefined}>
          {(id) => (
            <Lista id={id} value={nodo.data.version} onChange={(e) => usar(elegido.id, Number(e.target.value))}>
              {elegido.versiones.map((v) => (
                <option key={v.version} value={v.version}>
                  Versión {v.version}
                </option>
              ))}
            </Lista>
          )}
        </Campo>
      )}
      {elegido && (
        <p className="wf-campo-ayuda">
          Sale por: {nodo.data.salidas.map((s) => `«${s.nombre}»`).join(', ') || 'ninguna salida'}. Son los fines de ese flujo.
        </p>
      )}
      {nodo.data.flujo && onAbrirFlujo && (
        <button type="button" className="wf-inspector-boton" onClick={() => onAbrirFlujo(nodo.data.flujo)}>
          Abrir «{elegido?.nombre ?? nodo.data.flujo}» →
        </button>
      )}
    </>
  )
}

/**
 * El formulario de un nodo: lo que se puede configurar, según su tipo. No sabe dónde está montado (una barra lateral, una tarjeta
 * flotante) ni guarda nada: avisa cada cambio con `onCambio`. Las capacidades y los subflujos salen del contexto del editor.
 */
export function Inspector({ nodo, onCambio, onEliminar }: InspectorProps) {
  const { capacidades } = useEditor()
  const capacidad = nodo.type === 'funcion' ? capacidades.find((c) => c.id === nodo.data.capacidad) : undefined
  return (
    <div className="wf-inspector">
      <Campo etiqueta="Nombre">{(id) => <Entrada id={id} value={nodo.data.nombre} onChange={(e) => onCambio({ nombre: e.target.value })} />}</Campo>

      {nodo.type === 'funcion' && (
        <>
          <Campo etiqueta="Qué hace" ayuda={capacidad?.descripcion}>
            {(id) => (
              <Lista id={id} value={nodo.data.capacidad ?? ''} onChange={(e) => onCambio({ capacidad: e.target.value || undefined, params: undefined })}>
                <option value="">Elegí una capacidad…</option>
                {nodo.data.capacidad && !capacidad && <option value={nodo.data.capacidad}>{nodo.data.capacidad} (no existe)</option>}
                {capacidades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.grupo ? `${c.grupo} · ${c.nombre}` : c.nombre}
                  </option>
                ))}
              </Lista>
            )}
          </Campo>
          {capacidad?.schemaEntrada && (
            <fieldset className="wf-grupo">
              <legend>Con qué datos</legend>
              <FormularioDeEsquema esquema={capacidad.schemaEntrada} valor={nodo.data.params ?? {}} onCambio={(params) => onCambio({ params })} />
            </fieldset>
          )}
        </>
      )}

      {nodo.type === 'decision' && (
        <ListaDeNombres titulo="Ramas" items={nodo.data.ramas} onCambio={(ramas) => onCambio({ ramas })} agregar="Agregar una rama" nota="Se evalúan en orden. Si ninguna se cumple, sale por «si no»." />
      )}

      {nodo.type === 'evento' && nodo.data.variante === 'espera' && (
        <ListaDeNombres
          titulo="Eventos que escucha"
          items={nodo.data.eventos ?? []}
          onCambio={(eventos) => onCambio({ eventos })}
          agregar="Agregar un evento"
          nota="El flujo queda parado acá y sigue por el primero que ocurra."
        />
      )}

      {nodo.type === 'subflujo' && <Subflujo nodo={nodo} onCambio={onCambio} />}

      {onEliminar && (
        <button type="button" className="wf-inspector-boton wf-inspector-eliminar" onClick={onEliminar}>
          Eliminar este nodo
        </button>
      )}
    </div>
  )
}
