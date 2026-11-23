import { useEffect, useState } from 'react'
import { ProveedorDePreferencias, usePreferencias } from '../configuracion/preferencias'
import { Dialogo } from '../dialogo/Dialogo'
import { Editor, type EditorProps } from '../editor/Editor'
import type { Capacidad } from '../editor/contexto'
import { enTexto, type Almacen, type ContenidoDeFlujo, type ContratoDeSubflujo, type FlujoAbierto, type ResumenDeFlujo } from './almacen'
import { Autoguardado } from './Autoguardado'
import { BarraDeFlujo } from './BarraDeFlujo'
import { compararFlujos } from './comparar'
import './flujos.css'
import { ListaDeFlujos } from './ListaDeFlujos'
import { PublicarFlujo, type PublicarFlujoProps } from './PublicarFlujo'
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
  /** Para que combine con la pantalla donde está montada. Por defecto, claro. */
  tema?: 'claro' | 'oscuro'
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
      <div className={props.tema === 'oscuro' ? 'wf-raiz wf-tema-oscuro' : 'wf-raiz'}>
        <App {...props} />
      </div>
    </ProveedorDePreferencias>
  )
}

function App({ almacen, capacidades, puedePublicar = true, prueba, tema }: AppDeFlujosProps) {
  const [preferencias] = usePreferencias()
  const [flujos, setFlujos] = useState<readonly ResumenDeFlujo[] | null>(null)
  const [abierto, setAbierto] = useState<FlujoAbierto | null>(null)
  const [subflujos, setSubflujos] = useState<readonly ContratoDeSubflujo[]>([])
  const [guardado, setGuardado] = useState('')
  const [sinGuardar, setSinGuardar] = useState<ContenidoDeFlujo | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [fallo, setFallo] = useState(false)
  const [publicando, setPublicando] = useState(false)
  // Cómo va la publicación: esperando al sistema, rechazada (con el porqué) o hecha con algo que avisar.
  const [publicacion, setPublicacion] = useState<{ enCurso?: boolean; rechazo?: PublicarFlujoProps['rechazo']; hecha?: PublicarFlujoProps['publicado'] }>({})
  const [saliendo, setSaliendo] = useState(false)
  // De qué flujos se vino al abrir un subflujo desde un nodo, para volver por el mismo camino.
  const [camino, setCamino] = useState<readonly { id: string; nombre: string }[]>([])

  useEffect(() => {
    void almacen.listar().then(setFlujos)
  }, [almacen])

  async function abrir(id: string) {
    const [flujo, contratos] = await Promise.all([almacen.abrir(id), almacen.subflujos()])
    // Un flujo no se ofrece a sí mismo como subflujo.
    setSubflujos(contratos.filter((c) => c.id !== id))
    setGuardado(enTexto(flujo.contenido))
    setSinGuardar(null)
    setFallo(false)
    setAbierto(flujo)
  }

  async function guardar(contenido: ContenidoDeFlujo): Promise<boolean> {
    if (!abierto) return false
    setGuardando(true)
    try {
      await almacen.guardarBorrador(abierto.id, contenido)
      setGuardado(enTexto(contenido))
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
    setPublicacion({ enCurso: true })
    try {
      const { version, avisos = [] } = almacen.publicarConAvisos ? await almacen.publicarConAvisos(abierto.id) : { version: await almacen.publicar(abierto.id) }
      setAbierto((f) => f && { ...f, version, conBorrador: false, publicado: JSON.parse(guardado) as ContenidoDeFlujo })
      // Con algo que avisar, la ventana queda abierta para que la persona lo lea.
      if (avisos.length > 0) return setPublicacion({ hecha: { version, avisos } })
      setPublicacion({})
      setPublicando(false)
    } catch (e) {
      // El sistema dijo que no (o no respondió): la ventana queda abierta con el motivo, y nada cambió.
      const problemas = (e as { problemas?: unknown }).problemas
      setPublicacion({ rechazo: { mensaje: e instanceof Error && e.message ? e.message : 'No se pudo publicar.', ...(Array.isArray(problemas) && { problemas: problemas.filter((p): p is { mensaje: string } => typeof p?.mensaje === 'string') }) } })
    }
  }

  function salir() {
    setSaliendo(false)
    const anterior = camino.at(-1)
    if (anterior) {
      setCamino(camino.slice(0, -1))
      void abrir(anterior.id)
      return
    }
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

  /** Pasa a otro flujo (el subflujo de un nodo). Antes guarda lo pendiente como borrador, para no perderlo. */
  async function irA(id: string) {
    if (!abierto || (sinGuardar && !(await guardar(sinGuardar)))) return
    setCamino([...camino, { id: abierto.id, nombre: abierto.nombre }])
    await abrir(id)
  }

  if (!abierto) {
    return <ListaDeFlujos flujos={flujos ?? []} cargando={!flujos} onAbrir={(id) => void abrir(id)} onCrear={(nombre, tipo) => void almacen.crear(nombre, tipo).then((f) => abrir(f.id))} />
  }

  const automatico = preferencias.guardado === 'automatico'
  const estado = fallo ? 'error' : guardando || (sinGuardar && automatico) ? 'guardando' : sinGuardar ? 'sin-guardar' : abierto.conBorrador ? 'borrador' : 'sin-cambios'
  // Lo que se publica es el borrador guardado, no lo que está a medio editar en el lienzo.
  const borrador = publicando ? (JSON.parse(guardado) as ContenidoDeFlujo) : VACIO
  return (
    <div className="wf-app">
      <BarraDeFlujo
        nombre={`${abierto.nombre}${abierto.tipo === 'subflujo' ? ' · subflujo' : ''}`}
        version={abierto.version}
        estado={estado}
        onVolver={() => void volver()}
        volverA={camino.at(-1)?.nombre}
        onGuardar={() => sinGuardar && void guardar(sinGuardar)}
        hayCambiosSinGuardar={Boolean(sinGuardar) && !guardando}
        onPublicar={puedePublicar ? () => (setPublicacion({}), setPublicando(true)) : undefined}
      />
      <div className="wf-app-editor">
        <Editor key={abierto.id} capacidades={capacidades} subflujos={subflujos} tipo={abierto.tipo} onAbrirFlujo={(id) => void irA(id)} prueba={prueba} tema={tema} defaultNodes={abierto.contenido.nodos} defaultEdges={abierto.contenido.flechas} fitView fitViewOptions={{ maxZoom: 1.2 }}>
          <Autoguardado guardado={guardado} onCambio={setSinGuardar} onGuardar={automatico ? (c) => void guardar(c) : undefined} />
        </Editor>
      </div>
      <PublicarFlujo
        abierta={publicando}
        onCerrar={() => setPublicando(false)}
        onPublicar={() => void publicar()}
        publicando={publicacion.enCurso}
        rechazo={publicacion.rechazo}
        publicado={publicacion.hecha}
        nombre={abierto.nombre}
        version={abierto.version}
        problemas={verificarFlujo(borrador, capacidades.map((c) => c.id), { id: abierto.id, tipo: abierto.tipo, subflujos })}
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
