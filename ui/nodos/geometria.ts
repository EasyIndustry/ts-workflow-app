/** Un punto sobre el contorno de un nodo, en porcentaje de su caja. `antes` dice si cae en la primera mitad, para ubicar su rótulo. */
export interface PuntoDeContorno {
  x: number
  y: number
  antes: boolean
}

function repartir(indice: number, total: number, horizontal: boolean, avance: (t: number) => number, traves: (t: number) => number): PuntoDeContorno {
  const t = (indice + 0.5) / total
  return horizontal ? { x: avance(t), y: traves(t), antes: t < 0.5 } : { x: traves(t), y: avance(t), antes: t < 0.5 }
}

/**
 * Dónde va cada salida sobre un rombo. La entrada ocupa una punta y las salidas se reparten sobre los dos lados opuestos: los de
 * abajo en vertical, los de la derecha en horizontal. Con una sola salida, cae en la punta de enfrente.
 */
export function puntoEnRombo(indice: number, total: number, horizontal: boolean): PuntoDeContorno {
  return repartir(indice, total, horizontal, (t) => 50 + (0.5 - Math.abs(t - 0.5)) * 100, (t) => t * 100)
}

/** Lo mismo sobre un círculo: las salidas se reparten sobre la media circunferencia opuesta a la entrada. */
export function puntoEnCirculo(indice: number, total: number, horizontal: boolean): PuntoDeContorno {
  return repartir(indice, total, horizontal, (t) => 50 + 50 * Math.sin(Math.PI * t), (t) => 50 - 50 * Math.cos(Math.PI * t))
}
