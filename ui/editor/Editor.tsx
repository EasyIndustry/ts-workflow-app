import { ReactFlowProvider } from '@xyflow/react'
import { useState } from 'react'
import { Lienzo, type LienzoProps } from '../canvas/Lienzo'
import { Configuracion } from '../configuracion/Configuracion'
import { usePreferencias } from '../configuracion/preferencias'
import { BarraLateral } from '../inspector/BarraLateral'
import type { Capacidad } from '../inspector/Inspector'
import { TarjetaFlotante } from '../inspector/TarjetaFlotante'
import { TIPOS_DE_NODO, type NodoDeFlujo } from '../nodos'
import { PanelDePrueba, type RegistroDePrueba } from '../prueba/PanelDePrueba'
import type { Ejecutor } from '../prueba/recorrido'
import './editor.css'

export type EditorProps = Omit<LienzoProps<NodoDeFlujo>, 'nodeTypes' | 'botones' | 'orientacion'> & {
  /** Las capacidades del registro, para elegir qué hace cada función. */
  capacidades: readonly Capacidad[]
  /** Con esto aparece «Probar»: quién resuelve cada nodo en una prueba y los registros para elegir como entrada. */
  prueba?: { ejecutor: Ejecutor; registros?: readonly RegistroDePrueba[] }
}

/**
 * La app armada: el lienzo con los nodos, el inspector donde la persona lo prefiera, el panel de prueba y la configuración. Ocupa el alto y el ancho de
 * su contenedor, que tiene que tener tamaño.
 */
export function Editor({ capacidades, prueba, children, ...lienzo }: EditorProps) {
  const [preferencias, cambiarPreferencias] = usePreferencias()
  const [configurando, setConfigurando] = useState(false)
  const [probando, setProbando] = useState(false)
  return (
    // El proveedor arranca ya con los nodos y las flechas: lo que mira el lienzo los ve desde el primer dibujo.
    <ReactFlowProvider initialNodes={lienzo.defaultNodes} initialEdges={lienzo.defaultEdges}>
      <div className="wf-editor">
        <div className="wf-editor-lienzo">
          <Lienzo<NodoDeFlujo>
            {...lienzo}
            nodeTypes={TIPOS_DE_NODO}
            orientacion={preferencias.orientacion}
            botones={
              <>
                {prueba && (
                  <button type="button" onClick={() => setProbando(!probando)} aria-pressed={probando}>
                    Probar
                  </button>
                )}
                <button type="button" onClick={() => setConfigurando(true)}>
                  Configuración
                </button>
              </>
            }
          >
            {preferencias.inspector === 'tarjeta' && <TarjetaFlotante capacidades={capacidades} />}
            {children}
          </Lienzo>
        </div>
        {/* Mientras se prueba, el panel de prueba ocupa el lugar de la barra del inspector. */}
        {prueba && probando ? (
          <PanelDePrueba ejecutor={prueba.ejecutor} registros={prueba.registros} onCerrar={() => setProbando(false)} />
        ) : (
          preferencias.inspector === 'barra' && <BarraLateral capacidades={capacidades} />
        )}
      </div>
      <Configuracion abierta={configurando} onCerrar={() => setConfigurando(false)} preferencias={preferencias} onCambio={cambiarPreferencias} />
    </ReactFlowProvider>
  )
}
