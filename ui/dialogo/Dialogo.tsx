import { useEffect, useId, useRef, type ReactNode } from 'react'
import '../tema.css'
import './dialogo.css'

export interface DialogoProps {
  abierta: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
  /** Los botones de abajo. Sin ellos, la ventana solo tiene «Cerrar» arriba. */
  acciones?: ReactNode
}

/** Una ventana modal. Se cierra con «Cerrar», con Esc o haciendo click afuera. */
export function Dialogo({ abierta, onCerrar, titulo, children, acciones }: DialogoProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
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
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      // El click que llega al propio diálogo es el del fondo: el contenido lo tapa entero.
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="wf-dialogo-contenido">
        <header>
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="wf-dialogo-cerrar" onClick={onCerrar}>
            Cerrar
          </button>
        </header>
        {abierta && children}
        {acciones && <footer>{acciones}</footer>}
      </div>
    </dialog>
  )
}
