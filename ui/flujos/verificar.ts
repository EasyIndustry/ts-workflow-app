import type { NodoDeFlujo } from '../nodos'
import { esEntrada, esFin, rotuloDeNodo, salidasDe } from '../nodos/descripcion'
import type { ContenidoDeFlujo } from './almacen'

/** Algo que está mal en un flujo. Un error impide publicar; un aviso no. */
export interface Problema {
  nivel: 'error' | 'aviso'
  mensaje: string
  /** El id del nodo, cuando el problema es de uno. */
  nodo?: string
}

function alcanzables(desde: readonly string[], vecinos: ReadonlyMap<string, readonly string[]>): Set<string> {
  const vistos = new Set(desde)
  const cola = [...desde]
  for (let id = cola.pop(); id !== undefined; id = cola.pop()) {
    for (const v of vecinos.get(id) ?? []) {
      if (!vistos.has(v)) {
        vistos.add(v)
        cola.push(v)
      }
    }
  }
  return vistos
}

/**
 * Revisa que el dibujo de un flujo esté completo: que tenga por dónde entrar y dónde terminar, que cada función sepa qué hace, que
 * no queden salidas sueltas ni nodos a los que no se llega. `capacidades` son los ids que existen en el registro.
 */
export function verificarFlujo(contenido: ContenidoDeFlujo, capacidades: readonly string[]): Problema[] {
  const problemas: Problema[] = []
  const error = (mensaje: string, nodo?: NodoDeFlujo) => problemas.push({ nivel: 'error', mensaje, nodo: nodo?.id })
  const { nodos, flechas } = contenido
  const porId = new Map(nodos.map((n) => [n.id, n]))

  if (!nodos.some((n) => n.type === 'evento' && n.data.variante === 'inicio')) error('El flujo no tiene un inicio.')
  if (!nodos.some(esFin)) error('El flujo no tiene un fin.')

  const sigue = new Map<string, string[]>()
  const viene = new Map<string, string[]>()
  const conectadas = new Set<string>()
  for (const f of flechas) {
    if (!porId.has(f.source) || !porId.has(f.target)) {
      error('Hay una flecha que une un nodo que ya no existe.')
      continue
    }
    sigue.set(f.source, [...(sigue.get(f.source) ?? []), f.target])
    viene.set(f.target, [...(viene.get(f.target) ?? []), f.source])
    conectadas.add(`${f.source}|${f.sourceHandle ?? ''}`)
  }

  const completos = new Set<string>()
  for (const n of nodos) {
    const quien = rotuloDeNodo(n)
    if (!n.data.nombre.trim()) error(`${tipoSinNombre(n)} no tiene nombre.`, n)
    if (n.type === 'funcion') {
      if (!n.data.capacidad) error(`${quien} no tiene elegido qué hace.`, n)
      else if (!capacidades.includes(n.data.capacidad)) error(`${quien} usa «${n.data.capacidad}», que no existe en este sistema.`, n)
    }
    if (n.type === 'subflujo' && !n.data.flujo) error(`${quien} no tiene elegido qué flujo usa.`, n)
    if (n.type === 'decision' && n.data.ramas.length === 0) problemas.push({ nivel: 'aviso', mensaje: `${quien} no tiene ramas: siempre sale por «si no».`, nodo: n.id })

    const salidas = salidasDe(n)
    const sueltas = salidas.filter((s) => !conectadas.has(`${n.id}|${s.id}`) && !(salidas.length === 1 && conectadas.has(`${n.id}|`)))
    for (const s of sueltas) error(s.nombre ? `${quien}: la salida «${s.nombre}» no está conectada.` : `${quien} no tiene a dónde seguir.`, n)
    if (sueltas.length === 0) completos.add(n.id)
  }

  const desdeLasEntradas = alcanzables(nodos.filter(esEntrada).map((n) => n.id), sigue)
  const hastaUnFin = alcanzables(nodos.filter(esFin).map((n) => n.id), viene)
  for (const n of nodos) {
    if (!desdeLasEntradas.has(n.id)) error(`A ${rotuloDeNodo(n)} no se llega desde ningún inicio.`, n)
    // Si le falta conectar una salida, ya se avisó: no se repite con otro mensaje.
    else if (completos.has(n.id) && !hastaUnFin.has(n.id) && nodos.some(esFin)) error(`Desde ${rotuloDeNodo(n)} no se llega a ningún fin.`, n)
  }
  return problemas
}

function tipoSinNombre(n: NodoDeFlujo): string {
  const [tipo] = rotuloDeNodo(n).split(' «')
  return `Un nodo de tipo ${tipo}`
}
