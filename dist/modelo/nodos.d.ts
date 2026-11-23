/**
 * Los nodos de un flujo, como datos: qué guarda cada tipo y lo que se puede decir de un nodo sin dibujarlo (cómo se llama su tipo,
 * qué salidas tiene). Sin React ni librerías: lo usan la interfaz, el servidor y las herramientas para agentes.
 */
type Nombrado = {
    id: string;
    nombre: string;
};
/**
 * Un evento: algo que pasa afuera del flujo y que el flujo atrapa.
 * - `inicio`: lo que arranca el flujo.
 * - `fin`: donde termina. En un subflujo, su nombre es el resultado con el que sale.
 * - `espera`: el flujo se detiene hasta que pase uno de los `eventos` que escucha, y sale por el primero que ocurra.
 * - `interrupcion`: un evento que puede llegar en cualquier momento y desvía el flujo en curso, salvo en las esperas de `excepto`.
 */
export type DatosEvento = {
    variante: 'inicio' | 'espera' | 'fin' | 'interrupcion';
    nombre: string;
    eventos?: readonly Nombrado[];
    excepto?: readonly string[];
};
/** Una función del registro: `capacidad` es su id y `params`, los datos con los que la llama. */
export type DatosFuncion = {
    nombre: string;
    capacidad?: string;
    params?: Record<string, unknown>;
};
/** Una decisión: evalúa sus ramas en orden y sale por la primera que se cumple, o por «si no». Solo lee. */
export type DatosDecision = {
    nombre: string;
    ramas: readonly Nombrado[];
};
/** Otro flujo usado como un nodo, en una versión fija. Sus salidas son los fines de ese flujo. */
export type DatosSubflujo = {
    nombre: string;
    flujo: string;
    version: number;
    salidas: readonly Nombrado[];
};
type Guardado<D, T extends string> = {
    id: string;
    type: T;
    position: {
        x: number;
        y: number;
    };
    data: D;
};
/** Un nodo tal como se guarda: sin nada que sea solo de la pantalla. */
export type NodoGuardado = Guardado<DatosEvento, 'evento'> | Guardado<DatosFuncion, 'funcion'> | Guardado<DatosDecision, 'decision'> | Guardado<DatosSubflujo, 'subflujo'>;
/** Una flecha tal como se guarda: de qué salida de qué nodo, a qué nodo. */
export type FlechaGuardada = {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
};
export declare const SALIDA_SI_NO = "sino";
export declare const SALIDA_UNICA = "salida";
/** El nombre del tipo de nodo, como se le dice a una persona. */
export declare function tipoDeNodo(nodo: NodoGuardado): string;
/** Cómo nombrar un nodo en una frase: «Función «Avisar al responsable»». */
export declare function rotuloDeNodo(nodo: NodoGuardado): string;
/** Las salidas de un nodo, en orden. Una salida sin nombre es la única que tiene. Un fin no tiene ninguna. */
export declare function salidasDe(nodo: NodoGuardado): readonly {
    id: string;
    nombre?: string;
}[];
/** Si al nodo le pueden llegar flechas. Un inicio y una interrupción no reciben: son por donde se entra al flujo. */
export declare function esEntrada(nodo: NodoGuardado): boolean;
export declare function esFin(nodo: NodoGuardado): boolean;
export {};
