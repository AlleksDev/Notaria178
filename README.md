# Notaria 178 Frontend

SPA privada del sistema de gestion notarial de la Notaria 178.

El frontend actual esta construido con React + TypeScript + Vite y consume la API de `Notaria178_API`. La app ya incluye dashboard, expedientes, catalogo de actos, usuarios, auditoria, perfil, centro de notificaciones, asistencia y comentarios en vivo por WebSocket. Tambien integra Firebase Cloud Messaging para push notifications en foreground y background.

## Nota de nomenclatura

En negocio el termino vigente es **oficinas**. Aun asi, en codigo todavia existen nombres tecnicos como:

- carpeta `features/branches`
- tipos `Branch`
- campos `branch_id`
- endpoint backend `/branches/search`

Todo eso corresponde al catalogo de **oficinas**.

## Stack actual

- React `19.2.0`
- TypeScript `5.9.x`
- Vite `7.3.1`
- Tailwind CSS `4.2.1` via `@tailwindcss/vite`
- React Router DOM `7.13.1`
- Axios
- Zustand para estado persistido
- Recharts para dashboard
- Lucide React para iconografia
- Firebase Web SDK para push notifications

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

Por default Vite sirve la app en `http://localhost:5173`.

## Configuracion actual

### Variables `.env`

El `.env.example` actual incluye variables de Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

### API base y tiempo real

Hay tres detalles importantes del estado actual del codigo:

1. `src/config/axios.ts` tiene la `baseURL` fija en `http://localhost:8080`.
2. Algunos archivos tambien leen `VITE_API_URL`, pero si no existe caen al mismo `http://localhost:8080`.
3. El hook de comentarios usa `ws://localhost:8080` como base para WebSocket.

En otras palabras: hoy la app esta pensada para correr localmente contra la API en `localhost:8080`.

### Firebase y Service Worker

Push notifications se apoyan en:

- `src/config/firebase.ts`
- `src/hooks/usePushNotifications.ts`
- `src/hooks/useFCMListener.ts`
- `public/firebase-messaging-sw.js`

El service worker maneja notificaciones en background y apertura de la ruta del trabajo cuando el usuario hace click en la notificacion.

## Estructura real del proyecto

```text
src/
  assets/
  components/
  config/
  features/
    acts/
    attendance/
    audit/
    auth/
    branches/
    clients/
    home/
    notifications/
    profile/
    users/
    works/
  hooks/
  layouts/
  routes/
  store/
  utils/
  App.tsx
  index.css
  main.tsx
```

## Arquitectura actual

La aplicacion esta organizada por features.

Cada modulo suele separar:

- `api/`
- `components/`
- `hooks/`
- `pages/`
- `types/`

Ademas existen capas compartidas:

- `src/components/` para piezas reutilizables globales
- `src/layouts/` para layout principal
- `src/routes/` para router
- `src/store/` para estado global persistido
- `src/hooks/` para utilidades cross-feature

## Rutas que existen hoy

- `/login`
- `/home`
- `/works`
- `/works/:id`
- `/proyectistas`
- `/profile`
- `/acts`
- `/auditoria`
- `/notifications`

## Modulos visibles en la app

### Auth

- login contra `POST /users/login`
- persistencia de sesion en Zustand (`authStore`)

### Home / Dashboard

- KPIs
- grafica de tendencia
- distribucion por estado
- actividad reciente
- top proyectistas
- top actos
- filtros globales de tiempo, oficina y orden

El dashboard cambia segun permisos:

- admins ven vista global
- usuarios no admin ven una vista acotada

### Trabajos

Es el modulo central del frontend.

Incluye:

- listado paginado de expedientes
- busqueda por folio, cliente o proyectista
- filtros globales
- modal para crear trabajo
- badges por estado
- navegacion al detalle

### Detalle de trabajo

`/works/:id` hoy ya soporta:

- preview y descarga de documento principal
- subida y reemplazo de documentos
- gestion de requisitos por acto y requisitos ad-hoc
- subida de documentos por requisito
- alta y baja de actos asociados
- comentarios en vivo
- cambio de estado del expediente
- edicion de datos del cliente

Tambien existe una pestana de historial, pero actualmente muestra placeholder de "proximamente disponible".

### Catalogo de actos

- listado por categorias
- modal de alta/edicion
- alta y baja de requisitos
- control de estado activo/inactivo

### Proyectistas / Usuarios

- tabla de personal
- filtros por rol y estado
- KPIs
- alta, edicion y desactivacion

Aunque la ruta visible es `/proyectistas`, la pantalla administra varios roles:

- `DRAFTER`
- `DATA_ENTRY`
- `LOCAL_ADMIN`

### Auditoria

- pantalla dedicada en `/auditoria`
- consume busqueda de logs de auditoria

### Notificaciones

- centro de notificaciones
- filtro por tipo y leidas/no leidas
- marcar una o todas como leidas
- navegacion directa al expediente relacionado

### Perfil

- datos personales
- informacion de oficina
- historial de asistencia

### Asistencia

No tiene ruta dedicada en el menu.

Se expone como modal global desde `GlobalFilters` y permite:

- marcar entrada
- marcar salida
- ver historial reciente

## Flujos completos

### Flujo de un proyectista

