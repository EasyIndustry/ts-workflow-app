#!/usr/bin/env node
import { createInterface } from 'node:readline'
import { crearAlmacenHttp } from '../cliente/almacenHttp.js'
import { crearServidorMcp } from './herramientas.js'

/**
 * El servidor MCP de la app de flujos, por entrada y salida estándar: un mensaje JSON por renglón.
 *
 *   FLUJOS_URL            dónde está montada la app en el servidor (obligatoria)
 *   FLUJOS_AUTORIZACION   el valor del encabezado Authorization: la credencial del agente (opcional)
 */
const url = process.env['FLUJOS_URL']
if (!url) {
  process.stderr.write('Falta FLUJOS_URL: la dirección donde está montada la app de flujos.\n')
  process.exit(1)
}
const autorizacion = process.env['FLUJOS_AUTORIZACION']
const encabezados: Record<string, string> = autorizacion ? { authorization: autorizacion } : {}
const responder = crearServidorMcp(crearAlmacenHttp({ urlBase: url, encabezados: () => encabezados }), '0.1.0')

createInterface({ input: process.stdin }).on('line', (linea) => {
  if (!linea.trim()) return
  let mensaje: unknown
  try {
    mensaje = JSON.parse(linea)
  } catch {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'El mensaje no es un JSON válido.' } }) + '\n')
    return
  }
  void responder(mensaje as Parameters<typeof responder>[0])
    .catch((e: unknown) => ({ jsonrpc: '2.0', id: (mensaje as { id?: unknown }).id ?? null, error: { code: -32603, message: e instanceof Error ? e.message : String(e) } }))
    .then((respuesta) => {
      if (respuesta) process.stdout.write(JSON.stringify(respuesta) + '\n')
    })
})
