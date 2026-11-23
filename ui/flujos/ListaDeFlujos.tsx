import { useState } from 'react'
import { Entrada } from '../formulario/Campo'
import '../tema.css'
import type { ResumenDeFlujo } from './almacen'
import './flujos.css'

export interface ListaDeFlujosProps {
  flujos: readonly ResumenDeFlujo[]
  onAbrir: (id: string) => void
  onCrear: (nombre: string) => void
}

/** El estado de un flujo, dicho en una línea. */
export function estadoDeFlujo(f: Pick<ResumenDeFlujo, 'version' | 'conBorrador'>): string {
  if (!f.version) return 'Sin publicar'
  return f.conBorrador ? `Versión ${f.version} vigente · con cambios sin publicar` : `Versión ${f.version} vigente`
}

/** La lista de flujos: abrir uno o crear uno nuevo. No guarda nada: avisa lo que la persona pidió. */
export function ListaDeFlujos({ flujos, onAbrir, onCrear }: ListaDeFlujosProps) {
  const [nombre, setNombre] = useState('')
  return (
    <div className="wf-flujos">
      <h1>Flujos</h1>
      <form
        className="wf-flujos-nuevo"
        onSubmit={(e) => {
          e.preventDefault()
          if (!nombre.trim()) return
          onCrear(nombre.trim())
          setNombre('')
        }}
      >
        <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del flujo nuevo" aria-label="Nombre del flujo nuevo" />
        <button type="submit" className="wf-boton wf-boton-principal" disabled={!nombre.trim()}>
          Crear flujo
        </button>
      </form>
      {flujos.length === 0 ? (
        <p className="wf-flujos-vacio">Todavía no hay flujos.</p>
      ) : (
        <ul className="wf-flujos-lista">
          {flujos.map((f) => (
            <li key={f.id}>
              <button type="button" onClick={() => onAbrir(f.id)}>
                <strong>{f.nombre}</strong>
                <small>{estadoDeFlujo(f)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
