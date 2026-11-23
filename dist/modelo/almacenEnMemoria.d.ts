import { type Almacen, type ContenidoDeFlujo, type TipoDeFlujo } from './flujo.js';
export interface FlujoInicial {
    id: string;
    nombre: string;
    /** Por defecto, maestro. */
    tipo?: TipoDeFlujo;
    /** Con versión, `contenido` es lo publicado. Sin versión, es un borrador que nunca se publicó. */
    version?: number;
    contenido: ContenidoDeFlujo;
    editadoEl?: string;
    publicadoEl?: string;
}
/**
 * Un almacén que vive en la memoria: para las stories y las pruebas. Se pierde al recargar. `ahora` es el reloj, para poder
 * probarlo.
 */
export declare function crearAlmacenEnMemoria(iniciales?: readonly FlujoInicial[], ahora?: () => string): Almacen;
