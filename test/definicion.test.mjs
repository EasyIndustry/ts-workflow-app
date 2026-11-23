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

test('el mismo evento con una decisión de destino desde varias esperas: una sola decisión, sin ids repetidos', () => {
  // Reabrir desde tres estados cerrados: según el caso vuelve a un lugar o a otro. Es la misma regla las tres veces.
  const reabrir = (extra = {}) => ({
    nodos: [
      ev('inicio', 'inicio', 'Inicio'),
      ev('abierto', 'espera', 'Abierto', { eventos: [{ id: 'cerrar', nombre: 'Cerrar', accion: 'x.cerrar' }, { id: 'cerrar-sin', nombre: 'Cerrar sin servicio', accion: 'x.cerrar-sin' }] }),
      ev('espera', 'espera', 'En espera', { eventos: [{ id: 'cerrar', nombre: 'Cerrar', accion: 'x.cerrar' }] }),
      ev('cerrado', 'espera', 'Cerrado', { eventos: [{ id: 're_abrir', nombre: 'Re-abrir', accion: 'x.reabrir' }] }),
      ev('sin-servicio', 'espera', 'Cerrado sin servicio', { eventos: [{ id: 're_abrir', nombre: 'Re-abrir', accion: 'x.reabrir' }] }),
      dec('garantia', '¿Tiene garantía?', [rama(c('x.garantia'))]),
      ev('fin', 'fin', 'Archivado'),
      ev('archivar', 'interrupcion', 'Archivar', { accion: 'x.archivar' }),
      ...(extra.nodos ?? []),
    ],
    flechas: [f('inicio', 'abierto'), f('abierto', 'cerrado', 'cerrar'), f('espera', 'cerrado', 'cerrar'), f('abierto', 'sin-servicio', 'cerrar-sin'), f('cerrado', 'garantia', 're_abrir'), f('sin-servicio', extra.desdeSinServicio ?? 'garantia', 're_abrir'), f('garantia', 'espera', 'si'), f('garantia', 'abierto', 'sino'), f('archivar', 'fin'), ...(extra.flechas ?? [])],
  })
  const { definicion, problemas } = definicionDeFlujo(reabrir(), OPCIONES)
  assert.deepEqual(problemas, [])
  assert.deepEqual(definicion.decisiones, [{ id: 're_abrir-destino', nombre: '¿A dónde lleva «Re-abrir»?', ramas: [{ si: c('x.garantia'), hacia: 'espera' }], sino: 'abierto' }])
  assert.deepEqual(definicion.transiciones.filter((t) => t.accion === 'x.reabrir').map((t) => [t.id, t.desde, t.hacia]), [['re_abrir', ['cerrado', 'sin-servicio'], 're_abrir-destino']])

  // Si desde uno de los estados decide distinto, son dos transiciones, cada una con su decisión.
  const otra = reabrir({ nodos: [dec('otra', '¿Es vieja?', [rama(c('x.vieja'))])], flechas: [f('otra', 'abierto', 'si'), f('otra', 'espera', 'sino')], desdeSinServicio: 'otra' })
  const d2 = definicionDeFlujo(otra, OPCIONES).definicion
  assert.deepEqual(d2.decisiones.map((d) => d.id), ['re_abrir-destino', 're_abrir-sin-servicio-destino'])
  assert.deepEqual(d2.transiciones.filter((t) => t.accion === 'x.reabrir').map((t) => [t.id, t.desde, t.hacia]), [['re_abrir', ['cerrado'], 're_abrir-destino'], ['re_abrir-sin-servicio', ['sin-servicio'], 're_abrir-sin-servicio-destino']])
  // Ningún id repetido entre estados, decisiones y transiciones, que es lo que exige el motor.
  for (const d of [definicion, d2]) {
    const nodos = [...d.estados, ...d.decisiones].map((x) => x.id)
    assert.equal(new Set(nodos).size, nodos.length)
    assert.equal(new Set(d.transiciones.map((t) => t.id)).size, d.transiciones.length)
  }
})

