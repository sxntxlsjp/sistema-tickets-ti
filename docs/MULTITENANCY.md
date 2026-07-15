# Multitenancy — MasterDiv Desk

## Modelo de datos

**Tenant** (tabla `tenants`): `id, name, slug (único), legalName, taxId, logoUrl, primaryColor, isActive, createdAt, updatedAt`. En la UI se llama "Empresa".

**TenantUser** (tabla `tenant_users`): relación N:N entre `User` y `Tenant`, con `role` (`TenantRole`) e `isActive` propios de esa relación. Único por `[tenantId, userId]`. Permite que una persona tenga un rol distinto en cada empresa.

**Entidades con `tenantId` obligatorio**: `Ticket`, `TicketType`, `TicketSubtype`, `TicketPriority`, `SystemSetting`. `TicketType`/`TicketPriority` cambiaron su unicidad de global (`name`) a `[tenantId, name]`. `SystemSetting` cambió de `key` global a `[tenantId, key]`.

**Aislamiento transitivo (sin columna propia)**: `TicketComment`, `TicketAttachment`, `TicketHistory`, `TicketSatisfaction` se validan a través del `tenantId` del `Ticket` padre en cada controlador.

**Global (sin tenantId)**: `Country`. Es un catálogo de referencia mundial compartido; solo `isSuperAdmin` puede administrarlo (`authorizeRoles('ADMIN')` en `country.routes.js`, sin cambios). Un ticket puede referenciar cualquier país activo independientemente del tenant.

## Roles

- **Rol global** (`User.role`: `USER|SUPPORT|ADMIN`, sin cambios) + nuevo `User.isSuperAdmin: Boolean`. El Super Administrador de MasterDiv es global, no depende de una empresa.
- **Rol por tenant** (`TenantUser.role`, enum `TenantRole`): `TENANT_ADMIN | AGENT | USER`.
- Migración de datos: los usuarios con `role = ADMIN` se marcaron `isSuperAdmin = true` y obtuvieron `TenantUser.role = TENANT_ADMIN` en el tenant inicial; `SUPPORT → AGENT`; el resto → `USER`.
- Los permisos por endpoint replican exactamente la política previa (ADMIN-only → `TENANT_ADMIN`; ADMIN+SUPPORT → `TENANT_ADMIN`+`AGENT`), ver `src/middlewares/tenant.middleware.js` (`authorizeTenantRoles`, `requireSuperAdmin`).

## Selección de empresa

- Login (`POST /api/auth/login`) devuelve `tenants: [{id, name, slug, logoUrl, role, openTickets}]` (empresas activas del usuario; si es `isSuperAdmin`, todas las empresas activas).
- `GET /api/auth/tenants` repite el mismo cálculo para refrescar la lista sin volver a loguear (usado por `select-tenant.html`).
- Frontend (`public/js/auth.js`): 0 empresas → mensaje de error; 1 empresa → selección automática; 2+ → redirección a `select-tenant.html`.
- Al seleccionar empresa (`applyTenantSelection` en `public/js/api.js`) se guarda en `localStorage` solo `activeTenantId` y `activeTenant` (id, name, slug, logoUrl, role) — nunca la lista completa ni datos sensibles.

## Cómo se transmite `X-Tenant-Id`

- `public/js/api.js` parchea `window.fetch` una sola vez: si hay `activeTenantId` en `localStorage`, añade el header `X-Tenant-Id` a toda request hacia `API_URL`. Esto evita editar cada `fetch` disperso en 6+ archivos del frontend.
- El backend **nunca** confía en un `tenantId` de body/query. Todo endpoint operativo pasa por `resolveTenant` (`src/middlewares/tenant.middleware.js`), que: valida el JWT, lee `X-Tenant-Id`, verifica que el tenant existe y está activo, y verifica que el usuario autenticado tiene una fila `TenantUser` activa para ese tenant (o es `isSuperAdmin`, que tiene bypass). Carga `req.tenant`, `req.tenantId`, `req.tenantMembership`.

## Compatibilidad del Frontend existente

