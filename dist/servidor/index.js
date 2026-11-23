/**
 * El servidor de la app de flujos: dónde se guardan (Postgres, en el esquema `flujo` de la base del sistema) y cómo se atienden los
 * pedidos, sin atarse a ningún servidor web.
 */
export { crearAlmacenPostgres, idDesdeNombre, migrar } from './almacenPostgres.js';
export { atender } from './http.js';
export { crearAlmacenEnMemoria } from '../modelo/almacenEnMemoria.js';
export * from '../modelo/flujo.js';
export { verificarFlujo } from '../modelo/verificar.js';
export { compararFlujos } from '../modelo/comparar.js';
