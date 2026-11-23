import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { DataTable, type DataTableColumn, type EstadoOrden } from './DataTable'

/** La tabla de datos genérica, con sus opciones. Los datos son de mentira. */
const meta = { title: 'Tabla' } satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

interface Fila {
  codigo: string
  nombre: string
  cantidad: number
  nota: string
}

const FILAS: Fila[] = [
  { codigo: 'A-001', nombre: 'Primero', cantidad: 12, nota: 'Una nota larga que no entra en la columna y por eso se recorta con puntos suspensivos.' },
  { codigo: 'A-002', nombre: 'Segundo', cantidad: 3, nota: 'Corta.' },
  { codigo: 'B-010', nombre: 'Tercero', cantidad: 48, nota: 'Otra nota.' },
]

const COLUMNAS: DataTableColumn<Fila>[] = [
  { key: 'codigo', header: 'Código', mono: true, nowrap: true, sortable: true, cell: (f) => f.codigo },
  { key: 'nombre', header: 'Nombre', sortable: true, cell: (f) => f.nombre },
  { key: 'cantidad', header: 'Cantidad', align: 'right', sortable: true, cell: (f) => f.cantidad },
  { key: 'nota', header: 'Nota', muted: true, truncate: '14rem', title: (f) => f.nota, cell: (f) => f.nota },
]

function Ordenable() {
  const [orden, setOrden] = useState<EstadoOrden | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)
  const filas = orden
    ? [...FILAS].sort((a, b) => (orden.direccion === 'asc' ? 1 : -1) * String(a[orden.key as keyof Fila]).localeCompare(String(b[orden.key as keyof Fila]), 'es', { numeric: true }))
    : FILAS
  return (
    <DataTable
      caption="Ejemplo"
      rows={filas}
      columns={COLUMNAS}
      getRowId={(f) => f.codigo}
      sort={orden}
      onSortChange={setOrden}
      onRowClick={(f) => setAbierta(abierta === f.codigo ? null : f.codigo)}
      detalle={(f) => (abierta === f.codigo ? <span>Detalle de {f.nombre}: {f.nota}</span> : null)}
      acciones={() => <button type="button">Editar</button>}
    />
  )
}

/** Orden por columna, fila clickeable que abre su detalle y columna de acciones fija. */
export const Completa: Story = { render: () => <Ordenable /> }

export const Cargando: Story = { render: () => <DataTable rows={[]} columns={COLUMNAS} getRowId={(f) => f.codigo} isLoading /> }

export const Vacia: Story = { name: 'Vacía', render: () => <DataTable rows={[]} columns={COLUMNAS} getRowId={(f) => f.codigo} vacio="Todavía no hay nada." /> }

export const ConError: Story = { name: 'Con error', render: () => <DataTable rows={[]} columns={COLUMNAS} getRowId={(f) => f.codigo} error="No se pudieron traer los datos." /> }
