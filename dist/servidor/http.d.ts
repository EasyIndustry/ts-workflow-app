import { type Almacen, type Capacidad } from '../modelo/flujo.js';
/** Un pedido, sin atarse a ningún servidor web: el sistema donde está montada la app lo arma desde el suyo. */
export interface Pedido {
    metodo: string;
    /** La ruta sin el prefijo donde está montada la app: `/flujos/pedidos/borrador`. */
    ruta: string;
    cuerpo?: unknown;
}
export interface Respuesta {
    estado: number;
    cuerpo: unknown;
}
export interface OpcionesDeAtencion {
    /** El almacén para este pedido. El sistema lo crea con la persona que lo hace, para que quede anotada. */
    almacen: Almacen;
    /** Las capacidades que los flujos pueden usar en este sistema. */
    capacidades: () => readonly Capacidad[] | Promise<readonly Capacidad[]>;
    /** Si quien hace el pedido puede crear flujos y guardar borradores. Lo decide el sistema. */
    puedeEditar: boolean;
    /** Si puede publicar. Un agente nunca: publicar es de una persona. */
    puedePublicar: boolean;
}
/**
 * Atiende un pedido de la app de flujos y devuelve qué responder. El servidor no confía en la pantalla: revisa la forma de lo que
 * llega y, antes de publicar, vuelve a verificar el flujo.
 *
 * | Método y ruta | Qué hace |
 * |---|---|
 * | `GET /flujos` | La lista. |
 * | `POST /flujos` | Crea uno: `{ nombre, tipo }`. |
 * | `GET /flujos/:id` | Lo abre, con su contenido. |
 * | `PUT /flujos/:id/borrador` | Guarda el borrador: `{ contenido }`. |
 * | `GET /flujos/:id/verificacion` | Los problemas del borrador. |
 * | `POST /flujos/:id/publicar` | Publica el borrador si no tiene errores. |
 * | `GET /subflujos` | Los subflujos publicados, con sus salidas. |
 * | `GET /capacidades` | Lo que una función puede hacer en este sistema. |
 */
export declare function atender(pedido: Pedido, opciones: OpcionesDeAtencion): Promise<Respuesta>;
