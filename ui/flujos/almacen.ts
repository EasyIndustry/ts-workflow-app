import type { Edge } from '@xyflow/react'
import type { NodoDeFlujo } from '../nodos'

/** Lo que se guarda de un flujo: sus nodos y sus flechas, sin nada que sea solo de la pantalla (selección, medidas). */
export interface ContenidoDeFlujo {
  nodos: NodoDeFlujo[]
  flechas: Edge[]
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
}

/** Deja de un lienzo solo lo que se guarda, siempre con la misma forma, para poder comparar dos contenidos como texto. */
export function contenidoDe(nodos: readonly NodoDeFlujo[], flechas: readonly Edge[]): ContenidoDeFlujo {
  return {
    nodos: nodos.map((n) => ({ id: n.id, type: n.type, position: { x: n.position.x, y: n.position.y }, data: n.data }) as NodoDeFlujo),
    flechas: flechas.map((f) => ({ id: f.id, source: f.source, target: f.target, sourceHandle: f.sourceHandle ?? null, targetHandle: f.targetHandle ?? null })),
  }
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