1. Inicia sesion en `/login` con su correo y contrasena.
2. Entra al sistema y, desde cualquier pantalla que use `GlobalFilters`, puede abrir el modal de **Asistencia**.
3. Si aun no ha marcado ese dia, el boton registra su **entrada**.
4. Mas tarde, desde el mismo modal, registra su **salida**.
5. La regla actual del sistema es de **un solo turno por dia**: despues de marcar salida ya no puede volver a marcar entrada ese mismo dia; solo podra hacerlo nuevamente al dia siguiente.
6. En el mismo modal puede ver un historial reciente y en `/profile` puede consultar su historial de asistencia junto con sus datos personales y su oficina.
7. Va a `/works` para revisar expedientes existentes o crear uno nuevo con el boton **Agregar trabajo**.
8. Al crear un trabajo captura folio, fecha limite, oficina, cliente, actos iniciales y, si lo necesita, tambien puede adjuntar **documentos iniciales** desde el modal de alta.
9. Una vez creado, entra al detalle del expediente en `/works/:id`.
10. Dentro del detalle puede subir o reemplazar el documento principal del trabajo.
11. Tambien puede **asociar actos** adicionales al expediente desde el detalle si el tramite cambio o crecio.
12. Cada acto aporta requisitos, y para cada requisito el proyectista puede subir su documento correspondiente; ademas puede agregar requisitos ad-hoc del expediente y subirles archivo.
13. En la pestana de comentarios puede conversar con otros usuarios en tiempo real por WebSocket.
14. Si necesita corregir sus propios datos, entra a `/profile` y actualiza correo, telefono y contrasena; si su rol es privilegiado, tambien puede editar nombre y horario.

### Flujo de un admin

1. Inicia sesion y entra al dashboard con capacidades administrativas segun su rol.
2. Desde `/proyectistas` puede dar de alta personal nuevo, asignarle oficina, rol, telefono y horario.
3. En esa misma pantalla puede editar usuarios existentes, cambiar rol o estado y ajustar horarios.
4. Desde `/acts` puede crear actos, organizarlos por categoria, editar su informacion y administrar sus requisitos.
5. Si un acto ya tiene trabajos vinculados, la operacion visible en UI pasa a desactivacion en lugar de borrado duro.
6. Desde `/home` consulta KPIs, tendencia, distribucion, actividad y rankings; la vista exacta depende de permisos.
7. Desde `/auditoria` revisa el historial de acciones registradas por el sistema.
8. Desde `/notifications` puede atender eventos del sistema y saltar directo al expediente relacionado.

## Modulos tecnicos de apoyo

Hay features que hoy existen como soporte de otras pantallas, aunque no tengan una pagina propia en el menu:

### `features/branches`

- carga el catalogo de oficinas para filtros y formularios

### `features/clients`

- provee tipos y APIs usados por el flujo de expedientes
- hoy no existe una pantalla independiente de clientes en el router principal

## Componentes globales relevantes

Componentes reutilizados en varias vistas:

- `GlobalSearch`
- `GlobalFilters`
- `ConfirmModal`
- `KpiCards`
- `RestrictedButton`
- `StatusChangeModal`
- `Sidebar`
- `WorkCard`

`GlobalFilters` hoy concentra:

- selector de fecha
- selector de oficina
- selector de orden
- boton de asistencia

## Estado global

### `authStore`

- guarda usuario autenticado
- guarda JWT
- se persiste en `localStorage` bajo `notaria-auth`

### `notificationStore`

- guarda notificaciones y contador no leido
- persiste en `localStorage`
- protege contra mezclar notificaciones de usuarios distintos con `_ownerUserId`

## Tiempo real actual

La app usa varias estrategias al mismo tiempo:

### Notificaciones in-app

- `MainLayout` sincroniza notificaciones desde backend al montar
- ademas vuelve a sincronizar cada 60 segundos

### Push notifications con Firebase

- `usePushNotifications` pide permiso del navegador
- obtiene `fcm_token`
- registra el token en `PUT /notifications/device-token`
- `useFCMListener` escucha mensajes foreground
- `public/firebase-messaging-sw.js` escucha mensajes background

### Comentarios en vivo por WebSocket

`CommentsSection` usa hooks de comentarios que se conectan a:

- `ws://localhost:8080/ws/comments?token=<jwt>`

El flujo actual:

- entra a room por `work_id`
- escucha nuevos comentarios
- agrega notificaciones locales cuando el comentario viene de otro usuario
- intenta reconectar si el socket se cae

## Permisos

El hook `src/hooks/usePermissions.ts` hoy expone:

- `isSuperAdmin`
- `isAdmin`
- `canManageUsers`
- `canViewGlobalDashboard`

Con eso la UI muestra u oculta:

- menu de proyectistas
- catalogo de actos
- vista global del dashboard
- acciones administrativas

## Estilos

La app ya no usa un `tailwind.config.*` clasico.

El tema vive en `src/index.css` con `@theme`, donde estan definidos:

- color primario institucional
- colores del sidebar
- colores de badges por estado
- fondo del dashboard
- scrollbar custom

## Relacion con el backend

Este frontend consume `Notaria178_API` y hoy depende de:

- REST en `http://localhost:8080`
- SSE para notificaciones
- WebSocket para comentarios
- Firebase FCM para push opcional

Para mas detalle de endpoints y modulos del servidor, revisa `../Notaria178_API/README.md`.
