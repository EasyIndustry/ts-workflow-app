/** Lo que un agente necesita saber para armar un flujo. Es el texto que devuelve la herramienta `guia`. */
export const GUIA = `# Cómo armar un flujo

Un flujo es un diagrama: nodos unidos por flechas. Vos armás y guardás **borradores**; publicar es siempre de una persona.

## Pasos
1. \`capacidades_listar\`: qué puede hacer una función en este sistema (con el schema de sus parámetros).
2. \`flujos_listar\` y \`flujo_abrir\`: qué hay y cómo está hecho.
3. \`flujo_crear\` (si hace falta) y \`flujo_guardar_borrador\` con el contenido completo. Reemplaza el borrador anterior.
4. La respuesta trae los **problemas** que encontró la verificación. Corregí los de nivel «error» y volvé a guardar.
5. Avisale a la persona que el borrador está listo para que lo revise y lo publique.

## Tipos de flujo
- **maestro**: arranca solo, por un evento, y puede quedarse esperando. Suele haber uno por cada cosa importante del sistema.
- **subflujo**: lo llama otro flujo. Tiene un solo inicio, no puede esperar y cada fin es una salida con nombre propio.

## El contenido
\`\`\`json
{ "nodos": [ { "id": "...", "type": "...", "data": { "nombre": "..." } } ],
  "flechas": [ { "source": "idDelNodo", "sourceHandle": "idDeLaSalida", "target": "idDelNodo" } ] }
\`\`\`
La posición (\`position: { x, y }\`) es opcional: sin ella, los nodos se acomodan solos.

## Nodos
| type | data | salidas (sourceHandle) |
|---|---|---|
| \`evento\`, variante \`inicio\` | \`{ variante: "inicio", nombre }\` | \`salida\` |
| \`evento\`, variante \`fin\` | \`{ variante: "fin", nombre }\` | ninguna |
| \`evento\`, variante \`espera\` | \`{ variante: "espera", nombre, eventos: [{ id, nombre }] }\` | una por evento: su \`id\` |
| \`evento\`, variante \`interrupcion\` | \`{ variante: "interrupcion", nombre, excepto?, lateral? }\` | \`salida\` |
| \`funcion\` | \`{ nombre, capacidad, params }\` | \`salida\` |
| \`decision\` | \`{ nombre, ramas: [{ id, nombre }] }\` | una por rama: su \`id\`, más \`sino\` |
| \`subflujo\` | \`{ nombre, flujo, version, salidas: [{ id, nombre }] }\` | una por salida: su \`id\` |

- **inicio**: lo que arranca el flujo. No recibe flechas.
- **espera**: el flujo queda parado hasta que pase uno de sus eventos, y sigue por el primero. Solo en un maestro.
- **interrupcion**: un evento que puede llegar en cualquier momento (salvo en las esperas de \`excepto\`) y desvía el flujo. Con
  \`lateral: true\` no lo desvía: hace lo de su camino y el flujo sigue donde estaba. No recibe flechas. Solo en un maestro.
- Una **espera** con \`eventos: []\` no tiene salidas: se deja solo por una interrupción.
- **funcion**: hace algo. \`capacidad\` es un id de \`capacidades_listar\` y \`params\` cumple su schema.
- **decision**: solo lee. Las ramas se evalúan en orden; si ninguna se cumple, sale por \`sino\`. El nombre es la pregunta.
- **subflujo**: usa otro flujo en una versión fija. \`flujo\`, \`version\` y \`salidas\` salen de \`subflujos_listar\`, tal cual.

## Reglas que revisa la verificación
- Tiene al menos un inicio y un fin.
- Toda salida de todo nodo está conectada (una flecha por salida; un inicio y una función tienen una sola).
- A todo nodo se llega desde un inicio o una interrupción, y desde todo nodo se llega a un fin.
- Toda función tiene una capacidad que existe.
`
