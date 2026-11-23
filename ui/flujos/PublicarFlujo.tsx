import { Dialogo } from '../dialogo/Dialogo'
import type { Diferencias } from './comparar'
import './flujos.css'
import type { Problema } from './verificar'

export interface PublicarFlujoProps {
  abierta: boolean
  onCerrar: () => void
  onPublicar: () => void
  nombre: string
  /** La versión vigente. Sin número, es la primera publicación. */
  version?: number
  problemas: readonly Problema[]
  diferencias: Diferencias
  /** Se está publicando: el botón espera. */
  publicando?: boolean
  /** El sistema no dejó publicar: por qué, y los problemas que encontró, si los dijo. */
  rechazo?: { mensaje: string; problemas?: readonly { mensaje: string }[] }
  /** Ya se publicó, y el sistema tiene algo que avisar: la ventana queda abierta para mostrarlo. */
  publicado?: { version: number; avisos: readonly string[] }
}

function Grupo({ titulo, lineas, clase }: { titulo: string; lineas: readonly string[]; clase: string }) {
  if (lineas.length === 0) return null
  return (
    <>
      <h4>{titulo}</h4>
      <ul className={clase}>
        {lineas.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </>
  )
}

/**
 * La ventana que se abre antes de publicar: qué se verificó y qué cambia respecto de la versión vigente. Con un error no se puede
 * publicar. No calcula nada: muestra lo que le pasan.
 */
export function PublicarFlujo({ abierta, onCerrar, onPublicar, nombre, version, problemas, diferencias: d, publicando = false, rechazo, publicado }: PublicarFlujoProps) {
  if (publicado) {
    return (
      <Dialogo
        abierta={abierta}
        onCerrar={onCerrar}
        titulo={`Se publicó «${nombre}»`}
        acciones={
          <button type="button" className="wf-boton wf-boton-principal" onClick={onCerrar}>
            Entendido
          </button>
        }
      >
        <div className="wf-publicar">
          <p className="wf-publicar-bien">✓ Quedó vigente la versión {publicado.version}.</p>
          <Grupo titulo="Para tener en cuenta" lineas={publicado.avisos} clase="wf-publicar-avisos" />
        </div>
      </Dialogo>
    )
  }
  const errores = problemas.filter((p) => p.nivel === 'error')
  const avisos = problemas.filter((p) => p.nivel === 'aviso')
  const nada = !d.hayCambios && d.movidos === 0
  return (
    <Dialogo
      abierta={abierta}
      onCerrar={onCerrar}
      titulo={`Publicar «${nombre}»`}
      acciones={
        <>
          <button type="button" className="wf-boton" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="button" className="wf-boton wf-boton-principal" onClick={onPublicar} disabled={errores.length > 0 || nada || publicando}>
            {publicando ? 'Publicando…' : version ? `Publicar la versión ${version + 1}` : 'Publicar la versión 1'}
          </button>
        </>
      }
    >
      <div className="wf-publicar">
        {rechazo && (
          <section className="wf-publicar-rechazo" role="alert">
            <p className="wf-publicar-mal">No se publicó. {rechazo.mensaje}</p>
            {rechazo.problemas && rechazo.problemas.length > 0 && (
              <ul className="wf-publicar-errores">
                {[...new Set(rechazo.problemas.map((p) => p.mensaje))].map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </section>
        )}
        <p className="wf-publicar-resumen">
          {version
            ? `Hoy está vigente la versión ${version}. Lo que ya está en curso sigue con su versión; lo nuevo arranca con la ${version + 1}.`
            : 'Es la primera publicación de este flujo.'}
        </p>

        <section>
          <h3>Verificación</h3>
          {problemas.length === 0 && <p className="wf-publicar-bien">✓ El flujo está completo.</p>}
          {errores.length > 0 && (
            <>
              <p className="wf-publicar-mal">
                {errores.length === 1 ? 'Hay 1 problema que impide publicar:' : `Hay ${errores.length} problemas que impiden publicar:`}
              </p>
              <ul className="wf-publicar-errores">
                {errores.map((p) => (
                  <li key={p.mensaje + (p.nodo ?? '')}>{p.mensaje}</li>
                ))}
              </ul>
            </>
          )}
          <Grupo titulo="Para revisar (no impide publicar)" lineas={avisos.map((p) => p.mensaje)} clase="wf-publicar-avisos" />
        </section>

        <section>
          <h3>{version ? `Cambios respecto de la versión ${version}` : 'Qué tiene'}</h3>
          {nada && <p className="wf-publicar-nada">No hay cambios.</p>}
          <Grupo titulo="Nodos agregados" lineas={d.agregados} clase="wf-publicar-mas" />
          <Grupo titulo="Nodos quitados" lineas={d.quitados} clase="wf-publicar-menos" />
          {d.cambiados.length > 0 && (
            <>
              <h4>Nodos cambiados</h4>
              <ul className="wf-publicar-cambios">
                {d.cambiados.map((c) => (
                  <li key={c.nodo}>
                    {c.nodo}
                    <ul>
                      {c.cambios.map((linea) => (
                        <li key={linea}>{linea}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Grupo titulo="Flechas agregadas" lineas={d.flechasAgregadas} clase="wf-publicar-mas" />
          <Grupo titulo="Flechas quitadas" lineas={d.flechasQuitadas} clase="wf-publicar-menos" />
          {d.movidos > 0 && (
            <p className="wf-publicar-nada">
              {d.movidos === 1 ? 'Se movió 1 nodo de lugar.' : `Se movieron ${d.movidos} nodos de lugar.`} No cambia cómo funciona el flujo.
            </p>
          )}
        </section>
      </div>
    </Dialogo>
  )
}
