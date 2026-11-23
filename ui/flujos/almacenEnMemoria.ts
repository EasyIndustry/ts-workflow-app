import { contenidoDe, type Almacen, type ContenidoDeFlujo, type ResumenDeFlujo } from './almacen'

interface Guardado {
  id: string
  nombre: string
  version?: number
  publicado?: ContenidoDeFlujo
  borrador?: ContenidoDeFlujo
}

export interface FlujoInicial {
  id: string
  nombre: string
  /** Con versión, `contenido` es lo publicado. Sin versión, es un borrador que nunca se publicó. */
  version?: number
  contenido: ContenidoDeFlujo
}

/** Un almacén que vive en la memoria: para las stories y las pruebas. Se pierde al recargar. */
export function crearAlmacenEnMemoria(iniciales: readonly FlujoInicial[] = []): Almacen {
  const flujos = new Map<string, Guardado>(
    iniciales.map((f) => {
      const contenido = contenidoDe(f.contenido.nodos, f.contenido.flechas)
      return [f.id, f.version ? { id: f.id, nombre: f.nombre, version: f.version, publicado: contenido } : { id: f.id, nombre: f.nombre, borrador: contenido }]
    }),
  )
  const resumen = (f: Guardado): ResumenDeFlujo => ({ id: f.id, nombre: f.nombre, version: f.version, conBorrador: Boolean(f.borrador) })
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
      const f: Guardado = { id, nombre, borrador: contenidoDe([{ id: 'inicio', type: 'evento', position: { x: 0, y: 0 }, data: { variante: 'inicio', nombre: 'Inicio' } }], []) }
      flujos.set(id, f)
      return resumen(f)
    },
    abrir: async (id) => {
      const f = buscar(id)
      return { ...resumen(f), contenido: f.borrador ?? f.publicado ?? { nodos: [], flechas: [] } }
    },
    guardarBorrador: async (id, contenido) => {
      buscar(id).borrador = contenido
    },
    publicar: async (id) => {
      const f = buscar(id)
      if (!f.borrador) throw new Error('No hay cambios para publicar.')
      f.publicado = f.borrador
      f.borrador = undefined
      f.version = (f.version ?? 0) + 1
      return f.version
    },
  }
}
