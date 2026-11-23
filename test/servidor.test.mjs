import assert from 'node:assert/strict'
import { test } from 'node:test'
import { crearAlmacenHttp } from '../dist/cliente/almacenHttp.js'
import { crearServidorMcp } from '../dist/mcp/herramientas.js'
import { acomodarEnCapas, atender, crearAlmacenEnMemoria, crearAlmacenPostgres, idDesdeNombre, migrar, validarContenido } from '../dist/servidor/index.js'

const CAPACIDADES = [{ id: 'avisos.enviar', nombre: 'Enviar un aviso' }]
const inicio = { id: 'i', type: 'evento', data: { variante: 'inicio', nombre: 'Llegó' } }
const aviso = { id: 'a', type: 'funcion', data: { nombre: 'Avisar', capacidad: 'avisos.enviar' } }
const fin = { id: 'z', type: 'evento', data: { variante: 'fin', nombre: 'Listo' } }
const COMPLETO = { nodos: [inicio, aviso, fin], flechas: [{ source: 'i', target: 'a' }, { source: 'a', target: 'z' }] }

test('validarContenido limpia lo que llega, completa las flechas y acomoda lo que viene sin posición', () => {
  const c = validarContenido({ nodos: [{ ...inicio, selected: true, basura: 1 }, aviso, fin], flechas: COMPLETO.flechas })
  assert.deepEqual(Object.keys(c.nodos[0]), ['id', 'type', 'position', 'data'])
  assert.deepEqual(c.flechas[0], { id: 'i-salida-a', source: 'i', target: 'a', sourceHandle: 'salida', targetHandle: null })
  assert.deepEqual(c.nodos.map((n) => n.position), [{ x: 0, y: 0 }, { x: 0, y: 160 }, { x: 0, y: 320 }])
  const conLugar = validarContenido({ nodos: [{ ...inicio, position: { x: 5, y: 7 } }], flechas: [] })
  assert.deepEqual(conLugar.nodos[0].position, { x: 5, y: 7 })
})

test('validarContenido dice qué está mal', () => {
  const mal = (valor, esperado) => assert.throws(() => validarContenido(valor), { name: 'ErrorDeContenido', message: esperado })
  mal(null, /«nodos» y «flechas»/)
  mal({ nodos: [{ type: 'evento' }], flechas: [] }, /nodos\[0\]: falta el «id»/)
  mal({ nodos: [inicio, inicio], flechas: [] }, /«i» está repetido/)
  mal({ nodos: [{ id: 'x', type: 'otro', data: { nombre: 'X' } }], flechas: [] }, /«type» tiene que ser uno de/)
  mal({ nodos: [{ id: 'x', type: 'evento', data: { nombre: 'X', variante: 'nada' } }], flechas: [] }, /«data.variante»/)
  mal({ nodos: [{ id: 'x', type: 'decision', data: { nombre: 'X' } }], flechas: [] }, /«data.ramas»/)
  mal({ nodos: [{ id: 'x', type: 'subflujo', data: { nombre: 'X', flujo: 'f' } }], flechas: [] }, /un subflujo lleva/)
  mal({ nodos: [inicio], flechas: [{ source: 'i', target: 'no' }] }, /flechas\[0\]: une un nodo que no existe/)
})

test('acomodarEnCapas pone las ramas lado a lado y no se cuelga con un bucle', () => {
  const n = (id) => ({ id, type: 'funcion', position: { x: 0, y: 0 }, data: { nombre: id } })
  const f = (source, target) => ({ id: source + target, source, target })
  const p = acomodarEnCapas([{ ...inicio, position: { x: 0, y: 0 } }, n('a'), n('b'), n('c'), n('suelto')], [f('i', 'a'), f('i', 'b'), f('a', 'c'), f('b', 'c'), f('c', 'a')])
  assert.deepEqual(p, { i: { x: 0, y: 0 }, a: { x: 0, y: 160 }, b: { x: 260, y: 160 }, c: { x: 0, y: 320 }, suelto: { x: 0, y: 480 } })
})

test('idDesdeNombre arma un id legible', () => {
  assert.equal(idDesdeNombre('  Pedidos urgentes (año 2) '), 'pedidos-urgentes-ano-2')
  assert.equal(idDesdeNombre('¿¡!?'), 'flujo')
})

