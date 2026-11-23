import '../tema.css'
import './flujos.css'

/** Cómo está lo que se ve en el lienzo respecto de lo guardado. */
export type EstadoDeGuardado = 'sin-cambios' | 'guardando' | 'borrador' | 'error'

export interface BarraDeFlujoProps {
  nombre: string
  /** La versión vigente. Sin número, nunca se publicó. */
  version?: number
  estado: EstadoDeGuardado
  onVolver: () => void
  /** Sin esta función, la persona no puede publicar y el botón no aparece. */
  onPublicar?: () => void
}

function texto(estado: EstadoDeGuardado, version?: number): string {
  if (estado === 'guardando') return 'Guardando…'
  if (estado === 'error') return 'No se pudo guardar'
  if (estado === 'borrador') return version ? `Borrador guardado · vigente: versión ${version}` : 'Borrador guardado · sin publicar'
  return version ? `Versión ${version} vigente` : 'Sin publicar'
}

/**
 * La barra de arriba del editor: volver a la lista, el nombre del flujo, cómo está el guardado y publicar. El borrador se guarda
 * solo; publicar es la única decisión que toma la persona, y solo se puede con un borrador ya guardado.
 */
export function BarraDeFlujo({ nombre, version, estado, onVolver, onPublicar }: BarraDeFlujoProps) {
  return (
    <header className="wf-barra-flujo">
      <button type="button" className="wf-boton" onClick={onVolver}>
        ← Flujos
      </button>
      <strong>{nombre}</strong>
      <span className={estado === 'error' ? 'wf-barra-flujo-estado wf-barra-flujo-error' : 'wf-barra-flujo-estado'} role="status">
        {texto(estado, version)}
      </span>
      {onPublicar && (
        <button type="button" className="wf-boton wf-boton-principal" onClick={onPublicar} disabled={estado !== 'borrador'}>
          Publicar
        </button>
      )}
    </header>
  )
}
