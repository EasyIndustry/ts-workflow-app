import { useId, type ComponentProps, type ReactNode } from 'react'
import '../tema.css'
import './formulario.css'

/** Un campo de formulario: la etiqueta, el control que arma `children` con el id que recibe, y una ayuda opcional debajo. */
export function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="wf-campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children(id)}
      {ayuda && <p className="wf-campo-ayuda">{ayuda}</p>}
    </div>
  )
}

/** Una entrada de texto. */
export function Entrada(props: ComponentProps<'input'>) {
  return <input {...props} className="wf-control" />
}

/** Una lista desplegable, para pocas opciones. */
export function Lista(props: ComponentProps<'select'>) {
  return <select {...props} className="wf-control" />
}
