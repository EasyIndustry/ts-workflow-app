import { esEntrada } from './nodos.js';
/** Deja de un lienzo solo lo que se guarda, siempre con la misma forma, para poder comparar dos contenidos como texto. */
export function contenidoDe(nodos, flechas) {
    return {
        nodos: nodos.map((n) => ({ id: n.id, type: n.type, position: { x: n.position.x, y: n.position.y }, data: n.data })),
        flechas: flechas.map((f) => ({ id: f.id, source: f.source, target: f.target, sourceHandle: f.sourceHandle ?? null, targetHandle: f.targetHandle ?? null })),
    };
}
/** Las salidas de un flujo visto como subflujo: sus fines, con el id del nodo y su nombre. */
export function salidasDeContenido(contenido) {
    return contenido.nodos.flatMap((n) => (n.type === 'evento' && n.data.variante === 'fin' ? [{ id: n.id, nombre: n.data.nombre }] : []));
}
/** Lo que resume a un flujo y sale de su contenido: con qué arranca, cuántos nodos tiene y qué subflujos usa. */
export function resumenDeContenido(contenido) {
    const nodos = contenido?.nodos ?? [];
    return {
        inicios: nodos.flatMap((n) => (n.type === 'evento' && n.data.variante === 'inicio' ? [n.data.nombre] : [])),
        nodos: nodos.length,
        usa: [...new Set(nodos.flatMap((n) => (n.type === 'subflujo' && n.data.flujo ? [n.data.flujo] : [])))],
    };
}
/** Con qué arranca un flujo recién creado: un inicio, para que el lienzo no quede vacío. */
export function contenidoInicial(tipo) {
    const nombre = tipo === 'subflujo' ? 'Al ser llamado' : 'Inicio';
    return contenidoDe([{ id: 'inicio', type: 'evento', position: { x: 0, y: 0 }, data: { variante: 'inicio', nombre } }], []);
}
/** El flujo que se pidió no existe. */
export class ErrorNoExiste extends Error {
    constructor(id) {
        super(`No existe el flujo «${id}».`);
        this.name = 'ErrorNoExiste';
    }
}
/** Lo que llegó no tiene la forma de un flujo. El mensaje dice qué está mal. */
export class ErrorDeContenido extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = 'ErrorDeContenido';
    }
}
const TIPOS_DE_NODO = ['evento', 'funcion', 'decision', 'subflujo'];
const esObjeto = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const esLista = (v) => Array.isArray(v);
const sonNombrados = (v) => esLista(v) && v.every((x) => esObjeto(x) && typeof x['id'] === 'string' && typeof x['nombre'] === 'string');
/**
 * Ubica los nodos en capas siguiendo las flechas desde las entradas, de arriba hacia abajo. Es un acomodo simple, para un flujo
 * que llega sin posiciones (lo armó un agente): después se puede mejorar con «Acomodar» en la pantalla.
 */
export function acomodarEnCapas(nodos, flechas) {
    const capa = new Map();
    let frente = nodos.filter(esEntrada).map((n) => n.id);
    if (frente.length === 0 && nodos[0])
        frente = [nodos[0].id];
    for (let nivel = 0; frente.length > 0 && nivel <= nodos.length; nivel++) {
        for (const id of frente)
            capa.set(id, nivel);
        // Un nodo ya ubicado no se vuelve a bajar: así un bucle no lo empuja para siempre.
        frente = [...new Set(flechas.filter((f) => frente.includes(f.source) && !capa.has(f.target)).map((f) => f.target))];
    }
    const ultima = Math.max(-1, ...capa.values());
    const porCapa = new Map();
    return Object.fromEntries(nodos.map((n) => {
        const nivel = capa.get(n.id) ?? ultima + 1;
        const columna = porCapa.get(nivel) ?? 0;
        porCapa.set(nivel, columna + 1);
        return [n.id, { x: columna * 260, y: nivel * 160 }];
    }));
}
/**
 * Revisa que algo que llega de afuera (un pedido, un agente) tenga la forma de un flujo y lo devuelve limpio. No revisa que el
 * flujo esté bien armado: de eso se ocupa `verificarFlujo`. Si los nodos llegan sin posición, los acomoda en capas.
 */
export function validarContenido(valor) {
    if (!esObjeto(valor) || !esLista(valor['nodos']) || !esLista(valor['flechas']))
        throw new ErrorDeContenido('El contenido tiene que ser un objeto con «nodos» y «flechas».');
    const ids = new Set();
    const nodos = valor['nodos'].map((n, i) => {
        const donde = `nodos[${i}]`;
        if (!esObjeto(n) || typeof n['id'] !== 'string' || !n['id'])
            throw new ErrorDeContenido(`${donde}: falta el «id».`);
        if (ids.has(n['id']))
            throw new ErrorDeContenido(`${donde}: el id «${n['id']}» está repetido.`);
        ids.add(n['id']);
        const data = n['data'];
        if (typeof n['type'] !== 'string' || !TIPOS_DE_NODO.includes(n['type']))
            throw new ErrorDeContenido(`${donde}: «type» tiene que ser uno de ${TIPOS_DE_NODO.join(', ')}.`);
        if (!esObjeto(data) || typeof data['nombre'] !== 'string')
            throw new ErrorDeContenido(`${donde}: falta «data.nombre».`);
        if (n['type'] === 'evento' && !['inicio', 'espera', 'fin', 'interrupcion'].includes(String(data['variante'])))
            throw new ErrorDeContenido(`${donde}: «data.variante» tiene que ser inicio, espera, fin o interrupcion.`);
        if (n['type'] === 'evento' && data['eventos'] !== undefined && !sonNombrados(data['eventos']))
            throw new ErrorDeContenido(`${donde}: «data.eventos» tiene que ser una lista de { id, nombre }.`);
        if (n['type'] === 'decision' && !sonNombrados(data['ramas']))
            throw new ErrorDeContenido(`${donde}: «data.ramas» tiene que ser una lista de { id, nombre }.`);
        if (n['type'] === 'subflujo' && (typeof data['flujo'] !== 'string' || typeof data['version'] !== 'number' || !sonNombrados(data['salidas']))) {
            throw new ErrorDeContenido(`${donde}: un subflujo lleva «data.flujo», «data.version» y «data.salidas» (lista de { id, nombre }).`);
        }
        const p = n['position'];
        const position = esObjeto(p) && typeof p['x'] === 'number' && typeof p['y'] === 'number' ? { x: p['x'], y: p['y'] } : { x: Number.NaN, y: Number.NaN };
        return { id: n['id'], type: n['type'], position, data };
    });
    const flechas = valor['flechas'].map((f, i) => {
        const donde = `flechas[${i}]`;
        if (!esObjeto(f) || typeof f['source'] !== 'string' || typeof f['target'] !== 'string')
            throw new ErrorDeContenido(`${donde}: faltan «source» y «target».`);
        if (!ids.has(f['source']) || !ids.has(f['target']))
            throw new ErrorDeContenido(`${donde}: une un nodo que no existe.`);
        const salida = typeof f['sourceHandle'] === 'string' ? f['sourceHandle'] : 'salida';
        return { id: typeof f['id'] === 'string' && f['id'] ? f['id'] : `${f['source']}-${salida}-${f['target']}`, source: f['source'], target: f['target'], sourceHandle: salida, targetHandle: null };
    });
    if (nodos.some((n) => Number.isNaN(n.position.x))) {
        const lugares = acomodarEnCapas(nodos, flechas);
        for (const n of nodos)
            n.position = lugares[n.id] ?? { x: 0, y: 0 };
    }
    return contenidoDe(nodos, flechas);
}
