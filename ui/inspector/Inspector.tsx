import type { ReactNode } from 'react'
import { useEditor } from '../editor/contexto'
import { Campo, Entrada, Lista } from '../formulario/Campo'
import { FormularioDeEsquema } from '../formulario/FormularioDeEsquema'
import type { Capacidad } from '../flujos/almacen'
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
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Elegir una capacidad de una lista, agrupada. Si la elegida ya no existe en el sistema, la muestra igual, marcada. */
function ElegirCapacidad({ id, valor, opciones, vacio, onCambio }: { id?: string; valor: string | undefined; opciones: readonly Capacidad[]; vacio: string; onCambio: (id: string | undefined) => void }) {
  return (
    <Lista id={id} value={valor ?? ''} onChange={(e) => onCambio(e.target.value || undefined)} aria-label={id ? undefined : vacio}>
      <option value="">{vacio}</option>
      {valor && !opciones.some((c) => c.id === valor) && <option value={valor}>{valor} (no existe)</option>}
      {opciones.map((c) => (
        <option key={c.id} value={c.id}>
          {c.grupo ? `${c.grupo} · ${c.nombre}` : c.nombre}
        </option>
      ))}
    </Lista>
  )
}

/**
 * Una lista de cosas con nombre que se agregan, se renombran y se quitan: las ramas de una decisión o los eventos de una espera.
 * `extra` dibuja lo propio de cada una debajo de su nombre.
 */
function ListaDeNombres<T extends Item>({ titulo, items, onCambio, agregar, nota, extra }: { titulo: string; items: readonly T[]; onCambio: (items: T[]) => void; agregar: string; nota?: string; extra?: (item: T, cambiar: (cambio: Partial<T>) => void) => ReactNode }) {
  const cambiar = (id: string, cambio: Partial<T>) => onCambio(items.map((x) => (x.id === id ? { ...x, ...cambio } : x)))
  return (
    <fieldset className="wf-grupo">
      <legend>{titulo}</legend>
      {items.map((item, i) => (
        <div key={item.id} className="wf-inspector-item">
          <div className="wf-inspector-fila">
            <Entrada aria-label={`${titulo}: ${i + 1}`} value={item.nombre} onChange={(e) => cambiar(item.id, { nombre: e.target.value } as Partial<T>)} />
            <button type="button" className="wf-inspector-boton" onClick={() => onCambio(items.filter((x) => x.id !== item.id))} aria-label={`Quitar «${item.nombre}»`}>
              Quitar
            </button>
          </div>
          {extra?.(item, (cambio) => cambiar(item.id, cambio))}
        </div>
      ))}
      <button type="button" className="wf-inspector-boton" onClick={() => onCambio([...items, { id: idNuevo(), nombre: '' } as T])}>
        {agregar}
      </button>
      {nota && <p className="wf-campo-ayuda">{nota}</p>}
    </fieldset>
  )
}

/**
 * Lo que evalúa una rama: una condición del registro con sus parámetros. Una combinación de varias (armada por un agente o traída
 * de otro lado) se muestra tal cual, sin editar: para cambiarla hay que elegir una condición simple.
 */
