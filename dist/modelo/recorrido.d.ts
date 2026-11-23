import type { NodoGuardado } from './nodos.js';
import type { ContenidoDeFlujo } from './flujo.js';
/**
 * Recorrer un flujo de prueba, un nodo por vez. Esto no ejecuta nada por su cuenta: a cada nodo lo resuelve el `Ejecutor` que le
 * pasan (un ensayo sin efectos del servidor, o uno de mentira en las stories). Sin React.
 */
/** Lo que necesita un nodo para resolverse: los datos de entrada de la prueba y lo que devolvieron los nodos anteriores, por id. */
export interface Entorno {
    entrada: unknown;
    pasos: Readonly<Record<string, unknown>>;
}
/**
 * Resuelve un nodo. Devuelve por qué salida sigue (`salida`, el id; sin él, la primera) y lo que produjo (`datos`). En una espera,
 * la salida es el evento que «ocurre» en la prueba. Si algo falla, lanza un error con el mensaje para la persona.
 */
export type Ejecutor = (nodo: NodoGuardado, entorno: Entorno) => Promise<{
    salida?: string;
    datos?: unknown;
} | void>;
export interface PasoDeTraza {
    nodo: string;
    rotulo: string;
    /** El nombre de la salida por la que siguió, si tiene nombre. */
    salida?: string;
    datos?: unknown;
    error?: string;
    /** Cuánto tardó, en milisegundos. */
    ms: number;
}
export interface Recorrido {
    estado: 'listo' | 'en-curso' | 'terminado' | 'error';
    /** El nodo que toca resolver. */
    actual?: string;
    /** El nodo donde falló. */
    falloEn?: string;
    traza: PasoDeTraza[];
    pasos: Record<string, unknown>;
    /** Con qué terminó. */
    resultado?: {
        fin: string;
        pasos: Record<string, unknown>;
    };
    error?: string;
}
/** Más pasos que esto en una prueba es casi seguro un bucle. */
export declare const TOPE_DE_PASOS = 200;
/** Deja el recorrido parado en el inicio del flujo. */
export declare function iniciar(contenido: ContenidoDeFlujo): Recorrido;
export declare const sigue: (r: Recorrido) => boolean;
/** Resuelve el nodo actual y deja el recorrido en el siguiente, terminado o con el error. No cambia el recorrido que recibe. */
export declare function avanzar(contenido: ContenidoDeFlujo, r: Recorrido, entrada: unknown, ejecutor: Ejecutor): Promise<Recorrido>;
