import type { Meta, StoryObj } from '@storybook/react-vite'
import { CAPACIDADES_DE_EJEMPLO, FLECHAS_DE_EJEMPLO, NODOS_DE_EJEMPLO } from '../ejemplo'
import { Editor } from './Editor'

/**
 * La app armada. El botón «Configuración» abre la ventana de ajustes; el primero elige si el inspector aparece como barra lateral
 * o como tarjeta flotante. Lo elegido queda guardado en el navegador.
 */
const meta = {
  title: 'Editor',
  component: Editor,
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Editor>

export default meta

export const Completo: StoryObj<typeof meta> = {
  args: { capacidades: CAPACIDADES_DE_EJEMPLO, defaultNodes: NODOS_DE_EJEMPLO, defaultEdges: FLECHAS_DE_EJEMPLO, fitView: true, fitViewOptions: { maxZoom: 1.2 } },
}
