import { useEffect, useId, useRef } from 'react'
import '../tema.css'
import './configuracion.css'
import { AJUSTES, type Preferencias } from './preferencias'

export interface ConfiguracionProps {
  abierta: boolean
  onCerrar: () => void
  preferencias: Preferencias
  onCambio: (cambio: Partial<Preferencias>) => void
}

/** La ventana de configuración: una lista de ajustes con sus opciones. Cada cambio vale en el momento. Se cierra con Esc o desde afuera. */
export function Configuracion({ abierta, onCerrar, preferencias, onCambio }: ConfiguracionProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const titulo = useId()
  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (abierta && !d.open) d.showModal()
    if (!abierta && d.open) d.close()
  }, [abierta])

  return (
    <dialog
      ref={dialogo}
      className="wf-dialogo"
      aria-labelledby={titulo}
      onClose={onCerrar}
      // El click que llega al propio diálogo es el del fondo: el contenido lo tapa entero.
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="wf-dialogo-contenido">
        <header>
          <h2 id={titulo}>Configuración</h2>
          <button type="button" onClick={onCerrar}>
            Cerrar
          </button>
        </header>
        {AJUSTES.map((ajuste) => (
          <fieldset key={ajuste.clave}>
            <legend>{ajuste.titulo}</legend>
            {ajuste.opciones.map((opcion) => (
              <label key={opcion.valor} className="wf-opcion">
                <input
                  type="radio"
                  name={`${titulo}-${ajuste.clave}`}
                  checked={preferencias[ajuste.clave] === opcion.valor}
                  // Las opciones salen de AJUSTES, que solo lista valores válidos de cada preferencia.
                  onChange={() => onCambio({ [ajuste.clave]: opcion.valor } as Partial<Preferencias>)}
                />
                <span>
                  <strong>{opcion.nombre}</strong>
                  <small>{opcion.detalle}</small>
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </dialog>
  )
}