/** Recorre lo que tiene que cumplir cualquier almacén. */
async function recorrerAlmacen(almacen) {
  const maestro = await almacen.crear('Pedidos', 'maestro')
  assert.deepEqual([maestro.tipo, maestro.version, maestro.conBorrador, maestro.inicios, maestro.nodos], ['maestro', undefined, true, ['Inicio'], 1])
  await assert.rejects(almacen.abrir('no-existe'), { name: 'ErrorNoExiste' })
  await assert.rejects(almacen.guardarBorrador('no-existe', validarContenido(COMPLETO)), { name: 'ErrorNoExiste' })
  await assert.rejects(almacen.publicar('no-existe'), { name: 'ErrorNoExiste' })

  await almacen.guardarBorrador(maestro.id, validarContenido(COMPLETO))
  assert.equal(await almacen.publicar(maestro.id), 1)
  let abierto = await almacen.abrir(maestro.id)
  assert.deepEqual([abierto.version, abierto.conBorrador, abierto.nodos, abierto.contenido.nodos.length, abierto.publicado.nodos.length], [1, false, 3, 3, 3])
  await assert.rejects(almacen.publicar(maestro.id), /No hay cambios para publicar/)

  const sub = await almacen.crear('Revisar', 'subflujo')
  assert.deepEqual(await almacen.subflujos(), [], 'un subflujo sin publicar no se ofrece')
  await almacen.guardarBorrador(sub.id, validarContenido({ nodos: [inicio, { id: 'ok', type: 'evento', data: { variante: 'fin', nombre: 'aprobado' } }], flechas: [{ source: 'i', target: 'ok' }] }))
  await almacen.publicar(sub.id)
  await almacen.guardarBorrador(sub.id, validarContenido({ nodos: [inicio, { id: 'ok', type: 'evento', data: { variante: 'fin', nombre: 'aprobado' } }, { id: 'no', type: 'evento', data: { variante: 'fin', nombre: 'rechazado' } }], flechas: [{ source: 'i', target: 'ok' }] }))
  await almacen.publicar(sub.id)
  assert.deepEqual(await almacen.subflujos(), [{ id: sub.id, nombre: 'Revisar', versiones: [{ version: 1, salidas: [{ id: 'ok', nombre: 'aprobado' }] }, { version: 2, salidas: [{ id: 'ok', nombre: 'aprobado' }, { id: 'no', nombre: 'rechazado' }] }] }])

  const usa = { id: 's', type: 'subflujo', data: { nombre: 'Revisar', flujo: sub.id, version: 1, salidas: [{ id: 'ok', nombre: 'aprobado' }] } }
  await almacen.guardarBorrador(maestro.id, validarContenido({ nodos: [inicio, usa, fin], flechas: [{ source: 'i', target: 's' }, { source: 's', sourceHandle: 'ok', target: 'z' }] }))
  const lista = await almacen.listar()
  assert.deepEqual(lista.map((f) => [f.nombre, f.version, f.conBorrador, f.usadoPor]), [['Pedidos', 1, true, []], ['Revisar', 2, false, ['Pedidos']]])
  abierto = await almacen.abrir(maestro.id)
  assert.equal(abierto.publicado.nodos.length, 3, 'lo publicado no cambia al guardar un borrador')
  assert.equal(abierto.contenido.nodos[1].id, 's')
  return { maestro: maestro.id, sub: sub.id }
}

test('el almacén en memoria cumple', async () => {
  await recorrerAlmacen(crearAlmacenEnMemoria())
})

