import { createContext, useContext } from 'react'
import type { ContratoDeSubflujo, TipoDeFlujo } from '../flujos/almacen'

/** Una capacidad del registro, como la describe el core: lo que un nodo de función puede ejecutar. */
export interface Capacidad {
  id: string
  nombre: string
  descripcion?: string
  /** Para agrupar en la lista. */
  grupo?: string
  /** El JSON Schema de sus parámetros. Con él, el inspector arma el formulario. */
  schemaEntrada?: Record<string, unknown>
}

/** Lo que las piezas del editor necesitan saber del flujo que se está editando y del sistema donde corre. */
export interface DatosDelEditor {
  /** Las capacidades del registro, para elegir qué hace cada función. Las pasa quien monta la app. */
  capacidades: readonly Capacidad[]
  /** Los subflujos publicados que este flujo puede usar. */
  subflujos: readonly ContratoDeSubflujo[]
  /** El tipo del flujo que se edita: un subflujo no puede esperar ni tener más de un inicio. */
  tipo: TipoDeFlujo
  /** Abre otro flujo en el editor. Sin esta función, no se ofrece. */
  onAbrirFlujo?: (id: string) => void
}

export const ContextoDelEditor = createContext<DatosDelEditor>({ capacidades: [], subflujos: [], tipo: 'maestro' })

export const useEditor = () => useContext(ContextoDelEditor)
