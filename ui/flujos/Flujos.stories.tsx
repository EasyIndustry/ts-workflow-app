import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo } from 'react'
import { CAPACIDADES_DE_EJEMPLO, EJECUTOR_DE_EJEMPLO, FLECHAS_DE_EJEMPLO, NODOS_DE_EJEMPLO, REGISTROS_DE_EJEMPLO, SUBFLUJO_DE_EJEMPLO } from '../ejemplo'
import { crearAlmacenEnMemoria } from './almacenEnMemoria'
import type { ResumenDeFlujo } from './almacen'
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

function Demo({ puedePublicar, tema }: { puedePublicar: boolean; tema?: 'oscuro' }) {
  const almacen = useMemo(
    () =>
      crearAlmacenEnMemoria([
        { id: 'pedidos', nombre: 'Pedidos', version: 2, contenido: { nodos: NODOS_DE_EJEMPLO, flechas: FLECHAS_DE_EJEMPLO }, editadoEl: '2026-11-10T14:05:00Z', publicadoEl: '2026-11-10T14:20:00Z' },
        { id: 'reclamos', nombre: 'Reclamos', contenido: { nodos: NODOS_DE_EJEMPLO.slice(0, 2), flechas: FLECHAS_DE_EJEMPLO.slice(0, 1) }, editadoEl: '2026-11-22T09:30:00Z' },
        { id: 'revision', nombre: 'Revisar un pedido', tipo: 'subflujo', version: 1, contenido: SUBFLUJO_DE_EJEMPLO, editadoEl: '2026-11-05T10:00:00Z', publicadoEl: '2026-11-05T10:10:00Z' },
      ]),
    [],
  )
  return (
    <div style={{ height: '100vh' }}>
      <AppDeFlujos almacen={almacen} capacidades={CAPACIDADES_DE_EJEMPLO} puedePublicar={puedePublicar} prueba={{ ejecutor: EJECUTOR_DE_EJEMPLO, registros: REGISTROS_DE_EJEMPLO }} tema={tema} />
    </div>
  )
}

/**
 * La lista, abrir un flujo, agregarle nodos, guardar, probar, publicar (con su verificación y sus cambios) y volver. Hay un
 * subflujo publicado, «Revisar un pedido»: agregá un nodo Subflujo en «Pedidos», elegilo en el inspector y abrilo desde ahí.
 */
export const AppCompleta: Story = { name: 'App completa', render: () => <Demo puedePublicar /> }

/** La misma app con el tema oscuro, para un sistema que lo usa. */
export const AppOscura: Story = { name: 'App completa, oscura', render: () => <Demo puedePublicar tema="oscuro" /> }

/** Lo mismo para una persona que no puede publicar: el botón no aparece. */
export const SinPermisoDePublicar: Story = { name: 'Sin permiso de publicar', render: () => <Demo puedePublicar={false} /> }

const lista = { onAbrir: () => {}, onCrear: () => {} }
const FLUJOS: ResumenDeFlujo[] = [
  { id: 'a', nombre: 'Pedidos', tipo: 'maestro', usadoPor: [], version: 2, conBorrador: false, inicios: ['Llegó un pedido'], nodos: 5, editadoEl: '2026-11-10T14:05:00Z', publicadoEl: '2026-11-10T14:20:00Z' },
  { id: 'b', nombre: 'Devoluciones', tipo: 'maestro', usadoPor: [], version: 5, conBorrador: true, inicios: ['Pidieron devolver', 'Venció el plazo'], nodos: 12, editadoEl: '2026-11-22T09:30:00Z', publicadoEl: '2026-10-02T18:00:00Z' },
  { id: 'd', nombre: 'Revisar un pedido', tipo: 'subflujo', usadoPor: ['Pedidos', 'Devoluciones'], version: 1, conBorrador: false, inicios: ['Al ser llamado'], nodos: 4, editadoEl: '2026-11-05T10:00:00Z', publicadoEl: '2026-11-05T10:10:00Z' },
  { id: 'c', nombre: 'Reclamos', tipo: 'maestro', usadoPor: [], conBorrador: true, inicios: ['Llegó un reclamo'], nodos: 2, editadoEl: '2026-11-23T11:12:00Z' },
]

/** La tabla de flujos: se ordena por cualquier columna y se abre un flujo haciendo click en su fila. */
export const Lista: Story = { render: () => <div style={{ height: '100vh' }}><ListaDeFlujos {...lista} flujos={FLUJOS} /></div> }

export const ListaVacia: Story = { name: 'Lista vacía', render: () => <ListaDeFlujos {...lista} flujos={[]} /> }

export const ListaCargando: Story = { name: 'Lista cargando', render: () => <ListaDeFlujos {...lista} flujos={[]} cargando /> }

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

/** El sistema no dejó publicar: la ventana queda abierta con el motivo y lo que encontró. */
export const PublicarRechazado: Story = {
  name: 'Publicar: el sistema no lo aceptó',
  render: () => (
    <PublicarFlujo
      {...ventana}
      nombre="Pedidos"
      version={2}
      problemas={verificarFlujo(listo, ids)}
      diferencias={compararFlujos(vigente, listo, nombres)}
      rechazo={{ mensaje: 'El sistema no acepta este flujo.', problemas: [{ mensaje: '«Revisar» usa una condición que el sistema ya no tiene.' }, { mensaje: 'Alguien publicó otra versión recién: volvé a intentar.' }] }}
    />
  ),
}

/** Se publicó, y el sistema tiene algo que avisar: la ventana queda abierta para que la persona lo lea. */
export const PublicadoConAvisos: Story = {
  name: 'Publicar: publicado con avisos',
  render: () => (
    <PublicarFlujo {...ventana} nombre="Pedidos" version={3} problemas={[]} diferencias={compararFlujos(vigente, vigente, nombres)} publicado={{ version: 3, avisos: ['La versión nueva deja de tener una regla que la anterior tenía.'] }} />
  ),
}
