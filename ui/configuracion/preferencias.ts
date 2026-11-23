import { createContext, createElement, useContext, useState, type ReactNode } from 'react'

/** Cómo quiere ver y usar la app cada persona. Se guarda en su navegador. */
export interface Preferencias {
  /** Dónde aparece el inspector al seleccionar un nodo. */
  inspector: 'barra' | 'tarjeta'
  /** Hacia dónde corre el flujo en el lienzo. */
  orientacion: 'vertical' | 'horizontal'
  /** Si el borrador se guarda solo mientras se edita o solo con el botón «Guardar». */
  guardado: 'automatico' | 'manual'
}

export const PREFERENCIAS_DE_FABRICA: Preferencias = { inspector: 'barra', orientacion: 'vertical', guardado: 'automatico' }

/**
 * Los ajustes que muestra la configuración. Sumar uno es agregar una entrada acá y su campo en `Preferencias`: la pantalla se arma
 * sola.
 */
export const AJUSTES: readonly { clave: keyof Preferencias; titulo: string; opciones: readonly { valor: string; nombre: string; detalle: string }[] }[] = [
  {
    clave: 'inspector',
    titulo: 'Inspector de nodos',
    opciones: [
      { valor: 'barra', nombre: 'Barra lateral', detalle: 'Aparece al costado y el lienzo le hace lugar.' },
      { valor: 'tarjeta', nombre: 'Tarjeta flotante', detalle: 'Aparece sobre el lienzo y se puede mover.' },
    ],
  },
  {
    clave: 'orientacion',
    titulo: 'Orientación del flujo',
    opciones: [
      { valor: 'vertical', nombre: 'Vertical', detalle: 'El flujo corre de arriba hacia abajo.' },
      { valor: 'horizontal', nombre: 'Horizontal', detalle: 'El flujo corre de izquierda a derecha.' },
    ],
  },
  {
    clave: 'guardado',
    titulo: 'Guardado del borrador',
    opciones: [
      { valor: 'automatico', nombre: 'Automático', detalle: 'Se guarda solo mientras editás. «Guardar» sigue estando para guardar ya.' },
      { valor: 'manual', nombre: 'Manual', detalle: 'Se guarda solo cuando apretás «Guardar».' },
    ],
  },
]

const CLAVE = 'wf.preferencias'

function leer(): Preferencias {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Record<string, unknown>
    const validas = Object.fromEntries(AJUSTES.filter((a) => a.opciones.some((o) => o.valor === guardadas[a.clave])).map((a) => [a.clave, guardadas[a.clave]]))
    return { ...PREFERENCIAS_DE_FABRICA, ...validas }
  } catch {
    // Sin almacenamiento, o con algo roto guardado: valen las de fábrica.
    return PREFERENCIAS_DE_FABRICA
  }
}

type Par = [Preferencias, (cambio: Partial<Preferencias>) => void]

function usePreferenciasPropias(): Par {
  const [preferencias, setPreferencias] = useState(leer)
  return [
    preferencias,
    (cambio) => {
      const nuevas = { ...preferencias, ...cambio }
      setPreferencias(nuevas)
      try {
        localStorage.setItem(CLAVE, JSON.stringify(nuevas))
      } catch {
        // No se pudo guardar: sigue valiendo en esta sesión.
      }
    },
  ]
}

const Contexto = createContext<Par | null>(null)

/** Comparte las mismas preferencias entre todo lo que tiene adentro: cambiarlas en un lugar vale en todos. */
export function ProveedorDePreferencias({ children }: { children: ReactNode }) {
  return createElement(Contexto.Provider, { value: usePreferenciasPropias() }, children)
}

/**
 * Las preferencias de la persona y cómo cambiarlas. Adentro de un `ProveedorDePreferencias` son las compartidas; afuera, cada pieza
 * tiene las suyas. Si el navegador no deja guardar, valen mientras la app esté abierta.
 */
export function usePreferencias(): Par {
  const propias = usePreferenciasPropias()
  return useContext(Contexto) ?? propias
}
