import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReactFlowProvider } from '@xyflow/react'
import { Lienzo } from '../canvas/Lienzo'
import { CAPACIDADES_DE_EJEMPLO, FLECHAS_DE_EJEMPLO, NODOS_DE_EJEMPLO } from '../ejemplo'
import { TIPOS_DE_NODO, type NodoDeFlujo } from '../nodos'
import { BarraLateral } from './BarraLateral'
import { TarjetaFlotante } from './TarjetaFlotante'

/**
 * Dos formas de mostrar el inspector, con el mismo formulario adentro. Hacé click en un nodo para verlo; con ninguno o con varios
 * seleccionados no aparece. El nodo de función deja elegir qué hace; el resto, por ahora, solo el nombre.
 */
const meta = { title: 'Inspector' } satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const lienzo = { nodeTypes: TIPOS_DE_NODO, defaultNodes: NODOS_DE_EJEMPLO, defaultEdges: FLECHAS_DE_EJEMPLO, fitView: true, fitViewOptions: { maxZoom: 1.2 } }

/** El inspector al costado: aparece al seleccionar un nodo y el lienzo le hace lugar. */
export const EnBarraLateral: Story = {
  name: 'Barra lateral',
  render: () => (
    <ReactFlowProvider>
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Lienzo<NodoDeFlujo> {...lienzo} />
        </div>
        <BarraLateral capacidades={CAPACIDADES_DE_EJEMPLO} />
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
        <TarjetaFlotante capacidades={CAPACIDADES_DE_EJEMPLO} />
      </Lienzo>
    </div>
  ),
}
