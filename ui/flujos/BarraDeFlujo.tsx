import '../tema.css'
import './flujos.css'

/** Cómo está lo que se ve en el lienzo respecto de lo guardado. */
export type EstadoDeGuardado = 'sin-cambios' | 'sin-guardar' | 'guardando' | 'borrador' | 'error'

export interface BarraDeFlujoProps {
  nombre: string
  /** La versión vigente. Sin número, nunca se publicó. */
  version?: number
  estado: EstadoDeGuardado
  onVolver: () => void
  /** Guarda el borrador ahora. No publica. */
  onGuardar: () => void
  /** Si en el lienzo hay algo distinto de lo guardado. */
  hayCambiosSinGuardar: boolean
  /** Sin esta función, la persona no puede publicar y el botón no aparece. */
  onPublicar?: () => void
}

function texto(estado: EstadoDeGuardado, version?: number): string {
  if (estado === 'guardando') return 'Guardando…'
  if (estado === 'error') return 'No se pudo guardar'
  if (estado === 'sin-guardar') return 'Cambios sin guardar'
  if (estado === 'borrador') return version ? `Borrador guardado · vigente: versión ${version}` : 'Borrador guardado · sin publicar'
  return version ? `Versión ${version} vigente` : 'Sin publicar'
}

/**
 * La barra de arriba del editor: volver a la lista, el nombre del flujo, cómo está el guardado, guardar y publicar. Guardar deja un
 * borrador y no cambia nada de lo que está en uso; publicar sí, y solo se puede con el borrador ya guardado.
 */
export function BarraDeFlujo({ nombre, version, estado, onVolver, onGuardar, hayCambiosSinGuardar, onPublicar }: BarraDeFlujoProps) {
  return (
    <header className="wf-barra-flujo">
      <button type="button" className="wf-boton" onClick={onVolver}>
        ← Flujos
      </button>
      <strong>{nombre}</strong>
      <span className={estado === 'error' ? 'wf-barra-flujo-estado wf-barra-flujo-error' : 'wf-barra-flujo-estado'} role="status">
        {texto(estado, version)}
      </span>
      <button type="button" className="wf-boton" onClick={onGuardar} disabled={!hayCambiosSinGuardar}>
        Guardar
      </button>
      {onPublicar && (
        <button type="button" className="wf-boton wf-boton-principal" onClick={onPublicar} disabled={estado !== 'borrador'}>
          Publicar
        </button>
      )}
    </header>
  )
}
