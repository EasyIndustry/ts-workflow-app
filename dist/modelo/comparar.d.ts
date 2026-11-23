import { type ContenidoDeFlujo } from './flujo.js';
/** En qué se diferencian dos contenidos de un flujo, dicho para una persona. */
export interface Diferencias {
    agregados: string[];
    quitados: string[];
    cambiados: {
        nodo: string;
        cambios: string[];
    }[];
    flechasAgregadas: string[];
    flechasQuitadas: string[];
    /** Nodos que solo cambiaron de lugar: no cambia cómo funciona el flujo. */
    movidos: number;
    /** Si cambió algo de cómo funciona el flujo (no cuenta mover nodos). */
    hayCambios: boolean;
}
/**
 * Compara dos contenidos de un flujo. `nombres` traduce ids a nombres (los de las capacidades) para que el texto se lea. Los nodos
 * se reconocen por su id y las flechas por lo que unen.
 */
export declare function compararFlujos(antes: ContenidoDeFlujo, despues: ContenidoDeFlujo, nombres?: Readonly<Record<string, string>>): Diferencias;
