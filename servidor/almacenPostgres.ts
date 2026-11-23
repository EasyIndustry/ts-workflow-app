import { contenidoDe, contenidoInicial, ErrorNoExiste, resumenDeContenido, salidasDeContenido, type Almacen, type ContenidoDeFlujo, type ContratoDeSubflujo, type FlujoAbierto, type ResumenDeFlujo } from '../modelo/flujo.js'

/** Lo único que hace falta de un cliente de Postgres: `pg.Pool` y `pg.Client` lo cumplen. La app no depende de `pg`. */
export interface ClienteSql {
  query(texto: string, valores?: unknown[]): Promise<{ rows: any[] }>
}

/**
 * Las tablas de la app viven en el esquema `flujo` de la base del sistema donde está montada, con el prefijo `app_`. Cada
 * migración es una lista de sentencias que se pueden repetir sin romper nada; las aplicadas quedan anotadas.
 */
const MIGRACIONES: readonly (readonly string[])[] = [
  [
    `CREATE TABLE IF NOT EXISTS flujo.app_flujos (
       id text PRIMARY KEY,
       nombre text NOT NULL,
       tipo text NOT NULL CHECK (tipo IN ('maestro', 'subflujo')),
       borrador jsonb,
       creado_el timestamptz NOT NULL DEFAULT now(),
       editado_el timestamptz,
       editado_por text
     )`,
    `CREATE TABLE IF NOT EXISTS flujo.app_versiones (
       flujo text NOT NULL REFERENCES flujo.app_flujos (id),
       version integer NOT NULL CHECK (version > 0),
       contenido jsonb NOT NULL,
       publicado_el timestamptz NOT NULL DEFAULT now(),
       publicado_por text,
       PRIMARY KEY (flujo, version)
     )`,
  ],
]

/** Deja el esquema al día. Se corre al arrancar o en una migración del sistema; repetirlo no hace nada. Devuelve cuántas aplicó. */
export async function migrar(cliente: ClienteSql): Promise<number> {
  await cliente.query('CREATE SCHEMA IF NOT EXISTS flujo')
  await cliente.query('CREATE TABLE IF NOT EXISTS flujo.app_migraciones (numero integer PRIMARY KEY, aplicada_el timestamptz NOT NULL DEFAULT now())')
  const hechas = new Set((await cliente.query('SELECT numero FROM flujo.app_migraciones')).rows.map((f) => Number(f.numero)))
  let aplicadas = 0
  for (const [i, sentencias] of MIGRACIONES.entries()) {
    if (hechas.has(i + 1)) continue
    for (const sql of sentencias) await cliente.query(sql)
    await cliente.query('INSERT INTO flujo.app_migraciones (numero) VALUES ($1) ON CONFLICT DO NOTHING', [i + 1])
    aplicadas++
  }
  return aplicadas
}

export interface OpcionesAlmacenPostgres {
  /** Quién está haciendo los cambios, para dejarlo anotado. Lo dice el sistema donde está montada la app. */
  persona?: string
}

const FILAS = `
  SELECT f.id, f.nombre, f.tipo, f.borrador, f.editado_el, f.editado_por, v.version, v.contenido AS publicado, v.publicado_el, v.publicado_por
  FROM flujo.app_flujos f
  LEFT JOIN LATERAL (SELECT * FROM flujo.app_versiones WHERE flujo = f.id ORDER BY version DESC LIMIT 1) v ON true
  ORDER BY f.nombre, f.id`

const fecha = (v: unknown) => (v === null || v === undefined ? undefined : new Date(v as string).toISOString())
const texto = (v: unknown) => (typeof v === 'string' && v ? v : undefined)

/** El id de un flujo nuevo sale de su nombre: «Pedidos urgentes» → `pedidos-urgentes`. Es lo que se ve en las referencias. */
export function idDesdeNombre(nombre: string): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'flujo'
}

