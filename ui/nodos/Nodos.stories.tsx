import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Edge } from '@xyflow/react'
import { Lienzo } from '../canvas/Lienzo'
import type { Orientacion } from '../canvas/orientacion'
import { TIPOS_DE_NODO, type NodoDeFlujo } from './index'

/**
 * Cada story muestra un tipo de nodo solo en el lienzo. En «Todos» están juntos, sin flechas, para probar cómo se conectan. En
 * «Conectados» ya tienen flechas y están amontonados, para probar «Acomodar». La orientación se elige en el panel «Controls».
 */
function Muestra({ nodos, flechas = [], orientacion }: { nodos: NodoDeFlujo[]; flechas?: Edge[]; orientacion?: Orientacion }) {
  return (
    <div style={{ height: '100vh' }}>
      <Lienzo<NodoDeFlujo> nodeTypes={TIPOS_DE_NODO} orientacion={orientacion} defaultNodes={nodos} defaultEdges={flechas} fitView fitViewOptions={{ maxZoom: 1.5 }} />
    </div>
  )
}

const meta = {
  title: 'Nodos',
  component: Muestra,
  // La orientación se cambia desde el panel «Controls» de Storybook.
  args: { orientacion: 'vertical' },
  argTypes: { orientacion: { control: 'inline-radio', options: ['vertical', 'horizontal'] } },
} satisfies Meta<typeof Muestra>

export default meta

type Story = StoryObj<typeof meta>

const en = (x: number, y: number) => ({ position: { x, y } })

const inicio: NodoDeFlujo = { id: 'inicio', type: 'evento', ...en(0, 0), data: { variante: 'inicio', nombre: 'Llegó un pedido' } }
const espera: NodoDeFlujo = {
  id: 'espera',
  type: 'evento',
  ...en(0, 0),
  data: { variante: 'espera', nombre: 'Esperando la respuesta', eventos: [{ id: 'respondio', nombre: 'respondió' }, { id: 'vencio', nombre: 'pasaron 3 días' }] },
}
const interrupcion: NodoDeFlujo = { id: 'interrupcion', type: 'evento', ...en(0, 0), data: { variante: 'interrupcion', nombre: 'Cancelaron el pedido', excepto: ['espera'] } }
const fin: NodoDeFlujo = { id: 'fin', type: 'evento', ...en(0, 0), data: { variante: 'fin', nombre: 'Cerrado' } }
const funcion: NodoDeFlujo = { id: 'funcion', type: 'funcion', ...en(0, 0), data: { nombre: 'Avisar al responsable', capacidad: 'avisos.enviar' } }
const decision: NodoDeFlujo = {
  id: 'decision',
  type: 'decision',
  ...en(0, 0),
  data: { nombre: '¿Cuánto es el total?', ramas: [{ id: 'alto', nombre: 'más de 1000' }, { id: 'medio', nombre: 'más de 100' }] },
}
const subflujo: NodoDeFlujo = {
  id: 'subflujo',
  type: 'subflujo',
  ...en(0, 0),
  data: { nombre: 'Revisar el pedido', flujo: 'revision', version: 3, salidas: [{ id: 'aprobado', nombre: 'aprobado' }, { id: 'rechazado', nombre: 'rechazado' }] },
}

/** Las cuatro variantes del evento: inicio y fin (óvalo), espera (círculo de borde doble) e interrupción (el mismo círculo, sin entrada). */
export const Evento: Story = { args: { nodos: [inicio, { ...espera, ...en(260, 0) }, { ...interrupcion, ...en(260, 120) }, { ...fin, ...en(560, 0) }] } }
export const Funcion: Story = { args: { nodos: [funcion] } }
export const Decision: Story = { args: { nodos: [decision] } }
export const Subflujo: Story = { args: { nodos: [subflujo] } }

export const Todos: Story = {
  args: {
    nodos: [
      { ...inicio, ...en(60, 0) },
      { ...espera, ...en(360, 0) },
      { ...decision, ...en(0, 140) },
      { ...funcion, ...en(300, 160) },
      { ...subflujo, ...en(0, 340) },
      { ...fin, ...en(360, 350) },
      { ...interrupcion, ...en(560, 160) },
    ],
  },
}

const flecha = (source: string, target: string, sourceHandle = 'salida'): Edge => ({ id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle })

export const Conectados: Story = {
  args: {
    nodos: [
      { ...inicio, ...en(0, 0) },
      { ...decision, ...en(40, 30) },
      { ...funcion, ...en(80, 60) },
      { ...subflujo, ...en(120, 90) },
      { ...espera, ...en(160, 120) },
      { ...fin, ...en(200, 150) },
      { id: 'rechazado', type: 'evento', ...en(240, 180), data: { variante: 'fin', nombre: 'Rechazado' } },
      { ...interrupcion, ...en(280, 210) },
    ],
    flechas: [
      flecha('inicio', 'decision'),
      flecha('decision', 'subflujo', 'alto'),
      flecha('decision', 'funcion', 'medio'),
      flecha('decision', 'fin', 'sino'),
      flecha('subflujo', 'espera', 'aprobado'),
      flecha('subflujo', 'rechazado', 'rechazado'),
      flecha('funcion', 'fin'),
      flecha('espera', 'fin', 'respondio'),
      flecha('espera', 'rechazado', 'vencio'),
      flecha('interrupcion', 'rechazado'),
    ],
  },
}
