# Jujuy247 Portal

Arquitectura recomendada (separado):

- **Backend (admin + API):** Directus (Docker) + Postgres
- **Frontend:** Next.js consumiendo la API REST

## 1) Backend (Directus)

Carpeta: `backend-directus/`

### Requisitos

- Docker Desktop instalado y corriendo.

### Levantar el admin

1. Copiá variables de entorno:

   - Copiar `backend-directus/.env.example` a `backend-directus/.env`
   - Cambiar `DB_PASSWORD`, `DIRECTUS_KEY`, `DIRECTUS_SECRET`, `ADMIN_PASSWORD`

2. Levantar:

   - Desde la carpeta `backend-directus/` ejecutar:
     - `docker compose up -d`

    Nota: para **local** se levantan solo `db` + `directus`. El reverse proxy **Caddy** queda opcional bajo un profile.

    - Si querés levantar también Caddy (80/443), ejecutar:
       - `docker compose --profile proxy up -d`

3. Abrir:

- Admin: http://localhost:8055

### Modelo de datos sugerido

Crear 3 colecciones:

1) `categories`
- `name` (string, required)
- `slug` (string, unique, required)

2) `tags`
- `name` (string, required)
- `slug` (string, unique, required)

3) `articles`
- `title` (string, required)
- `slug` (string, unique, required)
- `excerpt` (text)
- `content` (text / markdown)
- `is_urgent` (boolean)
- `status` (string; values: `draft` | `published`)
- `published_at` (datetime)
- `category` (M2O -> `categories`)
- `tags` (M2M -> `tags`)
- (opcional) `cover_image` (file)

#### SEO recomendado (en `articles`)

Estos campos ayudan a que cada noticia tenga buen título/description para Google, y buenos previews en redes.

- `seo_title` (string) → si está vacío, usar `title`
- `seo_description` (text) → si está vacío, usar `excerpt`
- `seo_canonical_url` (string) → opcional, si querés forzar canonical distinto
- `seo_image` (file) → para Open Graph/Twitter (si está vacío, usar `cover_image`)
- `seo_no_index` (boolean) → si querés que NO indexe una nota
- `seo_no_follow` (boolean) → si querés que NO siga links

Opcional (avanzado):
- `seo_keywords` (text) → si no lo usás, se pueden derivar de `tags`

### Permisos (para que el frontend lea)

En **Settings → Roles & Permissions → Public** habilitar:

- `articles`: **read** (y filtrar por `status = published` si querés)
- `categories`: **read**
- `tags`: **read**

## 2) Frontend (Next.js)

Carpeta: `frontend/`

### Config

1. Copiar `frontend/.env.local.example` a `frontend/.env.local`
2. Setear:
   - `NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055`
3. (Opcional) setear stream:
   - `NEXT_PUBLIC_RADIO_STREAM_URL=<url_del_stream>`
4. (Opcional) setear Google AdSense:
   - `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx`
   - `NEXT_PUBLIC_ADSENSE_SLOT_HIGH=<slot_id>`
   - `NEXT_PUBLIC_ADSENSE_SLOT_HIGH_MID=<slot_id>`
   - `NEXT_PUBLIC_ADSENSE_SLOT_MID=<slot_id>`
   - `NEXT_PUBLIC_ADSENSE_SLOT_LOW_MID=<slot_id>`
   - `NEXT_PUBLIC_ADSENSE_SLOT_LOW=<slot_id>`

Si configurás AdSense, el front usa esos slots en lugar de los banners manuales de Directus. Si no, mantiene el fallback actual.

### Instalar y correr

- En `frontend/`:
  - `npm install`
  - `npm run dev`

Abrir: http://localhost:3000

## 3) Streaming tipo radio (en la misma página)

### Opción A (más simple): Icecast / Shoutcast

- Corrés un servidor de streaming (Icecast/Shoutcast) en un VPS.
- Emitís desde tu PC con **OBS** o **BUTT (Broadcast Using This Tool)**.
- En la web, ponés un reproductor HTML5 (`<audio>`), como ya está en el front.

Formato recomendado:
- MP3 o AAC

Notas:
- A veces el browser exige HTTPS si tu sitio corre en HTTPS.
- Ver CORS del servidor de streaming si el audio no carga.

### Opción B (más pro): HLS

- Usás un proveedor o un pipeline que emita HLS.
- En frontend se suele usar `hls.js` (cuando el navegador no soporta HLS nativo).

### Opción C (transmisión “desde la página”)

Si querés que alguien transmita *desde el navegador* (tipo “estudio web”), ya es WebRTC y se complica.
Recomendación práctica:
- Usar un servicio: **Mux**, **Cloudflare Stream**, **AWS IVS**, etc.
- O transmitir con OBS a un servidor RTMP/HLS.

Si me decís qué preferís (Icecast vs servicio), te dejo una configuración concreta + checklist de hosting.
