# Política del repositorio

App **genérica** de flujos sobre [`ts-workflow-core`](https://github.com/EasyIndustry/ts-workflow-core) y
[`ts-workflow-plugins`](https://github.com/EasyIndustry/ts-workflow-plugins). Vale la política del core: quién pide no cambia la
respuesta, y un pedido se lee por la necesidad, no por la solución que trae.

## El principio

**La app no lleva lógica de negocio de nadie.** Ni la app, ni los plugins, ni el core. Es una herramienta para ver, armar,
controlar y publicar flujos de cualquier dominio. El negocio de cada cliente es **configuración** que vive en su sistema.

## Qué entra

**La pregunta:** ¿le sirve a cualquier sistema que quiera flujos configurables, sin saber de qué rubro es?

- **Entra:** el lienzo, los nodos estándar, los paneles de control (validar, simular, comparar versiones, publicar, ver y pausar
  corridas), el guardado de definiciones y trazas, y la interfaz para que un agente arme flujos.
- **No entra:**
  - **capacidades concretas** de un sistema (sus acciones, condiciones y efectos): las registra cada sistema con un plugin o un
    adaptador propio, privado;
  - **reglas, estados, catálogos o textos de un cliente:** son datos suyos, guardados en su base;
  - **nombres propios** de clientes, marcas, productos, personas o sistemas internos: ni en el código, ni en los tests, ni en las
    stories, ni en los issues;
  - **pantallas pensadas para un rubro.** Un default que solo tiene sentido en un rubro es tan específico como una función con su
    nombre.
- **Los ejemplos y las stories son genéricos:** ilustran el modelo y no son el flujo de nadie.

## Los datos son del cliente

Todo lo que la app guarda (definiciones, versiones, corridas, trazas) queda **en la base del cliente**, en un schema propio que
maneja la app. No se envía nada a un lugar central.

## Reglas de la interfaz

1. **Se arma en Storybook, pieza por pieza.** Cada componente tiene su story y funciona solo, sin servidor.
2. **React Flow de fábrica primero.** Se usa su comportamiento por defecto, y encima se agrega solo lo que haga falta.
3. **Sin pedidos adentro de los componentes.** Reciben datos y funciones por props; quien los monta decide de dónde salen.
4. **La fuente de verdad es la definición (JSON), no el dibujo.** Un agente puede armar un flujo sin la interfaz; la interfaz es
   el control humano.
5. **Un agente nunca publica.** Publicar es siempre una decisión de una persona.

## El límite, controlado

`test/limites.test.mjs` es una lista blanca: `ui/` solo importa React, React Flow, el core, los plugins y sus propios archivos.
Una dependencia nueva se suma ahí a propósito.

## Instalar y actualizar

La app se instala dentro de otro sistema **fijando un tag o un commit**. **No se publica en npm.** La copia no se edita: un cambio
vuelve acá como issue. Las migraciones de su schema viajan con cada versión.
