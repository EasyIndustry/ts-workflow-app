import { Fragment, type ReactNode } from 'react'
import '../tema.css'
import './tabla.css'

/**
 * Tabla de datos genérica: sin nada de dominio adentro. Recibe filas y una definición de columnas.
 *
 * Qué resuelve, para no repetirlo en cada tabla:
 *  - Columnas declarativas: `cell` dibuja la celda; alineación, no partir en líneas y recorte con «…» (con el valor completo en el
 *    `title`) son opciones.
 *  - Encabezado fijo arriba y scroll interno (`scrollInterno`), para usar dentro de un contenedor de alto fijo.
 *  - Columna de acciones fija a la derecha (`acciones`): con muchas columnas hay scroll horizontal y las acciones no deben quedar
 *    fuera de vista.
 *  - Fila clickeable (`onRowClick`) con resaltado.
 *  - Detalle debajo de una fila (`detalle`): una fila a lo ancho de la tabla.
 *  - Orden por columna, controlado desde afuera (`sort` y `onSortChange`): la tabla no ordena datos, solo avisa qué se pidió. Así
 *    sirve para ordenar en el navegador o en el servidor.
 *  - Estados: cargando (filas esqueleto), vacío y error.
 *  - El contenedor que scrollea se alcanza con Tab y se mueve con las flechas.
 */

export type DireccionOrden = 'asc' | 'desc'

export interface EstadoOrden {
  /** `key` de la columna por la que se ordena. */
  key: string
  direccion: DireccionOrden
}

export interface DataTableColumn<T> {
  /** Identificador estable de la columna (también es la clave de orden). */
  key: string
  /** Título del encabezado. */
  header: ReactNode
  /** Contenido de la celda. */
  cell: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  /** Impide que el contenido se parta en varias líneas. */
  nowrap?: boolean
  /** Recorta el texto con «…» en este ancho máximo (un valor de CSS, por ejemplo `12rem`). */
  truncate?: string
  /** Texto completo para el tooltip nativo de la celda (útil con `truncate`). */
  title?: (row: T) => string | null | undefined
  /** Tipografía monoespaciada (códigos, números). */
  mono?: boolean
  /** Atenúa el texto (datos secundarios). */
  muted?: boolean
  /** Habilita el orden por esta columna (requiere `onSortChange`). */
  sortable?: boolean
  /** Clases extra para la celda. */
  className?: string
}

export interface DataTableProps<T> {
  rows: readonly T[]
  columns: readonly DataTableColumn<T>[]
  /** Clave única por fila. */
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  /** Contenido de la columna fija de acciones, a la derecha. */
  acciones?: (row: T) => ReactNode
  /** Nombre accesible del encabezado de la columna de acciones. */
  accionesLabel?: string
  /** Encabezado pegado arriba y scroll interno; requiere un padre de alto fijo. */
  scrollInterno?: boolean
  sort?: EstadoOrden | null
  onSortChange?: (sort: EstadoOrden | null) => void
  /** La primera columna queda fija al scrollear en horizontal. */
  primeraColumnaFija?: boolean
  /** Muestra filas esqueleto en vez de las filas. */
  isLoading?: boolean
  /** Cantidad de filas esqueleto mientras carga. */
  filasCargando?: number
  /** Si se define, reemplaza a las filas con este mensaje de error. */
  error?: string | null
  /** Contenido cuando no hay filas. */
  vacio?: ReactNode
  /** Clases extra por fila (por ejemplo, para resaltar algunas). */
  rowClassName?: (row: T) => string | undefined
  /** Contenido debajo de la fila, a lo ancho de la tabla; `null` = sin detalle. Lo que pase adentro no dispara `onRowClick`. */
  detalle?: (row: T) => ReactNode
  /** Descripción accesible de la tabla. */
  caption?: string
  /** Clases extra para el contenedor raíz. */
  className?: string
}

const clases = (...lista: (string | false | null | undefined)[]) => lista.filter(Boolean).join(' ')

/** Ciclo al hacer clic: ascendente → descendente → sin orden. */
export function siguienteOrden(actual: EstadoOrden | null | undefined, key: string): EstadoOrden | null {
  if (actual?.key !== key) return { key, direccion: 'asc' }
  if (actual.direccion === 'asc') return { key, direccion: 'desc' }
  return null
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  acciones,
  accionesLabel = 'Acciones',
  scrollInterno = false,
  sort,
  onSortChange,
  primeraColumnaFija = false,
  isLoading = false,
  filasCargando = 6,
  error,
  vacio = 'No hay datos para mostrar.',
  rowClassName,
  detalle,
  caption,
  className,
}: DataTableProps<T>) {
  const totalColumnas = columns.length + (acciones ? 1 : 0)
  // Con nombre es una región: se llega con Tab y, con el foco, las flechas la desplazan.
  const region = caption ? ({ tabIndex: 0, role: 'region', 'aria-label': caption } as const) : ({ tabIndex: 0 } as const)

  return (
    <div {...region} className={clases('wf-tabla', scrollInterno && 'wf-tabla-scroll', primeraColumnaFija && 'wf-tabla-primera-fija', className)}>
      <table>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => {
              const activa = sort?.key === col.key
              return (
                <th key={col.key} scope="col" aria-sort={activa ? (sort.direccion === 'asc' ? 'ascending' : 'descending') : undefined} className={`wf-tabla-${col.align ?? 'left'}`}>
                  {col.sortable && onSortChange ? (
                    <button type="button" className={clases('wf-tabla-orden', activa && 'wf-tabla-orden-activo')} onClick={() => onSortChange(siguienteOrden(sort, col.key))}>
                      {col.header}
                      <span aria-hidden>{activa ? (sort.direccion === 'asc' ? '↑' : '↓') : '↕'}</span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
            {acciones && (
              <th className="wf-tabla-acciones">
                <span className="wf-tabla-oculto">{accionesLabel}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: filasCargando }, (_, i) => (
              <tr key={i} aria-hidden>
                {Array.from({ length: totalColumnas }, (_, j) => (
                  <td key={j}>
                    <div className="wf-tabla-esqueleto" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={totalColumnas} role="alert" className="wf-tabla-mensaje wf-tabla-error">
                {error}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={totalColumnas} className="wf-tabla-mensaje">
                {vacio}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const contenidoDetalle = detalle?.(row)
              return (
                <Fragment key={getRowId(row)}>
                  <tr onClick={() => onRowClick?.(row)} className={clases(onRowClick && 'wf-tabla-fila-click', rowClassName?.(row))}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        title={col.title?.(row) ?? undefined}
                        style={col.truncate ? { maxWidth: col.truncate } : undefined}
                        className={clases(`wf-tabla-${col.align ?? 'left'}`, col.nowrap && 'wf-tabla-nowrap', col.truncate && 'wf-tabla-recorte', col.mono && 'wf-tabla-mono', col.muted && 'wf-tabla-tenue', col.className)}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    {acciones && <td className="wf-tabla-acciones">{acciones(row)}</td>}
                  </tr>
                  {contenidoDetalle != null && contenidoDetalle !== false ? (
                    <tr className="wf-tabla-detalle">
                      <td colSpan={totalColumnas}>{contenidoDetalle}</td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
