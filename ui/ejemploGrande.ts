import type { Edge } from '@xyflow/react'
import { acomodarEnCapas, type Capacidad, type ContratoDeSubflujo } from './flujos/almacen'
import type { NodoDeFlujo } from './nodos'

/**
 * Un flujo grande y genérico para probar cómo se lee y cómo se acomoda: el ciclo de un pedido con muchos estados. Tiene una
 * decisión de quince ramas, otra de cinco, subflujos de requisitos, rechazos, interrupciones que desvían y otras que no. No es el
 * flujo de nadie.
 */

const ESTADOS = [
  ['pendiente', 'Pendiente de revisión'],
  ['presupuestado', 'Presupuestado'],
  ['aprobado', 'Presupuesto aprobado'],
  ['diagnostico', 'En diagnóstico'],
  ['espera-contacto', 'Esperando al cliente'],
  ['espera-documentos', 'Esperando documentación'],
  ['espera-prueba', 'Esperando una prueba'],
  ['espera-control', 'Esperando el control'],
  ['espera-retiro', 'Esperando el retiro'],
  ['espera-presupuesto', 'A la espera de presupuesto'],
  ['espera-disponibilidad', 'En espera de disponibilidad'],
  ['cerrado', 'Cerrado'],
  ['cerrado-sin', 'Cerrado sin servicio'],
  ['cerrado-fuera', 'Cerrado fuera de plazo'],
] as const
const ESPERAS_ELEGIBLES = ['espera-contacto', 'espera-documentos', 'espera-prueba', 'espera-control', 'espera-retiro'] as const
const CERRADOS = ['cerrado', 'cerrado-sin', 'cerrado-fuera']
const nombreDe = (id: string) => ESTADOS.find(([e]) => e === id)![1]

/** Un nodo todavía sin lugar. Se reparte por cada tipo de nodo, para no perder cuál es cuál. */
type SinLugar<N = NodoDeFlujo> = N extends NodoDeFlujo ? Omit<N, 'position'> : never

const nodos: SinLugar[] = []
const flechas: Edge[] = []
const unir = (source: string, target: string, sourceHandle = 'salida') => flechas.push({ id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle })
const estaEn = (estado: string) => ({ condicion: 'campo.es', params: { campo: 'estado', valor: estado } })

nodos.push({ id: 'inicio', type: 'evento', data: { variante: 'inicio', nombre: 'Se carga un pedido', accion: 'pedidos.cargar' } })
nodos.push({ id: 'borrador', type: 'evento', data: { variante: 'espera', nombre: 'Borrador', eventos: [{ id: 'alta', nombre: 'Dar de alta', accion: 'pedidos.dar-de-alta' }] } })
unir('inicio', 'borrador')

// Los estados: cada uno es una espera. De los cerrados se puede reabrir; de dos se puede pasar a esperar el presupuesto.
for (const [id, nombre] of ESTADOS) {
  const eventos = CERRADOS.includes(id)
    ? [{ id: 'reabrir', nombre: 'Re-abrir', accion: 'pedidos.reabrir' }]
    : id === 'presupuestado' || id === 'aprobado'
      ? [{ id: 'esperar', nombre: 'Esperar el presupuesto', accion: 'pedidos.esperar-presupuesto' }]
      : id === 'espera-disponibilidad'
        ? [{ id: 'retomar', nombre: 'Retomar', accion: 'pedidos.retomar' }]
        : []
  nodos.push({ id, type: 'evento', data: { variante: 'espera', nombre, eventos } })
}
nodos.push({ id: 'otro', type: 'evento', data: { variante: 'espera', nombre: 'Otro estado', eventos: [] } })
nodos.push({ id: 'anulado', type: 'evento', data: { variante: 'fin', nombre: 'Anulado' } })
nodos.push({ id: 'sigue', type: 'evento', data: { variante: 'fin', nombre: 'Sigue donde estaba' } })
nodos.push({ id: 'no-se-puede', type: 'evento', data: { variante: 'fin', nombre: 'No se puede: falta algo', rechazo: true } })

