import { Panel, useReactFlow, useStoreApi } from '@xyflow/react'
import type { NodoDeFlujo } from '../nodos'
import { useEditor } from './contexto'

type Datos = NodoDeFlujo['data']

/** Lo que se puede agregar al flujo, con los datos con los que nace cada nodo. */
const PIEZAS: readonly { clave: string; nombre: string; tipo: NonNullable<NodoDeFlujo['type']>; datos: () => Datos; soloEnMaestro?: boolean }[] = [
  { clave: 'inicio', nombre: 'Inicio', tipo: 'evento', datos: () => ({ variante: 'inicio', nombre: 'Inicio' }), soloEnMaestro: true },
  { clave: 'funcion', nombre: 'Función', tipo: 'funcion', datos: () => ({ nombre: 'Función' }) },
  { clave: 'decision', nombre: 'Decisión', tipo: 'decision', datos: () => ({ nombre: '¿Se cumple?', ramas: [{ id: 'si', nombre: 'sí' }] }) },
  { clave: 'espera', nombre: 'Espera', tipo: 'evento', datos: () => ({ variante: 'espera', nombre: 'Espera', eventos: [{ id: 'evento', nombre: 'pasó algo' }] }), soloEnMaestro: true },
  { clave: 'interrupcion', nombre: 'Interrupción', tipo: 'evento', datos: () => ({ variante: 'interrupcion', nombre: 'Pasó algo' }), soloEnMaestro: true },
  { clave: 'subflujo', nombre: 'Subflujo', tipo: 'subflujo', datos: () => ({ nombre: 'Subflujo', flujo: '', version: 0, salidas: [] }) },
  { clave: 'fin', nombre: 'Fin', tipo: 'evento', datos: () => ({ variante: 'fin', nombre: 'Fin' }) },
]

/**
 * Los botones para agregar nodos. El nodo nuevo aparece en el centro de lo que se está viendo, seleccionado, para configurarlo en
 * el inspector. En un subflujo no se ofrecen las esperas, las interrupciones ni otro inicio. Va adentro del lienzo.
 */
export function Paleta() {
  const { setNodes, getNodes } = useReactFlow<NodoDeFlujo>()
  const estado = useStoreApi()
  const { tipo } = useEditor()

  function agregar(pieza: (typeof PIEZAS)[number]) {
    const { width, height, transform } = estado.getState()
    const [x, y, zoom] = transform
    // Cada nodo nuevo cae un poco corrido del anterior, para que dos seguidos no queden uno encima del otro.
    const corrimiento = (getNodes().length % 6) * 24
    const nuevo = {
      id: `${pieza.clave}-${Math.random().toString(36).slice(2, 8)}`,
      type: pieza.tipo,
      position: { x: (width / 2 - x) / zoom - 75 + corrimiento, y: (height / 2 - y) / zoom - 30 + corrimiento },
      data: pieza.datos(),
      selected: true,
    } as NodoDeFlujo
    setNodes((nodos) => [...nodos.map((n) => (n.selected ? { ...n, selected: false } : n)), nuevo])
  }

  return (
    <Panel position="top-left" className="wf-paleta">
      <span>Agregar</span>
      {PIEZAS.filter((p) => tipo === 'maestro' || !p.soloEnMaestro).map((p) => (
        <button key={p.clave} type="button" onClick={() => agregar(p)}>
          {p.nombre}
        </button>
      ))}
    </Panel>
  )
}
