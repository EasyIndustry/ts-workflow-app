import type { ContenidoDeFlujo } from './flujo.js'
import { esRechazo, rotuloDeNodo, SALIDA_SI_NO, salidasDe, type FlechaGuardada, type NodoGuardado } from './nodos.js'

/**
 * Traduce el dibujo de un flujo maestro a una definición de `ts-workflow-core`, para que el motor valide con él. Puro: recibe el
 * contenido y devuelve la definición como JSON, sin depender del core.
 *
 * Cómo se lee el dibujo:
 * - Cada **espera** es un estado. Un **fin** al que llega el flujo es un estado final.
 * - Cada **evento** de una espera es una transición desde ese estado, y su `accion` es la acción del sistema que la produce. Una
 *   **interrupción** es una transición desde cualquier estado, con sus excepciones; si no desvía el flujo, no cambia el estado.
 * - Desde el evento se sigue el camino hasta la próxima espera o fin. Lo que hay en el medio se traduce así:
 *   - una **decisión** que por alguna rama lleva a un **rechazo** es un **requisito**: la acción solo se permite por las otras;
 *   - una decisión que lleva a destinos distintos es una **decisión** del core;
 *   - una **función** es un **efecto**, con una condición si no está en todos los caminos;
 *   - un **subflujo** se abre en el lugar: cuenta lo que tiene adentro.
 *
 * Lo que el core no puede expresar no se traduce a medias: queda en `problemas` y no hay definición.
 */

type Json = Record<string, unknown>
/** Una condición del core, o siempre verdadera o siempre falsa. */
type Formula = true | false | Json

export interface OpcionesDeDefinicion {
  id: string
  version: number
  nombre: string
  /** El contenido de un subflujo publicado, por id y versión. Sin él, un nodo de subflujo no se puede traducir. */
  subflujo?: (id: string, version: number) => ContenidoDeFlujo | undefined
}

export interface Traduccion {
  /** La definición del core. Falta si hubo problemas. */
  definicion?: Json
  /** Lo que impidió traducir, dicho para una persona. */
  problemas: string[]
}

const texto = (v: unknown) => JSON.stringify(v)

// ── Condiciones ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Las condiciones que tienen que cumplirse todas, como lista: una `todas` se abre, una sola queda sola. */
const partes = (f: Formula): Json[] => (f === true ? [] : f === false ? [{ no: {} }] : Array.isArray(f['todas']) ? (f['todas'] as Json[]) : [f])
const todas = (lista: Formula[]): Formula => {
  if (lista.includes(false)) return false
  const unicas = [...new Map(lista.flatMap(partes).map((p) => [texto(p), p])).values()]
  return unicas.length === 0 ? true : unicas.length === 1 ? unicas[0]! : { todas: unicas }
}
const alguna = (lista: Formula[]): Formula => {
  if (lista.includes(true)) return true
  const unicas = [...new Map(lista.filter((f): f is Json => f !== false).map((f) => [texto(f), f])).values()]
  return unicas.length === 0 ? false : unicas.length === 1 ? unicas[0]! : { alguna: unicas }
}
const no = (f: Formula): Formula => (f === true ? false : f === false ? true : esObjeto(f['no']) ? f['no'] : { no: f })
const esObjeto = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * «Si se cumple `c`, vale `siSi`; si no, vale `siNo`», lo más simple posible. Lo que piden los dos caminos se saca afuera, así
 * «si lleva tal cosa, además hace falta tal otra» queda como una premisa y no como dos casos repetidos.
 */
function segun(c: Json, siSi: Formula, siNo: Formula): Formula {
  if (texto(siSi) === texto(siNo)) return siSi
  if (siSi === false) return todas([no(c), siNo])
  if (siNo === false) return todas([c, siSi])
  if (siSi === true) return alguna([c, siNo])
  const deSi = partes(siSi)
  const deNo = partes(siNo)
  const comunes = deSi.filter((p) => deNo.some((q) => texto(q) === texto(p)))
  const soloSi = todas(deSi.filter((p) => !comunes.includes(p)))
  const soloNo = todas(deNo.filter((p) => !comunes.some((q) => texto(q) === texto(p))))
  const resto: Formula = soloNo === true ? { si: c, entonces: soloSi } : alguna([todas([c, soloSi]), todas([no(c), soloNo])])
  return todas([...comunes, resto])
}

