import type { Edge } from '@xyflow/react'
import type { Capacidad } from './inspector/Inspector'
import type { NodoDeFlujo } from './nodos'

/** Un flujo genérico para las stories. No es el flujo de nadie. */
export const CAPACIDADES_DE_EJEMPLO: Capacidad[] = [
  { id: 'avisos.enviar', nombre: 'Enviar un aviso', descripcion: 'Le avisa a una persona o a un grupo.' },
  { id: 'registros.actualizar', nombre: 'Actualizar un registro', descripcion: 'Cambia campos de un registro.' },
  { id: 'tareas.crear', nombre: 'Crear una tarea', descripcion: 'Deja una tarea pendiente para alguien.' },
  { id: 'documentos.generar', nombre: 'Generar un documento', descripcion: 'Arma un documento a partir de una plantilla.' },
]

export const NODOS_DE_EJEMPLO: NodoDeFlujo[] = [
  { id: 'inicio', type: 'evento', position: { x: 60, y: 0 }, data: { variante: 'inicio', nombre: 'Llegó un pedido' } },
  { id: 'aviso', type: 'funcion', position: { x: 37, y: 120 }, data: { nombre: 'Avisar al responsable', capacidad: 'avisos.enviar' } },
  { id: 'total', type: 'decision', position: { x: 20, y: 250 }, data: { nombre: '¿Cuánto es el total?', ramas: [{ id: 'alto', nombre: 'más de 1000' }] } },
  { id: 'tarea', type: 'funcion', position: { x: -120, y: 450 }, data: { nombre: 'Pedir una revisión' } },
  { id: 'fin', type: 'evento', position: { x: 200, y: 460 }, data: { variante: 'fin', nombre: 'Cerrado' } },
]

const flecha = (source: string, target: string, sourceHandle = 'salida'): Edge => ({ id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle })

export const FLECHAS_DE_EJEMPLO: Edge[] = [flecha('inicio', 'aviso'), flecha('aviso', 'total'), flecha('total', 'tarea', 'alto'), flecha('total', 'fin', 'sino'), flecha('tarea', 'fin')]
