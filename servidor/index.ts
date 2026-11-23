/**
 * El servidor de la app de flujos: dónde se guardan (Postgres, en el esquema `flujo` de la base del sistema) y cómo se atienden los
 * pedidos, sin atarse a ningún servidor web.
 */
export { crearAlmacenPostgres, idDesdeNombre, migrar, type ClienteSql, type OpcionesAlmacenPostgres } from './almacenPostgres.js'
export { atender, definicionDe, type OpcionesDeAtencion, type Pedido, type Respuesta } from './http.js'
export { crearAlmacenEnMemoria } from '../modelo/almacenEnMemoria.js'
export * from '../modelo/flujo.js'
export { verificarFlujo, type Problema } from '../modelo/verificar.js'
export { compararFlujos, type Diferencias } from '../modelo/comparar.js'
export { definicionDeFlujo, type OpcionesDeDefinicion, type Traduccion } from '../modelo/definicion.js'
