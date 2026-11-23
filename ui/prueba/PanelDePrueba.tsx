import { useReactFlow } from '@xyflow/react'
import { useEffect, useState } from 'react'
import { contenidoDe } from '../flujos/almacen'
import { Campo, Lista } from '../formulario/Campo'
import type { NodoDeFlujo } from '../nodos'
import { rotuloDeNodo, salidasDe } from '../nodos/descripcion'
import '../tema.css'
import './prueba.css'
import { avanzar, iniciar, sigue, type Ejecutor, type Recorrido } from './recorrido'

/** Un registro con el que probar: lo que la persona elige en vez de escribir los datos a mano. */
export interface RegistroDePrueba {
  id: string
  titulo: string
  datos: unknown
}

export interface PanelDePruebaProps {
  /**
   * Quién resuelve cada nodo durante la prueba. Sin él, la prueba es un ensayo manual: no ejecuta nada y, en cada nodo con más de
   * una salida, la persona elige por dónde sigue.
   */
  ejecutor?: Ejecutor
  /** Registros para elegir como entrada. Los pasa quien monta la app. */
  registros?: readonly RegistroDePrueba[]
  onCerrar: () => void
}

const bonito = (valor: unknown) => JSON.stringify(valor ?? {}, null, 2)

/**
 * El panel para probar el flujo que está en el lienzo. Tres sectores apilados que se abren y se cierran: la entrada (un registro o
 * los datos a mano), la salida (con qué terminó, o el error) y la traza (cada nodo por el que pasó). «Probar» corre todo; los
 * botones de doble triángulo van un paso atrás o adelante. Mientras tanto marca en el lienzo por dónde va. Va al lado del lienzo,
 * adentro de su proveedor.
 */
