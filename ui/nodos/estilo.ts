import { createContext, useContext } from 'react'

/**
 * Cómo se dibuja una decisión:
 * - `peine`: el rombo, y de cada salida un tramo recto con su texto a lo largo, que termina en el punto de conexión. El rombo
 *   crece con la cantidad de ramas.
 * - `tarjeta`: una tarjeta con la pregunta y una fila por rama, como una tabla. Es la más compacta con muchas ramas.
 * - `rombo`: el rombo de tamaño fijo, con los textos al costado de cada punto. Alcanza para dos o tres ramas.
 */
export type EstiloDeDecision = 'peine' | 'tarjeta' | 'rombo'

export const ContextoEstiloDeDecision = createContext<EstiloDeDecision>('peine')

export const useEstiloDeDecision = () => useContext(ContextoEstiloDeDecision)
