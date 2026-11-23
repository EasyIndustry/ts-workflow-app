import { useState } from 'react'
import { Entrada, Lista } from '../formulario/Campo'
import { DataTable, type DataTableColumn, type EstadoOrden } from '../tabla/DataTable'
import '../tema.css'
import type { ResumenDeFlujo, TipoDeFlujo } from './almacen'
import './flujos.css'

export interface ListaDeFlujosProps {
  flujos: readonly ResumenDeFlujo[]
  onAbrir: (id: string) => void
  onCrear: (nombre: string, tipo: TipoDeFlujo) => void
  /** Mientras se traen los flujos. */
  cargando?: boolean
}

/** En qué anda un flujo, en pocas palabras. */
export function estadoDeFlujo(f: Pick<ResumenDeFlujo, 'version' | 'conBorrador'>): 'Publicado' | 'Con cambios sin publicar' | 'Sin publicar' {
  if (!f.version) return 'Sin publicar'
  return f.conBorrador ? 'Con cambios sin publicar' : 'Publicado'
}

const fecha = new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' })
const cuando = (iso?: string) => (iso ? fecha.format(new Date(iso)) : '—')

const CLASE_DE_ESTADO = { Publicado: 'wf-estado wf-estado-bien', 'Con cambios sin publicar': 'wf-estado wf-estado-aviso', 'Sin publicar': 'wf-estado' }

const TIPOS = { maestro: 'Maestro', subflujo: 'Subflujo' }

const COLUMNAS: DataTableColumn<ResumenDeFlujo>[] = [
  { key: 'nombre', header: 'Nombre', sortable: true, cell: (f) => <strong className="wf-flujos-nombre">{f.nombre}</strong> },
  { key: 'tipo', header: 'Tipo', sortable: true, cell: (f) => TIPOS[f.tipo] },
  { key: 'estado', header: 'Estado', sortable: true, nowrap: true, cell: (f) => <span className={CLASE_DE_ESTADO[estadoDeFlujo(f)]}>{estadoDeFlujo(f)}</span> },
  { key: 'version', header: 'Versión vigente', sortable: true, align: 'right', cell: (f) => f.version ?? '—' },
  { key: 'inicios', header: 'Arranca con', muted: true, truncate: '16rem', title: (f) => f.inicios.join(', '), cell: (f) => f.inicios.join(', ') || '—' },
  { key: 'usadoPor', header: 'Usado por', muted: true, truncate: '14rem', title: (f) => f.usadoPor.join(', '), cell: (f) => f.usadoPor.join(', ') || '—' },
  { key: 'nodos', header: 'Nodos', sortable: true, align: 'right', muted: true, cell: (f) => f.nodos },
  { key: 'editadoEl', header: 'Última edición', sortable: true, nowrap: true, muted: true, cell: (f) => cuando(f.editadoEl) },
  { key: 'publicadoEl', header: 'Publicado', sortable: true, nowrap: true, muted: true, cell: (f) => cuando(f.publicadoEl) },
]

/** El valor por el que se ordena cada columna. */
const VALOR: Record<string, (f: ResumenDeFlujo) => string | number> = {
  nombre: (f) => f.nombre.toLocaleLowerCase('es'),
  tipo: (f) => f.tipo,
  estado: (f) => estadoDeFlujo(f),
  version: (f) => f.version ?? 0,
  nodos: (f) => f.nodos,
  editadoEl: (f) => f.editadoEl ?? '',
  publicadoEl: (f) => f.publicadoEl ?? '',
}

/** Ordena una copia de los flujos según la columna pedida. Sin orden, quedan como vinieron. */
export function ordenarFlujos(flujos: readonly ResumenDeFlujo[], orden: EstadoOrden | null): ResumenDeFlujo[] {
  const valor = orden && VALOR[orden.key]
  if (!orden || !valor) return [...flujos]
  const signo = orden.direccion === 'asc' ? 1 : -1
  return [...flujos].sort((a, b) => {
    const x = valor(a)
    const y = valor(b)
    return signo * (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es'))
  })
}

/** La lista de flujos, como tabla: ordenar, abrir uno haciendo click en su fila o crear uno nuevo. No guarda nada: avisa lo pedido. */
export function ListaDeFlujos({ flujos, onAbrir, onCrear, cargando = false }: ListaDeFlujosProps) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoDeFlujo>('maestro')
  const [orden, setOrden] = useState<EstadoOrden | null>({ key: 'nombre', direccion: 'asc' })
  return (
    <div className="wf-flujos">
      <header>
        <h1>Flujos</h1>
        <form
          className="wf-flujos-nuevo"
          onSubmit={(e) => {
            e.preventDefault()
            if (!nombre.trim()) return
            onCrear(nombre.trim(), tipo)
            setNombre('')
          }}
        >
          <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del flujo nuevo" aria-label="Nombre del flujo nuevo" />
          <Lista value={tipo} onChange={(e) => setTipo(e.target.value as TipoDeFlujo)} aria-label="Tipo del flujo nuevo">
            <option value="maestro">Maestro</option>
            <option value="subflujo">Subflujo</option>
          </Lista>
          <button type="submit" className="wf-boton wf-boton-principal" disabled={!nombre.trim()}>
            Crear flujo
          </button>
        </form>
      </header>
      <DataTable
        caption="Flujos"
        rows={ordenarFlujos(flujos, orden)}
        columns={COLUMNAS}
        getRowId={(f) => f.id}
        onRowClick={(f) => onAbrir(f.id)}
        sort={orden}
        onSortChange={setOrden}
        scrollInterno
        isLoading={cargando}
        filasCargando={3}
        vacio="Todavía no hay flujos."
      />
    </div>
  )
}
