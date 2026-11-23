import { ReactFlowProvider } from '@xyflow/react'
import { useState } from 'react'
import { Lienzo, type LienzoProps } from '../canvas/Lienzo'
import { Configuracion } from '../configuracion/Configuracion'
import { usePreferencias } from '../configuracion/preferencias'
import { BarraLateral } from '../inspector/BarraLateral'
import type { Capacidad } from '../inspector/Inspector'
import { TarjetaFlotante } from '../inspector/TarjetaFlotante'
import { TIPOS_DE_NODO, type NodoDeFlujo } from '../nodos'
import './editor.css'

export type EditorProps = Omit<LienzoProps<NodoDeFlujo>, 'nodeTypes' | 'botones' | 'orientacion'> & {
  /** Las capacidades del registro, para elegir qué hace cada función. */
  capacidades: readonly Capacidad[]
}

/**
 * La app armada: el lienzo con los nodos, el inspector donde la persona lo prefiera y la configuración. Ocupa el alto y el ancho de
 * su contenedor, que tiene que tener tamaño.
 */
export function Editor({ capacidades, children, ...lienzo }: EditorProps) {
  const [preferencias, cambiarPreferencias] = usePreferencias()
  const [configurando, setConfigurando] = useState(false)
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
              <button type="button" onClick={() => setConfigurando(true)}>
                Configuración
              </button>
            }
          >
            {preferencias.inspector === 'tarjeta' && <TarjetaFlotante capacidades={capacidades} />}
            {children}
          </Lienzo>
        </div>
        {preferencias.inspector === 'barra' && <BarraLateral capacidades={capacidades} />}
      </div>
      <Configuracion abierta={configurando} onCerrar={() => setConfigurando(false)} preferencias={preferencias} onCambio={cambiarPreferencias} />
    </ReactFlowProvider>
  )
}
