import { esEntrada, type FlechaGuardada, type NodoGuardado } from './nodos.js'

/** Lo que se guarda de un flujo: sus nodos y sus flechas, sin nada que sea solo de la pantalla (selección, medidas). */
export interface ContenidoDeFlujo {
  nodos: NodoGuardado[]
  flechas: FlechaGuardada[]
}

/**
 * Un maestro arranca solo, por un evento, y puede quedarse esperando. Un subflujo arranca cuando otro flujo lo llama, corre de
 * punta a punta y termina por uno de sus fines, que son sus salidas. El tipo se elige al crear y no cambia.
 */
export type TipoDeFlujo = 'maestro' | 'subflujo'

/** Un flujo en la lista. */
export interface ResumenDeFlujo {
  id: string
  nombre: string
  tipo: TipoDeFlujo
  /** La versión vigente. Sin número, todavía no se publicó nunca. */
  version?: number
  /** Si tiene cambios guardados que todavía no se publicaron. */
  conBorrador: boolean
  /** Los nombres de sus inicios: qué lo arranca. */
  inicios: readonly string[]
  /** Cuántos nodos tiene. */
  nodos: number
  /** Los nombres de los flujos que lo usan como subflujo. */
  usadoPor: readonly string[]
  /** Cuándo se guardó por última vez, en formato ISO, y quién. */
  editadoEl?: string
  editadoPor?: string
  /** Cuándo se publicó la versión vigente, en formato ISO, y quién. */
  publicadoEl?: string
  publicadoPor?: string
}

export interface FlujoAbierto extends ResumenDeFlujo {
  /** El borrador si lo hay; si no, la versión vigente. */
  contenido: ContenidoDeFlujo
  /** La versión vigente, para comparar contra ella. Falta si nunca se publicó. */
  publicado?: ContenidoDeFlujo
}

/** Lo que otro flujo necesita saber de un subflujo para usarlo: sus versiones publicadas y las salidas de cada una. */
export interface ContratoDeSubflujo {
  id: string
  nombre: string
  /** De la más vieja a la más nueva. */
  versiones: readonly { version: number; salidas: readonly { id: string; nombre: string }[] }[]
}

/**
 * Dónde viven los flujos. La interfaz no sabe si es un servidor o la memoria: recibe uno de estos. Una versión publicada no se
 * edita: los cambios se guardan como borrador y `publicar` los convierte en la versión siguiente.
 */
export interface Almacen {
  listar(): Promise<ResumenDeFlujo[]>
  crear(nombre: string, tipo: TipoDeFlujo): Promise<ResumenDeFlujo>
  abrir(id: string): Promise<FlujoAbierto>
  guardarBorrador(id: string, contenido: ContenidoDeFlujo): Promise<void>
  /** Publica el borrador y devuelve el número de la versión nueva. */
  publicar(id: string): Promise<number>
  /** Los subflujos que ya tienen al menos una versión publicada. */
  subflujos(): Promise<ContratoDeSubflujo[]>
  /** El contenido de una versión publicada de un flujo, tal como quedó. */
  contenidoDeVersion(id: string, version: number): Promise<ContenidoDeFlujo>
}

/** Deja de un lienzo solo lo que se guarda, siempre con la misma forma, para poder comparar dos contenidos como texto. */
export function contenidoDe(nodos: readonly NodoGuardado[], flechas: readonly FlechaGuardada[]): ContenidoDeFlujo {
  return {
    nodos: nodos.map((n) => ({ id: n.id, type: n.type, position: { x: n.position.x, y: n.position.y }, data: n.data }) as NodoGuardado),
    flechas: flechas.map((f) => ({ id: f.id, source: f.source, target: f.target, sourceHandle: f.sourceHandle ?? null, targetHandle: f.targetHandle ?? null })),
  }
}

const conClavesOrdenadas = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(conClavesOrdenadas)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, x]) => [k, conClavesOrdenadas(x)]))
      : v

/**
 * Un valor como texto, siempre igual para el mismo contenido: las claves de los objetos van ordenadas. Para comparar dos
 * contenidos sin que importe en qué orden vienen las claves (una base de datos las puede devolver en otro).
 */
