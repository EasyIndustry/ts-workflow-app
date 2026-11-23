import type { Meta, StoryObj } from '@storybook/react-vite'
import { Lienzo } from '../canvas/Lienzo'
import { TIPOS_DE_NODO, type NodoDeFlujo } from './index'

/** Cada story muestra un tipo de nodo solo en el lienzo. En «Todos» están juntos, sin flechas, para probar cómo se conectan. */
function Muestra({ nodos }: { nodos: NodoDeFlujo[] }) {
  return (
    <div style={{ height: '100vh' }}>
      <Lienzo<NodoDeFlujo> nodeTypes={TIPOS_DE_NODO} defaultNodes={nodos} defaultEdges={[]} fitView fitViewOptions={{ maxZoom: 1.5 }} />
    </div>
  )
}

const meta = { title: 'Nodos', component: Muestra } satisfies Meta<typeof Muestra>

export default meta

type Story = StoryObj<typeof meta>

const en = (x: number, y: number) => ({ position: { x, y } })

const disparador: NodoDeFlujo = { id: 'disparador', type: 'disparador', ...en(0, 0), data: { nombre: 'Llegó un pedido', detalle: 'evento' } }
const funcion: NodoDeFlujo = { id: 'funcion', type: 'funcion', ...en(0, 0), data: { nombre: 'Avisar al responsable', capacidad: 'avisos.enviar' } }
const decision: NodoDeFlujo = {
  id: 'decision',
  type: 'decision',
  ...en(0, 0),
  data: { nombre: '¿Cuánto es el total?', ramas: [{ id: 'alto', nombre: 'más de 1000' }, { id: 'medio', nombre: 'más de 100' }] },
}
const estado: NodoDeFlujo = { id: 'estado', type: 'estado', ...en(0, 0), data: { nombre: 'En revisión' } }
const subflujo: NodoDeFlujo = {
  id: 'subflujo',
  type: 'subflujo',
  ...en(0, 0),
  data: { nombre: 'Revisar el pedido', flujo: 'revision', version: 3, salidas: [{ id: 'aprobado', nombre: 'aprobado' }, { id: 'rechazado', nombre: 'rechazado' }] },
}

export const Disparador: Story = { args: { nodos: [disparador] } }
export const Funcion: Story = { args: { nodos: [funcion] } }
export const Decision: Story = { args: { nodos: [decision] } }
export const Estado: Story = {
  args: {
    nodos: [
      { id: 'inicial', type: 'estado', ...en(0, 0), data: { nombre: 'Nuevo', inicial: true } },
      { ...estado, ...en(220, 0) },
      { id: 'final', type: 'estado', ...en(440, 0), data: { nombre: 'Cerrado', final: true } },
    ],
  },
}
export const Subflujo: Story = { args: { nodos: [subflujo] } }

export const Todos: Story = {
  args: {
    nodos: [
      { ...disparador, ...en(0, 0) },
      { ...estado, ...en(260, 0) },
      { ...decision, ...en(0, 140) },
      { ...funcion, ...en(300, 140) },
      { ...subflujo, ...en(0, 300) },
      { id: 'final', type: 'estado', ...en(300, 300), data: { nombre: 'Cerrado', final: true } },
    ],
  },
}
