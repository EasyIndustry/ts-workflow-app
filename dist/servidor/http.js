import { definicionDeFlujo } from '../modelo/definicion.js';
import { ErrorDeContenido, ErrorNoExiste, validarContenido } from '../modelo/flujo.js';
import { verificarFlujo } from '../modelo/verificar.js';
const bien = (cuerpo, estado = 200) => ({ estado, cuerpo });
const mal = (estado, error, extra = {}) => ({ estado, cuerpo: { error, ...extra } });
const esObjeto = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
/** Lo que está mal en el borrador de un flujo, revisado contra las capacidades y los subflujos de este sistema. */
async function problemasDe(id, opciones) {
    const [flujo, subflujos, capacidades] = await Promise.all([opciones.almacen.abrir(id), opciones.almacen.subflujos(), opciones.capacidades()]);
    return verificarFlujo(flujo.contenido, capacidades.map((c) => c.id), { id, tipo: flujo.tipo, subflujos: subflujos.filter((s) => s.id !== id) });
}
/**
 * La definición de `ts-workflow-core` de un flujo: su contenido actual (el borrador si lo hay) traducido, con los subflujos que usa
 * abiertos en su lugar. Es lo que un sistema le pasa a su motor para que valide con este flujo. El número de versión es el que
 * tendría al publicarse.
 */
export async function definicionDe(almacen, id) {
    const flujo = await almacen.abrir(id);
    // Se traen primero todos los subflujos que hacen falta, también los que usan otros subflujos: traducir no espera a nadie.
    const subflujos = new Map();
    const pendientes = [flujo.contenido];
    for (let contenido = pendientes.pop(); contenido; contenido = pendientes.pop()) {
        for (const n of contenido.nodos) {
            const clave = n.type === 'subflujo' ? `${n.data.flujo}@${n.data.version}` : '';
            if (n.type !== 'subflujo' || !n.data.flujo || subflujos.has(clave))
                continue;
            const adentro = await almacen.contenidoDeVersion(n.data.flujo, n.data.version).catch(() => undefined);
            if (!adentro)
                continue;
            subflujos.set(clave, adentro);
            pendientes.push(adentro);
        }
    }
    return definicionDeFlujo(flujo.contenido, { id, nombre: flujo.nombre, version: (flujo.version ?? 0) + (flujo.conBorrador ? 1 : 0), subflujo: (s, v) => subflujos.get(`${s}@${v}`) });
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
 * | `GET /flujos/:id/definicion` | El flujo traducido a una definición de `ts-workflow-core`, o por qué no se puede. |
 * | `GET /flujos/:id/versiones/:n` | El contenido de una versión publicada. |
 * | `POST /flujos/:id/publicar` | Publica el borrador si no tiene errores: `{ version, avisos? }`. Si no se puede, `{ error, problemas? }`. |
 * | `GET /subflujos` | Los subflujos publicados, con sus salidas. |
 * | `GET /capacidades` | Lo que una función puede hacer en este sistema. |
 */
export async function atender(pedido, opciones) {
    const partes = pedido.ruta.split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
    const metodo = pedido.metodo.toUpperCase();
    const es = (m, ...forma) => metodo === m && partes.length === forma.length && forma.every((f, i) => f === null || f === partes[i]);
    const id = partes[1] ?? '';
    const cuerpo = esObjeto(pedido.cuerpo) ? pedido.cuerpo : {};
    try {
        if (es('GET', 'flujos'))
            return bien(await opciones.almacen.listar());
        if (es('GET', 'subflujos'))
            return bien(await opciones.almacen.subflujos());
        if (es('GET', 'capacidades'))
            return bien(await opciones.capacidades());
        if (es('GET', 'flujos', null))
            return bien(await opciones.almacen.abrir(id));
        if (es('GET', 'flujos', null, 'verificacion'))
            return bien({ problemas: await problemasDe(id, opciones) });
        if (es('GET', 'flujos', null, 'definicion'))
            return bien(await definicionDe(opciones.almacen, id));
        if (es('GET', 'flujos', null, 'versiones', null))
            return bien(await opciones.almacen.contenidoDeVersion(id, Number(partes[3])));
        if (es('POST', 'flujos')) {
            if (!opciones.puedeEditar)
                return mal(403, 'No tenés permiso para crear flujos.');
            const nombre = typeof cuerpo['nombre'] === 'string' ? cuerpo['nombre'].trim() : '';
            const tipo = cuerpo['tipo'] ?? 'maestro';
            if (!nombre)
                return mal(400, 'Falta el nombre del flujo.');
            if (tipo !== 'maestro' && tipo !== 'subflujo')
                return mal(400, 'El tipo tiene que ser «maestro» o «subflujo».');
            return bien(await opciones.almacen.crear(nombre, tipo), 201);
        }
        if (es('PUT', 'flujos', null, 'borrador')) {
            if (!opciones.puedeEditar)
                return mal(403, 'No tenés permiso para editar flujos.');
            await opciones.almacen.guardarBorrador(id, validarContenido(cuerpo['contenido']));
            return bien({ guardado: true });
        }
        if (es('POST', 'flujos', null, 'publicar')) {
            if (!opciones.puedePublicar)
                return mal(403, 'No tenés permiso para publicar flujos.');
            const problemas = await problemasDe(id, opciones);
            if (problemas.some((p) => p.nivel === 'error'))
                return mal(422, 'El flujo tiene problemas que impiden publicarlo.', { problemas });
            // Si el almacén del sistema tiene algo que avisar de la publicación, viaja en la respuesta y la ventana de publicar lo muestra.
            if (opciones.almacen.publicarConAvisos) {
                const { version, avisos = [] } = await opciones.almacen.publicarConAvisos(id);
                return bien({ version, ...(avisos.length > 0 && { avisos }) });
            }
            return bien({ version: await opciones.almacen.publicar(id) });
        }
        return mal(404, 'No existe esa ruta.');
    }
    catch (e) {
        if (e instanceof ErrorNoExiste)
            return mal(404, e.message);
        if (e instanceof ErrorDeContenido)
            return mal(400, e.message);
        if (e instanceof Error && e.message === 'No hay cambios para publicar.')
            return mal(409, e.message);
        throw e;
    }
}