/** El almacén de flujos sobre Postgres. Antes hay que correr `migrar`. */
export function crearAlmacenPostgres(cliente: ClienteSql, opciones: OpcionesAlmacenPostgres = {}): Almacen {
  const persona = opciones.persona ?? null

  async function todos(): Promise<FlujoAbierto[]> {
    const filas = (await cliente.query(FILAS)).rows
    const contenido = (f: any): ContenidoDeFlujo | undefined => f.borrador ?? f.publicado ?? undefined
    const usan = filas.map((f) => ({ nombre: f.nombre as string, usa: resumenDeContenido(contenido(f)).usa }))
    return filas.map((f) => {
      const { inicios, nodos } = resumenDeContenido(contenido(f))
      const resumen: ResumenDeFlujo = {
        id: f.id,
        nombre: f.nombre,
        tipo: f.tipo,
        version: f.version === null || f.version === undefined ? undefined : Number(f.version),
        conBorrador: f.borrador !== null && f.borrador !== undefined,
        inicios,
        nodos,
        usadoPor: usan.filter((u) => u.usa.includes(f.id)).map((u) => u.nombre),
        editadoEl: fecha(f.editado_el),
        editadoPor: texto(f.editado_por),
        publicadoEl: fecha(f.publicado_el),
        publicadoPor: texto(f.publicado_por),
      }
      return { ...resumen, contenido: contenido(f) ?? { nodos: [], flechas: [] }, publicado: f.publicado ?? undefined }
    })
  }
  const sinContenido = ({ contenido: _c, publicado: _p, ...resumen }: FlujoAbierto): ResumenDeFlujo => resumen

  return {
    listar: async () => (await todos()).map(sinContenido),
    abrir: async (id) => {
      const flujo = (await todos()).find((f) => f.id === id)
      if (!flujo) throw new ErrorNoExiste(id)
      return flujo
    },
    crear: async (nombre, tipo) => {
      const base = idDesdeNombre(nombre)
      // Si el id ya está tomado, prueba con un número detrás.
      for (let intento = 1; intento <= 50; intento++) {
        const id = intento === 1 ? base : `${base}-${intento}`
        const { rows } = await cliente.query(
          'INSERT INTO flujo.app_flujos (id, nombre, tipo, borrador, editado_el, editado_por) VALUES ($1, $2, $3, $4::jsonb, now(), $5) ON CONFLICT (id) DO NOTHING RETURNING id',
          [id, nombre, tipo, JSON.stringify(contenidoInicial(tipo)), persona],
        )
        if (rows.length > 0) return sinContenido((await todos()).find((f) => f.id === id)!)
      }
      throw new Error(`No se pudo crear «${nombre}»: hay demasiados flujos con un nombre parecido.`)
    },
    guardarBorrador: async (id, contenido) => {
      const limpio = contenidoDe(contenido.nodos, contenido.flechas)
      const { rows } = await cliente.query('UPDATE flujo.app_flujos SET borrador = $2::jsonb, editado_el = now(), editado_por = $3 WHERE id = $1 RETURNING id', [id, JSON.stringify(limpio), persona])
      if (rows.length === 0) throw new ErrorNoExiste(id)
    },
    publicar: async (id) => {
      // Una sola sentencia: toma el borrador, lo guarda como la versión siguiente y lo saca del flujo, todo o nada.
      const { rows } = await cliente.query(
        `WITH f AS (SELECT id, borrador FROM flujo.app_flujos WHERE id = $1 AND borrador IS NOT NULL FOR UPDATE),
              v AS (INSERT INTO flujo.app_versiones (flujo, version, contenido, publicado_por)
                    SELECT f.id, COALESCE((SELECT max(version) FROM flujo.app_versiones WHERE flujo = f.id), 0) + 1, f.borrador, $2 FROM f
                    RETURNING version),
              u AS (UPDATE flujo.app_flujos SET borrador = NULL WHERE id IN (SELECT id FROM f))
         SELECT version FROM v`,
        [id, persona],
      )
      if (rows.length > 0) return Number(rows[0].version)
      const existe = (await cliente.query('SELECT 1 FROM flujo.app_flujos WHERE id = $1', [id])).rows.length > 0
      if (!existe) throw new ErrorNoExiste(id)
      throw new Error('No hay cambios para publicar.')
    },
    subflujos: async () => {
      const { rows } = await cliente.query(
        `SELECT f.id, f.nombre, v.version, v.contenido FROM flujo.app_flujos f JOIN flujo.app_versiones v ON v.flujo = f.id WHERE f.tipo = 'subflujo' ORDER BY f.nombre, f.id, v.version`,
      )
      type Contrato = { id: string; nombre: string; versiones: { version: number; salidas: { id: string; nombre: string }[] }[] }
      const contratos = new Map<string, Contrato>()
      for (const f of rows) {
        const contrato: Contrato = contratos.get(f.id) ?? { id: f.id, nombre: f.nombre, versiones: [] }
        contrato.versiones.push({ version: Number(f.version), salidas: salidasDeContenido(f.contenido) })
        contratos.set(f.id, contrato)
      }
      return [...contratos.values()] satisfies ContratoDeSubflujo[]
    },
  }
}
