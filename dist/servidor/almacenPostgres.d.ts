import { type Almacen } from '../modelo/flujo.js';
/** Lo único que hace falta de un cliente de Postgres: `pg.Pool` y `pg.Client` lo cumplen. La app no depende de `pg`. */
export interface ClienteSql {
    query(texto: string, valores?: unknown[]): Promise<{
        rows: any[];
    }>;
}
/** Deja el esquema al día. Se corre al arrancar o en una migración del sistema; repetirlo no hace nada. Devuelve cuántas aplicó. */
export declare function migrar(cliente: ClienteSql): Promise<number>;
export interface OpcionesAlmacenPostgres {
    /** Quién está haciendo los cambios, para dejarlo anotado. Lo dice el sistema donde está montada la app. */
    persona?: string;
}
/** El id de un flujo nuevo sale de su nombre: «Pedidos urgentes» → `pedidos-urgentes`. Es lo que se ve en las referencias. */
export declare function idDesdeNombre(nombre: string): string;
/** El almacén de flujos sobre Postgres. Antes hay que correr `migrar`. */
export declare function crearAlmacenPostgres(cliente: ClienteSql, opciones?: OpcionesAlmacenPostgres): Almacen;
