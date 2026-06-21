# Vertix — Surebets / Arbitraje deportivo

App completa para **detectar y calcular surebets** (arbitraje deportivo), **registrar tus apuestas y ganancias**, y verlas en un **calendario** y un **dashboard**. Estilo oscuro tipo [oddsjam.com](https://oddsjam.com).

Incluye **backend + base de datos**, **web responsive** y **app móvil nativa**, todo compartiendo la misma API y las mismas cuentas de usuario.

```
surebets/
├── backend/   API REST + base de datos (Node + Express + SQLite + JWT)
├── web/       App web (React + Vite)            ← escritorio y móvil (responsive/PWA)
├── mobile/    App móvil nativa (React Native + Expo)
└── brand/     Logos de Vertix (mark, icon, wordmark en SVG)
```

## Marca

**Vertix** — de *vértice / vertex*: el punto donde convergen todas las líneas; en arbitraje, donde todos los resultados convergen en una ganancia garantizada. Verde = beneficio. Logos en [`brand/`](brand/): `vertix-mark.svg` (icono), `vertix-icon.svg` (app-icon sobre fondo oscuro), `vertix-wordmark.svg` (icono + nombre).

> El nombre dentro de la app ya es Vertix. Para que el **nombre bajo el icono** del móvil y el proyecto de Xcode también se llamen Vertix, regenera el nativo: `cd mobile && npx expo prebuild --clean -p ios` (creará `ios/Vertix.xcworkspace`) y exporta `brand/vertix-icon.svg` a PNG 1024×1024 como icono.

---

## ✨ Funcionalidades

- **Cuentas de usuario** multiusuario: registro e inicio de sesión (email + contraseña). Cada usuario guarda sus datos en la base de datos.
- **Calculadora de surebets**: introduces las cuotas de cada casa y la app calcula el reparto de stakes para un **beneficio garantizado**, con:
  - 2 o más resultados (1X2, ganador, hándicaps…).
  - Cuotas en formato **decimal** o **americano**.
  - **Redondeo** de stakes (a 1, 5, 10…).
  - Detección de si es **surebet** y % de beneficio real.
- **Registro de apuestas**: guarda cada operación, márcala como ganada / perdida / anulada y anota el beneficio real.
- **Calendario de ganancias**: cuadrícula mensual con el **P&L por día** (verde = beneficio, rojo = pérdida) y el detalle de cada día.
- **Dashboard**: beneficio total y del mes, ROI, tasa de acierto, apuestas pendientes y gráfico de beneficio por mes.
- **Listo para cuotas en vivo**: hay un stub (`backend/src/odds.js` + `GET /api/odds`) preparado para enchufar un proveedor de cuotas (p. ej. [The Odds API](https://the-odds-api.com)) y escanear surebets automáticamente.

---

## 🚀 Puesta en marcha

Requisitos: **Node.js 22+** (se usa el módulo integrado `node:sqlite`, sin dependencias nativas).

### 1) Backend (API + base de datos)

```bash
cd backend
npm install
npm run seed     # (opcional) crea datos de ejemplo y un usuario demo
npm start        # arranca en http://localhost:4000
```

La base de datos es un fichero SQLite (`backend/surebets.db`) que se crea solo.

**Usuario demo** (tras `npm run seed`): `demo@surebets.app` / `demo1234`

### 2) Web

```bash
cd web
npm install
npm run dev      # http://localhost:5183
```

La web habla con el backend mediante un proxy (`/api` → `http://localhost:4000`), configurado en `web/vite.config.js`. Es **responsive**: en móvil el menú lateral se convierte en una barra inferior, así que también sirve como versión móvil web/PWA.

### 3) Móvil (Expo)

```bash
cd mobile
npm install
# Edita src/config.js y pon la IP de tu ordenador en la red local:
#   - Móvil físico (Expo Go):  http://TU_IP_LOCAL:4000
#   - Emulador Android:        http://10.0.2.2:4000
#   - Simulador iOS:           http://localhost:4000
npx expo start
```

Escanea el QR con la app **Expo Go** (iOS/Android) o pulsa `a`/`i` para abrir en emulador.
Si hay avisos de versiones, ejecuta `npx expo install --fix`.

#### Build nativa para Xcode (iOS)

Si en vez de Expo Go quieres una build nativa para abrir en Xcode:

```bash
cd mobile
npx expo prebuild -p ios          # genera la carpeta ios/ (.xcworkspace)
# pod install necesita locale UTF-8; si falla con Encoding::CompatibilityError:
cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install && cd ..
open ios/SureEdge.xcworkspace     # abrir en Xcode (¡el .xcworkspace, no el .xcodeproj!)
```

En Xcode: selecciona tu iPhone como destino → target **SureEdge** → *Signing & Capabilities* →
marca *Automatically manage signing* y elige tu **Team** (tu Apple ID) → ▶︎ Run.
El `app.json` ya incluye una excepción **ATS** (`NSAllowsArbitraryLoads`) para permitir el `http`
del backend en desarrollo. Con Apple ID gratis, la app dura 7 días en el dispositivo.

> ⚠️ En el móvil, `localhost` es el propio teléfono, **no** tu ordenador. Por eso hay que poner la IP de tu máquina en `mobile/src/config.js`.

---

## 🧮 La matemática del arbitraje

Para cuotas decimales `o₁…oₙ` de los resultados de un mismo evento (cada uno en una casa distinta):

- Probabilidad implícita de cada resultado: `pᵢ = 1 / oᵢ`
- Suma: `S = Σ pᵢ`
- **Es surebet si `S < 1`.** Beneficio teórico: `(1/S − 1) × 100 %`
- Reparto de una inversión total `T` para que el retorno sea igual gane quien gane:
  `stakeᵢ = T × pᵢ / S`  → retorno `= T / S` en todos los casos.
- **Beneficio garantizado** = retorno − inversión (la app usa el peor retorno tras redondear, así nunca se sobreestima).

Ejemplo (cuotas 2.10 y 2.05, 100 € totales): stakes 49,40 € y 50,60 €, retorno ≈ 103,73 € en ambos → **+3,73 € garantizados (+3,73 %)**.

La lógica vive en `arb.js` (idéntica en backend, web y móvil) y el backend **recalcula siempre** al guardar, para mantener la integridad de los números.

---

## 🔌 API REST

Base: `http://localhost:4000/api`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Crear cuenta → `{ token, user }` |
| `POST` | `/auth/login` | Iniciar sesión → `{ token, user }` |
| `GET` | `/auth/me` | Usuario actual *(requiere token)* |
| `GET` | `/bets` | Listar apuestas (`?from&to&status`) |
| `POST` | `/bets` | Crear apuesta |
| `PATCH` | `/bets/:id` | Actualizar (estado, beneficio real…) |
| `DELETE` | `/bets/:id` | Eliminar |
| `GET` | `/stats/summary` | KPIs (total, mes, ROI, acierto…) |
| `GET` | `/stats/calendar?month=YYYY-MM` | P&L por día |
| `GET` | `/stats/monthly?year=YYYY` | P&L por mes |
| `GET` | `/odds` | Cuotas en vivo *(stub, listo para integrar)* |

Autenticación por **JWT** en la cabecera `Authorization: Bearer <token>`. Las rutas de apuestas y estadísticas filtran siempre por el usuario del token.

### Modelo de datos (SQLite)

- **users**: `id, email, name, password_hash, created_at`
- **bets**: `id, user_id, event, sport, market, legs (JSON), total_stake, expected_profit, profit_pct, status, actual_profit, placed_at, settled_at, notes, created_at`

---

## 🧱 Stack

- **Backend**: Node.js, Express, `node:sqlite` (integrado), JWT (`jsonwebtoken`), `bcryptjs`.
- **Web**: React 18, Vite, React Router. Tema oscuro con CSS variables (OKLCH).
- **Móvil**: React Native + Expo (SDK 52), React Navigation, Expo SecureStore.

## 🔐 Notas de seguridad (para producción)

Esto es una base sólida para desarrollo. Antes de publicarlo:
- Define un `JWT_SECRET` fuerte en `backend/.env` (copia `.env.example`).
- Sirve todo por **HTTPS** y restringe **CORS** a tu dominio.
- Considera Postgres/MySQL en vez de SQLite si esperas mucha concurrencia.
- El juego con dinero real está regulado: revisa la legalidad en tu país. Esta herramienta es de cálculo/registro, no incita a apostar.
