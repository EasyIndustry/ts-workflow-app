# ts-workflow-app

App genérica de flujos sobre [`ts-workflow-core`](https://github.com/EasyIndustry/ts-workflow-core) (el motor puro) y
[`ts-workflow-plugins`](https://github.com/EasyIndustry/ts-workflow-plugins) (lo que escucha y ejecuta). Es la interfaz para que
una persona vea, controle y publique flujos. No lleva lógica de negocio de nadie: ver [`POLITICA.md`](POLITICA.md).

**Estado:** recién empieza. Hoy tiene el lienzo (orientación vertical u horizontal y acomodo automático) y los nodos.

## Simbología

Los nodos siguen los símbolos de siempre, para que cualquiera que lea diagramas de flujo los entienda. La base es la norma clásica
(ISO 5807); la espera toma el círculo de borde doble de BPMN, porque la norma clásica no tiene un símbolo para «esperar a que pase algo».

| Nodo | Símbolo | Qué hace |
|---|---|---|
| **Inicio** | óvalo (terminador) | Lo que arranca el flujo. |
| **Fin** | óvalo (terminador) | Donde termina. En un subflujo, su nombre es el resultado con el que sale. |
| **Espera** | círculo de borde doble | El flujo se detiene hasta que pase uno de los eventos que escucha. Es el único nodo donde queda parado. |
| **Función** | rectángulo (proceso) | Hace algo y sigue. Es una capacidad del registro. |
| **Decisión** | rombo | Evalúa condiciones y sale por una rama. Solo lee. Siempre tiene «si no». |
| **Subflujo** | rectángulo con doble barra (proceso predefinido) | Otro flujo, con versión fija, que corre de punta a punta. |

## Estructura

```
ui/<pieza>/        un componente y su story, por carpeta
test/              el límite de dependencias
.storybook/        configuración de Storybook
```

## Probar

```bash
npm ci
npm run storybook     # http://127.0.0.1:6610
npm run typecheck
npm test
```