function CondicionDeRama({ condicion, opciones, onCambio, vacio = 'Elegí qué evalúa…' }: { condicion: Record<string, unknown> | undefined; opciones: readonly Capacidad[]; onCambio: (c: Record<string, unknown> | undefined) => void; vacio?: string }) {
  const simple = condicion && typeof condicion['condicion'] === 'string' ? condicion['condicion'] : undefined
  const elegida = opciones.find((c) => c.id === simple)
  return (
    <>
      <ElegirCapacidad valor={simple} opciones={opciones} vacio={condicion && !simple ? 'Varias condiciones combinadas' : vacio} onCambio={(id) => onCambio(id ? { condicion: id } : undefined)} />
      {condicion && !simple && <pre className="wf-inspector-json">{JSON.stringify(condicion, null, 2)}</pre>}
      {elegida?.schemaEntrada && (
        <FormularioDeEsquema esquema={elegida.schemaEntrada} valor={esObjeto(condicion?.['params']) ? condicion['params'] : {}} onCambio={(params) => onCambio({ condicion: elegida.id, ...(Object.keys(params).length > 0 && { params }) })} />
      )}
    </>
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
 *
 * Cada tipo de capacidad va en su lugar: las acciones son los eventos (lo que hace una persona), las condiciones son las ramas de
 * una decisión, y una función es lo que el flujo hace solo (un efecto, o una acción que el flujo ejecuta por su cuenta).
 */
export function Inspector({ nodo, onCambio, onEliminar }: InspectorProps) {
  const { capacidades } = useEditor()
  const acciones = capacidades.filter((c) => (c.tipo ?? 'accion') === 'accion')
  const condiciones = capacidades.filter((c) => c.tipo === 'condicion')
  const ejecutables = capacidades.filter((c) => c.tipo !== 'condicion')
  const capacidad = nodo.type === 'funcion' ? ejecutables.find((c) => c.id === nodo.data.capacidad) : undefined
  return (
    <div className="wf-inspector">
      <Campo etiqueta="Nombre">{(id) => <Entrada id={id} value={nodo.data.nombre} onChange={(e) => onCambio({ nombre: e.target.value })} />}</Campo>

      {nodo.type === 'funcion' && (
        <>
          <Campo etiqueta="Qué hace" ayuda={capacidad?.descripcion ?? 'Lo hace el flujo, por su cuenta.'}>
            {(id) => <ElegirCapacidad id={id} valor={nodo.data.capacidad} opciones={ejecutables} vacio="Elegí una capacidad…" onCambio={(capacidad) => onCambio({ capacidad, params: undefined })} />}
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
        <ListaDeNombres
          titulo="Ramas"
          items={nodo.data.ramas}
          onCambio={(ramas) => onCambio({ ramas })}
          agregar="Agregar una rama"
          nota="Se evalúan en orden. Si ninguna se cumple, sale por «si no»."
          extra={(rama, cambiar) => <CondicionDeRama condicion={rama.condicion} opciones={condiciones} onCambio={(condicion) => cambiar({ condicion })} />}
        />
      )}

      {nodo.type === 'evento' && nodo.data.variante === 'espera' && (
        <ListaDeNombres
          titulo="Eventos que escucha"
          items={nodo.data.eventos ?? []}
          onCambio={(eventos) => onCambio({ eventos })}
          agregar="Agregar un evento"
          nota="El flujo queda parado acá y sigue por el primero que ocurra. La acción la hace una persona: el flujo decide si se puede."
          extra={(evento, cambiar) => (
            <>
              <ElegirCapacidad valor={evento.accion} opciones={acciones} vacio="Qué acción lo produce…" onCambio={(accion) => cambiar({ accion })} />
              <CondicionDeRama condicion={evento.conviene} opciones={condiciones} vacio="Qué conviene (no impide)…" onCambio={(conviene) => cambiar({ conviene })} />
            </>
          )}
        />
      )}

      {nodo.type === 'evento' && (nodo.data.variante === 'inicio' || nodo.data.variante === 'interrupcion') && (
        <Campo etiqueta="Qué acción lo produce" ayuda="La hace una persona en el sistema. El flujo no la ejecuta: decide si se puede y qué sigue.">
          {(id) => <ElegirCapacidad id={id} valor={nodo.data.accion} opciones={acciones} vacio="Sin elegir" onCambio={(accion) => onCambio({ accion })} />}
        </Campo>
      )}

      {nodo.type === 'evento' && nodo.data.variante === 'interrupcion' && (
        <fieldset className="wf-grupo">
          <legend>Qué conviene</legend>
          <CondicionDeRama condicion={nodo.data.conviene} opciones={condiciones} vacio="Nada en particular" onCambio={(conviene) => onCambio({ conviene })} />
          <p className="wf-campo-ayuda">No impide la acción: el sistema lo evalúa y se lo muestra a la persona.</p>
        </fieldset>
      )}

      {nodo.type === 'evento' && nodo.data.variante === 'fin' && nodo.data.rechazo && (
        <Campo etiqueta="Qué se le dice a la persona" ayuda="Si lo dejás vacío, el sistema arma el mensaje con lo que no se cumplió, que suele ser más preciso.">
          {(id) => <Entrada id={id} value={nodo.data.mensaje ?? ''} onChange={(e) => onCambio({ mensaje: e.target.value || undefined })} />}
        </Campo>
      )}

      {nodo.type === 'evento' && nodo.data.variante === 'interrupcion' && (
        <Campo
          etiqueta="Qué pasa con el flujo"
          ayuda={nodo.data.lateral ? 'Hace lo que tiene en su camino y el flujo sigue parado donde estaba.' : 'El flujo deja la espera donde estaba y sigue por este camino.'}
        >
          {(id) => (
            <Lista id={id} value={nodo.data.lateral ? 'lateral' : 'desvia'} onChange={(e) => onCambio({ lateral: e.target.value === 'lateral' || undefined })}>
              <option value="desvia">Lo desvía</option>
              <option value="lateral">No lo desvía</option>
            </Lista>
          )}
        </Campo>
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