export function enTexto(valor: unknown): string {
  return JSON.stringify(conClavesOrdenadas(valor))
}

/** Las salidas de un flujo visto como subflujo: sus fines, con el id del nodo y su nombre. */
export function salidasDeContenido(contenido: ContenidoDeFlujo): { id: string; nombre: string }[] {
  return contenido.nodos.flatMap((n) => (n.type === 'evento' && n.data.variante === 'fin' ? [{ id: n.id, nombre: n.data.nombre }] : []))
}

/** Lo que resume a un flujo y sale de su contenido: con qué arranca, cuántos nodos tiene y qué subflujos usa. */
export function resumenDeContenido(contenido: ContenidoDeFlujo | undefined): { inicios: string[]; nodos: number; usa: string[] } {
  const nodos = contenido?.nodos ?? []
  return {
    inicios: nodos.flatMap((n) => (n.type === 'evento' && n.data.variante === 'inicio' ? [n.data.nombre] : [])),
    nodos: nodos.length,
    usa: [...new Set(nodos.flatMap((n) => (n.type === 'subflujo' && n.data.flujo ? [n.data.flujo] : [])))],
  }
}

/** Con qué arranca un flujo recién creado: un inicio, para que el lienzo no quede vacío. */
export function contenidoInicial(tipo: TipoDeFlujo): ContenidoDeFlujo {
  const nombre = tipo === 'subflujo' ? 'Al ser llamado' : 'Inicio'
  return contenidoDe([{ id: 'inicio', type: 'evento', position: { x: 0, y: 0 }, data: { variante: 'inicio', nombre } }], [])
}

/**
 * Una capacidad del registro del sistema, como la describe el core. Según su tipo, va en un lugar distinto del flujo:
 * - `accion`: algo que hace una persona (o un agente) en el sistema. Es el evento de una espera, y también una función.
 * - `efecto`: algo que el flujo hace solo. Es una función.
 * - `condicion`: una pregunta sobre los datos. Es la rama de una decisión.
 */
export interface Capacidad {
  id: string
  nombre: string
  /** Por defecto, `accion`. */
  tipo?: 'accion' | 'efecto' | 'condicion'
  descripcion?: string
  /** Para agrupar en la lista. */
  grupo?: string
  /** El JSON Schema de sus parámetros. Con él, el inspector arma el formulario. */
  schemaEntrada?: Record<string, unknown>
}

/** El flujo que se pidió no existe. */
export class ErrorNoExiste extends Error {
  constructor(id: string) {
    super(`No existe el flujo «${id}».`)
    this.name = 'ErrorNoExiste'
  }
}

/** Lo que llegó no tiene la forma de un flujo. El mensaje dice qué está mal. */
export class ErrorDeContenido extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorDeContenido'
  }
}

const TIPOS_DE_NODO = ['evento', 'funcion', 'decision', 'subflujo']
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const esLista = (v: unknown): v is unknown[] => Array.isArray(v)
const sonNombrados = (v: unknown) => esLista(v) && v.every((x) => esObjeto(x) && typeof x['id'] === 'string' && typeof x['nombre'] === 'string')

/**
 * Ubica los nodos en capas siguiendo las flechas desde las entradas, de arriba hacia abajo. Es un acomodo simple, para un flujo
 * que llega sin posiciones (lo armó un agente): después se puede mejorar con «Acomodar» en la pantalla.
 */
export function acomodarEnCapas(nodos: readonly NodoGuardado[], flechas: readonly FlechaGuardada[]): Record<string, { x: number; y: number }> {
  const capa = new Map<string, number>()
  let frente = nodos.filter(esEntrada).map((n) => n.id)
  if (frente.length === 0 && nodos[0]) frente = [nodos[0].id]
  for (let nivel = 0; frente.length > 0 && nivel <= nodos.length; nivel++) {
    for (const id of frente) capa.set(id, nivel)
    // Un nodo ya ubicado no se vuelve a bajar: así un bucle no lo empuja para siempre.
    frente = [...new Set(flechas.filter((f) => frente.includes(f.source) && !capa.has(f.target)).map((f) => f.target))]
  }
  const ultima = Math.max(-1, ...capa.values())
  const porCapa = new Map<number, number>()
  return Object.fromEntries(
    nodos.map((n) => {
      const nivel = capa.get(n.id) ?? ultima + 1
      const columna = porCapa.get(nivel) ?? 0
      porCapa.set(nivel, columna + 1)
      return [n.id, { x: columna * 260, y: nivel * 160 }]
    }),
  )
}

