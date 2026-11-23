import { rotuloDeNodo, salidasDe } from './nodos.js';
import { enTexto } from './flujo.js';
const CAMPOS = {
    nombre: 'Nombre',
    capacidad: 'Qué hace',
    ramas: 'Ramas',
    eventos: 'Eventos que escucha',
    excepto: 'No aplica en',
    variante: 'Tipo de evento',
    flujo: 'Flujo',
    version: 'Versión',
    salidas: 'Salidas',
};
function decir(valor, nombres) {
    if (valor === undefined || valor === null || valor === '')
        return 'nada';
    if (Array.isArray(valor))
        return valor.length ? valor.map((v) => (typeof v === 'object' && v && 'nombre' in v ? String(v.nombre) : String(v))).join(', ') : 'nada';
    return typeof valor === 'string' ? `«${nombres[valor] ?? valor}»` : String(valor);
}
function flechaEnPalabras(f, nodos) {
    const desde = nodos.get(f.source);
    const hacia = nodos.get(f.target);
    const salida = desde && salidasDe(desde).find((s) => s.id === f.sourceHandle)?.nombre;
    return `${desde ? rotuloDeNodo(desde) : f.source}${salida ? ` (por «${salida}»)` : ''} → ${hacia ? rotuloDeNodo(hacia) : f.target}`;
}
const claveDeFlecha = (f) => `${f.source}|${f.sourceHandle ?? ''}|${f.target}|${f.targetHandle ?? ''}`;
/**
 * Compara dos contenidos de un flujo. `nombres` traduce ids a nombres (los de las capacidades) para que el texto se lea. Los nodos
 * se reconocen por su id y las flechas por lo que unen.
 */
export function compararFlujos(antes, despues, nombres = {}) {
    const viejos = new Map(antes.nodos.map((n) => [n.id, n]));
    const nuevos = new Map(despues.nodos.map((n) => [n.id, n]));
    const d = { agregados: [], quitados: [], cambiados: [], flechasAgregadas: [], flechasQuitadas: [], movidos: 0, hayCambios: false };
    for (const n of despues.nodos) {
        const v = viejos.get(n.id);
        if (!v) {
            d.agregados.push(rotuloDeNodo(n));
            continue;
        }
        const a = { tipo: v.type, ...v.data };
        const b = { tipo: n.type, ...n.data };
        const cambios = [...new Set([...Object.keys(a), ...Object.keys(b)])]
            .filter((k) => enTexto(a[k]) !== enTexto(b[k]))
            .map((k) => `${CAMPOS[k] ?? k}: ${decir(a[k], nombres)} → ${decir(b[k], nombres)}`);
        if (cambios.length)
            d.cambiados.push({ nodo: rotuloDeNodo(n), cambios });
        else if (v.position.x !== n.position.x || v.position.y !== n.position.y)
            d.movidos++;
    }
    for (const v of antes.nodos)
        if (!nuevos.has(v.id))
            d.quitados.push(rotuloDeNodo(v));
    const flechasViejas = new Map(antes.flechas.map((f) => [claveDeFlecha(f), f]));
    const flechasNuevas = new Map(despues.flechas.map((f) => [claveDeFlecha(f), f]));
    for (const [k, f] of flechasNuevas)
        if (!flechasViejas.has(k))
            d.flechasAgregadas.push(flechaEnPalabras(f, nuevos));
    for (const [k, f] of flechasViejas)
        if (!flechasNuevas.has(k))
            d.flechasQuitadas.push(flechaEnPalabras(f, viejos));
    d.hayCambios = [d.agregados, d.quitados, d.cambiados, d.flechasAgregadas, d.flechasQuitadas].some((l) => l.length > 0);
    return d;
}
