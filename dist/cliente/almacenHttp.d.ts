import type { Traduccion } from '../modelo/definicion.js';
import type { Almacen, Capacidad } from '../modelo/flujo.js';
import type { Problema } from '../modelo/verificar.js';
export interface OpcionesAlmacenHttp {
    /** Dónde está montada la app en el servidor: `https://sistema.ejemplo/api/flujos-app`. */
    urlBase: string;
    /** Los encabezados de cada pedido: la sesión de la persona, o la credencial de un agente. */
    encabezados?: () => Record<string, string> | Promise<Record<string, string>>;
    /** Para probar o para un entorno sin `fetch` global. */
    fetch?: typeof fetch;
}
/** El servidor respondió que no. `estado` es el código y `problemas`, lo que impidió publicar, si fue eso. */
export declare class ErrorDelServidor extends Error {
    readonly estado: number;
    readonly problemas?: readonly Problema[] | undefined;
    constructor(mensaje: string, estado: number, problemas?: readonly Problema[] | undefined);
}
/** El almacén de flujos hablando con el servidor de la app. Suma lo que el servidor sabe y el almacén no: capacidades y verificación. */
export declare function crearAlmacenHttp(opciones: OpcionesAlmacenHttp): Almacen & {
    capacidades(): Promise<Capacidad[]>;
    verificar(id: string): Promise<Problema[]>;
    definicion(id: string): Promise<Traduccion>;
};
