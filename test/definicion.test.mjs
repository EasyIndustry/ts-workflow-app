import assert from 'node:assert/strict'
import { test } from 'node:test'
import { definicionDeFlujo } from '../dist/servidor/index.js'

const ev = (id, variante, nombre, extra = {}) => ({ id, type: 'evento', position: { x: 0, y: 0 }, data: { variante, nombre, ...extra } })
const fn = (id, nombre, capacidad, params) => ({ id, type: 'funcion', position: { x: 0, y: 0 }, data: { nombre, capacidad, ...(params && { params }) } })
const dec = (id, nombre, ramas) => ({ id, type: 'decision', position: { x: 0, y: 0 }, data: { nombre, ramas } })
const f = (source, target, sourceHandle = 'salida') => ({ id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle, targetHandle: null })
const c = (condicion, params) => ({ condicion, ...(params && { params }) })
const rama = (condicion, id = 'si') => ({ id, nombre: 'sí', condicion })
const OPCIONES = { id: 'pedidos', version: 3, nombre: 'Pedidos' }

/** Los requisitos para revisar: tiene que estar pago y, si es urgente, además tiene que tener responsable. */
const REQUISITOS = {
  nodos: [
    ev('inicio', 'inicio', 'Al ser llamado'),
    dec('pago', '¿Está pago?', [rama(c('pedido.pago'))]),
    dec('urgente', '¿Es urgente?', [rama(c('pedido.urgente'))]),
    dec('responsable', '¿Tiene responsable?', [rama(c('pedido.tiene', { campo: 'responsable' }))]),
    ev('cumple', 'fin', 'cumple'),
    ev('no-cumple', 'fin', 'no cumple'),
  ],
  flechas: [f('inicio', 'pago'), f('pago', 'urgente', 'si'), f('pago', 'no-cumple', 'sino'), f('urgente', 'responsable', 'si'), f('urgente', 'cumple', 'sino'), f('responsable', 'cumple', 'si'), f('responsable', 'no-cumple', 'sino')],
}

const MAESTRO = {
  nodos: [
    ev('inicio', 'inicio', 'Se carga un pedido'),
    ev('nuevo', 'espera', 'Nuevo', { eventos: [{ id: 'revisar', nombre: 'Revisar', accion: 'pedidos.revisar' }] }),
    { id: 'requisitos', type: 'subflujo', position: { x: 0, y: 0 }, data: { nombre: '¿Cumple?', flujo: 'requisitos', version: 2, salidas: [{ id: 'cumple', nombre: 'cumple' }, { id: 'no-cumple', nombre: 'no cumple' }] } },
    ev('falta', 'fin', 'Falta algo para revisarlo', { rechazo: true }),
    fn('avisar', 'Avisar', 'avisos.enviar', { para: 'ventas' }),
    ev('revisado', 'espera', 'Revisado', { eventos: [{ id: 'cerrar', nombre: 'Cerrar', accion: 'pedidos.cerrar' }] }),
    dec('monto', '¿Es grande?', [rama(c('total.mayor-que', { monto: 1000 }), 'grande')]),
    fn('auditar', 'Pedir auditoría', 'tareas.crear'),
    ev('auditado', 'fin', 'Cerrado con auditoría'),
    ev('cerrado', 'fin', 'Cerrado'),
    ev('anular', 'interrupcion', 'Anular', { accion: 'pedidos.anular', excepto: ['revisado'] }),
    ev('anulado', 'fin', 'Anulado'),
    ev('comentar', 'interrupcion', 'Comentar', { accion: 'pedidos.comentar', lateral: true }),
    fn('notificar', 'Notificar', 'avisos.enviar'),
    ev('sigue', 'fin', 'Sigue donde estaba'),
  ],
  flechas: [
    f('inicio', 'nuevo'),
    f('nuevo', 'requisitos', 'revisar'),
    f('requisitos', 'avisar', 'cumple'),
    f('requisitos', 'falta', 'no-cumple'),
    f('avisar', 'revisado'),
    f('revisado', 'monto', 'cerrar'),
    f('monto', 'auditar', 'grande'),
    f('auditar', 'auditado'),
    f('monto', 'cerrado', 'sino'),
    f('anular', 'anulado'),
    f('comentar', 'notificar'),
    f('notificar', 'sigue'),
  ],
}
const subflujo = (id, version) => (id === 'requisitos' && version === 2 ? REQUISITOS : undefined)

test('un maestro con requisitos en un subflujo, una decisión de destino e interrupciones', () => {
  const { definicion, problemas } = definicionDeFlujo(MAESTRO, { ...OPCIONES, subflujo })
  assert.deepEqual(problemas, [])
  assert.deepEqual(definicion, {
    id: 'pedidos',
    version: 3,
    nombre: 'Pedidos',
    estadoInicial: 'nuevo',
    estados: [
      { id: 'nuevo', nombre: 'Nuevo' },
      { id: 'revisado', nombre: 'Revisado' },
      { id: 'auditado', nombre: 'Cerrado con auditoría', final: true },
      { id: 'cerrado', nombre: 'Cerrado', final: true },
      { id: 'anulado', nombre: 'Anulado', final: true },
    ],
    decisiones: [{ id: 'cerrar-destino', nombre: '¿A dónde lleva «Cerrar»?', ramas: [{ si: c('total.mayor-que', { monto: 1000 }), hacia: 'auditado' }], sino: 'cerrado' }],
    transiciones: [
      {
        id: 'revisar',
        accion: 'pedidos.revisar',
        nombre: 'Revisar',
        hacia: 'revisado',
        // Lo que piden los dos caminos queda afuera, y lo del urgente como una premisa.
        requisitos: { todas: [c('pedido.pago'), { si: c('pedido.urgente'), entonces: c('pedido.tiene', { campo: 'responsable' }) }] },
        efectos: [{ efecto: 'avisos.enviar', params: { para: 'ventas' } }],
        desde: ['nuevo'],
      },
      // La auditoría se pide solo por el camino del pedido grande.
      { id: 'cerrar', accion: 'pedidos.cerrar', nombre: 'Cerrar', hacia: 'cerrar-destino', efectos: [{ efecto: 'tareas.crear', si: c('total.mayor-que', { monto: 1000 }) }], desde: ['revisado'] },
      { id: 'anular', accion: 'pedidos.anular', nombre: 'Anular', excepto: ['revisado'], hacia: 'anulado', desde: '*' },
      // No desvía el flujo: no tiene «hacia», y su fin no es un estado.
      { id: 'comentar', accion: 'pedidos.comentar', nombre: 'Comentar', efectos: [{ efecto: 'avisos.enviar' }], desde: '*' },
    ],
  })
})

