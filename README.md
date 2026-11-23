# ts-workflow-app

App genérica de flujos sobre [`ts-workflow-core`](https://github.com/EasyIndustry/ts-workflow-core) (el motor puro) y
[`ts-workflow-plugins`](https://github.com/EasyIndustry/ts-workflow-plugins) (lo que escucha y ejecuta). Es la interfaz para que
una persona vea, controle y publique flujos. No lleva lógica de negocio de nadie: ver [`POLITICA.md`](POLITICA.md).

**Estado:** recién empieza. Hoy tiene el lienzo (orientación vertical u horizontal y acomodo automático), los nodos, el inspector
(como barra lateral o tarjeta flotante), la configuración, la lista de flujos con guardado del borrador y publicación (con
verificación y comparación contra la versión vigente) y el panel para probar un flujo. Tiene servidor (Postgres) y servidor MCP para agentes. La prueba de un flujo todavía usa un
ejecutor de mentira, y lo que se guarda es el dibujo: falta traducirlo a una definición del core para ejecutarlo.

## Simbología

Los nodos siguen los símbolos de siempre, para que cualquiera que lea diagramas de flujo los entienda. La base es la norma clásica
(ISO 5807); la espera toma el círculo de borde doble de BPMN, porque la norma clásica no tiene un símbolo para «esperar a que pase algo».

| Nodo | Símbolo | Qué hace |
|---|---|---|
| **Inicio** | óvalo (terminador) | Lo que arranca el flujo. |
| **Fin** | óvalo (terminador) | Donde termina. En un subflujo, su nombre es el resultado con el que sale. |
| **Espera** | círculo de borde doble | El flujo se detiene hasta que pase uno de los eventos que escucha. Es el único nodo donde queda parado. |
| **Interrupción** | el mismo círculo de borde doble, sin entrada | Un evento que puede llegar en cualquier momento y desvía el flujo que está corriendo. |
| **Función** | rectángulo (proceso) | Hace algo y sigue. Es una capacidad del registro. |
| **Decisión** | rombo | Evalúa condiciones y sale por una rama. Solo lee. Siempre tiene «si no». |
| **Subflujo** | rectángulo con doble barra (proceso predefinido) | Otro flujo, con versión fija, que corre de punta a punta. |

## Estructura

```
modelo/      los flujos como datos: nodos, verificar, comparar, recorrer. Sin React ni librerías.
ui/          la interfaz (React): una carpeta por pieza, con su story.
servidor/    dónde se guardan (Postgres) y cómo se atienden los pedidos, sin atarse a un servidor web.
cliente/     el almacén hablando con el servidor por HTTP.
mcp/         el servidor MCP, para que un agente arme borradores.
dist/        servidor, cliente y mcp compilados y versionados (se instala desde git).
test/        el límite de dependencias y las pruebas del servidor.
```

## Montarla en un sistema

Se instala **fijando un tag o un commit**. No se publica en npm.

**En el servidor**, la app guarda sus flujos en el esquema `flujo` de la base del sistema, con sus propias migraciones, y atiende
los pedidos con una función que no depende de ningún servidor web: el sistema la llama desde sus rutas y decide los permisos.

```ts
import { atender, crearAlmacenPostgres, migrar } from 'ts-workflow-app/servidor'

await migrar(pool)                                   // al arrancar; repetirlo no hace nada

// en la ruta del sistema, por ejemplo /api/flujos-app/*
const { estado, cuerpo } = await atender(
  { metodo, ruta, cuerpo: body },                    // la ruta sin el prefijo: /flujos/pedidos/borrador
  {
    almacen: crearAlmacenPostgres(pool, { persona: usuario.nombre }),
    capacidades: () => capacidadesDelSistema,        // lo que una función puede hacer acá
    puedeEditar: usuario.puedeEditarFlujos,
    puedePublicar: usuario.puedePublicarFlujos,      // nunca para la credencial de un agente
  },
)
```

Antes de publicar, el servidor vuelve a verificar el flujo: no confía en la pantalla.

**En la interfaz**, un componente de React:

```tsx
import { AppDeFlujos, crearAlmacenHttp } from 'ts-workflow-app/ui'

const almacen = crearAlmacenHttp({ urlBase: '/api/flujos-app', encabezados: () => ({ authorization: `Bearer ${token}` }) })
<AppDeFlujos almacen={almacen} capacidades={capacidades} puedePublicar={puede} />
```

## Para agentes (MCP)

`dist/mcp/servidor.js` es un servidor MCP por entrada y salida estándar, sin dependencias. Habla con el mismo servidor de la app:

```json
{ "command": "node", "args": ["node_modules/ts-workflow-app/dist/mcp/servidor.js"],
  "env": { "FLUJOS_URL": "https://sistema.ejemplo/api/flujos-app", "FLUJOS_AUTORIZACION": "Bearer <credencial del agente>" } }
```

Herramientas: `guia`, `capacidades_listar`, `flujos_listar`, `flujo_abrir`, `subflujos_listar`, `flujo_crear`,
`flujo_guardar_borrador` y `flujo_verificar`. **No hay herramienta para publicar**, y el sistema tiene que negarle ese permiso a la
credencial del agente: un agente arma el borrador y una persona lo revisa y lo publica.

## Probar

```bash
npm ci
npm run storybook     # http://127.0.0.1:6610
npm run typecheck
npm test
```