test('el almacén de Postgres cumple, y migrar se puede repetir', { skip: !process.env.PRUEBAS_POSTGRES_URL && 'falta PRUEBAS_POSTGRES_URL' }, async () => {
  const { default: pg } = await import('pg')
  const pool = new pg.Pool({ connectionString: process.env.PRUEBAS_POSTGRES_URL })
  try {
    await pool.query('DROP SCHEMA IF EXISTS flujo CASCADE')
    assert.equal(await migrar(pool), 1)
    assert.equal(await migrar(pool), 0)
    const { maestro } = await recorrerAlmacen(crearAlmacenPostgres(pool, { persona: 'ana' }))
    const abierto = await crearAlmacenPostgres(pool).abrir(maestro)
    assert.deepEqual([abierto.editadoPor, abierto.publicadoPor], ['ana', 'ana'])
    assert.match(abierto.editadoEl, /^\d{4}-\d\d-\d\dT/)

    // Dos nombres iguales no chocan, y dos publicaciones a la vez dan una sola versión nueva.
    const almacen = crearAlmacenPostgres(pool)
    assert.deepEqual([(await almacen.crear('Pedidos', 'maestro')).id, (await almacen.crear('Pedidos', 'maestro')).id], ['pedidos-2', 'pedidos-3'])
    const resultados = await Promise.allSettled([almacen.publicar(maestro), almacen.publicar(maestro)])
    assert.deepEqual(resultados.map((r) => r.status).sort(), ['fulfilled', 'rejected'])
    assert.equal(resultados.find((r) => r.status === 'fulfilled').value, 2)
  } finally {
    await pool.query('DROP SCHEMA IF EXISTS flujo CASCADE')
    await pool.end()
  }
})

/** Un `fetch` que le pasa los pedidos al servidor de la app, sin red: prueba el cliente y el servidor juntos. */
function fetchHacia(opciones) {
  return async (url, init = {}) => {
    const { estado, cuerpo } = await atender({ metodo: init.method ?? 'GET', ruta: new URL(url).pathname.replace(/^\/api/, ''), cuerpo: init.body ? JSON.parse(init.body) : undefined }, opciones)
    return new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'content-type': 'application/json' } })
  }
}

test('el cliente y el servidor: crear, guardar, verificar y publicar, con permisos', async () => {
  const almacen = crearAlmacenEnMemoria()
  const opciones = { almacen, capacidades: () => CAPACIDADES, puedeEditar: true, puedePublicar: true }
  const cliente = crearAlmacenHttp({ urlBase: 'http://app.test/api/', fetch: fetchHacia(opciones) })
  const flujo = await cliente.crear('Pedidos', 'maestro')
  assert.deepEqual(await cliente.capacidades(), CAPACIDADES)

  // Un borrador incompleto se guarda, pero no se publica: el servidor vuelve a verificar.
  await cliente.guardarBorrador(flujo.id, { nodos: [inicio, { ...aviso, data: { nombre: 'Avisar' } }, fin], flechas: COMPLETO.flechas })
  assert.deepEqual((await cliente.verificar(flujo.id)).map((p) => p.mensaje), ['Función «Avisar» no tiene elegido qué hace.'])
  await assert.rejects(cliente.publicar(flujo.id), (e) => e.name === 'ErrorDelServidor' && e.estado === 422 && e.problemas.length === 1)

  await cliente.guardarBorrador(flujo.id, COMPLETO)
  assert.equal(await cliente.publicar(flujo.id), 1)
  await assert.rejects(cliente.publicar(flujo.id), (e) => e.estado === 409)
  assert.equal((await cliente.abrir(flujo.id)).version, 1)
  assert.equal((await cliente.listar()).length, 1)

  await assert.rejects(cliente.abrir('no-existe'), (e) => e.estado === 404 && e.message === 'No existe el flujo «no-existe».')
  await assert.rejects(cliente.guardarBorrador(flujo.id, { nodos: 'x' }), (e) => e.estado === 400)
  await assert.rejects(cliente.crear('  ', 'maestro'), (e) => e.estado === 400)
  assert.equal((await atender({ metodo: 'GET', ruta: '/otra' }, opciones)).estado, 404)

  const soloLee = crearAlmacenHttp({ urlBase: 'http://app.test/api', fetch: fetchHacia({ ...opciones, puedeEditar: false, puedePublicar: false }) })
  await assert.rejects(soloLee.crear('Otro', 'maestro'), (e) => e.estado === 403)
  await assert.rejects(soloLee.guardarBorrador(flujo.id, COMPLETO), (e) => e.estado === 403)
  await assert.rejects(soloLee.publicar(flujo.id), (e) => e.estado === 403)
  assert.equal((await soloLee.listar()).length, 1)
})

