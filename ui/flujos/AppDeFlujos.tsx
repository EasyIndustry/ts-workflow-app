import { useEffect, useState } from 'react'
import { ProveedorDePreferencias, usePreferencias } from '../configuracion/preferencias'
import { Dialogo } from '../dialogo/Dialogo'
import { Editor, type EditorProps } from '../editor/Editor'
import type { Capacidad } from '../inspector/Inspector'
import type { Almacen, ContenidoDeFlujo, FlujoAbierto, ResumenDeFlujo } from './almacen'
import { Autoguardado } from './Autoguardado'
import { BarraDeFlujo } from './BarraDeFlujo'
import { compararFlujos } from './comparar'
import './flujos.css'
import { ListaDeFlujos } from './ListaDeFlujos'
import { PublicarFlujo } from './PublicarFlujo'
import { verificarFlujo } from './verificar'

export interface AppDeFlujosProps {
  /** Dónde viven los flujos. */
  almacen: Almacen
  /** Las capacidades del registro, para elegir qué hace cada función. */
  capacidades: readonly Capacidad[]
  /** Si esta persona puede publicar. Lo decide el sistema que monta la app. */
  puedePublicar?: boolean
  /** Con esto aparece «Probar» en el editor. */
  prueba?: EditorProps['prueba']
}

const VACIO: ContenidoDeFlujo = { nodos: [], flechas: [] }

/**
 * La app entera: la lista de flujos y, al abrir uno, el editor con su barra. Guardar deja un borrador (solo mientras se edita, o
 * con el botón, según la configuración). Publicar abre la ventana con la verificación y los cambios, y convierte el borrador en la
 * versión siguiente. Ocupa el alto y el ancho de su contenedor.
 */
export function AppDeFlujos(props: AppDeFlujosProps) {
  return (
    <ProveedorDePreferencias>
      <App {...props} />
    </ProveedorDePreferencias>
  )
}

function App({ almacen, capacidades, puedePublicar = true, prueba }: AppDeFlujosProps) {
  const [preferencias] = usePreferencias()
  const [flujos, setFlujos] = useState<readonly ResumenDeFlujo[]>([])
  const [abierto, setAbierto] = useState<FlujoAbierto | null>(null)
  const [guardado, setGuardado] = useState('')
  const [sinGuardar, setSinGuardar] = useState<ContenidoDeFlujo | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [fallo, setFallo] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    void almacen.listar().then(setFlujos)
  }, [almacen])

  async function abrir(id: string) {
    const flujo = await almacen.abrir(id)
    setGuardado(JSON.stringify(flujo.contenido))
    setSinGuardar(null)
    setFallo(false)
    setAbierto(flujo)
  }

  async function guardar(contenido: ContenidoDeFlujo): Promise<boolean> {
    if (!abierto) return false
    setGuardando(true)
    try {
      await almacen.guardarBorrador(abierto.id, contenido)
      setGuardado(JSON.stringify(contenido))
      setAbierto((f) => f && { ...f, conBorrador: true })
      setFallo(false)
      return true
    } catch {
      setFallo(true)
      return false
    } finally {
      setGuardando(false)
    }
  }

  async function publicar() {
    if (!abierto) return
    const version = await almacen.publicar(abierto.id)
    setAbierto((f) => f && { ...f, version, conBorrador: false, publicado: JSON.parse(guardado) as ContenidoDeFlujo })
    setPublicando(false)
  }

  function salir() {
    setSaliendo(false)
    setAbierto(null)
    void almacen.listar().then(setFlujos)
  }

  async function volver() {
    if (!sinGuardar) return salir()
    // Con guardado automático no se pregunta: se guarda lo que faltaba y se sale.
    if (preferencias.guardado === 'automatico') {
      if (await guardar(sinGuardar)) salir()
      return
    }
    setSaliendo(true)
  }

  if (!abierto) {
    return <ListaDeFlujos flujos={flujos} onAbrir={(id) => void abrir(id)} onCrear={(nombre) => void almacen.crear(nombre).then((f) => abrir(f.id))} />
  }

  const automatico = preferencias.guardado === 'automatico'
  const estado = fallo ? 'error' : guardando || (sinGuardar && automatico) ? 'guardando' : sinGuardar ? 'sin-guardar' : abierto.conBorrador ? 'borrador' : 'sin-cambios'
  // Lo que se publica es el borrador guardado, no lo que está a medio editar en el lienzo.
  const borrador = publicando ? (JSON.parse(guardado) as ContenidoDeFlujo) : VACIO
  return (
    <div className="wf-app">
      <BarraDeFlujo
        nombre={abierto.nombre}
        version={abierto.version}
        estado={estado}
        onVolver={() => void volver()}
        onGuardar={() => sinGuardar && void guardar(sinGuardar)}
        hayCambiosSinGuardar={Boolean(sinGuardar) && !guardando}
        onPublicar={puedePublicar ? () => setPublicando(true) : undefined}
      />
      <div className="wf-app-editor">
        <Editor key={abierto.id} capacidades={capacidades} prueba={prueba} defaultNodes={abierto.contenido.nodos} defaultEdges={abierto.contenido.flechas} fitView fitViewOptions={{ maxZoom: 1.2 }}>
          <Autoguardado guardado={guardado} onCambio={setSinGuardar} onGuardar={automatico ? (c) => void guardar(c) : undefined} />
        </Editor>
      </div>
      <PublicarFlujo
        abierta={publicando}
        onCerrar={() => setPublicando(false)}
        onPublicar={() => void publicar()}
        nombre={abierto.nombre}
        version={abierto.version}
        problemas={verificarFlujo(borrador, capacidades.map((c) => c.id))}
        diferencias={compararFlujos(abierto.publicado ?? VACIO, borrador, Object.fromEntries(capacidades.map((c) => [c.id, c.nombre])))}
      />
      <Dialogo
        abierta={saliendo}
        onCerrar={() => setSaliendo(false)}
        titulo="Hay cambios sin guardar"
        acciones={
          <>
            <button type="button" className="wf-boton" onClick={salir}>
              Salir sin guardar
            </button>
            <button type="button" className="wf-boton wf-boton-principal" onClick={() => sinGuardar && void guardar(sinGuardar).then((bien) => bien && salir())}>
              Guardar y salir
            </button>
          </>
        }
      >
        <p className="wf-salir-texto">Si salís sin guardar, se pierde lo que cambiaste desde la última vez que guardaste.</p>
      </Dialogo>
    </div>
  )
}
