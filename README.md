# ts-workflow-app

App genérica de flujos sobre [`ts-workflow-core`](https://github.com/EasyIndustry/ts-workflow-core) (el motor puro) y
[`ts-workflow-plugins`](https://github.com/EasyIndustry/ts-workflow-plugins) (lo que escucha y ejecuta). Es la interfaz para que
una persona vea, controle y publique flujos. No lleva lógica de negocio de nadie: ver [`POLITICA.md`](POLITICA.md).

**Estado:** recién empieza. Hoy solo tiene el lienzo.

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