// ── El recorrido ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Un contenido que se está recorriendo. Si es un subflujo, `alSalir` dice dónde sigue en quien lo llamó, por cada salida. */
interface Marco {
  nodos: Map<string, NodoGuardado>
  flechas: readonly FlechaGuardada[]
  alSalir?: (salida: string) => Lugar | undefined
}
interface Lugar {
  marco: Marco
  id: string
}
/** Dónde termina un camino: en un estado, en un rechazo, o sin mover el flujo de donde estaba. */
type Fin = { tipo: 'estado'; estado: string } | { tipo: 'rechazo' } | { tipo: 'queda' }
interface Camino {
  /** Lo que tiene que darse para que el flujo tome este camino. */
  condicion: Formula
  fin: Fin
  /** Las funciones por las que pasa, en orden, con el id del nodo para reconocer la misma en dos caminos. */
  efectos: { nodo: string; efecto: Json }[]
}

const TOPE = 400

class NoSePuede extends Error {}

const marcoDe = (contenido: ContenidoDeFlujo, alSalir?: Marco['alSalir']): Marco => ({ nodos: new Map(contenido.nodos.map((n) => [n.id, n])), flechas: contenido.flechas, alSalir })

/** A dónde lleva una salida de un nodo. Un nodo con una sola salida acepta una flecha sin salida declarada. */
function destino(marco: Marco, nodo: NodoGuardado, salida: string): Lugar {
  const unica = salidasDe(nodo).length === 1
  const flecha = marco.flechas.find((f) => f.source === nodo.id && (f.sourceHandle === salida || (unica && !f.sourceHandle)))
  if (!flecha) throw new NoSePuede(`${rotuloDeNodo(nodo)} tiene una salida sin conectar.`)
  return { marco, id: flecha.target }
}

