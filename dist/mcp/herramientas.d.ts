import type { crearAlmacenHttp } from '../cliente/almacenHttp.js';
/** El almacén con lo que suma el servidor: capacidades y verificación. Es lo que devuelve `crearAlmacenHttp`. */
export type Sistema = ReturnType<typeof crearAlmacenHttp>;
interface Herramienta {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    hacer(sistema: Sistema, args: Record<string, unknown>): Promise<unknown>;
}
/**
 * Lo que un agente puede hacer con los flujos: leer, crear y guardar borradores, y verificar. **No hay herramienta para publicar**:
 * publicar es una decisión de una persona, y el servidor además se lo niega a la credencial de un agente.
 */
export declare const HERRAMIENTAS: readonly Herramienta[];
interface Mensaje {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: Record<string, unknown>;
}
/**
 * El servidor MCP, sin atarse a por dónde llegan los mensajes: recibe uno (JSON-RPC) y devuelve la respuesta, o `null` si era un
 * aviso que no se contesta.
 */
export declare function crearServidorMcp(sistema: Sistema, version: string): (mensaje: Mensaje) => Promise<Record<string, unknown> | null>;
export {};
