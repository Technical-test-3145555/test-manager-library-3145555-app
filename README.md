# test-manager-library-3145555-app

> **Prueba técnica · Ficha ADSO 3145555**
> Horario: **miércoles 14 de octubre de 2026, de 6:50 a. m. a 11:00 a. m.** (hora Colombia). Entrega a las **11:00 a. m.**

Este repositorio es el **frontend** de *Manager Library*, en **React**. **Empieza vacío a propósito**: se construye en el fork de cada aprendiz.

## Instrucciones

Cada aprendiz debe **crear el fork** de los seis repositorios del proyecto y **resolver el proyecto
con el spec planteado**.

1. Hacer fork, a su cuenta de GitHub, de cada repositorio de la tabla del final.
2. Leer el spec en [`test-manager-library-3145555-docs`](https://github.com/code-sena/test-manager-library-3145555-docs).
   Se entrega en dos versiones: `spec-python/` y `spec-.net/`.
3. Desarrollar en los forks.

## El reto se desarrolla con React y PHP (Laravel)

El spec está escrito para Python y para .NET, pero el reto **no** se hace en esos lenguajes:

| Capa | Tecnología del reto |
|---|---|
| Frontend | React |
| Backend | PHP con Laravel |

Lo que el spec define sobre el negocio —historias, criterios de aceptación, reglas, contrato de la
API, modelo de datos— se respeta. Lo que define sobre la tecnología se traduce a React y Laravel.

## La prueba no consiste en escribir el código

El propósito principal es ver la **capacidad de desempeño con SDD** (*Spec-Driven Development*,
desarrollo guiado por especificación): cómo se lee, se interpreta y se aplica una especificación
para llevarla a un stack distinto. El código es el medio, no el fin.

## Entrega

Cuenta lo que quede **subido a los forks antes de las 11:00 a. m.** Lo que llegue después no se revisa.
No hay prórroga: suban avances parciales con commits pequeños durante la prueba.

## Los seis repositorios

| Repositorio | Qué va ahí |
|---|---|
| [`test-manager-library-3145555-docs`](https://github.com/code-sena/test-manager-library-3145555-docs) | El spec: `spec-python/` y `spec-.net/` |
| [`test-manager-library-3145555-api`](https://github.com/code-sena/test-manager-library-3145555-api) | Backend en PHP (Laravel) |
| [`test-manager-library-3145555-app`](https://github.com/code-sena/test-manager-library-3145555-app) | Frontend en React |
| [`test-manager-library-3145555-page`](https://github.com/code-sena/test-manager-library-3145555-page) | Sitio público estático de presentación |
| [`test-manager-library-3145555-infra`](https://github.com/code-sena/test-manager-library-3145555-infra) | Contenedores, red, volúmenes y motor de base de datos vacío |
| [`test-manager-library-3145555-tool`](https://github.com/code-sena/test-manager-library-3145555-tool) | Utilidades: sembrador de datos de demostración |

## Cómo se usa

Requisitos: Node 20 o superior y la API levantada (repos `api` e `infra`).

```bash
cp .env.example .env     # VITE_API_URL apunta a la API
npm install
npm run dev              # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 5173 (el origen que la API permite por CORS) |
| `npm test` | Pruebas del cliente HTTP, las rutas por rol, el acceso, el tema y el límite de 3 libros |
| `npm run build` | Revisa los tipos y genera `dist/` |

Con Docker, el repo `infra` construye este frontend con `docker compose up`.

## Pantallas

| Ruta | Quién | Qué hace |
|---|---|---|
| `/login` | todos | Inicio de sesión |
| `/books` | admin y bibliotecaria | Catálogo con búsqueda, filtro por categoría y portadas. El admin crea, edita, da de baja y sube portadas |
| `/members` | admin y bibliotecaria | Registro y búsqueda de socios, con sus préstamos activos |
| `/loans/new` | admin y bibliotecaria | Prestar de 1 a 3 libros a un socio |
| `/loans` | admin y bibliotecaria | Lista con filtros y devolución línea por línea |
| `/overdue` | admin y bibliotecaria | Libros vencidos, con los días de retraso |
| `/report` | solo admin | Los libros más prestados por periodo |
| `/users` | solo admin | Dar acceso a una bibliotecaria |

El token vive solo en memoria: al recargar la página hay que volver a entrar. El tema claro y oscuro (rosa) se recuerda en el navegador.