test('el mismo evento en dos esperas es una sola transición si hace lo mismo, y dos si no', () => {
  const dos = (destinoDeB) => ({
    nodos: [ev('inicio', 'inicio', 'Inicio'), ev('a', 'espera', 'A', { eventos: [{ id: 'pasar', nombre: 'Pasar', accion: 'x.pasar' }, { id: 'cerrar', nombre: 'Cerrar', accion: 'x.cerrar' }] }), ev('b', 'espera', 'B', { eventos: [{ id: 'cerrar', nombre: 'Cerrar', accion: 'x.cerrar' }] }), ev('z', 'fin', 'Fin'), ev('y', 'fin', 'Otro fin')],
    flechas: [f('inicio', 'a'), f('a', 'b', 'pasar'), f('a', 'z', 'cerrar'), f('b', destinoDeB, 'cerrar')],
  })
  const cerrar = (d) => d.definicion.transiciones.filter((t) => t.accion === 'x.cerrar').map((t) => [t.id, t.desde, t.hacia])
  assert.deepEqual(cerrar(definicionDeFlujo(dos('z'), OPCIONES)), [['cerrar', ['a', 'b'], 'z']])
  assert.deepEqual(cerrar(definicionDeFlujo(dos('y'), OPCIONES)), [['cerrar', ['a'], 'z'], ['cerrar-b', ['b'], 'y']])
})

test('una rama que vuelve a la espera de donde salió deja el estado igual', () => {
  const vuelve = {
    nodos: [ev('inicio', 'inicio', 'Inicio'), ev('a', 'espera', 'A', { eventos: [{ id: 'probar', nombre: 'Probar', accion: 'x.probar' }] }), dec('d', '¿Anda?', [rama(c('x.anda'))]), ev('z', 'fin', 'Listo')],
    flechas: [f('inicio', 'a'), f('a', 'd', 'probar'), f('d', 'z', 'si'), f('d', 'a', 'sino')],
  }
  const { definicion } = definicionDeFlujo(vuelve, OPCIONES)
  assert.deepEqual(definicion.decisiones, [{ id: 'probar-destino', nombre: '¿A dónde lleva «Probar»?', ramas: [{ si: c('x.anda'), hacia: 'z' }], sino: 'a' }])
})

test('lo que el motor no puede expresar no se traduce a medias: dice qué falta', () => {
  const con = (cambio) => {
    const nodos = MAESTRO.nodos.map((n) => cambio[n.id] ?? n)
    return definicionDeFlujo({ nodos, flechas: cambio.flechas ?? MAESTRO.flechas }, { ...OPCIONES, subflujo: cambio.subflujo ?? subflujo })
  }
  const dice = (cambio, esperado) => {
    const r = con(cambio)
    assert.equal(r.definicion, undefined)
    assert.deepEqual(r.problemas, esperado)
  }
  dice({ nuevo: ev('nuevo', 'espera', 'Nuevo', { eventos: [{ id: 'revisar', nombre: 'Revisar' }] }) }, ['«Revisar» no tiene elegida la acción que lo produce.'])
  dice({ monto: dec('monto', '¿Es grande?', [{ id: 'grande', nombre: 'sí' }]) }, ['Decisión «¿Es grande?»: la rama «sí» no tiene una condición.'])
  dice({ auditar: fn('auditar', 'Pedir auditoría') }, ['Función «Pedir auditoría» no tiene elegido qué hace.'])
  dice({ subflujo: () => undefined }, ['Subflujo «¿Cumple?» usa la versión 2 de «requisitos», que no está disponible.'])
  dice({ flechas: MAESTRO.flechas.map((x) => (x.source === 'requisitos' && x.sourceHandle === 'cumple' ? f('requisitos', 'falta', 'cumple') : x)) }, ['«Revisar» siempre termina en un rechazo: no se puede hacer nunca.'])
  dice({ flechas: MAESTRO.flechas.map((x) => (x.source === 'inicio' ? f('inicio', 'avisar') : x)) }, ['El inicio tiene que llevar directo a una espera: es el estado en el que arranca.'])
  dice({ flechas: MAESTRO.flechas.filter((x) => x.source !== 'auditar') }, ['Función «Pedir auditoría» tiene una salida sin conectar.'])
  // Un camino que no llega a ninguna espera ni fin.
  dice({ flechas: MAESTRO.flechas.map((x) => (x.source === 'auditar' ? f('auditar', 'monto') : x)) }, ['Hay un camino que da vueltas sin llegar a una espera ni a un fin.'])
})
