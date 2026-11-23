import { useEffect, useState } from 'react'
import { Editor } from '../editor/Editor'
import type { Capacidad } from '../inspector/Inspector'
import type { Almacen, ContenidoDeFlujo, FlujoAbierto, ResumenDeFlujo } from './almacen'
import { Autoguardado } from './Autoguardado'
import { BarraDeFlujo } from './BarraDeFlujo'
import './flujos.css'
import { ListaDeFlujos } from './ListaDeFlujos'

export interface AppDeFlujosProps {
  /** Dónde viven los flujos. */
  almacen: Almacen
  /** Las capacidades del registro, para elegir qué hace cada función. */
  capacidades: readonly Capacidad[]
  /** Si esta persona puede publicar. Lo decide el sistema que monta la app. */
  puedePublicar?: boolean
}

/**
 * La app entera: la lista de flujos y, al abrir uno, el editor con su barra. El borrador se guarda solo mientras se edita; publicar
 * lo convierte en la versión siguiente. Ocupa el alto y el ancho de su contenedor.
 */
export function AppDeFlujos({ almacen, capacidades, puedePublicar = true }: AppDeFlujosProps) {
  const [flujos, setFlujos] = useState<readonly ResumenDeFlujo[]>([])
  const [abierto, setAbierto] = useState<FlujoAbierto | null>(null)
  const [guardado, setGuardado] = useState('')
  const [pendiente, setPendiente] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    void almacen.listar().then(setFlujos)
  }, [almacen])

  async function abrir(id: string) {
    const flujo = await almacen.abrir(id)
    setGuardado(JSON.stringify(flujo.contenido))
    setPendiente(false)
    setFallo(false)
    setAbierto(flujo)
  }

  async function guardar(contenido: ContenidoDeFlujo) {
    if (!abierto) return
    setGuardando(true)
    try {
      await almacen.guardarBorrador(abierto.id, contenido)
      setGuardado(JSON.stringify(contenido))
      setAbierto((f) => f && { ...f, conBorrador: true })
      setFallo(false)
    } catch {
      setFallo(true)
    } finally {
      setGuardando(false)
    }
  }

  async function publicar() {
    if (!abierto) return
    const version = await almacen.publicar(abierto.id)
    setAbierto((f) => f && { ...f, version, conBorrador: false })
  }

  if (!abierto) {
    return (
      <ListaDeFlujos
        flujos={flujos}
        onAbrir={(id) => void abrir(id)}
        onCrear={(nombre) => void almacen.crear(nombre).then((f) => abrir(f.id))}
      />
    )
  }

  const estado = fallo ? 'error' : pendiente || guardando ? 'guardando' : abierto.conBorrador ? 'borrador' : 'sin-cambios'
  return (
    <div className="wf-app">
      <BarraDeFlujo
        nombre={abierto.nombre}
        version={abierto.version}
        estado={estado}
        onVolver={() => {
          setAbierto(null)
          void almacen.listar().then(setFlujos)
        }}
        onPublicar={puedePublicar ? () => void publicar() : undefined}
      />
      <div className="wf-app-editor">
        <Editor key={abierto.id} capacidades={capacidades} defaultNodes={abierto.contenido.nodos} defaultEdges={abierto.contenido.flechas} fitView fitViewOptions={{ maxZoom: 1.2 }}>
          <Autoguardado guardado={guardado} onPendiente={setPendiente} onGuardar={(c) => void guardar(c)} />
        </Editor>
      </div>
    </div>
  )
}