El frontend legado (`dashboard.js`, `tickets.js`, `ticket-detail.js`, `create-ticket.js`, `users.js`) sigue comprobando `user.role === 'ADMIN'` en decenas de sitios. En vez de reescribir cada archivo, `applyTenantSelection` sobrescribe `user.role` en `localStorage` con el rol **efectivo** en la empresa activa (`'ADMIN'` si `isSuperAdmin` o `TENANT_ADMIN`; `'USER'` si `AGENT` o `USER`) y añade `user.tenantRole` con el valor real. El backend es la única fuente de verdad de autorización (`authorizeTenantRoles`); el valor en `localStorage` es solo para decidir qué UI mostrar.

## Reglas de aislamiento (resumen)

Todo controlador operativo agrega `tenantId: req.tenantId` a sus queries de Prisma. Los sub-recursos de ticket (comentarios, adjuntos, satisfacción, estado, detalle, reasignación, prioridad) usan `findTenantTicket(id, tenantId)` (`src/utils/ticketTenant.util.js`) para devolver **404** (no 403) si el ticket pertenece a otro tenant, evitando revelar su existencia. Un responsable solo puede asignarse si tiene `TenantUser` activo con rol `TENANT_ADMIN`/`AGENT` en ese mismo tenant.

## Cómo crear un nuevo Tenant

Módulo **Empresas** (`/tenants.html`, solo `isSuperAdmin`): `POST /api/tenants { name, slug? }` (el slug se autogenera si se omite). Editar con `PUT /api/tenants/:id`, activar/desactivar con `PATCH /api/tenants/:id/status` (no hay borrado físico). Un `TENANT_ADMIN` se crea llamando `POST /api/users` con `X-Tenant-Id` de la empresa nueva (el super admin puede hacerlo directamente gracias al bypass de `authorizeTenantRoles`).

## Cómo se migraron los datos existentes

Migración `20260714223811_add_multitenant_architecture` (patrón *expand → backfill → contract*, sin `prisma migrate reset`):
1. Crea `tenants`, `tenant_users`, agrega columnas `tenantId` **nullable** a `tickets/ticket_types/ticket_subtypes/ticket_priorities/system_settings` y `isSuperAdmin` a `users`.
2. Un bloque `DO $$ ... $$` crea el tenant **MasterDiv Demo** y reasigna todos los registros existentes a él, crea `TenantUser` para cada usuario existente (mapeando su rol) y marca `isSuperAdmin = true` a los `ADMIN`.
3. Convierte `tenantId` a `NOT NULL`, agrega índices (`tenantId`, `tenantId+status`, `tenantId+createdAt`, `tenantId+assignedTo`) y las nuevas restricciones únicas por tenant.

No se perdió ningún ticket, usuario, tipo, subtipo, prioridad ni configuración existente (verificado: 14/14 tickets, 6/6 tipos migrados).

`prisma/seed/seed.js` fue actualizado: ahora crea (o reutiliza) el tenant `MasterDiv Demo`, marca al admin sembrado como `isSuperAdmin` y crea su `TenantUser` (`TENANT_ADMIN`), y los tipos de ticket se crean con `tenantId`. Así una instalación completamente nueva (`npm run seed` sobre una BD vacía) también queda operativa sin depender de la migración de backfill (que solo aplica a datos preexistentes).

## Riesgos conocidos

1. **Descarga de adjuntos sin validar tenant.** Los archivos se sirven vía `express.static('/uploads')` por nombre de archivo, sin pasar por un controlador que valide `tenantId`. Si un nombre de archivo se filtra o es adivinable, podría descargarse cruzando tenants. No se corrigió por ser un cambio de arquitectura de archivos fuera del alcance de esta fase.
3. **`ticketNumber` sigue siendo una secuencia global**, no por empresa (preserva compatibilidad; no es un problema de aislamiento de datos, solo estético).
4. **AGENT es un rol nuevo sin datos reales**: no había usuarios `SUPPORT` en la base migrada, por lo que el camino `AGENT` está probado solo a nivel de autorización backend, no con datos reales de uso.
5. **Country global administrable solo por `isSuperAdmin`**: si en el futuro una empresa necesita su propio país "privado", requeriría una tabla `TenantCountry` (deliberadamente no implementada ahora, ver Fase 3 del pedido original).
