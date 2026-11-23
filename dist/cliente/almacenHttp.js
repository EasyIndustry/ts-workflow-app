/** El servidor respondió que no. `estado` es el código y `problemas`, lo que impidió publicar, si fue eso. */
export class ErrorDelServidor extends Error {
    estado;
    problemas;
    constructor(mensaje, estado, problemas) {
        super(mensaje);
        this.estado = estado;
        this.problemas = problemas;
        this.name = 'ErrorDelServidor';
    }
}
/** El almacén de flujos hablando con el servidor de la app. Suma lo que el servidor sabe y el almacén no: capacidades y verificación. */
export function crearAlmacenHttp(opciones) {
    const base = opciones.urlBase.replace(/\/+$/, '');
    async function pedir(metodo, ruta, cuerpo) {
        const respuesta = await (opciones.fetch ?? fetch)(base + ruta, {
            method: metodo,
            headers: { accept: 'application/json', ...(cuerpo !== undefined && { 'content-type': 'application/json' }), ...(await opciones.encabezados?.()) },
            ...(cuerpo !== undefined && { body: JSON.stringify(cuerpo) }),
        });
        const datos = await respuesta.json().catch(() => null);
        if (!respuesta.ok) {
            const d = (datos ?? {});
            const mensaje = typeof d.error === 'string' ? d.error : typeof d.message === 'string' ? d.message : `El servidor respondió ${respuesta.status}.`;
            throw new ErrorDelServidor(mensaje, respuesta.status, d.problemas);
        }
        return datos;
    }
    const de = (id) => `/flujos/${encodeURIComponent(id)}`;
    return {
        listar: () => pedir('GET', '/flujos'),
        crear: (nombre, tipo) => pedir('POST', '/flujos', { nombre, tipo }),
        abrir: (id) => pedir('GET', de(id)),
        guardarBorrador: async (id, contenido) => void (await pedir('PUT', `${de(id)}/borrador`, { contenido })),
        publicar: async (id) => (await pedir('POST', `${de(id)}/publicar`)).version,
        subflujos: () => pedir('GET', '/subflujos'),
        capacidades: () => pedir('GET', '/capacidades'),
        verificar: async (id) => (await pedir('GET', `${de(id)}/verificacion`)).problemas,
    };
}
