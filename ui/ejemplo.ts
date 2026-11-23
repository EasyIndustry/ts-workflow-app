import type { Edge } from '@xyflow/react'
import type { Capacidad } from './editor/contexto'
import type { NodoDeFlujo } from './nodos'
import type { RegistroDePrueba } from './prueba/PanelDePrueba'
import type { Ejecutor } from './prueba/recorrido'

/** Un flujo genérico para las stories. No es el flujo de nadie. */
export const CAPACIDADES_DE_EJEMPLO: Capacidad[] = [
  {
    id: 'avisos.enviar',
    nombre: 'Enviar un aviso',
    descripcion: 'Le avisa a una persona o a un grupo.',
    schemaEntrada: {
      type: 'object',
      required: ['para', 'mensaje'],
      properties: { para: { type: 'string', title: 'Para quién' }, mensaje: { type: 'string', title: 'Mensaje' }, urgente: { type: 'boolean', title: 'Urgente' } },
    },
  },
  {
    id: 'registros.actualizar',
    nombre: 'Actualizar un registro',
    descripcion: 'Cambia campos de un registro.',
    schemaEntrada: { type: 'object', required: ['campos'], properties: { campos: { type: 'object', title: 'Campos', properties: { estado: { type: 'string', enum: ['nuevo', 'en curso', 'cerrado'] }, nota: { type: 'string' } } } } },
  },
  { id: 'tareas.crear', nombre: 'Crear una tarea', descripcion: 'Deja una tarea pendiente para alguien.', schemaEntrada: { type: 'object', properties: { titulo: { type: 'string', title: 'Título' }, dias: { type: 'integer', title: 'Plazo en días' } } } },
  { id: 'documentos.generar', nombre: 'Generar un documento', tipo: 'efecto', descripcion: 'Arma un documento a partir de una plantilla.' },
  { id: 'pedidos.cargar', nombre: 'Cargar un pedido', descripcion: 'Una persona carga un pedido nuevo.' },
  { id: 'pedidos.cerrar', nombre: 'Cerrar el pedido', descripcion: 'Una persona da por terminado el pedido.' },
  {
    id: 'total.mayor-que',
    nombre: 'El total es mayor que',
    tipo: 'condicion',
    schemaEntrada: { type: 'object', required: ['monto'], properties: { monto: { type: 'number', title: 'Monto' } } },
  },
  { id: 'datos.completos', nombre: 'Tiene todos los datos', tipo: 'condicion' },
]

export const NODOS_DE_EJEMPLO: NodoDeFlujo[] = [
  { id: 'inicio', type: 'evento', position: { x: 60, y: 0 }, data: { variante: 'inicio', nombre: 'Llegó un pedido', accion: 'pedidos.cargar' } },
  { id: 'aviso', type: 'funcion', position: { x: 37, y: 120 }, data: { nombre: 'Avisar al responsable', capacidad: 'avisos.enviar' } },
  { id: 'total', type: 'decision', position: { x: 20, y: 250 }, data: { nombre: '¿Cuánto es el total?', ramas: [{ id: 'alto', nombre: 'más de 1000', condicion: { condicion: 'total.mayor-que', params: { monto: 1000 } } }] } },
  { id: 'tarea', type: 'funcion', position: { x: -120, y: 450 }, data: { nombre: 'Pedir una revisión' } },
  { id: 'fin', type: 'evento', position: { x: 200, y: 460 }, data: { variante: 'fin', nombre: 'Cerrado' } },
]

const flecha = (source: string, target: string, sourceHandle = 'salida'): Edge => ({ id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle })

export const FLECHAS_DE_EJEMPLO: Edge[] = [flecha('inicio', 'aviso'), flecha('aviso', 'total'), flecha('total', 'tarea', 'alto'), flecha('total', 'fin', 'sino'), flecha('tarea', 'fin')]

export const REGISTROS_DE_EJEMPLO: RegistroDePrueba[] = [
  { id: '1', titulo: 'Pedido 1 · total 250', datos: { id: 1, cliente: 'Ana', total: 250 } },
  { id: '2', titulo: 'Pedido 2 · total 4800', datos: { id: 2, cliente: 'Luis', total: 4800 } },
]

/**
 * Un ejecutor de mentira, para probar el panel sin servidor. Las funciones «hacen» lo suyo si tienen elegida una capacidad, y si no
 * fallan. Una decisión sale por su primera rama cuando el total de la entrada pasa de 1000, y si no por «si no».
 */
export const EJECUTOR_DE_EJEMPLO: Ejecutor = async (nodo, { entrada }) => {
  await new Promise((listo) => setTimeout(listo, 350))
  if (nodo.type === 'funcion') {
    if (!nodo.data.capacidad) throw new Error('no tiene elegido qué hace.')
    return { datos: { capacidad: nodo.data.capacidad, hecho: true } }
  }
  if (nodo.type === 'decision') {
    const total = Number((entrada as { total?: unknown } | null)?.total ?? 0)
    return { salida: total > 1000 ? nodo.data.ramas[0]?.id : 'sino', datos: { total } }
  }
  return {}
}

/** Un subflujo de ejemplo: revisa un pedido y termina aprobado o rechazado. */
export const SUBFLUJO_DE_EJEMPLO = {
  nodos: [
    { id: 'inicio', type: 'evento', position: { x: 60, y: 0 }, data: { variante: 'inicio', nombre: 'Al ser llamado' } },
    { id: 'tiene', type: 'decision', position: { x: 20, y: 110 }, data: { nombre: '¿Tiene todos los datos?', ramas: [{ id: 'si', nombre: 'sí', condicion: { condicion: 'datos.completos' } }] } },
    { id: 'aprobado', type: 'evento', position: { x: -80, y: 320 }, data: { variante: 'fin', nombre: 'aprobado' } },
    { id: 'rechazado', type: 'evento', position: { x: 200, y: 320 }, data: { variante: 'fin', nombre: 'rechazado' } },
  ] as NodoDeFlujo[],
  flechas: [flecha('inicio', 'tiene'), flecha('tiene', 'aprobado', 'si'), flecha('tiene', 'rechazado', 'sino')],
}
