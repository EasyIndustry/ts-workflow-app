import ELK from 'elkjs/lib/elk.bundled.js'
import type { Orientacion } from './orientacion'

export interface CajaDeNodo {
  id: string
  ancho: number
  alto: number
}

export interface Flecha {
  id: string
  desde: string
  hacia: string
}

export type Posiciones = Record<string, { x: number; y: number }>

const elk = new ELK()

/**
 * Acomoda los nodos en capas siguiendo las flechas: de arriba hacia abajo en vertical, de izquierda a derecha en horizontal.
 * Devuelve la posición nueva de cada nodo. No sabe de React ni del lienzo: recibe tamaños y flechas.
 */
export async function acomodar(nodos: readonly CajaDeNodo[], flechas: readonly Flecha[], orientacion: Orientacion): Promise<Posiciones> {
  const ids = new Set(nodos.map((n) => n.id))
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
    children: nodos.map((n) => ({ id: n.id, width: n.ancho, height: n.alto })),
    edges: flechas.filter((f) => ids.has(f.desde) && ids.has(f.hacia)).map((f) => ({ id: f.id, sources: [f.desde], targets: [f.hacia] })),
  })
  return Object.fromEntries((grafo.children ?? []).map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]))
}
