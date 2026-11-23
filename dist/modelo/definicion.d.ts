import type { ContenidoDeFlujo } from './flujo.js';
/**
 * Traduce el dibujo de un flujo maestro a una definición de `ts-workflow-core`, para que el motor valide con él. Puro: recibe el
 * contenido y devuelve la definición como JSON, sin depender del core.
 *
 * Cómo se lee el dibujo:
 * - Cada **espera** es un estado. Un **fin** al que llega el flujo es un estado final.
 * - Cada **evento** de una espera es una transición desde ese estado, y su `accion` es la acción del sistema que la produce. Una
 *   **interrupción** es una transición desde cualquier estado, con sus excepciones; si no desvía el flujo, no cambia el estado.
 * - Desde el evento se sigue el camino hasta la próxima espera o fin. Lo que hay en el medio se traduce así:
 *   - una **decisión** que por alguna rama lleva a un **rechazo** es un **requisito**: la acción solo se permite por las otras.
 *     Si el rechazo tiene mensaje, es lo que el motor le dice a la persona cuando esa condición no se cumple;
 *   - una decisión que lleva a destinos distintos es una **decisión** del core;
 *   - una **función** es un **efecto**, con una condición si no está en todos los caminos;
 *   - un **subflujo** se abre en el lugar: cuenta lo que tiene adentro.
 *
 * Lo que el core no puede expresar no se traduce a medias: queda en `problemas` y no hay definición.
 */
type Json = Record<string, unknown>;
export interface OpcionesDeDefinicion {
    id: string;
    version: number;
    nombre: string;
    /** El contenido de un subflujo publicado, por id y versión. Sin él, un nodo de subflujo no se puede traducir. */
    subflujo?: (id: string, version: number) => ContenidoDeFlujo | undefined;
}
export interface Traduccion {
    /** La definición del core. Falta si hubo problemas. */
    definicion?: Json;
    /** Lo que impidió traducir, dicho para una persona. */
    problemas: string[];
}
export declare function definicionDeFlujo(contenido: ContenidoDeFlujo, opciones: OpcionesDeDefinicion): Traduccion;
export {};
