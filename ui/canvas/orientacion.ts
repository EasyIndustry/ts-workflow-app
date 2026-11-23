import { createContext, useContext } from 'react'

/** Hacia dónde corre el flujo: de arriba hacia abajo o de izquierda a derecha. */
export type Orientacion = 'vertical' | 'horizontal'

export const ContextoOrientacion = createContext<Orientacion>('vertical')

/** La orientación del lienzo donde está montado el nodo. Fuera de un lienzo es vertical. */
export const useOrientacion = () => useContext(ContextoOrientacion)
