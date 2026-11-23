import { type FlechaGuardada, type NodoGuardado } from './nodos.js';
/** Lo que se guarda de un flujo: sus nodos y sus flechas, sin nada que sea solo de la pantalla (selección, medidas). */
export interface ContenidoDeFlujo {
    nodos: NodoGuardado[];
    flechas: FlechaGuardada[];
}
/**
 * Un maestro arranca solo, por un evento, y puede quedarse esperando. Un subflujo arranca cuando otro flujo lo llama, corre de
 * punta a punta y termina por uno de sus fines, que son sus salidas. El tipo se elige al crear y no cambia.
 */
export type TipoDeFlujo = 'maestro' | 'subflujo';
/** Un flujo en la lista. */
export interface ResumenDeFlujo {
    id: string;
    nombre: string;
    tipo: TipoDeFlujo;
    /** La versión vigente. Sin número, todavía no se publicó nunca. */
    version?: number;
    /** Si tiene cambios guardados que todavía no se publicaron. */
    conBorrador: boolean;
    /** Los nombres de sus inicios: qué lo arranca. */
    inicios: readonly string[];
    /** Cuántos nodos tiene. */
    nodos: number;
    /** Los nombres de los flujos que lo usan como subflujo. */
    usadoPor: readonly string[];
    /** Cuándo se guardó por última vez, en formato ISO, y quién. */
    editadoEl?: string;
    editadoPor?: string;
    /** Cuándo se publicó la versión vigente, en formato ISO, y quién. */
    publicadoEl?: string;
    publicadoPor?: string;
}
export interface FlujoAbierto extends ResumenDeFlujo {
    /** El borrador si lo hay; si no, la versión vigente. */
    contenido: ContenidoDeFlujo;
    /** La versión vigente, para comparar contra ella. Falta si nunca se publicó. */
    publicado?: ContenidoDeFlujo;
}
/** Lo que otro flujo necesita saber de un subflujo para usarlo: sus versiones publicadas y las salidas de cada una. */
export interface ContratoDeSubflujo {
    id: string;
    nombre: string;
    /** De la más vieja a la más nueva. */
    versiones: readonly {
        version: number;
        salidas: readonly {
            id: string;
            nombre: string;
        }[];
    }[];
}
/**
 * Dónde viven los flujos. La interfaz no sabe si es un servidor o la memoria: recibe uno de estos. Una versión publicada no se
 * edita: los cambios se guardan como borrador y `publicar` los convierte en la versión siguiente.
 */
export interface Almacen {
    listar(): Promise<ResumenDeFlujo[]>;
    crear(nombre: string, tipo: TipoDeFlujo): Promise<ResumenDeFlujo>;
    abrir(id: string): Promise<FlujoAbierto>;
    guardarBorrador(id: string, contenido: ContenidoDeFlujo): Promise<void>;
    /** Publica el borrador y devuelve el número de la versión nueva. */
    publicar(id: string): Promise<number>;
    /** Los subflujos que ya tienen al menos una versión publicada. */
    subflujos(): Promise<ContratoDeSubflujo[]>;
}
/** Deja de un lienzo solo lo que se guarda, siempre con la misma forma, para poder comparar dos contenidos como texto. */
export declare function contenidoDe(nodos: readonly NodoGuardado[], flechas: readonly FlechaGuardada[]): ContenidoDeFlujo;
/** Las salidas de un flujo visto como subflujo: sus fines, con el id del nodo y su nombre. */
export declare function salidasDeContenido(contenido: ContenidoDeFlujo): {
    id: string;
    nombre: string;
}[];
/** Lo que resume a un flujo y sale de su contenido: con qué arranca, cuántos nodos tiene y qué subflujos usa. */
export declare function resumenDeContenido(contenido: ContenidoDeFlujo | undefined): {
    inicios: string[];
    nodos: number;
    usa: string[];
};
/** Con qué arranca un flujo recién creado: un inicio, para que el lienzo no quede vacío. */
export declare function contenidoInicial(tipo: TipoDeFlujo): ContenidoDeFlujo;
/** Una capacidad del registro, como la describe el core: lo que un nodo de función puede ejecutar. */
export interface Capacidad {
    id: string;
    nombre: string;
    descripcion?: string;
    /** Para agrupar en la lista. */
    grupo?: string;
    /** El JSON Schema de sus parámetros. Con él, el inspector arma el formulario. */
    schemaEntrada?: Record<string, unknown>;
}
/** El flujo que se pidió no existe. */
export declare class ErrorNoExiste extends Error {
    constructor(id: string);
}
/** Lo que llegó no tiene la forma de un flujo. El mensaje dice qué está mal. */
export declare class ErrorDeContenido extends Error {
    constructor(mensaje: string);
}
/**
 * Ubica los nodos en capas siguiendo las flechas desde las entradas, de arriba hacia abajo. Es un acomodo simple, para un flujo
 * que llega sin posiciones (lo armó un agente): después se puede mejorar con «Acomodar» en la pantalla.
 */
export declare function acomodarEnCapas(nodos: readonly NodoGuardado[], flechas: readonly FlechaGuardada[]): Record<string, {
    x: number;
    y: number;
}>;
/**
 * Revisa que algo que llega de afuera (un pedido, un agente) tenga la forma de un flujo y lo devuelve limpio. No revisa que el
 * flujo esté bien armado: de eso se ocupa `verificarFlujo`. Si los nodos llegan sin posición, los acomoda en capas.
 */
export declare function validarContenido(valor: unknown): ContenidoDeFlujo;