test('el servidor MCP: un agente arma un borrador y no puede publicar', async () => {
  // El agente edita pero no publica: así lo configura el sistema para su credencial.
  const opciones = { almacen: crearAlmacenEnMemoria(), capacidades: () => CAPACIDADES, puedeEditar: true, puedePublicar: false }
  const responder = crearServidorMcp(crearAlmacenHttp({ urlBase: 'http://app.test/api', fetch: fetchHacia(opciones) }), '0.0.0')
  let n = 0
  const pedir = (method, params) => responder({ jsonrpc: '2.0', id: ++n, method, params })
  const usar = async (name, args = {}) => {
    const { result } = await pedir('tools/call', { name, arguments: args })
    return { ...result, valor: result.isError ? result.content[0].text : name === 'guia' ? result.content[0].text : JSON.parse(result.content[0].text) }
  }

  const inicial = await pedir('initialize', { protocolVersion: '2025-03-26' })
  assert.deepEqual([inicial.result.protocolVersion, inicial.result.serverInfo.name, inicial.result.capabilities], ['2025-03-26', 'ts-workflow-app', { tools: {} }])
  assert.equal(await responder({ jsonrpc: '2.0', method: 'notifications/initialized' }), null)
  const { tools } = (await pedir('tools/list')).result
  assert.deepEqual(tools.map((t) => t.name), ['guia', 'capacidades_listar', 'flujos_listar', 'flujo_abrir', 'subflujos_listar', 'flujo_crear', 'flujo_guardar_borrador', 'flujo_verificar'])
  assert.ok(!tools.some((t) => /publicar/.test(t.name)), 'no hay herramienta para publicar')
  assert.match((await usar('guia')).valor, /# Cómo armar un flujo/)
  assert.deepEqual((await usar('capacidades_listar', { buscar: 'AVISO' })).valor, CAPACIDADES)
  assert.deepEqual((await usar('capacidades_listar', { buscar: 'nada' })).valor, [])

  const { id } = (await usar('flujo_crear', { nombre: 'Reclamos', tipo: 'maestro' })).valor
  const incompleto = (await usar('flujo_guardar_borrador', { id, contenido: { nodos: [inicio, fin], flechas: [] } })).valor
  assert.equal(incompleto.listoParaPublicar, false)
  assert.deepEqual(incompleto.problemas.map((p) => p.mensaje), ['Inicio «Llegó» no tiene a dónde seguir.', 'A Fin «Listo» no se llega desde ningún inicio.'])
  assert.deepEqual((await usar('flujo_guardar_borrador', { id, contenido: COMPLETO })).valor, { guardado: true, listoParaPublicar: true, problemas: [] })
  assert.deepEqual((await usar('flujo_verificar', { id })).valor, { problemas: [] })
  assert.equal((await usar('flujo_abrir', { id })).valor.contenido.nodos.length, 3)
  assert.deepEqual((await usar('flujos_listar')).valor.map((f) => [f.nombre, f.conBorrador, f.version]), [['Reclamos', true, undefined]])

  // Los errores le vuelven al agente como resultado, para que corrija.
  const mal = await usar('flujo_guardar_borrador', { id, contenido: { nodos: [{ id: 'x' }], flechas: [] } })
  assert.equal(mal.isError, true); assert.match(mal.valor, /«type» tiene que ser uno de/)
  assert.equal((await usar('flujo_abrir', { id: 'no-existe' })).isError, true)
  assert.equal((await usar('flujo_crear', { nombre: 'X', tipo: 'otro' })).isError, true)
  assert.equal((await pedir('tools/call', { name: 'flujo_publicar', arguments: { id } })).error.code, -32602)
  assert.equal((await pedir('otra/cosa')).error.code, -32601)
})

test('enTexto no depende del orden de las claves, y comparar tampoco', async () => {
  const { enTexto, compararFlujos } = await import('../dist/servidor/index.js')
  assert.equal(enTexto({ b: [{ y: 1, x: 2 }], a: 1 }), enTexto({ a: 1, b: [{ x: 2, y: 1 }] }))
  assert.notEqual(enTexto({ a: [1, 2] }), enTexto({ a: [2, 1] }), 'el orden de una lista sí importa')
  const nodo = (data) => ({ nodos: [{ id: 'd', type: 'decision', position: { x: 0, y: 0 }, data }], flechas: [] })
  const d = compararFlujos(nodo({ nombre: 'X', ramas: [{ id: 'a', nombre: 'sí' }] }), nodo({ ramas: [{ nombre: 'sí', id: 'a' }], nombre: 'X' }))
  assert.equal(d.hayCambios, false)
})
