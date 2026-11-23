import { ReactFlowProvider } from '@xyflow/react'
import { useMemo, useState } from 'react'
import { Lienzo, type LienzoProps } from '../canvas/Lienzo'
import { Configuracion } from '../configuracion/Configuracion'
import { usePreferencias } from '../configuracion/preferencias'
import type { ContratoDeSubflujo, TipoDeFlujo } from '../flujos/almacen'
import { BarraLateral } from '../inspector/BarraLateral'
import { TarjetaFlotante } from '../inspector/TarjetaFlotante'
import { TIPOS_DE_NODO, type NodoDeFlujo } from '../nodos'
import { PanelDePrueba, type RegistroDePrueba } from '../prueba/PanelDePrueba'
import type { Ejecutor } from '../prueba/recorrido'
import { ContextoDelEditor, type Capacidad } from './contexto'
import './editor.css'
import { Paleta } from './Paleta'

export type EditorProps = Omit<LienzoProps<NodoDeFlujo>, 'nodeTypes' | 'botones' | 'orientacion'> & {
  /** Las capacidades del registro, para elegir qué hace cada función. */
  capacidades: readonly Capacidad[]
  /** Los subflujos publicados que se pueden usar. */
  subflujos?: readonly ContratoDeSubflujo[]
  /** El tipo del flujo que se edita. Por defecto, maestro. */
  tipo?: TipoDeFlujo
  /** Abre otro flujo (el subflujo de un nodo). Sin esta función, no se ofrece. */
  onAbrirFlujo?: (id: string) => void
  /**
   * Para «Probar»: quién resuelve cada nodo y los registros para elegir como entrada. Sin ejecutor, la prueba es un ensayo manual:
   * no ejecuta nada y la persona elige por dónde sigue en cada decisión.
   */
  prueba?: { ejecutor?: Ejecutor; registros?: readonly RegistroDePrueba[] }
}

const SIN_SUBFLUJOS: readonly ContratoDeSubflujo[] = []

/**
 * La app armada: el lienzo con los nodos y la paleta para agregarlos, el inspector donde la persona lo prefiera, el panel de prueba
 * y la configuración. Ocupa el alto y el ancho de su contenedor, que tiene que tener tamaño.
 */
export function Editor({ capacidades, subflujos = SIN_SUBFLUJOS, tipo = 'maestro', onAbrirFlujo, prueba, children, ...lienzo }: EditorProps) {
  const [preferencias, cambiarPreferencias] = usePreferencias()
  const [configurando, setConfigurando] = useState(false)
  const [probando, setProbando] = useState(false)
  const datos = useMemo(() => ({ capacidades, subflujos, tipo, onAbrirFlujo }), [capacidades, subflujos, tipo, onAbrirFlujo])
  return (
    <ContextoDelEditor.Provider value={datos}>
      {/* El proveedor arranca ya con los nodos y las flechas: lo que mira el lienzo los ve desde el primer dibujo. */}
      <ReactFlowProvider initialNodes={lienzo.defaultNodes} initialEdges={lienzo.defaultEdges}>
        <div className="wf-editor">
          <div className="wf-editor-lienzo">
            <Lienzo<NodoDeFlujo>
              {...lienzo}
              nodeTypes={TIPOS_DE_NODO}
              orientacion={preferencias.orientacion}
              botones={
                <>
                  <button type="button" onClick={() => setProbando(!probando)} aria-pressed={probando}>
                    Probar
                  </button>
                  <button type="button" onClick={() => setConfigurando(true)}>
                    Configuración
                  </button>
                </>
              }
            >
              <Paleta />
              {preferencias.inspector === 'tarjeta' && <TarjetaFlotante />}
              {children}
            </Lienzo>
          </div>
          {/* Mientras se prueba, el panel de prueba ocupa el lugar de la barra del inspector. */}
          {probando ? (
            <PanelDePrueba ejecutor={prueba?.ejecutor} registros={prueba?.registros} onCerrar={() => setProbando(false)} />
          ) : (
            preferencias.inspector === 'barra' && <BarraLateral />
          )}
        </div>
        <Configuracion abierta={configurando} onCerrar={() => setConfigurando(false)} preferencias={preferencias} onCambio={cambiarPreferencias} />
      </ReactFlowProvider>
    </ContextoDelEditor.Provider>
  )
}
