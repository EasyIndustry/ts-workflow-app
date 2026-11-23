import { contenidoDe, type Almacen, type ContenidoDeFlujo, type ResumenDeFlujo } from './almacen'

interface Guardado {
  id: string
  nombre: string
  version?: number
  publicado?: ContenidoDeFlujo
  borrador?: ContenidoDeFlujo
  editadoEl?: string
  publicadoEl?: string
}

export interface FlujoInicial {
  id: string
  nombre: string
  /** Con versión, `contenido` es lo publicado. Sin versión, es un borrador que nunca se publicó. */
  version?: number
  contenido: ContenidoDeFlujo
  editadoEl?: string
  publicadoEl?: string
}

/**
 * Un almacén que vive en la memoria: para las stories y las pruebas. Se pierde al recargar. `ahora` es el reloj, para poder
 * probarlo.
 */
export function crearAlmacenEnMemoria(iniciales: readonly FlujoInicial[] = [], ahora: () => string = () => new Date().toISOString()): Almacen {
  const flujos = new Map<string, Guardado>(
    iniciales.map((f) => {
      const contenido = contenidoDe(f.contenido.nodos, f.contenido.flechas)
      const base = { id: f.id, nombre: f.nombre, editadoEl: f.editadoEl, publicadoEl: f.publicadoEl }
      return [f.id, f.version ? { ...base, version: f.version, publicado: contenido } : { ...base, borrador: contenido }]
    }),
  )
  const resumen = (f: Guardado): ResumenDeFlujo => {
    const nodos = (f.borrador ?? f.publicado)?.nodos ?? []
    return {
      id: f.id,
      nombre: f.nombre,
      version: f.version,
      conBorrador: Boolean(f.borrador),
      inicios: nodos.flatMap((n) => (n.type === 'evento' && n.data.variante === 'inicio' ? [n.data.nombre] : [])),
      nodos: nodos.length,
      editadoEl: f.editadoEl,
      publicadoEl: f.publicadoEl,
    }
  }
  const buscar = (id: string) => {
    const f = flujos.get(id)
    if (!f) throw new Error(`No existe el flujo «${id}».`)
    return f
  }
  let creados = 0

  return {
    listar: async () => [...flujos.values()].map(resumen),
    crear: async (nombre) => {
      const id = `flujo-${++creados}`
      // Arranca con un inicio, para que el lienzo no quede vacío.
      const inicio = { id: 'inicio', type: 'evento' as const, position: { x: 0, y: 0 }, data: { variante: 'inicio' as const, nombre: 'Inicio' } }
      const f: Guardado = { id, nombre, editadoEl: ahora(), borrador: contenidoDe([inicio], []) }
      flujos.set(id, f)
      return resumen(f)
    },
    abrir: async (id) => {
      const f = buscar(id)
      return { ...resumen(f), contenido: f.borrador ?? f.publicado ?? { nodos: [], flechas: [] }, publicado: f.publicado }
    },
    guardarBorrador: async (id, contenido) => {
      const f = buscar(id)
      f.borrador = contenido
      f.editadoEl = ahora()
    },
    publicar: async (id) => {
      const f = buscar(id)
      if (!f.borrador) throw new Error('No hay cambios para publicar.')
      f.publicado = f.borrador
      f.borrador = undefined
      f.version = (f.version ?? 0) + 1
      f.publicadoEl = ahora()
      return f.version
    },
  }
}
