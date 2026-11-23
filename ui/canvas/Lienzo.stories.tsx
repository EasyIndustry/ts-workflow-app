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

export const Vacio: StoryObj<typeof meta> = {}