/**
 * Revisa que algo que llega de afuera (un pedido, un agente) tenga la forma de un flujo y lo devuelve limpio. No revisa que el
 * flujo esté bien armado: de eso se ocupa `verificarFlujo`. Si los nodos llegan sin posición, los acomoda en capas.
 */
export function validarContenido(valor: unknown): ContenidoDeFlujo {
  if (!esObjeto(valor) || !esLista(valor['nodos']) || !esLista(valor['flechas'])) throw new ErrorDeContenido('El contenido tiene que ser un objeto con «nodos» y «flechas».')
  const ids = new Set<string>()
  const nodos = valor['nodos'].map((n, i): NodoGuardado => {
    const donde = `nodos[${i}]`
    if (!esObjeto(n) || typeof n['id'] !== 'string' || !n['id']) throw new ErrorDeContenido(`${donde}: falta el «id».`)
    if (ids.has(n['id'])) throw new ErrorDeContenido(`${donde}: el id «${n['id']}» está repetido.`)
    ids.add(n['id'])
    const data = n['data']
    if (typeof n['type'] !== 'string' || !TIPOS_DE_NODO.includes(n['type'])) throw new ErrorDeContenido(`${donde}: «type» tiene que ser uno de ${TIPOS_DE_NODO.join(', ')}.`)
    if (!esObjeto(data) || typeof data['nombre'] !== 'string') throw new ErrorDeContenido(`${donde}: falta «data.nombre».`)
    if (n['type'] === 'evento' && !['inicio', 'espera', 'fin', 'interrupcion'].includes(String(data['variante']))) throw new ErrorDeContenido(`${donde}: «data.variante» tiene que ser inicio, espera, fin o interrupcion.`)
    if (n['type'] === 'evento' && data['eventos'] !== undefined && !sonNombrados(data['eventos'])) throw new ErrorDeContenido(`${donde}: «data.eventos» tiene que ser una lista de { id, nombre }.`)
    if (n['type'] === 'decision' && !sonNombrados(data['ramas'])) throw new ErrorDeContenido(`${donde}: «data.ramas» tiene que ser una lista de { id, nombre }.`)
    if (n['type'] === 'subflujo' && (typeof data['flujo'] !== 'string' || typeof data['version'] !== 'number' || !sonNombrados(data['salidas']))) {
      throw new ErrorDeContenido(`${donde}: un subflujo lleva «data.flujo», «data.version» y «data.salidas» (lista de { id, nombre }).`)
    }
    const p = n['position']
    const position = esObjeto(p) && typeof p['x'] === 'number' && typeof p['y'] === 'number' ? { x: p['x'], y: p['y'] } : { x: Number.NaN, y: Number.NaN }
    return { id: n['id'], type: n['type'], position, data } as NodoGuardado
  })
  const flechas = valor['flechas'].map((f, i): FlechaGuardada => {
    const donde = `flechas[${i}]`
    if (!esObjeto(f) || typeof f['source'] !== 'string' || typeof f['target'] !== 'string') throw new ErrorDeContenido(`${donde}: faltan «source» y «target».`)
    if (!ids.has(f['source']) || !ids.has(f['target'])) throw new ErrorDeContenido(`${donde}: une un nodo que no existe.`)
    const salida = typeof f['sourceHandle'] === 'string' ? f['sourceHandle'] : 'salida'
    return { id: typeof f['id'] === 'string' && f['id'] ? f['id'] : `${f['source']}-${salida}-${f['target']}`, source: f['source'], target: f['target'], sourceHandle: salida, targetHandle: null }
  })
  if (nodos.some((n) => Number.isNaN(n.position.x))) {
    const lugares = acomodarEnCapas(nodos, flechas)
    for (const n of nodos) n.position = lugares[n.id] ?? { x: 0, y: 0 }
  }
  return contenidoDe(nodos, flechas)
}
