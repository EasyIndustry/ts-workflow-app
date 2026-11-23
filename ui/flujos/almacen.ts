import type { Edge } from '@xyflow/react'
import type { NodoDeFlujo } from '../nodos'

/** Lo que se guarda de un flujo: sus nodos y sus flechas, sin nada que sea solo de la pantalla (selección, medidas). */
export interface ContenidoDeFlujo {
  nodos: NodoDeFlujo[]
  flechas: Edge[]
}

/** Un flujo en la lista. */
export interface ResumenDeFlujo {
  id: string
  nombre: string
  /** La versión vigente. Sin número, todavía no se publicó nunca. */
  version?: number
  /** Si tiene cambios guardados que todavía no se publicaron. */
  conBorrador: boolean
  /** Los nombres de sus inicios: qué lo arranca. */
  inicios: readonly string[]
  /** Cuántos nodos tiene. */
  nodos: number
  /** Cuándo se guardó por última vez, en formato ISO. */
  editadoEl?: string
  /** Cuándo se publicó la versión vigente, en formato ISO. */
  publicadoEl?: string
}

export interface FlujoAbierto extends ResumenDeFlujo {
  /** El borrador si lo hay; si no, la versión vigente. */
  contenido: ContenidoDeFlujo
  /** La versión vigente, para comparar contra ella. Falta si nunca se publicó. */
  publicado?: ContenidoDeFlujo
}

/**
 * Dónde viven los flujos. La interfaz no sabe si es un servidor o la memoria: recibe uno de estos. Una versión publicada no se
 * edita: los cambios se guardan como borrador y `publicar` los convierte en la versión siguiente.
 */
export interface Almacen {
  listar(): Promise<ResumenDeFlujo[]>
  crear(nombre: string): Promise<ResumenDeFlujo>
  abrir(id: string): Promise<FlujoAbierto>
  guardarBorrador(id: string, contenido: ContenidoDeFlujo): Promise<void>
  /** Publica el borrador y devuelve el número de la versión nueva. */
  publicar(id: string): Promise<number>
}

/** Deja de un lienzo solo lo que se guarda, siempre con la misma forma, para poder comparar dos contenidos como texto. */
export function contenidoDe(nodos: readonly NodoDeFlujo[], flechas: readonly Edge[]): ContenidoDeFlujo {
  return {
    nodos: nodos.map((n) => ({ id: n.id, type: n.type, position: { x: n.position.x, y: n.position.y }, data: n.data }) as NodoDeFlujo),
    flechas: flechas.map((f) => ({ id: f.id, source: f.source, target: f.target, sourceHandle: f.sourceHandle ?? null, targetHandle: f.targetHandle ?? null })),
  }
}
