import type { Meta, StoryObj } from '@storybook/react-vite'
import { CAPACIDADES_DE_EJEMPLO, EJECUTOR_DE_EJEMPLO, FLECHAS_DE_EJEMPLO, NODOS_DE_EJEMPLO, REGISTROS_DE_EJEMPLO } from '../ejemplo'
import { CAPACIDADES_GRANDES, FLECHAS_GRANDES, NODOS_GRANDES, SUBFLUJOS_GRANDES } from '../ejemploGrande'
import { Editor } from './Editor'

/**
 * La app armada. El botón «Configuración» abre la ventana de ajustes; ahí se elige si el inspector aparece como barra lateral
 * o como tarjeta flotante, y la orientación del flujo. Lo elegido queda guardado en el navegador.
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

/**
 * Con «Probar»: abre el panel de prueba. El pedido de 250 termina bien; el de 4800 va por la otra rama y falla en una función que
 * no tiene elegido qué hace.
 */
export const ConPrueba: StoryObj<typeof meta> = {
  name: 'Con prueba',
  args: { ...Completo.args, prueba: { ejecutor: EJECUTOR_DE_EJEMPLO, registros: REGISTROS_DE_EJEMPLO } },
}

/**
 * Un flujo grande, para probar cómo se lee: 49 nodos, con una decisión de quince ramas, otra de cinco, subflujos de requisitos,
 * rechazos e interrupciones. Apretá «Acomodar», y en «Configuración» cambiá la orientación y cómo se dibujan las decisiones.
 */
export const FlujoGrande: StoryObj<typeof meta> = {
  name: 'Flujo grande',
  args: { capacidades: CAPACIDADES_GRANDES, subflujos: SUBFLUJOS_GRANDES, defaultNodes: NODOS_GRANDES, defaultEdges: FLECHAS_GRANDES, fitView: true },
}
