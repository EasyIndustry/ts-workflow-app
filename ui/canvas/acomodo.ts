import ELK from 'elkjs/lib/elk.bundled.js'
import type { Orientacion } from './orientacion'

/** Un punto de conexión de un nodo: su posición es relativa a la esquina de arriba a la izquierda de la caja. */
export interface Puerto {
  id: string
  x: number
  y: number
  ancho: number
  alto: number
}

export interface CajaDeNodo {
  id: string
  ancho: number
  alto: number
  /** Con los puntos de conexión, las flechas se alinean con ellos y no con el centro de la caja, y salen en su orden. */
  puertos?: readonly Puerto[]
}

export interface Flecha {
  id: string
  desde: string
  hacia: string
  puertoDesde?: string
  puertoHacia?: string
}

export type Posiciones = Record<string, { x: number; y: number }>

const elk = new ELK()

/**
 * Acomoda los nodos en capas siguiendo las flechas: de arriba hacia abajo en vertical, de izquierda a derecha en horizontal.
 * Devuelve la posición nueva de cada nodo. No sabe de React ni del lienzo: recibe tamaños, puntos de conexión y flechas.
 */
export async function acomodar(nodos: readonly CajaDeNodo[], flechas: readonly Flecha[], orientacion: Orientacion): Promise<Posiciones> {
  const ids = new Set(nodos.map((n) => n.id))
  const puertos = new Set(nodos.flatMap((n) => (n.puertos ?? []).map((p) => p.id)))
  const extremo = (nodo: string, puerto?: string) => (puerto && puertos.has(puerto) ? puerto : nodo)
  const grafo = await elk.layout({
    id: 'raiz',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': orientacion === 'horizontal' ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '70',
      // Respeta el orden en que vienen los nodos y las flechas: las ramas de una decisión quedan en su orden.
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    },
    children: nodos.map((n) => ({
      id: n.id,
      width: n.ancho,
      height: n.alto,
      ...(n.puertos?.length && {
        layoutOptions: { 'elk.portConstraints': 'FIXED_POS' },
        ports: n.puertos.map((p) => ({ id: p.id, x: p.x, y: p.y, width: p.ancho, height: p.alto })),
      }),
    })),
    edges: flechas
      .filter((f) => ids.has(f.desde) && ids.has(f.hacia))
      .map((f) => ({ id: f.id, sources: [extremo(f.desde, f.puertoDesde)], targets: [extremo(f.hacia, f.puertoHacia)] })),
  })
  return Object.fromEntries((grafo.children ?? []).map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]))
}
