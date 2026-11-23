/**
 * La interfaz de la app de flujos, para montarla en otro sistema. Lo habitual es `AppDeFlujos` con un almacén (`crearAlmacenHttp`
 * contra el servidor de la app) y las capacidades del sistema.
 */
export { AppDeFlujos, type AppDeFlujosProps } from './flujos/AppDeFlujos'
export { Editor, type EditorProps } from './editor/Editor'
export { crearAlmacenHttp, ErrorDelServidor, type OpcionesAlmacenHttp } from '../cliente/almacenHttp.js'
export { crearAlmacenEnMemoria } from '../modelo/almacenEnMemoria.js'
export type { Almacen, Capacidad, ContenidoDeFlujo, ContratoDeSubflujo, FlujoAbierto, ResumenDeFlujo, TipoDeFlujo } from '../modelo/flujo.js'
export type { Ejecutor } from '../modelo/recorrido.js'
export type { RegistroDePrueba } from './prueba/PanelDePrueba'
