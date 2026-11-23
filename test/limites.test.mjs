import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

/**
 * El límite de la app, como lista blanca (POLITICA.md): `ui/` solo importa React, React Flow, elkjs, el core, los plugins, el modelo y sus propios
 * archivos. Una dependencia nueva se suma acá a propósito, no por descuido.
 */
const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)))
const ui = join(raiz, 'ui')
const modelo = join(raiz, 'modelo')
const cliente = join(raiz, 'cliente')
const PERMITIDOS = [/^react(\/.*)?$/, /^react-dom(\/.*)?$/, /^@xyflow\/react(\/.*)?$/, /^elkjs(\/.*)?$/, /^ts-workflow-core$/, /^ts-workflow-plugins(\/.*)?$/]
const SOLO_EN_STORIES = [/^@storybook\/react-vite$/, /^storybook(\/.*)?$/]

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? archivos(p) : /\.(ts|tsx)$/.test(n) ? [p] : []
  })
}

test('ui solo importa React, React Flow, el core, los plugins y archivos propios', () => {
  const malos = []
  const vistos = archivos(ui)
  for (const f of vistos) {
    const permitidos = /\.stories\.tsx?$/.test(f) ? [...PERMITIDOS, ...SOLO_EN_STORIES] : PERMITIDOS
    for (const m of readFileSync(f, 'utf8').matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g)) {
      const spec = m[1] ?? m[2]
      if (spec.startsWith('.')) {
        const destino = resolve(f, '..', spec)
        if ([ui, modelo, cliente].every((carpeta) => relative(carpeta, destino).startsWith('..'))) malos.push(`${relative(raiz, f)} → ${spec}`)
      } else if (!permitidos.some((r) => r.test(spec))) malos.push(`${relative(raiz, f)} → ${spec}`)
    }
  }
  assert.ok(vistos.length > 0, 'no se encontró ningún archivo en ui/')
  assert.deepEqual(malos, [])
})

test('modelo no importa nada de afuera: ni React, ni librerías, ni la interfaz', () => {
  const malos = []
  const vistos = archivos(modelo)
  for (const f of vistos) {
    for (const m of readFileSync(f, 'utf8').matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g)) {
      const spec = m[1] ?? m[2]
      if (!spec.startsWith('.') || relative(modelo, resolve(f, '..', spec)).startsWith('..')) malos.push(`${relative(raiz, f)} → ${spec}`)
    }
  }
  assert.ok(vistos.length > 0, 'no se encontró ningún archivo en modelo/')
  assert.deepEqual(malos, [])
})
