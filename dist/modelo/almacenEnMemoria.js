import { contenidoDe, contenidoInicial, ErrorNoExiste, resumenDeContenido, salidasDeContenido } from './flujo.js';
/**
 * Un almacén que vive en la memoria: para las stories y las pruebas. Se pierde al recargar. `ahora` es el reloj, para poder
 * probarlo.
 */
export function crearAlmacenEnMemoria(iniciales = [], ahora = () => new Date().toISOString()) {
    const flujos = new Map(iniciales.map((f) => {
        const contenido = contenidoDe(f.contenido.nodos, f.contenido.flechas);
        const base = { id: f.id, nombre: f.nombre, tipo: f.tipo ?? 'maestro', editadoEl: f.editadoEl, publicadoEl: f.publicadoEl };
        return [f.id, f.version ? { ...base, versiones: new Map([[f.version, contenido]]) } : { ...base, versiones: new Map(), borrador: contenido }];
    }));
    const version = (f) => (f.versiones.size ? Math.max(...f.versiones.keys()) : undefined);
    const vigente = (f) => f.versiones.get(version(f) ?? 0);
    const resumen = (f) => {
        const { inicios, nodos } = resumenDeContenido(f.borrador ?? vigente(f));
        return {
            id: f.id,
            nombre: f.nombre,
            tipo: f.tipo,
            version: version(f),
            conBorrador: Boolean(f.borrador),
            inicios,
            nodos,
            usadoPor: [...flujos.values()].filter((otro) => resumenDeContenido(otro.borrador ?? vigente(otro)).usa.includes(f.id)).map((otro) => otro.nombre),
            editadoEl: f.editadoEl,
            publicadoEl: f.publicadoEl,
        };
    };
    const buscar = (id) => {
        const f = flujos.get(id);
        if (!f)
            throw new ErrorNoExiste(id);
        return f;
    };
    let creados = 0;
    return {
        listar: async () => [...flujos.values()].map(resumen),
        crear: async (nombre, tipo) => {
            const id = `flujo-${++creados}`;
            const f = { id, nombre, tipo, versiones: new Map(), editadoEl: ahora(), borrador: contenidoInicial(tipo) };
            flujos.set(id, f);
            return resumen(f);
        },
        abrir: async (id) => {
            const f = buscar(id);
            return { ...resumen(f), contenido: f.borrador ?? vigente(f) ?? { nodos: [], flechas: [] }, publicado: vigente(f) };
        },
        guardarBorrador: async (id, contenido) => {
            const f = buscar(id);
            f.borrador = contenido;
            f.editadoEl = ahora();
        },
        publicar: async (id) => {
            const f = buscar(id);
            if (!f.borrador)
                throw new Error('No hay cambios para publicar.');
            const nueva = (version(f) ?? 0) + 1;
            f.versiones.set(nueva, f.borrador);
            f.borrador = undefined;
            f.publicadoEl = ahora();
            return nueva;
        },
        subflujos: async () => [...flujos.values()]
            .filter((f) => f.tipo === 'subflujo' && f.versiones.size > 0)
            .map((f) => ({ id: f.id, nombre: f.nombre, versiones: [...f.versiones].sort(([a], [b]) => a - b).map(([v, c]) => ({ version: v, salidas: salidasDeContenido(c) })) })),
    };
}
