import { useReactFlow } from '@xyflow/react'
import { useEffect, useState } from 'react'
import { contenidoDe } from '../flujos/almacen'
import { Campo, Lista } from '../formulario/Campo'
import type { NodoDeFlujo } from '../nodos'
import { rotuloDeNodo } from '../nodos/descripcion'
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
  /** Quién resuelve cada nodo durante la prueba. */
  ejecutor: Ejecutor
  /** Registros para elegir como entrada. Los pasa quien monta la app. */
  registros?: readonly RegistroDePrueba[]
  onCerrar: () => void
}

const bonito = (valor: unknown) => JSON.stringify(valor ?? {}, null, 2)

/**
 * El panel para probar el flujo que está en el lienzo. Tres sectores apilados que se abren y se cierran: la entrada (un registro o
 * los datos a mano), la salida (con qué terminó, o el error) y la traza (cada nodo por el que pasó). «Probar» corre todo; «Paso a
 * paso» resuelve un nodo por vez. Mientras tanto marca en el lienzo por dónde va. Va al lado del lienzo, adentro de su proveedor.
 */
export function PanelDePrueba({ ejecutor, registros = [], onCerrar }: PanelDePruebaProps) {
  const { getNodes, getEdges, updateNode } = useReactFlow<NodoDeFlujo>()
  const [registro, setRegistro] = useState(registros[0]?.id ?? '')
  const [texto, setTexto] = useState(() => bonito(registros[0]?.datos))
  const [entradaMal, setEntradaMal] = useState(false)
  const [recorrido, setRecorrido] = useState<Recorrido | null>(null)
  const [corriendo, setCorriendo] = useState(false)

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

  async function probar() {
    const listo = preparar()
    if (!listo) return
    setCorriendo(true)
    let r = iniciar(listo.contenido)
    setRecorrido(r)
    while (sigue(r)) {
      r = await avanzar(listo.contenido, r, listo.entrada, ejecutor)
      setRecorrido(r)
    }
    setCorriendo(false)
  }

  async function unPaso() {
    const listo = preparar()
    if (!listo) return
    setCorriendo(true)
    // Si no hay una prueba a medias, arranca una y queda parada en el inicio: el primer paso solo muestra dónde empieza.
    if (!recorrido || !sigue(recorrido)) setRecorrido(iniciar(listo.contenido))
    else setRecorrido(await avanzar(listo.contenido, recorrido, listo.entrada, ejecutor))
    setCorriendo(false)
  }

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
        <button type="button" className="wf-prueba-boton wf-prueba-principal" onClick={() => void probar()} disabled={corriendo}>
          ▶ Probar
        </button>
        <button type="button" className="wf-prueba-boton" onClick={() => void unPaso()} disabled={corriendo}>
          Paso a paso
        </button>
        <button type="button" className="wf-prueba-boton" onClick={() => setRecorrido(null)} disabled={corriendo || !recorrido}>
          Reiniciar
        </button>
      </div>
      <p className="wf-prueba-estado" role="status">
        {!recorrido && 'Todavía no se probó.'}
        {recorrido && sigue(recorrido) && (corriendo ? 'Probando…' : `En pausa. Sigue: ${siguiente ? rotuloDeNodo(siguiente) : 'el próximo nodo'}.`)}
        {recorrido?.estado === 'terminado' && `Terminó en «${recorrido.resultado?.fin}», en ${recorrido.traza.length} pasos.`}
        {recorrido?.estado === 'error' && 'Se detuvo por un error.'}
      </p>

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
