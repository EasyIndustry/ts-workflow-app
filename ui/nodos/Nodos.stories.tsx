import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Edge } from '@xyflow/react'
import { Lienzo } from '../canvas/Lienzo'
import { TIPOS_DE_NODO, type NodoDeFlujo } from './index'

/**
 * Cada story muestra un tipo de nodo solo en el lienzo. En «Todos» están juntos, sin flechas, para probar cómo se conectan. En
 * «Conectados» ya tienen flechas y están amontonados, para probar «Acomodar».
 */
function Muestra({ nodos, flechas = [] }: { nodos: NodoDeFlujo[]; flechas?: Edge[] }) {
  return (
    <div style={{ height: '100vh' }}>
      <Lienzo<NodoDeFlujo> nodeTypes={TIPOS_DE_NODO} defaultNodes={nodos} defaultEdges={flechas} fitView fitViewOptions={{ maxZoom: 1.5 }} />
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

const flecha = (source: string, target: string, sourceHandle = 'salida'): Edge => ({ id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle })

export const Conectados: Story = {
  args: {
    nodos: [
      { ...disparador, ...en(0, 0) },
      { ...decision, ...en(40, 30) },
      { ...funcion, ...en(80, 60) },
      { ...subflujo, ...en(120, 90) },
      { ...estado, ...en(160, 120) },
      { id: 'final', type: 'estado', ...en(200, 150), data: { nombre: 'Cerrado', final: true } },
    ],
    flechas: [
      flecha('disparador', 'decision'),
      flecha('decision', 'subflujo', 'alto'),
      flecha('decision', 'funcion', 'medio'),
      flecha('decision', 'final', 'sino'),
      flecha('subflujo', 'estado', 'aprobado'),
      flecha('subflujo', 'final', 'rechazado'),
      flecha('funcion', 'final'),
      flecha('estado', 'final'),
    ],
  },
}
