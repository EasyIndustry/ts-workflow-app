import type { ContenidoDeFlujo, ContratoDeSubflujo, TipoDeFlujo } from './flujo.js';
/** Algo que está mal en un flujo. Un error impide publicar; un aviso no. */
export interface Problema {
    nivel: 'error' | 'aviso';
    mensaje: string;
    /** El id del nodo, cuando el problema es de uno. */
    nodo?: string;
}
export interface OpcionesDeVerificacion {
    /** El id del flujo, para avisar si se usa a sí mismo. */
    id?: string;
    /** Un subflujo tiene reglas propias: un solo inicio, sin esperas, y fines con nombres distintos. Por defecto, maestro. */
    tipo?: TipoDeFlujo;
    /** Los subflujos publicados. Con ellos se revisa que cada nodo de subflujo use uno que existe, en una versión que existe. */
    subflujos?: readonly ContratoDeSubflujo[];
}
/**
 * Revisa que el dibujo de un flujo esté completo: que tenga por dónde entrar y dónde terminar, que cada función sepa qué hace, que
 * no queden salidas sueltas ni nodos a los que no se llega, y que cumpla las reglas de su tipo. `capacidades` son los ids que
 * existen en el registro (acciones, efectos y condiciones).
 *
 * Lo que le falta a un flujo para poder ejecutarse (una rama sin condición, un evento sin acción) sale como aviso: el dibujo está
 * completo, pero todavía no dice qué evaluar.
 */
export declare function verificarFlujo(contenido: ContenidoDeFlujo, capacidades: readonly string[], opciones?: OpcionesDeVerificacion): Problema[];
/** Los ids de las condiciones del registro que usa un árbol de condición, sea una sola o una combinación. */
export declare function condicionesDe(condicion: unknown): string[];
