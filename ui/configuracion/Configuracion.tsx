import { useId } from 'react'
import { Dialogo } from '../dialogo/Dialogo'
import './configuracion.css'
import { AJUSTES, type Preferencias } from './preferencias'

export interface ConfiguracionProps {
  abierta: boolean
  onCerrar: () => void
  preferencias: Preferencias
  onCambio: (cambio: Partial<Preferencias>) => void
}

/** La ventana de configuración: una lista de ajustes con sus opciones. Cada cambio vale en el momento. */
export function Configuracion({ abierta, onCerrar, preferencias, onCambio }: ConfiguracionProps) {
  const grupo = useId()
  return (
    <Dialogo abierta={abierta} onCerrar={onCerrar} titulo="Configuración">
      {AJUSTES.map((ajuste) => (
        <fieldset key={ajuste.clave} className="wf-ajuste">
          <legend>{ajuste.titulo}</legend>
          {ajuste.opciones.map((opcion) => (
            <label key={opcion.valor} className="wf-opcion">
              <input
                type="radio"
                name={`${grupo}-${ajuste.clave}`}
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
    </Dialogo>
  )
}
