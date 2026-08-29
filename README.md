# Car Sales API

API REST para la compra de vehículos (sedán, SUV, pickup, hatchback y deportivo). Permite registrar clientes, explorar el catálogo, gestionar carrito y lista de deseos, y confirmar pedidos.

Proyecto académico — Universidad Remington, Énfasis I.

## Stack

| | |
|---|---|
| Runtime | Node.js 22 (CommonJS, sin paso de build) |
| Framework | Express 5 |
| Base de datos | MongoDB 7 + Mongoose 8 |
| Autenticación | JWT (`jsonwebtoken`) + hash con `bcryptjs` |
| Despliegue | Docker Compose |

## Requisitos

- Docker y Docker Compose, **o bien** Node.js 22+ y una instancia de MongoDB accesible.

## Puesta en marcha

### Con Docker (recomendado)

```bash
cp .env.example .env
docker compose up -d --build
docker exec backend-mono-api-api-1 npm run seed
```

La API queda en `http://localhost:8000` y MongoDB en `localhost:27017`.

### En local

```bash
cp .env.example .env          # ajusta DB_URL a tu MongoDB
npm install
npm run seed
npm run dev                   # recarga automática con node --watch
```

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto HTTP de la API | `8000` |
| `DB_URL` | Cadena de conexión a MongoDB | `mongodb://localhost:27017/enfasis-i` |
| `APP_SECRET` | Clave para firmar y verificar los JWT | `dev-secret-change-me` |

No hay validación al arrancar: si falta una variable, el error aparece más tarde al conectar. Cámbiale el valor a `APP_SECRET` antes de exponer el servicio.

## Scripts

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor |
| `npm run dev` | Inicia con recarga automática (`node --watch`) |
| `npm run seed` | Puebla el catálogo — **solo inserta lo que falta** |
| `npm run seed -- --force` | Sobrescribe los productos existentes |
| `npm test` | Sin implementar (el proyecto no tiene pruebas) |

### Sobre el seed

El script hace *upsert* por `name` usando `$setOnInsert`, así que **no actualiza documentos que ya existen**: si editas `src/database/seed/products.js` y vuelves a ejecutarlo, no cambia nada. Usa `--force` para reescribirlos (ten en cuenta que eso también reinicia el campo `available`).

Si trabajas con Docker, recuerda que el código se copia dentro de la imagen y no hay volumen montado: **reconstruye antes de sembrar**, o el contenedor ejecutará una copia vieja del archivo.

```bash
docker compose up -d --build api
docker exec backend-mono-api-api-1 npm run seed -- --force
```

## API

Base: `http://localhost:8000`. Todas las respuestas son JSON.

### Catálogo

| Método | Ruta | Auth | Descripción |
|---|---|:---:|---|
| `GET` | `/` | — | Catálogo completo + categorías disponibles |
| `GET` | `/:id` | — | Detalle de un vehículo |

### Clientes

| Método | Ruta | Auth | Descripción |
|---|---|:---:|---|
| `POST` | `/customer/signup` | — | Registro. Body: `{ email, password, phone }` |
| `POST` | `/customer/login` | — | Inicio de sesión. Body: `{ email, password }` |
| `POST` | `/customer/address` | 🔒 | Nueva dirección. Body: `{ street, postalCode, city, country }` |
| `GET` | `/customer/profile` | 🔒 | Perfil con direcciones, carrito, wishlist y pedidos |
| `GET` | `/customer/shoping-details` | 🔒 | Solo carrito, wishlist y pedidos |
| `GET` | `/customer/wishlist` | 🔒 | Lista de deseos |

### Carrito y lista de deseos

| Método | Ruta | Auth | Descripción |
|---|---|:---:|---|
| `PUT` | `/cart` | 🔒 | Agregar o actualizar cantidad. Body: `{ _id, qty }` |
| `DELETE` | `/cart/:id` | 🔒 | Quitar del carrito |
| `PUT` | `/wishlist` | 🔒 | Agregar a la wishlist. Body: `{ _id }` |
| `DELETE` | `/wishlist/:id` | 🔒 | Quitar de la wishlist |

### Pedidos

| Método | Ruta | Auth | Descripción |
|---|---|:---:|---|
| `POST` | `/shopping/order/` | 🔒 | Genera el pedido con el contenido del carrito. Body: `{ txnId }` |

`PUT /cart` reemplaza la cantidad, no la suma. Confirmar un pedido calcula el monto total y **vacía el carrito**.

### Autenticación

`signup` y `login` devuelven `{ id, token }`. El token es un JWT con vigencia de **1 día** y se envía en cada petición protegida:

```
Authorization: Bearer <token>
```

Sin token válido, las rutas marcadas con 🔒 responden `401`.

### Errores

```json
{ "message": "Invalid credentials" }
```

`400` datos inválidos o correo ya registrado · `401` token ausente o inválido · `404` recurso no encontrado · `500` error interno.

## Ejemplo de uso

```bash
# 1. Registro — guarda el token
TOKEN=$(curl -s -X POST localhost:8000/customer/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@test.com","password":"123456","phone":"3001234567"}' | jq -r '.token')

# 2. Catálogo — toma el id del primer vehículo
ID=$(curl -s localhost:8000/ | jq -r '.products[0]._id')

# 3. Agregar dos unidades al carrito
curl -s -X PUT localhost:8000/cart -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"_id\":\"$ID\",\"qty\":2}"

# 4. Confirmar el pedido
curl -s -X POST localhost:8000/shopping/order/ -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"txnId":"tx-001"}'
```

## Arquitectura

El backend se organiza en **tres dominios**, cada uno con las mismas cuatro capas:

```
src/api/<dominio>.js                          rutas y validación de entrada
  └─ src/services/<dominio>-service.js        lógica de negocio
       └─ src/database/repository/...         consultas a MongoDB
            └─ src/database/models/...        esquemas de Mongoose
```

- **Customer** — registro, autenticación, perfil y direcciones. Es además el **dueño de los datos** de carrito, wishlist y pedidos, que viven embebidos en el documento del cliente.
- **Products** — catálogo de vehículos. Expone también las rutas de carrito y wishlist, pero delega su escritura en `CustomerService`.
- **Shopping** — confirmación de pedidos.

### Regla de frontera entre dominios

> Un dominio solo accede a los datos de otro a través de su **capa de servicio pública**, nunca de su repositorio o modelo.

Es intencional: prepara el código para dividirlo en microservicios sin reescribir la lógica de negocio. Si trabajas en este repositorio, respétala.

```
src/
├── index.js              arranque del servidor
├── express-app.js        middlewares y registro de rutas
├── api/                  capa HTTP + middleware de autenticación
├── services/             lógica de negocio
├── database/             conexión, modelos, repositorios y seed
├── config/               variables de entorno
└── utils/                JWT, hashing, errores y manejador de errores
```

## Documentación

| Archivo | Contenido |
|---|---|
| `docs/01-requirements.md` | Requerimientos funcionales y no funcionales |
| `docs/02-user-history.md` | Historias de usuario |
| `docs/03-use-case-.md` | Casos de uso |
| `docs/04-user-story.md` | Product backlog priorizado |