export function PanelDePrueba({ ejecutor, registros = [], onCerrar }: PanelDePruebaProps) {
  const { getNodes, getEdges, updateNode } = useReactFlow<NodoDeFlujo>()
  const [registro, setRegistro] = useState(registros[0]?.id ?? '')
  const [texto, setTexto] = useState(() => bonito(registros[0]?.datos))
  const [entradaMal, setEntradaMal] = useState(false)
  // Cada estado por el que pasó la prueba, para poder volver atrás sin ejecutar nada de nuevo.
  const [historia, setHistoria] = useState<readonly Recorrido[]>([])
  const [indice, setIndice] = useState(0)
  const recorrido = historia[indice] ?? null
  const [corriendo, setCorriendo] = useState(false)
  const manual = !ejecutor

  // Marca en el lienzo por dónde va la prueba. La marca es solo de la pantalla: no se guarda con el flujo.
  useEffect(() => {
    const hechos = new Set(recorrido?.traza.map((p) => p.nodo))
    for (const n of getNodes()) {
      const clase = n.id === recorrido?.falloEn ? 'wf-prueba-error' : n.id === recorrido?.actual ? 'wf-prueba-actual' : hechos.has(n.id) ? 'wf-prueba-hecho' : ''
      if ((n.className ?? '') !== clase) updateNode(n.id, { className: clase })
    }
  }, [recorrido, getNodes, updateNode])
  useEffect(
    () => () => {
      for (const n of getNodes()) if (n.className) updateNode(n.id, { className: '' })
    },
    [getNodes, updateNode],
  )

  function preparar(): { contenido: ReturnType<typeof contenidoDe>; entrada: unknown } | null {
    try {
      const entrada: unknown = JSON.parse(texto || '{}')
      setEntradaMal(false)
      return { contenido: contenidoDe(getNodes(), getEdges()), entrada }
    } catch {
      setEntradaMal(true)
      return null
    }
  }

  /** En un ensayo manual, las salidas entre las que hay que elegir para seguir desde donde está parado. */
  function porElegir(r: Recorrido | null): readonly { id: string; nombre?: string }[] {
    if (!manual || !r || !sigue(r)) return []
    const nodo = getNodes().find((n) => n.id === r.actual)
    const salidas = nodo ? salidasDe(nodo) : []
    return salidas.length > 1 ? salidas : []
  }

  /** Avanza desde el último estado de `pasos` hasta que termine, falle o haya que elegir. `salida` es la elección para el primer paso. */
  async function correr(listo: NonNullable<ReturnType<typeof preparar>>, pasos: readonly Recorrido[], salida?: string) {
    setCorriendo(true)
    let todos = pasos
    const mostrar = () => {
      setHistoria(todos)
      setIndice(todos.length - 1)
    }
    mostrar()
    let elegida = salida
    for (let r = todos.at(-1)!; sigue(r) && (elegida !== undefined || porElegir(r).length === 0); ) {
      const tomar = elegida
      elegida = undefined
      r = await avanzar(listo.contenido, r, listo.entrada, ejecutor ?? (async () => (tomar === undefined ? {} : { salida: tomar })))
      todos = [...todos, r]
      mostrar()
    }
    setCorriendo(false)
  }

  async function probar() {
    const listo = preparar()
    if (listo) await correr(listo, [iniciar(listo.contenido)])
  }

  /** Sigue por la salida que eligió la persona, y de ahí hasta la próxima elección. */
  async function elegir(salida: string) {
    const listo = preparar()
    if (listo && recorrido) await correr(listo, historia.slice(0, indice + 1), salida)
  }

  /** Un paso adelante. Si ya se había pasado por ahí, lo vuelve a mostrar; si no, resuelve el nodo que sigue. */
  async function adelante() {
    if (indice < historia.length - 1) return setIndice(indice + 1)
    const listo = preparar()
    if (!listo) return
    // Sin una prueba empezada, el primer paso la deja parada en el inicio.
    if (!recorrido) {
      setHistoria([iniciar(listo.contenido)])
      setIndice(0)
      return
    }
    setCorriendo(true)
    const nuevo = await avanzar(listo.contenido, recorrido, listo.entrada, ejecutor ?? (async () => ({})))
    setHistoria([...historia, nuevo])
    setIndice(historia.length)
    setCorriendo(false)
  }

  const enElUltimo = indice >= historia.length - 1
  const opciones = enElUltimo && !corriendo ? porElegir(recorrido) : []
  const puedeAdelante = !corriendo && opciones.length === 0 && (!recorrido || !enElUltimo || sigue(recorrido))
  const siguiente = recorrido?.actual && getNodes().find((n) => n.id === recorrido.actual)
  return (
    <aside className="wf-prueba" aria-label="Probar el flujo">
      <header>
        <h2>Probar el flujo</h2>
        <button type="button" className="wf-prueba-boton" onClick={onCerrar}>
          Cerrar
        </button>
      </header>
      <div className="wf-prueba-controles">
        <button type="button" className="wf-prueba-boton" onClick={() => setIndice(indice - 1)} disabled={corriendo || indice === 0} aria-label="Un paso atrás" title="Un paso atrás">
          ◀◀
        </button>
        <button type="button" className="wf-prueba-boton wf-prueba-principal" onClick={() => void probar()} disabled={corriendo}>
          ▶ Probar
        </button>
        <button type="button" className="wf-prueba-boton" onClick={() => void adelante()} disabled={!puedeAdelante} aria-label="Un paso adelante" title="Un paso adelante">
          ▶▶
        </button>
        <button type="button" className="wf-prueba-boton" onClick={() => setHistoria([])} disabled={corriendo || !recorrido}>
          Reiniciar
        </button>
      </div>
      <p className="wf-prueba-estado" role="status">
        {!recorrido && 'Todavía no se probó.'}
        {recorrido && sigue(recorrido) && (corriendo && enElUltimo ? 'Probando…' : `En pausa en ${siguiente ? rotuloDeNodo(siguiente) : 'el próximo nodo'}.`)}
        {recorrido?.estado === 'terminado' && `Terminó en «${recorrido.resultado?.fin}», en ${recorrido.traza.length} pasos.`}
        {recorrido?.estado === 'error' && 'Se detuvo por un error.'}
      </p>

      {manual && <p className="wf-prueba-nota">Ensayo manual: no ejecuta nada. En cada nodo con más de una salida, elegís por dónde sigue.</p>}
      {opciones.length > 0 && (
        <div className="wf-prueba-eleccion" role="group" aria-label="Por dónde sigue">
          <strong>¿Por dónde sigue?</strong>
          {opciones.map((o) => (
            <button key={o.id} type="button" className="wf-prueba-boton" onClick={() => void elegir(o.id)}>
              {o.nombre ?? o.id}
            </button>
          ))}
        </div>
      )}

      <details open>
        <summary>Entrada</summary>
        <div className="wf-prueba-sector">
          {registros.length > 0 && (
            <Campo etiqueta="Registro">
              {(id) => (
                <Lista
                  id={id}
                  value={registro}
                  onChange={(e) => {
                    setRegistro(e.target.value)
                    const elegido = registros.find((r) => r.id === e.target.value)
                    if (elegido) setTexto(bonito(elegido.datos))
                  }}
                >
                  {registros.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.titulo}
                    </option>
                  ))}
                  <option value="">Datos a mano</option>
                </Lista>
              )}
            </Campo>
          )}
          <Campo etiqueta="Datos de entrada (JSON)">
            {(id) => (
              <textarea
                id={id}
                className="wf-prueba-json"
                rows={8}
                spellCheck={false}
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value)
                  setRegistro('')
                }}
              />
            )}
          </Campo>
          {entradaMal && <p className="wf-prueba-error">Los datos de entrada no son un JSON válido.</p>}
        </div>
      </details>

      <details open>
        <summary>Salida</summary>
        <div className="wf-prueba-sector">
          {recorrido?.error && <p className="wf-prueba-error">{recorrido.error}</p>}
          {recorrido?.resultado && <pre className="wf-prueba-json">{bonito(recorrido.resultado)}</pre>}
          {recorrido && !recorrido.resultado && recorrido.traza.length > 0 && (
            <>
              <p className="wf-prueba-nota">Lo que produjo hasta acá:</p>
              <pre className="wf-prueba-json">{bonito(recorrido.pasos)}</pre>
            </>
          )}
          {(!recorrido || (!recorrido.error && recorrido.traza.length === 0)) && <p className="wf-prueba-nota">Acá va a aparecer con qué terminó el flujo, o el error.</p>}
        </div>
      </details>

      <details open>
        <summary>Traza{recorrido && recorrido.traza.length > 0 ? ` · ${recorrido.traza.length}` : ''}</summary>
        <div className="wf-prueba-sector">
          {(!recorrido || recorrido.traza.length === 0) && <p className="wf-prueba-nota">Acá va a aparecer cada nodo por el que pasó.</p>}
          <ol className="wf-prueba-traza">
            {recorrido?.traza.map((p, i) => (
              <li key={i} className={p.error ? 'wf-prueba-paso-mal' : undefined}>
                <details>
                  <summary>
                    {p.rotulo}
                    <small>
                      {p.error ? 'falló' : p.salida ? `siguió por «${p.salida}»` : 'bien'} · {p.ms} ms
                    </small>
                  </summary>
                  {p.error ? <p className="wf-prueba-error">{p.error}</p> : <pre className="wf-prueba-json">{bonito(p.datos)}</pre>}
                </details>
              </li>
            ))}
          </ol>
        </div>
      </details>
    </aside>
  )
}