test('el mensaje de un rechazo es el de la condición que lo causa', () => {
  const rechazo = (id, mensaje) => ev(id, 'fin', 'No se puede', { rechazo: true, ...(mensaje && { mensaje }) })
  const flujo = (decisiones, flechas, rechazos) => ({
    nodos: [ev('inicio', 'inicio', 'Inicio'), ev('a', 'espera', 'A', { eventos: [{ id: 'terminar', nombre: 'Terminar', accion: 'x.terminar' }] }), ...decisiones, ev('z', 'fin', 'Fin'), ...rechazos],
    flechas: [f('inicio', 'a'), ...flechas],
  })
  const requisitos = (x) => definicionDeFlujo(x, OPCIONES).definicion.transiciones[0].requisitos

  // Una sola condición: por el «si no» se rechaza con su mensaje.
  assert.deepEqual(requisitos(flujo([dec('d', '¿Firmó?', [rama(c('x.firmo'))])], [f('a', 'd', 'terminar'), f('d', 'z', 'si'), f('d', 'r', 'sino')], [rechazo('r', 'Falta la firma del cliente')])), { condicion: 'x.firmo', mensaje: 'Falta la firma del cliente' })
  // Sin mensaje, la condición queda como está: el motor arma el texto.
  assert.deepEqual(requisitos(flujo([dec('d', '¿Firmó?', [rama(c('x.firmo'))])], [f('a', 'd', 'terminar'), f('d', 'z', 'si'), f('d', 'r', 'sino')], [rechazo('r')])), { condicion: 'x.firmo' })
  // Una premisa («si es de este tipo…») y adentro la condición con su mensaje, cada una con el suyo o sin ninguno.
  assert.deepEqual(
    requisitos(
      flujo(
        [dec('tipo', '¿Es de inspección?', [rama(c('x.tipo', { es: 'inspeccion' }))]), dec('firma', '¿Firmó?', [rama(c('x.firmo'))]), dec('deuda', '¿Tiene deuda?', [rama(c('x.deuda'))])],
        [f('a', 'tipo', 'terminar'), f('tipo', 'firma', 'si'), f('tipo', 'deuda', 'sino'), f('firma', 'deuda', 'si'), f('firma', 'r1', 'sino'), f('deuda', 'r2', 'si'), f('deuda', 'z', 'sino')],
        [rechazo('r1', 'Falta la firma del cliente'), rechazo('r2', 'Tiene deuda')],
      ),
    ),
    { todas: [{ no: c('x.deuda'), mensaje: 'Tiene deuda' }, { si: c('x.tipo', { es: 'inspeccion' }), entonces: { condicion: 'x.firmo', mensaje: 'Falta la firma del cliente' } }] },
  )
})

test('un rechazo adentro de un subflujo corta la acción y no es una de sus salidas', async () => {
  const { salidasDeContenido } = await import('../dist/servidor/index.js')
  const sub = {
    nodos: [ev('inicio', 'inicio', 'Al ser llamado'), dec('d', '¿Firmó?', [rama(c('x.firmo'))]), ev('cumple', 'fin', 'cumple'), ev('r', 'fin', 'No se puede', { rechazo: true, mensaje: 'Falta la firma' })],
    flechas: [f('inicio', 'd'), f('d', 'cumple', 'si'), f('d', 'r', 'sino')],
  }
  assert.deepEqual(salidasDeContenido(sub), [{ id: 'cumple', nombre: 'cumple' }])
  const maestro = {
    nodos: [ev('inicio', 'inicio', 'Inicio'), ev('a', 'espera', 'A', { eventos: [{ id: 'terminar', nombre: 'Terminar', accion: 'x.terminar' }] }), { id: 's', type: 'subflujo', position: { x: 0, y: 0 }, data: { nombre: '¿Cumple?', flujo: 'req', version: 1, salidas: [{ id: 'cumple', nombre: 'cumple' }] } }, ev('z', 'fin', 'Fin')],
    flechas: [f('inicio', 'a'), f('a', 's', 'terminar'), f('s', 'z', 'cumple')],
  }
  const { definicion, problemas } = definicionDeFlujo(maestro, { ...OPCIONES, subflujo: () => sub })
  assert.deepEqual(problemas, [])
  assert.deepEqual(definicion.transiciones[0], { id: 'terminar', accion: 'x.terminar', nombre: 'Terminar', hacia: 'z', requisitos: { condicion: 'x.firmo', mensaje: 'Falta la firma' }, desde: ['a'] })
})
