import type { Traduccion } from '../modelo/definicion.js'
import type { Almacen, Capacidad, Publicacion } from '../modelo/flujo.js'
import type { Problema } from '../modelo/verificar.js'

export interface OpcionesAlmacenHttp {
  /** Dónde está montada la app en el servidor: `https://sistema.ejemplo/api/flujos-app`. */
  urlBase: string
  /** Los encabezados de cada pedido: la sesión de la persona, o la credencial de un agente. */
  encabezados?: () => Record<string, string> | Promise<Record<string, string>>
  /** Para probar o para un entorno sin `fetch` global. */
  fetch?: typeof fetch
}

/** El servidor respondió que no. `estado` es el código y `problemas`, lo que impidió publicar, si fue eso. */
export class ErrorDelServidor extends Error {
  constructor(
    mensaje: string,
    readonly estado: number,
    readonly problemas?: readonly Problema[],
  ) {
    super(mensaje)
    this.name = 'ErrorDelServidor'
  }
}

/** El almacén de flujos hablando con el servidor de la app. Suma lo que el servidor sabe y el almacén no: capacidades y verificación. */
export function crearAlmacenHttp(opciones: OpcionesAlmacenHttp): Almacen & { capacidades(): Promise<Capacidad[]>; verificar(id: string): Promise<Problema[]>; definicion(id: string): Promise<Traduccion> } {
  const base = opciones.urlBase.replace(/\/+$/, '')
  async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
    const respuesta = await (opciones.fetch ?? fetch)(base + ruta, {
      method: metodo,
      headers: { accept: 'application/json', ...(cuerpo !== undefined && { 'content-type': 'application/json' }), ...(await opciones.encabezados?.()) },
      ...(cuerpo !== undefined && { body: JSON.stringify(cuerpo) }),
    })
    const datos: unknown = await respuesta.json().catch(() => null)
    if (!respuesta.ok) {
      const d = (datos ?? {}) as { error?: unknown; message?: unknown; problemas?: readonly Problema[] }
      const mensaje = typeof d.error === 'string' ? d.error : typeof d.message === 'string' ? d.message : `El servidor respondió ${respuesta.status}.`
      throw new ErrorDelServidor(mensaje, respuesta.status, Array.isArray(d.problemas) ? d.problemas : undefined)
    }
    return datos as T
  }
  const de = (id: string) => `/flujos/${encodeURIComponent(id)}`
  return {
    listar: () => pedir('GET', '/flujos'),
    crear: (nombre, tipo) => pedir('POST', '/flujos', { nombre, tipo }),
    abrir: (id) => pedir('GET', de(id)),
    guardarBorrador: async (id, contenido) => void (await pedir('PUT', `${de(id)}/borrador`, { contenido })),
    publicar: async (id) => (await pedir<{ version: number }>('POST', `${de(id)}/publicar`)).version,
    publicarConAvisos: async (id) => {
      const { version, avisos } = await pedir<Publicacion>('POST', `${de(id)}/publicar`)
      return { version, avisos: Array.isArray(avisos) ? avisos.filter((a) => typeof a === 'string') : [] }
    },
    subflujos: () => pedir('GET', '/subflujos'),
    contenidoDeVersion: (id, version) => pedir('GET', `${de(id)}/versiones/${version}`),
    definicion: (id) => pedir('GET', `${de(id)}/definicion`),
    capacidades: () => pedir('GET', '/capacidades'),
    verificar: async (id) => (await pedir<{ problemas: Problema[] }>('GET', `${de(id)}/verificacion`)).problemas,
  }
}
