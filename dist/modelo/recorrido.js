import { esFin, rotuloDeNodo, salidasDe } from './nodos.js';
/** Más pasos que esto en una prueba es casi seguro un bucle. */
export const TOPE_DE_PASOS = 200;
/** Deja el recorrido parado en el inicio del flujo. */
export function iniciar(contenido) {
    const inicio = contenido.nodos.find((n) => n.type === 'evento' && n.data.variante === 'inicio');
    if (!inicio)
        return { estado: 'error', traza: [], pasos: {}, error: 'El flujo no tiene un inicio.' };
    return { estado: 'listo', actual: inicio.id, traza: [], pasos: {} };
}
export const sigue = (r) => r.estado === 'listo' || r.estado === 'en-curso';
/** Resuelve el nodo actual y deja el recorrido en el siguiente, terminado o con el error. No cambia el recorrido que recibe. */
export async function avanzar(contenido, r, entrada, ejecutor) {
    if (!sigue(r) || !r.actual)
        return r;
    const nodo = contenido.nodos.find((n) => n.id === r.actual);
    if (!nodo)
        return { ...r, estado: 'error', actual: undefined, error: 'La flecha lleva a un nodo que ya no existe.' };
    const rotulo = rotuloDeNodo(nodo);
    const empezo = performance.now();
    const falla = (error) => ({
        ...r,
        estado: 'error',
        actual: undefined,
        falloEn: nodo.id,
        error: `${rotulo}: ${error}`,
        traza: [...r.traza, { nodo: nodo.id, rotulo, error, ms: Math.round(performance.now() - empezo) }],
    });
    if (r.traza.length >= TOPE_DE_PASOS)
        return falla(`la prueba pasó de ${TOPE_DE_PASOS} pasos; el flujo probablemente da vueltas sin terminar.`);
    let resuelto;
    try {
        resuelto = (await ejecutor(nodo, { entrada, pasos: r.pasos })) ?? {};
    }
    catch (e) {
        return falla(e instanceof Error ? e.message : String(e));
    }
    const ms = Math.round(performance.now() - empezo);
    const pasos = { ...r.pasos, [nodo.id]: resuelto.datos };
    if (esFin(nodo)) {
        return { estado: 'terminado', traza: [...r.traza, { nodo: nodo.id, rotulo, datos: resuelto.datos, ms }], pasos, resultado: { fin: nodo.data.nombre, pasos } };
    }
    const salidas = salidasDe(nodo);
    const tomada = resuelto.salida ? salidas.find((s) => s.id === resuelto.salida) : salidas[0];
    if (!tomada)
        return falla(`salió por «${resuelto.salida}», que no es una salida de este nodo.`);
    const flecha = contenido.flechas.find((f) => f.source === nodo.id && (f.sourceHandle === tomada.id || (salidas.length === 1 && !f.sourceHandle)));
    if (!flecha)
        return falla(tomada.nombre ? `la salida «${tomada.nombre}» no está conectada.` : 'no tiene a dónde seguir.');
    return { estado: 'en-curso', actual: flecha.target, traza: [...r.traza, { nodo: nodo.id, rotulo, salida: tomada.nombre, datos: resuelto.datos, ms }], pasos };
}