// Al dar de alta: una decisión con una rama por estado.
const alAlta = [['anulado', 'Anulado'] as const, ...ESTADOS]
nodos.push({ id: 'estado-al-alta', type: 'decision', data: { nombre: '¿En qué estado estaba cargado?', ramas: alAlta.map(([id, nombre]) => ({ id: `es-${id}`, nombre: `El campo «estado» es ${nombre}`, condicion: estaEn(id) })) } })
unir('borrador', 'estado-al-alta', 'alta')
for (const [id] of alAlta) unir('estado-al-alta', id, `es-${id}`)
unir('estado-al-alta', 'otro', 'sino')

// Reabrir, desde cualquiera de los cerrados: según tenga garantía, vuelve a un lugar o a otro.
nodos.push({ id: 'garantia', type: 'decision', data: { nombre: '¿Tiene garantía?', ramas: [{ id: 'si', nombre: 'sí', condicion: { condicion: 'pedido.en-garantia' } }] } })
for (const id of CERRADOS) unir(id, 'garantia', 'reabrir')
unir('garantia', 'espera-contacto', 'si')
unir('garantia', 'pendiente', 'sino')
unir('presupuestado', 'espera-presupuesto', 'esperar')
unir('aprobado', 'espera-presupuesto', 'esperar')
nodos.push({ id: 'cambiar', type: 'funcion', data: { nombre: 'Cambiar el estado en otro flujo', capacidad: 'cambiar-estado' } })
unir('espera-disponibilidad', 'cambiar', 'retomar')
unir('cambiar', 'cerrado-sin')

// Qué espera se eligió: una decisión con cinco ramas, a la que llegan dos caminos.
nodos.push({ id: 'espera-elegida', type: 'decision', data: { nombre: '¿Qué espera se eligió?', ramas: ESPERAS_ELEGIBLES.slice(1).map((id) => ({ id: `a-${id}`, nombre: nombreDe(id), condicion: { condicion: 'entrada.es', params: { campo: 'espera', valor: id } } })) } })
for (const id of ESPERAS_ELEGIBLES.slice(1)) unir('espera-elegida', id, `a-${id}`)
unir('espera-elegida', 'espera-contacto', 'sino')

