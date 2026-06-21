# Compartir Vertix gratis (PWA + backend en la nube)

Apple **no** permite publicar en la App Store ni en TestFlight sin el Apple Developer Program (99 $/año). La forma **gratuita** de que cualquiera instale Vertix en iPhone y Android es la **PWA**: se despliega la web, se comparte un enlace y cada persona la "añade a la pantalla de inicio" como una app.

Necesitas 2 despliegues (ambos con plan gratis): **backend** (API) y **web** (PWA).

---

## 1) Subir el proyecto a GitHub
```bash
cd ~/Documents/surebets
git init && git add . && git commit -m "Vertix"
# crea un repo vacío en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/vertix.git
git branch -M main && git push -u origin main
```

## 2) Backend → Render (gratis, sin tarjeta)
1. [render.com](https://render.com) → **New → Web Service** → conecta el repo.
2. **Root Directory**: `backend` · **Runtime**: Docker (detecta el `Dockerfile`).
3. **Environment** → añade:
   - `JWT_SECRET` = una cadena larga y aleatoria.
4. **Create Web Service**. Al terminar tendrás una URL tipo `https://vertix-api.onrender.com`.
5. Pruébala: abre `https://TU-API.onrender.com/api/health` → debe responder `{"ok":true}`.

> ⚠️ En el plan gratis de Render el servicio "se duerme" tras 15 min (la primera petición tarda unos segundos) y **la base de datos SQLite se reinicia en cada despliegue**. Para datos permanentes de usuarios reales, migra a Postgres gratis (Neon) — pídemelo y lo dejo hecho.

## 3) Web (PWA) → Netlify (gratis, sin tarjeta)
1. [netlify.com](https://netlify.com) → **Add new site → Import from GitHub** → el mismo repo.
2. **Base directory**: `web` (build y publish ya están en `netlify.toml`).
3. **Environment variables** → añade:
   - `VITE_API_URL` = la URL del backend del paso 2 (sin `/api` al final), p.ej. `https://vertix-api.onrender.com`.
4. **Deploy**. Tendrás una URL tipo `https://vertix.netlify.app`.

## 4) Compartir e instalar
- Comparte el enlace `https://vertix.netlify.app`.
- En **iPhone** (Safari): botón Compartir → **Añadir a pantalla de inicio** → aparece el icono de Vertix y se abre a pantalla completa.
- En **Android** (Chrome): menú → **Instalar app**.

---

## Notas
- **CORS**: el backend acepta cualquier origen (vale para empezar). Para restringirlo a tu dominio, dímelo y lo ajusto.
- **HTTPS**: Render y Netlify dan HTTPS automático (necesario para PWA y para que iOS no bloquee las llamadas).
- **App nativa (Xcode/App Store)**: requiere el Apple Developer Program (99 $/año). Cuando lo tengas: en Xcode, `Product → Archive → Distribute App → App Store Connect` (o `eas build`/`eas submit`). Mientras, en la app nativa para tu uso, pon la URL pública en `mobile/src/config.js`.
- **Persistencia real**: si quieres que los datos de los usuarios no se borren, migramos a **Neon Postgres** (gratis, sin tarjeta).
