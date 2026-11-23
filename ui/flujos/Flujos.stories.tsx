import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo } from 'react'
import { CAPACIDADES_DE_EJEMPLO, FLECHAS_DE_EJEMPLO, NODOS_DE_EJEMPLO } from '../ejemplo'
import { crearAlmacenEnMemoria } from './almacenEnMemoria'
import { AppDeFlujos } from './AppDeFlujos'
import { BarraDeFlujo } from './BarraDeFlujo'
import { ListaDeFlujos } from './ListaDeFlujos'

/**
 * Guardar y publicar flujos. «App completa» junta todo con un almacén en memoria: se pierde al recargar. Las otras stories muestran
 * cada pieza sola.
 */
const meta = { title: 'Flujos' } satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function Demo({ puedePublicar }: { puedePublicar: boolean }) {
  const almacen = useMemo(
    () =>
      crearAlmacenEnMemoria([
        { id: 'pedidos', nombre: 'Pedidos', version: 2, contenido: { nodos: NODOS_DE_EJEMPLO, flechas: FLECHAS_DE_EJEMPLO } },
        { id: 'reclamos', nombre: 'Reclamos', contenido: { nodos: NODOS_DE_EJEMPLO.slice(0, 2), flechas: FLECHAS_DE_EJEMPLO.slice(0, 1) } },
      ]),
    [],
  )
  return (
    <div style={{ height: '100vh' }}>
      <AppDeFlujos almacen={almacen} capacidades={CAPACIDADES_DE_EJEMPLO} puedePublicar={puedePublicar} />
    </div>
  )
}

/** La lista, abrir un flujo, editarlo (se guarda solo), publicar y volver. */
export const AppCompleta: Story = { name: 'App completa', render: () => <Demo puedePublicar /> }

/** Lo mismo para una persona que no puede publicar: el botón no aparece. */
export const SinPermisoDePublicar: Story = { name: 'Sin permiso de publicar', render: () => <Demo puedePublicar={false} /> }

export const Lista: Story = {
  render: () => (
    <ListaDeFlujos
      flujos={[
        { id: 'a', nombre: 'Pedidos', version: 2, conBorrador: false },
        { id: 'b', nombre: 'Devoluciones', version: 5, conBorrador: true },
        { id: 'c', nombre: 'Reclamos', conBorrador: true },
      ]}
      onAbrir={() => {}}
      onCrear={() => {}}
    />
  ),
}

export const ListaVacia: Story = { name: 'Lista vacía', render: () => <ListaDeFlujos flujos={[]} onAbrir={() => {}} onCrear={() => {}} /> }

/** Los cuatro estados de la barra. */
export const Barra: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <BarraDeFlujo nombre="Pedidos" version={2} estado="sin-cambios" onVolver={() => {}} onPublicar={() => {}} />
      <BarraDeFlujo nombre="Pedidos" version={2} estado="guardando" onVolver={() => {}} onPublicar={() => {}} />
      <BarraDeFlujo nombre="Pedidos" version={2} estado="borrador" onVolver={() => {}} onPublicar={() => {}} />
      <BarraDeFlujo nombre="Reclamos" estado="borrador" onVolver={() => {}} onPublicar={() => {}} />
      <BarraDeFlujo nombre="Pedidos" version={2} estado="error" onVolver={() => {}} onPublicar={() => {}} />
    </div>
  ),
}