export function definicionDeFlujo(contenido: ContenidoDeFlujo, opciones: OpcionesDeDefinicion): Traduccion {
  const problemas: string[] = []
  const raiz = marcoDe(contenido)

  /**
   * Todos los caminos que salen de un lugar, hasta donde cada uno termina. `lateral` dice que el camino no mueve el flujo: ahí un
   * fin solo termina el camino.
   */
  function caminos(lugar: Lugar, lateral: boolean, pasos = 0): Camino[] {
    if (pasos > TOPE) throw new NoSePuede('Hay un camino que da vueltas sin llegar a una espera ni a un fin.')
    const nodo = lugar.marco.nodos.get(lugar.id)
    if (!nodo) throw new NoSePuede('Hay una flecha hacia un nodo que no existe.')
    const sigue = (salida: string) => caminos(destino(lugar.marco, nodo, salida), lateral, pasos + 1)
    const quien = rotuloDeNodo(nodo)

    if (nodo.type === 'evento') {
      if (nodo.data.variante === 'espera') {
        if (lugar.marco !== raiz) throw new NoSePuede(`${quien} está adentro de un subflujo, y un subflujo no puede esperar.`)
        return [{ condicion: true, fin: lateral ? { tipo: 'queda' } : { tipo: 'estado', estado: nodo.id }, efectos: [] }]
      }
      if (nodo.data.variante === 'fin') {
        if (esRechazo(nodo)) return [{ condicion: true, fin: { tipo: 'rechazo' }, efectos: [] }]
        // El fin de un subflujo es una de sus salidas: el camino sigue en quien lo llamó.
        if (lugar.marco.alSalir) {
          const vuelta = lugar.marco.alSalir(nodo.id)
          if (!vuelta) throw new NoSePuede(`La salida «${nodo.data.nombre}» de un subflujo no está conectada.`)
          return caminos(vuelta, lateral, pasos + 1)
        }
        return [{ condicion: true, fin: lateral ? { tipo: 'queda' } : { tipo: 'estado', estado: nodo.id }, efectos: [] }]
      }
      throw new NoSePuede(`A ${quien} le llega una flecha, y es por donde se entra al flujo.`)
    }

    if (nodo.type === 'funcion') {
      if (!nodo.data.capacidad) throw new NoSePuede(`${quien} no tiene elegido qué hace.`)
      const efecto = { efecto: nodo.data.capacidad, ...(nodo.data.params && { params: nodo.data.params }) }
      return sigue('salida').map((c) => ({ ...c, efectos: [{ nodo: nodo.id, efecto }, ...c.efectos] }))
    }

    if (nodo.type === 'decision') {
      // Las ramas se evalúan en orden: cada una vale si se cumple la suya y no se cumplió ninguna de las anteriores.
      const salen: Camino[] = []
      let ninguna: Formula = true
      for (const rama of nodo.data.ramas) {
        if (!rama.condicion) throw new NoSePuede(`${quien}: la rama «${rama.nombre}» no tiene una condición.`)
        const estaRama = todas([ninguna, rama.condicion])
        salen.push(...sigue(rama.id).map((c) => ({ ...c, condicion: todas([estaRama, c.condicion]) })))
        ninguna = todas([ninguna, no(rama.condicion)])
      }
      salen.push(...sigue(SALIDA_SI_NO).map((c) => ({ ...c, condicion: todas([ninguna, c.condicion]) })))
      return salen
    }

    // Un subflujo se recorre por adentro y, al llegar a uno de sus fines, sigue por la salida de ese fin.
    const adentro = opciones.subflujo?.(nodo.data.flujo, nodo.data.version)
    if (!adentro) throw new NoSePuede(`${quien} usa la versión ${nodo.data.version} de «${nodo.data.flujo}», que no está disponible.`)
    const inicio = adentro.nodos.find((n) => n.type === 'evento' && n.data.variante === 'inicio')
    if (!inicio) throw new NoSePuede(`El subflujo de ${quien} no tiene un inicio.`)
    const marco = marcoDe(adentro, (salida) => (lugar.marco.flechas.some((f) => f.source === nodo.id && f.sourceHandle === salida) ? destino(lugar.marco, nodo, salida) : undefined))
    return caminos(destino(marco, inicio, 'salida'), lateral, pasos + 1)
  }

  /** Lo que tiene que cumplirse para que la acción se permita: que el camino no termine en un rechazo. */
  function permitido(lugar: Lugar, pasos = 0): Formula {
    if (pasos > TOPE) return true
    const nodo = lugar.marco.nodos.get(lugar.id)
    if (!nodo) return true
    const sigue = (salida: string) => permitido(destino(lugar.marco, nodo, salida), pasos + 1)
    if (nodo.type === 'funcion') return sigue('salida')
    if (nodo.type === 'decision') return [...nodo.data.ramas].reverse().reduce<Formula>((resto, rama) => segun(rama.condicion ?? {}, sigue(rama.id), resto), sigue(SALIDA_SI_NO))
    if (nodo.type === 'subflujo') {
      const adentro = opciones.subflujo?.(nodo.data.flujo, nodo.data.version)
      const inicio = adentro?.nodos.find((n) => n.type === 'evento' && n.data.variante === 'inicio')
      if (!adentro || !inicio) return true
      const marco = marcoDe(adentro, (salida) => destino(lugar.marco, nodo, salida))
      return permitido(destino(marco, inicio, 'salida'), pasos + 1)
    }
    if (nodo.data.variante === 'fin' && !esRechazo(nodo) && lugar.marco.alSalir) {
      const vuelta = lugar.marco.alSalir(nodo.id)
      return vuelta ? permitido(vuelta, pasos + 1) : true
    }
    return !esRechazo(nodo)
  }

  const estados = new Map<string, Json>()
  const decisiones: Json[] = []
  const transiciones: { id: string; desde: string[] | '*'; cuerpo: Json }[] = []
  const anotarEstado = (id: string) => {
    const nodo = raiz.nodos.get(id)
    if (!nodo || estados.has(id)) return
    estados.set(id, { id, nombre: nodo.data.nombre, ...(nodo.type === 'evento' && nodo.data.variante === 'fin' && { final: true }) })
  }

  /** Arma la transición de un evento: sus requisitos, a dónde lleva y qué efectos tiene. */
  function transicion(id: string, nombre: string, accion: string | undefined, desde: string[] | '*', excepto: readonly string[] | undefined, primero: Lugar, lateral: boolean) {
    try {
      if (!accion) throw new NoSePuede(`«${nombre}» no tiene elegida la acción que lo produce.`)
      const todos = caminos(primero, lateral)
      const siguen = todos.filter((c) => c.fin.tipo !== 'rechazo')
      const requisitos = permitido(primero)
      if (siguen.length === 0 || requisitos === false) throw new NoSePuede(`«${nombre}» siempre termina en un rechazo: no se puede hacer nunca.`)

      // A dónde lleva. Si todos los caminos llegan al mismo lugar, es ese; si no, hace falta una decisión del core.
      const lugares = [...new Set(siguen.map((c) => texto(c.fin)))]
      let hacia: string | undefined
      if (lugares.length === 1) {
        const fin = siguen[0]!.fin
        if (fin.tipo === 'estado') hacia = fin.estado
      } else {
        if (siguen.some((c) => c.fin.tipo !== 'estado')) throw new NoSePuede(`«${nombre}» a veces cambia de lugar y a veces no: el motor no lo puede expresar.`)
        // El último camino queda como «si no»: como los caminos cubren todos los casos, es el que vale cuando ninguno de los otros.
        const ramas = siguen.slice(0, -1).map((c) => ({ si: c.condicion === true ? {} : c.condicion, hacia: (c.fin as { estado: string }).estado }))
        hacia = `${id}-destino`
        decisiones.push({ id: hacia, nombre: `¿A dónde lleva «${nombre}»?`, ramas, sino: (siguen.at(-1)!.fin as { estado: string }).estado })
      }
      for (const c of siguen) if (c.fin.tipo === 'estado') anotarEstado(c.fin.estado)

      // Los efectos, en el orden en que aparecen. Uno que no está en todos los caminos lleva la condición de los que sí.
      const vistos = new Map<string, Json>()
      for (const c of siguen) for (const e of c.efectos) if (!vistos.has(e.nodo)) vistos.set(e.nodo, e.efecto)
      const efectos = [...vistos].map(([nodo, efecto]) => {
        const con = siguen.filter((c) => c.efectos.some((e) => e.nodo === nodo))
        const cuando = con.length === siguen.length ? true : alguna(con.map((c) => c.condicion))
        return cuando === true ? efecto : { ...efecto, si: cuando }
      })

      transiciones.push({
        id,
        desde,
        cuerpo: { accion, nombre, ...(excepto?.length && { excepto: [...excepto] }), ...(hacia && { hacia }), ...(requisitos !== true && { requisitos }), ...(efectos.length > 0 && { efectos }) },
      })
    } catch (e) {
      if (!(e instanceof NoSePuede)) throw e
      problemas.push(e.message)
    }
  }

  const inicios = contenido.nodos.filter((n) => n.type === 'evento' && n.data.variante === 'inicio')
  let estadoInicial: string | undefined
  if (inicios.length !== 1) problemas.push(inicios.length === 0 ? 'El flujo no tiene un inicio.' : 'El flujo tiene más de un inicio, y el motor arranca en un solo estado.')
  else {
    try {
      const primero = raiz.nodos.get(destino(raiz, inicios[0]!, 'salida').id)
      if (primero?.type === 'evento' && primero.data.variante === 'espera') {
        estadoInicial = primero.id
        anotarEstado(primero.id)
      } else problemas.push('El inicio tiene que llevar directo a una espera: es el estado en el que arranca.')
    } catch (e) {
      if (!(e instanceof NoSePuede)) throw e
      problemas.push(e.message)
    }
  }

  for (const nodo of contenido.nodos) {
    if (nodo.type !== 'evento') continue
    try {
      if (nodo.data.variante === 'espera') {
        anotarEstado(nodo.id)
        for (const evento of nodo.data.eventos ?? []) transicion(evento.id, evento.nombre, evento.accion, [nodo.id], undefined, destino(raiz, nodo, evento.id), false)
      } else if (nodo.data.variante === 'interrupcion') {
        transicion(nodo.id, nodo.data.nombre, nodo.data.accion, '*', nodo.data.excepto, destino(raiz, nodo, 'salida'), nodo.data.lateral === true)
      }
    } catch (e) {
      if (!(e instanceof NoSePuede)) throw e
      problemas.push(e.message)
    }
  }

  // El mismo evento en varias esperas, si hace lo mismo, es una sola transición desde todas. Si no, cada una con su id.
  const juntas: Json[] = []
  for (const t of transiciones) {
    const igual = t.desde !== '*' && (juntas.find((j) => j['id'] === t.id && Array.isArray(j['desde']) && texto({ ...j, desde: 0 }) === texto({ id: t.id, ...t.cuerpo, desde: 0 })) as { desde: string[] } | undefined)
    if (igual) igual.desde.push(...(t.desde as string[]))
    else juntas.push({ id: juntas.some((j) => j['id'] === t.id) ? `${t.id}-${(t.desde as string[])[0]}` : t.id, ...t.cuerpo, desde: t.desde === '*' ? '*' : [...t.desde] })
  }

  if (problemas.length > 0) return { problemas: [...new Set(problemas)] }
  return {
    problemas: [],
    definicion: { id: opciones.id, version: opciones.version, nombre: opciones.nombre, estadoInicial, estados: [...estados.values()], ...(decisiones.length > 0 && { decisiones }), transiciones: juntas },
  }
}
