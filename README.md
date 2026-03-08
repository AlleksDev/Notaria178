<p align="center">
  <img src="src/assets/Logomenu.png" alt="Notaría 178" width="280" />
</p>

<h1 align="center">Notaría 178 — Sistema de Gestión Notarial</h1>

<p align="center">
  <em>Plataforma privada para la administración integral de expedientes, actos legales y personal de la Notaría 178.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/License-Private-red" />
</p>

---

## Acerca del Proyecto

**Notaría 178** es un sistema de gestión privado desarrollado a la medida para la Notaría Pública No. 178. Está diseñado para operar en una **red local** con un **servidor on-premise**, y es accesible desde las demás sucursales de la misma notaría a través de una **VPN corporativa**, garantizando que el notario titular tenga gestión y visibilidad total sobre todas las operaciones que se llevan a cabo en cada sede.

> ⚠️ **Proyecto privado**: Este repositorio y su código fuente son propiedad exclusiva de la Notaría 178. No está destinado a distribución pública.

### Propósito

- Centralizar la gestión de expedientes legales (trabajos), actos notariales, clientes, sucursales y personal.
- Proporcionar un panel de control (dashboard) con KPIs en tiempo real para la toma de decisiones.
- Garantizar trazabilidad mediante un sistema de auditoría y notificaciones en tiempo real (SSE).
- Proteger la integridad de los registros históricos mediante lógica de **eliminación segura** (soft delete / deactivation).

---

## Stack Tecnológico

| Capa             | Tecnología                                   |
|------------------|----------------------------------------------|
| Framework        | React 19.1 + TypeScript 5.8                  |
| Bundler          | Vite 6.3                                     |
| Estilos          | Tailwind CSS 4.1                             |
| HTTP Client      | Axios                                        |
| Iconos           | Lucide React                                 |
| Gráficos         | Recharts                                     |
| Routing          | React Router DOM                             |

---

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

El servidor de desarrollo inicia en `http://localhost:5173` por defecto.

### Configuración

El cliente HTTP está configurado en `src/config/axios.ts` y apunta al backend local:

```
Base URL: http://localhost:8080
```

Las peticiones autenticadas incluyen automáticamente el token JWT almacenado en `localStorage`.

---

## Arquitectura del Proyecto

```
src/
├── assets/              # Recursos estáticos (logos, imágenes)
├── components/          # Componentes globales reutilizables
│   ├── ConfirmModal.tsx      # Modal de confirmación genérica (danger/warning)
│   ├── GlobalSearch.tsx      # Barra de búsqueda global
│   ├── KpiCards.tsx          # Tarjetas KPI reutilizables (Total/Activo/Inactivo)
│   └── MainLayout.tsx        # Layout principal con sidebar y topbar
├── config/
│   └── axios.ts              # Instancia Axios con interceptor JWT
├── features/            # Módulos de negocio (feature-based architecture)
│   ├── acts/                 # Catálogo de actos legales
│   ├── auth/                 # Autenticación (login)
│   ├── branches/             # Gestión de sucursales
│   ├── clients/              # Registro de clientes
│   ├── home/                 # Dashboard / Panel de control
│   ├── profile/              # Perfil de usuario
│   ├── users/                # Gestión de empleados (Proyectistas)
│   └── works/                # Expedientes (trabajos)
└── index.tsx            # Punto de entrada + Router
```

### Principios

- **Feature-based architecture**: Cada módulo contiene sus propias páginas, componentes, tipos, y funciones de API.
- **Componentes globales**: UI reutilizable (`KpiCards`, `ConfirmModal`, `GlobalSearch`) se ubica en `src/components/`.
- **Tipado estricto**: Interfaces TypeScript para todas las entidades, DTOs y respuestas de API.
- **Consistencia de diseño**: Sistema de diseño institucional con paleta coherente (rojo oscuro `#7f1d1d`, dorado `#b8860b`, grises neutros).

---

## Módulos

### 🔐 Auth (`features/auth`)
Login con credenciales de empleado. Almacena el JWT en `localStorage` y lo inyecta automáticamente en todas las solicitudes.

### 🏠 Dashboard (`features/home`)
Panel de control con KPIs, gráficos de tendencia, distribución por estado, actividad reciente, top proyectistas y actos más comunes. Datos filtrados por rango de tiempo, sucursal y búsqueda global.

### 📋 Actos Legales (`features/acts`)
Catálogo completo de tipos de actos notariales, organizado por categorías con acordeones expandibles.

| Funcionalidad | Descripción |
|---------------|-------------|
| **CRUD de Actos** | Crear, editar, eliminar/desactivar actos desde una modal reutilizable |
| **Checklist de Requisitos** | Cada acto tiene una lista de requisitos con CRUD inline (agregar/eliminar) |
| **Eliminación Segura** | Actos con trabajos vinculados → se desactivan. Huérfanos → se eliminan permanentemente |
| **Requisitos Seguros** | Si el acto padre tiene trabajos: requisitos se desactivan (line-through + badge). Si no: se eliminan |
| **KPIs** | Tarjetas de Total, Activos, Inactivos |
| **Búsqueda + Filtros** | Búsqueda global + filtro por estado (Todos/Activos/Inactivos) |
| **Categorías** | Selector de categorías existentes o creación de nuevas (toggle inline) |

### 👥 Proyectistas (`features/users`)
Gestión de empleados (proyectistas/redactores). Lista con búsqueda, tarjetas KPI, y modales de creación/edición.

### 📁 Expedientes (`features/works`)
Módulo central de trabajos (expedientes legales). Creación con selección de sucursal, cliente, actos y proyectista asignado.

### 👤 Clientes (`features/clients`)
Registro de clientes de la notaría con nombre, RFC, teléfono y email.

### 🏢 Sucursales (`features/branches`)
Gestión de las diferentes sedes de la notaría.

### 👤 Perfil (`features/profile`)
Visualización y edición del perfil del usuario autenticado.

---

## Componentes Globales Reutilizables

| Componente | Descripción |
|------------|-------------|
| `KpiCards` | Tres tarjetas con Total, Activos e Inactivos. Labels configurables. Usado en Actos y Proyectistas. |
| `ConfirmModal` | Modal de confirmación con variantes `danger` (rojo) y `warning` (ámbar). Título, mensaje y botón configurables. |
| `GlobalSearch` | Barra de búsqueda con icono, placeholder configurable y debounce. |
| `MainLayout` | Layout principal con sidebar de navegación y topbar. |

---

## Seguridad y Red

- **Red local**: El sistema opera en el servidor local de la Notaría 178.
- **VPN**: Las sucursales remotas se conectan a través de VPN corporativa para acceder al sistema.
- **JWT**: Autenticación basada en tokens con expiración configurable.
- **Roles**: El backend restringe endpoints según el rol del usuario (`SUPER_ADMIN`, `LOCAL_ADMIN`, `DRAFTER`, `DATA_ENTRY`).
- **Sin exposición pública**: El sistema no se expone a Internet; toda la comunicación ocurre dentro de la red privada o la VPN.

---

## Backend

Este frontend se conecta a la **Notaría 178 API**, un backend REST construido en Go con arquitectura hexagonal. Consulta el [README del backend](../Notaria178_API/README.md) para documentación completa de los 41 endpoints disponibles.

---
