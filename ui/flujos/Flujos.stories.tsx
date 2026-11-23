import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo } from 'react'
import { CAPACIDADES_DE_EJEMPLO, FLECHAS_DE_EJEMPLO, NODOS_DE_EJEMPLO } from '../ejemplo'
import { crearAlmacenEnMemoria } from './almacenEnMemoria'
import { AppDeFlujos } from './AppDeFlujos'
import { BarraDeFlujo } from './BarraDeFlujo'
import { compararFlujos } from './comparar'
import { ListaDeFlujos } from './ListaDeFlujos'
import { PublicarFlujo } from './PublicarFlujo'
import { verificarFlujo } from './verificar'

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

/** La lista, abrir un flujo, editarlo, guardar, publicar (con su verificación y sus cambios) y volver. */
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

const barra = { onVolver: () => {}, onGuardar: () => {}, onPublicar: () => {} }

/** Los estados de la barra. */
export const Barra: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <BarraDeFlujo {...barra} nombre="Pedidos" version={2} estado="sin-cambios" hayCambiosSinGuardar={false} />
      <BarraDeFlujo {...barra} nombre="Pedidos" version={2} estado="sin-guardar" hayCambiosSinGuardar />
      <BarraDeFlujo {...barra} nombre="Pedidos" version={2} estado="guardando" hayCambiosSinGuardar={false} />
      <BarraDeFlujo {...barra} nombre="Pedidos" version={2} estado="borrador" hayCambiosSinGuardar={false} />
      <BarraDeFlujo {...barra} nombre="Reclamos" estado="borrador" hayCambiosSinGuardar={false} />
      <BarraDeFlujo {...barra} nombre="Pedidos" version={2} estado="error" hayCambiosSinGuardar />
    </div>
  ),
}

const ids = CAPACIDADES_DE_EJEMPLO.map((c) => c.id)
const nombres = Object.fromEntries(CAPACIDADES_DE_EJEMPLO.map((c) => [c.id, c.nombre]))
const vigente = { nodos: NODOS_DE_EJEMPLO, flechas: FLECHAS_DE_EJEMPLO }
const conCapacidad = NODOS_DE_EJEMPLO.map((n) => (n.id === 'tarea' && n.type === 'funcion' ? { ...n, data: { ...n.data, capacidad: 'tareas.crear' } } : n))

/** Un borrador listo: se eligió qué hace una función, se renombró otra y se movió un nodo. */
const listo = {
  nodos: conCapacidad.map((n) =>
    n.id === 'aviso' && n.type === 'funcion' ? { ...n, data: { ...n.data, nombre: 'Avisar al equipo' } } : n.id === 'fin' ? { ...n, position: { x: 240, y: 480 } } : n,
  ),
  flechas: FLECHAS_DE_EJEMPLO,
}

/** Un borrador con problemas: una función sin elegir, una salida suelta y un nodo al que no se llega. */
const roto = {
  nodos: [...NODOS_DE_EJEMPLO, { id: 'suelto', type: 'funcion' as const, position: { x: 400, y: 200 }, data: { nombre: 'Generar el comprobante', capacidad: 'documentos.generar' } }],
  flechas: FLECHAS_DE_EJEMPLO.filter((f) => f.sourceHandle !== 'sino'),
}

const ventana = { abierta: true, onCerrar: () => {}, onPublicar: () => {} }

/** Todo en orden: se puede publicar. */
export const PublicarListo: Story = {
  name: 'Publicar: listo',
  render: () => <PublicarFlujo {...ventana} nombre="Pedidos" version={2} problemas={verificarFlujo(listo, ids)} diferencias={compararFlujos(vigente, listo, nombres)} />,
}

/** Con errores: el botón de publicar queda deshabilitado. */
export const PublicarConErrores: Story = {
  name: 'Publicar: con errores',
  render: () => <PublicarFlujo {...ventana} nombre="Pedidos" version={2} problemas={verificarFlujo(roto, ids)} diferencias={compararFlujos(vigente, roto, nombres)} />,
}

/** La primera vez no hay contra qué comparar: muestra lo que tiene el flujo. */
export const PublicarPrimeraVez: Story = {
  name: 'Publicar: primera vez',
  render: () => <PublicarFlujo {...ventana} nombre="Reclamos" problemas={verificarFlujo(listo, ids)} diferencias={compararFlujos({ nodos: [], flechas: [] }, listo, nombres)} />,
}
