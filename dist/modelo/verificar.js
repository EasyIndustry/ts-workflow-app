import { esEntrada, esFin, rotuloDeNodo, salidasDe } from './nodos.js';
function alcanzables(desde, vecinos) {
    const vistos = new Set(desde);
    const cola = [...desde];
    for (let id = cola.pop(); id !== undefined; id = cola.pop()) {
        for (const v of vecinos.get(id) ?? []) {
            if (!vistos.has(v)) {
                vistos.add(v);
                cola.push(v);
            }
        }
    }
    return vistos;
}
/**
 * Revisa que el dibujo de un flujo esté completo: que tenga por dónde entrar y dónde terminar, que cada función sepa qué hace, que
 * no queden salidas sueltas ni nodos a los que no se llega, y que cumpla las reglas de su tipo. `capacidades` son los ids que
 * existen en el registro (acciones, efectos y condiciones).
 *
 * Lo que le falta a un flujo para poder ejecutarse (una rama sin condición, un evento sin acción) sale como aviso: el dibujo está
 * completo, pero todavía no dice qué evaluar.
 */
export function verificarFlujo(contenido, capacidades, opciones = {}) {
    const problemas = [];
    const error = (mensaje, nodo) => problemas.push({ nivel: 'error', mensaje, nodo: nodo?.id });
    const { nodos, flechas } = contenido;
    const porId = new Map(nodos.map((n) => [n.id, n]));
    if (!nodos.some((n) => n.type === 'evento' && n.data.variante === 'inicio'))
        error('El flujo no tiene un inicio.');
    if (!nodos.some(esFin))
        error('El flujo no tiene un fin.');
    if (opciones.tipo === 'subflujo') {
        if (nodos.filter((n) => n.type === 'evento' && n.data.variante === 'inicio').length > 1)
            error('Un subflujo tiene un solo inicio.');
        const fines = nodos.filter(esFin).map((n) => n.data.nombre.trim());
        const repetidos = [...new Set(fines.filter((nombre, i) => nombre && fines.indexOf(nombre) !== i))];
        for (const nombre of repetidos)
            error(`Hay más de un fin llamado «${nombre}». En un subflujo cada fin es una salida y necesita un nombre propio.`);
    }
    const sigue = new Map();
    const viene = new Map();
    const conectadas = new Set();
    for (const f of flechas) {
        if (!porId.has(f.source) || !porId.has(f.target)) {
            error('Hay una flecha que une un nodo que ya no existe.');
            continue;
        }
        sigue.set(f.source, [...(sigue.get(f.source) ?? []), f.target]);
        viene.set(f.target, [...(viene.get(f.target) ?? []), f.source]);
        conectadas.add(`${f.source}|${f.sourceHandle ?? ''}`);
    }
    const completos = new Set();
    for (const n of nodos) {
        const quien = rotuloDeNodo(n);
        if (!n.data.nombre.trim())
            error(`${tipoSinNombre(n)} no tiene nombre.`, n);
        if (n.type === 'funcion') {
            if (!n.data.capacidad)
                error(`${quien} no tiene elegido qué hace.`, n);
            else if (!capacidades.includes(n.data.capacidad))
                error(`${quien} usa «${n.data.capacidad}», que no existe en este sistema.`, n);
        }
        if (n.type === 'subflujo') {
            const contrato = opciones.subflujos?.find((x) => x.id === n.data.flujo);
            const version = contrato?.versiones.find((v) => v.version === n.data.version);
            if (!n.data.flujo)
                error(`${quien} no tiene elegido qué flujo usa.`, n);
            else if (n.data.flujo === opciones.id)
                error(`${quien} usa este mismo flujo: un flujo no se puede usar a sí mismo.`, n);
            else if (opciones.subflujos && !contrato)
                error(`${quien} usa un flujo que no existe o que todavía no se publicó.`, n);
            else if (contrato && !version)
                error(`${quien} usa la versión ${n.data.version} de «${contrato.nombre}», que no existe.`, n);
            else if (version && version.salidas.map((x) => x.id).join() !== n.data.salidas.map((x) => x.id).join()) {
                error(`${quien}: sus salidas no coinciden con las de la versión ${version.version} de «${contrato.nombre}». Volvé a elegir la versión.`, n);
            }
        }
        if (opciones.tipo === 'subflujo' && n.type === 'evento' && (n.data.variante === 'espera' || n.data.variante === 'interrupcion')) {
            error(`${quien}: un subflujo corre de punta a punta y no puede esperar.`, n);
        }
        if (n.type === 'decision' && n.data.ramas.length === 0)
            problemas.push({ nivel: 'aviso', mensaje: `${quien} no tiene ramas: siempre sale por «si no».`, nodo: n.id });
        const aviso = (mensaje) => problemas.push({ nivel: 'aviso', mensaje, nodo: n.id });
        if (n.type === 'decision') {
            for (const rama of n.data.ramas) {
                const usadas = condicionesDe(rama.condicion);
                if (!rama.condicion)
                    aviso(`${quien}: la rama «${rama.nombre}» no tiene una condición: todavía no se puede ejecutar.`);
                for (const id of usadas)
                    if (!capacidades.includes(id))
                        error(`${quien}: la rama «${rama.nombre}» usa la condición «${id}», que no existe en este sistema.`, n);
            }
        }
        if (n.type === 'evento') {
            const acciones = n.data.variante === 'espera' ? (n.data.eventos ?? []).map((e) => [e.nombre, e.accion]) : n.data.variante === 'fin' ? [] : [[n.data.nombre, n.data.accion]];
            for (const [nombre, accion] of acciones) {
                if (accion && !capacidades.includes(accion))
                    error(`${quien}: «${nombre}» usa la acción «${accion}», que no existe en este sistema.`, n);
            }
        }
        const salidas = salidasDe(n);
        const sueltas = salidas.filter((s) => !conectadas.has(`${n.id}|${s.id}`) && !(salidas.length === 1 && conectadas.has(`${n.id}|`)));
        for (const s of sueltas)
            error(s.nombre ? `${quien}: la salida «${s.nombre}» no está conectada.` : `${quien} no tiene a dónde seguir.`, n);
        if (sueltas.length === 0)
            completos.add(n.id);
    }
    // De una espera también se sale por cualquier interrupción que aplique en ella: cuenta para saber si se llega a un fin.
    const interrupciones = nodos.filter((n) => n.type === 'evento' && n.data.variante === 'interrupcion');
    for (const n of nodos) {
        if (n.type !== 'evento' || n.data.variante !== 'espera')
            continue;
        for (const i of interrupciones) {
            if (i.type !== 'evento' || i.data.lateral || i.data.excepto?.includes(n.id))
                continue;
            viene.set(i.id, [...(viene.get(i.id) ?? []), n.id]);
        }
    }
    const desdeLasEntradas = alcanzables(nodos.filter(esEntrada).map((n) => n.id), sigue);
    const hastaUnFin = alcanzables(nodos.filter(esFin).map((n) => n.id), viene);
    for (const n of nodos) {
        if (!desdeLasEntradas.has(n.id))
            error(`A ${rotuloDeNodo(n)} no se llega desde ningún inicio.`, n);
        // Si le falta conectar una salida, ya se avisó: no se repite con otro mensaje.
        else if (completos.has(n.id) && !hastaUnFin.has(n.id) && nodos.some(esFin))
            error(`Desde ${rotuloDeNodo(n)} no se llega a ningún fin.`, n);
    }
    return problemas;
}
function tipoSinNombre(n) {
    const [tipo] = rotuloDeNodo(n).split(' «');
    return `Un nodo de tipo ${tipo}`;
}
/** Los ids de las condiciones del registro que usa un árbol de condición, sea una sola o una combinación. */
export function condicionesDe(condicion) {
    if (Array.isArray(condicion))
        return condicion.flatMap(condicionesDe);
    if (typeof condicion !== 'object' || condicion === null)
        return [];
    const c = condicion;
    if (typeof c['condicion'] === 'string')
        return [c['condicion']];
    return ['todas', 'alguna', 'no', 'si', 'entonces'].flatMap((clave) => condicionesDe(c[clave]));
}
