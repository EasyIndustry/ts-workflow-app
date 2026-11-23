import { validarContenido } from '../modelo/flujo.js';
import { GUIA } from './guia.js';
const objeto = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const texto = (v, nombre) => {
    if (typeof v !== 'string' || !v.trim())
        throw new Error(`Falta «${nombre}».`);
    return v.trim();
};
/**
 * Lo que un agente puede hacer con los flujos: leer, crear y guardar borradores, y verificar. **No hay herramienta para publicar**:
 * publicar es una decisión de una persona, y el servidor además se lo niega a la credencial de un agente.
 */
export const HERRAMIENTAS = [
    { name: 'guia', description: 'Cómo armar un flujo: los tipos de nodo, la forma del contenido y las reglas. Leela antes de crear o cambiar uno.', inputSchema: objeto(), hacer: async () => GUIA },
    {
        name: 'capacidades_listar',
        description: 'Lo que una función puede hacer en este sistema, con el schema de sus parámetros. `buscar` filtra por texto en el id, el nombre o la descripción.',
        inputSchema: objeto({ buscar: { type: 'string' } }),
        hacer: async (sistema, args) => {
            const todas = await sistema.capacidades();
            const buscar = typeof args['buscar'] === 'string' ? args['buscar'].toLowerCase() : '';
            return buscar ? todas.filter((c) => `${c.id} ${c.nombre} ${c.descripcion ?? ''}`.toLowerCase().includes(buscar)) : todas;
        },
    },
    { name: 'flujos_listar', description: 'Los flujos que hay: nombre, tipo, versión vigente, si tienen cambios sin publicar y quién los usa.', inputSchema: objeto(), hacer: (sistema) => sistema.listar() },
    {
        name: 'flujo_abrir',
        description: 'Un flujo con su contenido (el borrador si lo hay; si no, la versión vigente) y, aparte, lo publicado.',
        inputSchema: objeto({ id: { type: 'string' } }, ['id']),
        hacer: (sistema, args) => sistema.abrir(texto(args['id'], 'id')),
    },
    { name: 'subflujos_listar', description: 'Los subflujos publicados que se pueden usar en un nodo de subflujo, con sus versiones y las salidas de cada una.', inputSchema: objeto(), hacer: (sistema) => sistema.subflujos() },
    {
        name: 'flujo_crear',
        description: 'Crea un flujo vacío (con su inicio) y devuelve su id. `tipo` es «maestro» (arranca solo, puede esperar) o «subflujo» (lo llama otro flujo).',
        inputSchema: objeto({ nombre: { type: 'string' }, tipo: { type: 'string', enum: ['maestro', 'subflujo'] } }, ['nombre', 'tipo']),
        hacer: (sistema, args) => {
            const tipo = args['tipo'];
            if (tipo !== 'maestro' && tipo !== 'subflujo')
                throw new Error('«tipo» tiene que ser «maestro» o «subflujo».');
            return sistema.crear(texto(args['nombre'], 'nombre'), tipo);
        },
    },
    {
        name: 'flujo_guardar_borrador',
        description: 'Guarda el contenido completo como borrador del flujo (reemplaza el borrador anterior; no toca lo publicado) y devuelve los problemas que encontró la verificación. Las posiciones son opcionales.',
        inputSchema: objeto({ id: { type: 'string' }, contenido: { type: 'object', properties: { nodos: { type: 'array' }, flechas: { type: 'array' } }, required: ['nodos', 'flechas'] } }, ['id', 'contenido']),
        hacer: async (sistema, args) => {
            const id = texto(args['id'], 'id');
            // Se revisa la forma acá también, para que el error le llegue al agente con el detalle y sin hacer el pedido.
            await sistema.guardarBorrador(id, validarContenido(args['contenido']));
            const problemas = await sistema.verificar(id);
            return { guardado: true, listoParaPublicar: !problemas.some((p) => p.nivel === 'error'), problemas };
        },
    },
    {
        name: 'flujo_verificar',
        description: 'Los problemas del borrador de un flujo. Los de nivel «error» impiden publicarlo; los de «aviso», no.',
        inputSchema: objeto({ id: { type: 'string' } }, ['id']),
        hacer: async (sistema, args) => ({ problemas: await sistema.verificar(texto(args['id'], 'id')) }),
    },
];
/**
 * El servidor MCP, sin atarse a por dónde llegan los mensajes: recibe uno (JSON-RPC) y devuelve la respuesta, o `null` si era un
 * aviso que no se contesta.
 */
export function crearServidorMcp(sistema, version) {
    return async function responder(mensaje) {
        const { id, method, params = {} } = mensaje;
        if (id === undefined || id === null)
            return null;
        const resultado = (result) => ({ jsonrpc: '2.0', id, result });
        switch (method) {
            case 'initialize':
                return resultado({
                    protocolVersion: typeof params['protocolVersion'] === 'string' ? params['protocolVersion'] : '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'ts-workflow-app', version },
                    instructions: 'Herramientas para leer flujos y armar borradores. Empezá por `guia`. Publicar es siempre de una persona.',
                });
            case 'ping':
                return resultado({});
            case 'tools/list':
                return resultado({ tools: HERRAMIENTAS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
            case 'tools/call': {
                const herramienta = HERRAMIENTAS.find((h) => h.name === params['name']);
                if (!herramienta)
                    return { jsonrpc: '2.0', id, error: { code: -32602, message: `No existe la herramienta «${String(params['name'])}».` } };
                try {
                    const salida = await herramienta.hacer(sistema, (params['arguments'] ?? {}));
                    return resultado({ content: [{ type: 'text', text: typeof salida === 'string' ? salida : JSON.stringify(salida, null, 2) }] });
                }
                catch (e) {
                    // Un error de la herramienta se le devuelve al agente como resultado, para que pueda corregir y reintentar.
                    return resultado({ content: [{ type: 'text', text: e instanceof Error ? e.message : String(e) }], isError: true });
                }
            }
            default:
                return { jsonrpc: '2.0', id, error: { code: -32601, message: `No se conoce el método «${String(method)}».` } };
        }
    };
}
