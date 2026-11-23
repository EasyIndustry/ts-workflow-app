import { useState } from 'react'

/** Cómo quiere ver la app cada persona. Se guarda en su navegador. */
export interface Preferencias {
  /** Dónde aparece el inspector al seleccionar un nodo. */
  inspector: 'barra' | 'tarjeta'
}

export const PREFERENCIAS_DE_FABRICA: Preferencias = { inspector: 'barra' }

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

/** Las preferencias de la persona y cómo cambiarlas. Si el navegador no deja guardar, valen mientras la app esté abierta. */
export function usePreferencias(): [Preferencias, (cambio: Partial<Preferencias>) => void] {
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
