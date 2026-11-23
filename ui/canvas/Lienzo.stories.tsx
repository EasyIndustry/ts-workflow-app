import type { Meta, StoryObj } from '@storybook/react-vite'
import { Lienzo } from './Lienzo'

const meta = {
  title: 'Canvas',
  component: Lienzo,
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Lienzo>

export default meta

type Story = StoryObj<typeof meta>

export const Vacio: Story = {}

const borde = '1px solid #d4d4d8'

/**
 * La app metida en un iframe dentro de la pantalla de otro sistema. El sistema de afuera es de mentira: solo muestra que el lienzo
 * vive en su propio documento y que el zoom, el arrastre y el click derecho quedan adentro del frame.
 */
export const EnUnFrame: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%', fontFamily: 'system-ui, sans-serif', color: '#18181b' }}>
      <header style={{ padding: '10px 16px', borderBottom: borde, fontWeight: 600 }}>Sistema anfitrión</header>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 0 }}>
        <nav aria-label="Menú del sistema anfitrión" style={{ padding: 12, borderRight: borde, fontSize: 14, lineHeight: 2 }}>
          <div>Inicio</div>
          <div>Operaciones</div>
          <div>Configuración</div>
          <div style={{ fontWeight: 600 }}>Flujos</div>
        </nav>
        <main style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 12, padding: 16, minHeight: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>Flujos</h1>
          <iframe title="App de flujos" src="iframe.html?id=canvas--vacio&viewMode=story" style={{ width: '100%', height: '100%', border: borde, borderRadius: 8 }} />
        </main>
      </div>
    </div>
  ),
}
