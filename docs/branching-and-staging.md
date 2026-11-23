# Flujo de ramas y entorno de Staging · Jujuy247

Este documento define el flujo de trabajo para probar nuevas funcionalidades en un entorno de **staging** antes de promoverlas a **producción (`main`)**.

---

## 1. Modelo de ramas

| Rama | Rol | Despliegue esperado |
| --- | --- | --- |
| `main` | Código estable en producción (`https://www.jujuy247.com.ar`) | Vercel Production |
| `staging` | Integración y QA funcional previo a producción | Vercel Preview (o dominio `staging.jujuy247.com.ar`) |
| `feat/<feature>` | Nueva funcionalidad acotada (creada desde `staging`) | Vercel Preview temporal por rama/PR |
| `feat/<feature>-<parte>` | Sub-etapa de una funcionalidad grande (ver sección 2) | Vercel Preview temporal por rama/PR |
| `fix/<tema>` | Corrección de bug detectada en staging o producción | Vercel Preview temporal por rama/PR |
| `chore/<tema>` | Tareas técnicas, CI, dependencias o configuración | Vercel Preview temporal por rama/PR |

### Regla de origen y destino
- Toda rama de trabajo (`feat/*`, `fix/*`, `chore/*`) nace desde `staging` actualizada y se integra primero en `staging` mediante Pull Request.
- Nunca se hace push directo de features experimentales a `main`.
- La única excepción son hotfixes críticos en producción, que luego deben integrarse también en `staging` para evitar desvíos.

---

## 2. Cómo dividir funcionalidades grandes en múltiples ramas

Cuando una funcionalidad abarca varias capas o integraciones externas (por ejemplo, la automatización de publicación en redes sociales), **se divide en ramas independientes, pequeñas y verificables**:

1. **Partir desde la base común (`core`):** tipos, helpers puros, validaciones, simulación (`dry-run`) y pruebas unitarias.
2. **UI aislada o integrada sobre contratos claros:** interfaz en el Panel Editorial trabajando primero contra simulación.
3. **Un adaptador por integración externa:** una rama separada por red o proveedor (Instagram, Facebook, WhatsApp Gateway), de modo que cada una se pueda revisar, probar en `staging` y revertir sin afectar a las demás.
4. **Integración secuencial en `staging`:** cada parte pasa `frontend-verify` y se prueba en staging antes o mientras avanza la siguiente. Si una rama depende de otra aún no mergeada, ramifica desde esa rama padre y deja explícita la dependencia en el PR hasta que la base entre en `staging`.

---

## 3. Guardarraíles automáticos del entorno Staging

La lógica central vive en `frontend/lib/env.mjs` y aplica protecciones automáticas según `NEXT_PUBLIC_APP_ENV` o `VERCEL_ENV`:

- **Detección de entorno:** `NEXT_PUBLIC_APP_ENV` (`production` | `staging` | `development`) tiene prioridad; si no se define, `VERCEL_ENV=preview` se resuelve automáticamente como `staging`.
- **Bloqueo de buscadores (`robots.txt`):** en `staging` y `development`, `app/robots.js` responde `Disallow: /` y omite los sitemaps para que Google no indexe URLs de prueba.
- **Meta robots (`noindex, nofollow`):** `app/layout.js` emite `index: false, follow: false` fuera de producción (y también permite desactivar indexación con `ALLOW_SEARCH_INDEXING=false`).
- **Banner visible en el Panel Editorial:** `app/panel/components/StagingBanner.js` muestra en la parte superior de `/panel` la insignia **STAGING**, la rama activa (`VERCEL_GIT_COMMIT_REF`) y si las redes están en simulación (`dry-run`) o `LIVE`.
- **Simulación de redes sociales (`SOCIAL_PUBLISH_MODE`):** por defecto es `dry-run` fuera de producción, evitando publicaciones accidentales en cuentas reales del cliente durante pruebas en staging.

---

## 4. Configuración en Vercel y GitHub

### A. Vercel (Preview para `staging`)
1. En el proyecto de Vercel (`frontend` como Root Directory), todas las ramas distintas de `main` generan automáticamente un **Preview Deployment** al hacer push.
2. *(Opcional recomendado)* En **Project Settings → Domains**, agregá `staging.jujuy247.com.ar` (subdominio apuntado por CNAME en tu DNS) y asígnalo a la Git Branch **`staging`**.
3. En **Project Settings → Environment Variables**, para el scope **Preview** (o específicamente para la rama `staging`):
   - `NEXT_PUBLIC_APP_ENV` = `staging`
   - `NEXT_PUBLIC_DIRECTUS_URL` = URL del CMS aprobado (`https://directus-production-244d.up.railway.app` u otra instancia de Directus dedicada si más adelante separan base de pruebas)
   - `NEXT_PUBLIC_SITE_URL`: si usás `staging.jujuy247.com.ar`, podés definir esa URL en Preview; si usás el preview autogenerado de Vercel, mantené la URL canónica según corresponda teniendo en cuenta que `robots.js` y `layout.js` ya bloquean la indexación (`Disallow: /` y `noindex`).
   - `SOCIAL_PUBLISH_MODE` = `dry-run` (mantener así en Preview salvo pruebas controladas en cuentas sandbox).
   - Conservá `Production` intacto apuntando a `main` y `https://www.jujuy247.com.ar`.

### B. GitHub Branch Protection (Settings → Branches)
Creá reglas de protección (Rulesets o Branch protection rules) para **`main`** y **`staging`**:
1. Activar **Require a pull request before merging** (al menos 1 aprobación para `main`).
2. Activar **Require status checks to pass before merging** y seleccionar el check **`frontend-verify`** definido en `.github/workflows/ci.yml`.
3. Activar **Require branches to be up to date before merging** en `main`.
4. Bloquear force-push y borrado de rama en `main` y `staging`.

---

## 5. Flujo de promoción `staging` → `main`

1. Desarrollar cada funcionalidad en su rama `feat/...` desde `staging`.
2. Abrir Pull Request hacia `staging`, verificar que pase `frontend-verify` y mergear.
3. Probar la funcionalidad en el deployment de `staging` (verificando banner `STAGING`, `/robots.txt` y comportamiento funcional).
4. Cuando el cliente o el responsable aprueba los cambios y autoriza la salida a producción:
   - Abrir Pull Request de **`staging` → `main`**.
   - Confirmar que todas las variables necesarias existen en el entorno **Production** de Vercel antes del merge.
   - Mergear el PR hacia `main` para disparar el deploy productivo.
5. Mantener `docs/production-release.md` como referencia para checklist y rollback en producción.
