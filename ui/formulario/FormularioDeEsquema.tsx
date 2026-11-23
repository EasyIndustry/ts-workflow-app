import { useId } from 'react'
import { Entrada, Lista } from './Campo'
import './formulario.css'

type Esquema = Record<string, unknown>
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export interface FormularioDeEsquemaProps {
  /** Un JSON Schema de tipo objeto. */
  esquema: Esquema
  valor: Record<string, unknown>
  onCambio: (valor: Record<string, unknown>) => void
}

/** Saca del objeto las claves sin valor, para no guardar campos vacíos. */
function sin(valor: Record<string, unknown>, clave: string, nuevo: unknown): Record<string, unknown> {
  const copia = { ...valor }
  if (nuevo === undefined || nuevo === '' || (esObjeto(nuevo) && Object.keys(nuevo).length === 0)) delete copia[clave]
  else copia[clave] = nuevo
  return copia
}

function Uno({ nombre, esquema, valor, obligatorio, onCambio }: { nombre: string; esquema: Esquema; valor: unknown; obligatorio: boolean; onCambio: (v: unknown) => void }) {
  const id = useId()
  const titulo = (typeof esquema['title'] === 'string' ? esquema['title'] : nombre) + (obligatorio ? ' *' : '')
  const tipo = Array.isArray(esquema['type']) ? esquema['type'].find((t) => t !== 'null') : esquema['type']
  const opciones = Array.isArray(esquema['enum']) ? esquema['enum'] : null

  if (tipo === 'object' && esObjeto(esquema['properties'])) {
    return (
      <fieldset className="wf-grupo">
        <legend>{titulo}</legend>
        <FormularioDeEsquema esquema={esquema} valor={esObjeto(valor) ? valor : {}} onCambio={onCambio} />
      </fieldset>
    )
  }
  let control
  if (opciones) {
    control = (
      <Lista id={id} value={valor === undefined ? '' : String(valor)} onChange={(e) => onCambio(opciones.find((o) => String(o) === e.target.value))}>
        <option value="">—</option>
        {opciones.map((o) => (
          <option key={String(o)} value={String(o)}>
            {String(o)}
          </option>
        ))}
      </Lista>
    )
  } else if (tipo === 'boolean') {
    control = (
      <Lista id={id} value={valor === undefined ? '' : String(valor)} onChange={(e) => onCambio(e.target.value === '' ? undefined : e.target.value === 'true')}>
        <option value="">—</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </Lista>
    )
  } else if (tipo === 'number' || tipo === 'integer') {
    control = <Entrada id={id} type="number" value={typeof valor === 'number' ? valor : ''} onChange={(e) => onCambio(e.target.value === '' ? undefined : Number(e.target.value))} />
  } else if (tipo === 'string' || tipo === undefined) {
    control = <Entrada id={id} value={typeof valor === 'string' ? valor : valor === undefined ? '' : JSON.stringify(valor)} onChange={(e) => onCambio(e.target.value)} />
  } else {
    // Listas y otras formas: se escriben como JSON.
    control = <JsonSuelto id={id} valor={valor} onCambio={onCambio} />
  }
  return (
    <div className="wf-campo">
      <label htmlFor={id}>{titulo}</label>
      {control}
      {typeof esquema['description'] === 'string' && <p className="wf-campo-ayuda">{esquema['description']}</p>}
    </div>
  )
}

function JsonSuelto({ id, valor, onCambio }: { id: string; valor: unknown; onCambio: (v: unknown) => void }) {
  return (
    <textarea
      id={id}
      className="wf-control wf-control-json"
      rows={3}
      spellCheck={false}
      placeholder="JSON"
      defaultValue={valor === undefined ? '' : JSON.stringify(valor, null, 2)}
      onBlur={(e) => {
        if (!e.target.value.trim()) return onCambio(undefined)
        try {
          onCambio(JSON.parse(e.target.value))
          e.target.setCustomValidity('')
        } catch {
          e.target.setCustomValidity('No es un JSON válido.')
          e.target.reportValidity()
        }
      }}
    />
  )
}

/**
 * Un formulario armado desde un JSON Schema de tipo objeto: un campo por propiedad, con los objetos anidados como grupos. Texto,
 * número, sí/no y listas de opciones tienen su control; lo demás se escribe como JSON. Los campos vacíos no se guardan.
 */
export function FormularioDeEsquema({ esquema, valor, onCambio }: FormularioDeEsquemaProps) {
  const propiedades = esObjeto(esquema['properties']) ? esquema['properties'] : {}
  const obligatorios = Array.isArray(esquema['required']) ? esquema['required'] : []
  return (
    <div className="wf-formulario">
      {Object.entries(propiedades).map(([nombre, sub]) => (
        <Uno key={nombre} nombre={nombre} esquema={esObjeto(sub) ? sub : {}} valor={valor[nombre]} obligatorio={obligatorios.includes(nombre)} onCambio={(v) => onCambio(sin(valor, nombre, v))} />
      ))}
    </div>
  )
}