/** Una interrupción: `requisitos` le pone adelante un subflujo que puede terminar en un rechazo. */
function interrupcion(id: string, nombre: string, hacia: string, opciones: { requisitos?: boolean; lateral?: boolean; excepto?: string[] } = {}) {
  nodos.push({ id, type: 'evento', data: { variante: 'interrupcion', nombre, accion: `pedidos.${id}`, ...(opciones.excepto && { excepto: opciones.excepto }), ...(opciones.lateral && { lateral: true }) } })
  if (!opciones.requisitos) return unir(id, hacia)
  const sub = `${id}-requisitos`
  nodos.push({ id: sub, type: 'subflujo', data: { nombre: '¿Cumple lo que se pide?', flujo: 'requisitos', version: 1, salidas: [{ id: 'cumple', nombre: 'cumple' }, { id: 'no-cumple', nombre: 'no cumple' }] } })
  unir(id, sub)
  unir(sub, hacia, 'cumple')
  unir(sub, 'no-se-puede', 'no-cumple')
}
const NO_ABIERTO = ['borrador', ...CERRADOS]
interrupcion('a-pendiente', 'Pasar a pendiente', 'pendiente', { excepto: ['borrador', 'pendiente'] })
interrupcion('a-presupuestado', 'Presupuestar', 'presupuestado', { excepto: ['borrador', 'presupuestado'] })
interrupcion('a-aprobado', 'Aprobar el presupuesto', 'aprobado', { excepto: ['borrador', 'aprobado'] })
interrupcion('a-diagnostico', 'Pasar a diagnóstico', 'diagnostico', { excepto: ['borrador', 'diagnostico'] })
interrupcion('poner-en-espera', 'Poner en espera', 'espera-elegida', { requisitos: true, excepto: NO_ABIERTO })
interrupcion('pasar-a-garantia', 'Pasar a garantía', 'espera-elegida', { requisitos: true, excepto: NO_ABIERTO })
interrupcion('sacar-de-garantia', 'Sacar de garantía', 'pendiente', { requisitos: true, excepto: NO_ABIERTO })
interrupcion('esperar-disponibilidad', 'Esperar disponibilidad', 'espera-disponibilidad', { excepto: [...NO_ABIERTO, 'espera-disponibilidad'] })
interrupcion('cerrar', 'Cerrar', 'cerrado', { excepto: NO_ABIERTO })
interrupcion('cerrar-sin', 'Cerrar sin servicio', 'cerrado-sin', { excepto: NO_ABIERTO })
interrupcion('cerrar-fuera', 'Cerrar fuera de plazo', 'cerrado-fuera', { requisitos: true, excepto: NO_ABIERTO })
interrupcion('anular', 'Anular', 'anulado', { excepto: NO_ABIERTO })
// Las que no desvían el flujo: hacen lo suyo y el pedido sigue donde estaba.
interrupcion('comentar', 'Agregar un comentario', 'sigue', { lateral: true, excepto: ['borrador'] })
interrupcion('pedir-presupuesto', 'Pedir un presupuesto', 'sigue', { lateral: true, excepto: NO_ABIERTO })
interrupcion('cambiar-fecha', 'Cambiar la fecha de cierre', 'sigue', { lateral: true, excepto: ['borrador'] })
interrupcion('registrar-pago', 'Registrar un pago', 'sigue', { lateral: true, requisitos: true, excepto: ['borrador'] })
interrupcion('avisar-al-cliente', 'Avisar al cliente', 'sigue', { lateral: true, requisitos: true, excepto: ['borrador'] })
interrupcion('terminar-formulario', 'Terminar un formulario', 'sigue', { lateral: true, requisitos: true })

// Un primer acomodo simple, en capas. En la pantalla, «Acomodar» lo afina con las medidas reales.
const lugares = acomodarEnCapas(nodos.map((n) => ({ ...n, position: { x: 0, y: 0 } }) as NodoDeFlujo), flechas)

export const NODOS_GRANDES = nodos.map((n) => ({ ...n, position: lugares[n.id] ?? { x: 0, y: 0 } }) as NodoDeFlujo)
export const FLECHAS_GRANDES: Edge[] = flechas

export const SUBFLUJOS_GRANDES: ContratoDeSubflujo[] = [{ id: 'requisitos', nombre: 'Requisitos del pedido', versiones: [{ version: 1, salidas: [{ id: 'cumple', nombre: 'cumple' }, { id: 'no-cumple', nombre: 'no cumple' }] }] }]

/** Las capacidades que usa el flujo: una acción por evento, un efecto y las condiciones de las ramas. */
export const CAPACIDADES_GRANDES: Capacidad[] = [
  ...[...new Set(nodos.flatMap((n) => (n.type === 'evento' ? [n.data.accion, ...(n.data.eventos ?? []).map((e) => e.accion)] : [])).filter((a): a is string => Boolean(a)))].map((id) => ({ id, nombre: id.replace('pedidos.', '').replaceAll('-', ' '), grupo: 'Pedidos' })),
  { id: 'cambiar-estado', nombre: 'Cambiar el estado en otro flujo', tipo: 'efecto' },
  { id: 'campo.es', nombre: 'Un campo tiene un valor', tipo: 'condicion', schemaEntrada: { type: 'object', required: ['campo', 'valor'], properties: { campo: { type: 'string', title: 'Campo' }, valor: { type: 'string', title: 'Valor' } } } },
  { id: 'entrada.es', nombre: 'Lo que se cargó tiene un valor', tipo: 'condicion', schemaEntrada: { type: 'object', required: ['campo', 'valor'], properties: { campo: { type: 'string', title: 'Campo' }, valor: { type: 'string', title: 'Valor' } } } },
  { id: 'pedido.en-garantia', nombre: 'El pedido está en garantía', tipo: 'condicion' },
]
