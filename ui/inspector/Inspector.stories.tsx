import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReactFlowProvider, type Edge } from '@xyflow/react'
import { Lienzo } from '../canvas/Lienzo'
import { TIPOS_DE_NODO, type NodoDeFlujo } from '../nodos'
import { BarraLateral } from './BarraLateral'
import type { Capacidad } from './Inspector'
import { TarjetaFlotante } from './TarjetaFlotante'

/**
 * Dos formas de mostrar el inspector, con el mismo formulario adentro. Hacé click en un nodo para verlo; con ninguno o con varios
 * seleccionados no aparece. El nodo de función deja elegir qué hace; el resto, por ahora, solo el nombre.
 */
const meta = { title: 'Inspector' } satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const CAPACIDADES: Capacidad[] = [
  { id: 'avisos.enviar', nombre: 'Enviar un aviso', descripcion: 'Le avisa a una persona o a un grupo.' },
  { id: 'registros.actualizar', nombre: 'Actualizar un registro', descripcion: 'Cambia campos de un registro.' },
  { id: 'tareas.crear', nombre: 'Crear una tarea', descripcion: 'Deja una tarea pendiente para alguien.' },
  { id: 'documentos.generar', nombre: 'Generar un documento', descripcion: 'Arma un documento a partir de una plantilla.' },
]

const NODOS: NodoDeFlujo[] = [
  { id: 'inicio', type: 'evento', position: { x: 60, y: 0 }, data: { variante: 'inicio', nombre: 'Llegó un pedido' } },
  { id: 'aviso', type: 'funcion', position: { x: 37, y: 120 }, data: { nombre: 'Avisar al responsable', capacidad: 'avisos.enviar' } },
  { id: 'total', type: 'decision', position: { x: 20, y: 250 }, data: { nombre: '¿Cuánto es el total?', ramas: [{ id: 'alto', nombre: 'más de 1000' }] } },
  { id: 'tarea', type: 'funcion', position: { x: -120, y: 450 }, data: { nombre: 'Pedir una revisión' } },
  { id: 'fin', type: 'evento', position: { x: 200, y: 460 }, data: { variante: 'fin', nombre: 'Cerrado' } },
]

const flecha = (source: string, target: string, sourceHandle = 'salida'): Edge => ({ id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle })
const FLECHAS = [flecha('inicio', 'aviso'), flecha('aviso', 'total'), flecha('total', 'tarea', 'alto'), flecha('total', 'fin', 'sino'), flecha('tarea', 'fin')]

const lienzo = { nodeTypes: TIPOS_DE_NODO, defaultNodes: NODOS, defaultEdges: FLECHAS, fitView: true, fitViewOptions: { maxZoom: 1.2 } }

/** El inspector al costado: aparece al seleccionar un nodo y el lienzo le hace lugar. */
export const EnBarraLateral: Story = {
  name: 'Barra lateral',
  render: () => (
    <ReactFlowProvider>
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Lienzo<NodoDeFlujo> {...lienzo} />
        </div>
        <BarraLateral capacidades={CAPACIDADES} />
      </div>
    </ReactFlowProvider>
  ),
}

/** El inspector como tarjeta sobre el lienzo: se arrastra del título y recuerda dónde quedó. */
export const EnTarjetaFlotante: Story = {
  name: 'Tarjeta flotante',
  render: () => (
    <div style={{ height: '100vh' }}>
      <Lienzo<NodoDeFlujo> {...lienzo}>
        <TarjetaFlotante capacidades={CAPACIDADES} />
      </Lienzo>
    </div>
  ),
}
