# Panel Editorial de Jujuy247 · Documentación Técnica y Funcional

**Versión:** 1.0.0  
**Fecha de implementación:** Octubre 2026  
**Entorno backend:** Directus REST API (`http://localhost:8055` o `NEXT_PUBLIC_DIRECTUS_URL`)  
**Frontend:** Next.js 16 (App Router)  

---

## 1. Visión y Propósito

El **Panel Editorial** de Jujuy247 es una interfaz de redacción propia, sobria y libre de distracciones diseñada para que el equipo editorial y el cliente puedan gestionar, redactar y publicar noticias sin enfrentarse a la complejidad técnica del panel nativo de Directus (sin UUIDs, tablas crudas ni configuraciones de bases de datos).

Reutiliza la identidad gráfica del diario público:
* Tipografías oficiales: **Archivo** (títulos y encabezados) y **Source Sans 3** (redacción y controles).
* Colores: Rojo carmesí Jujuy247 (`#c23434`), superficies en blanco puro y gris perla (`#f5f6f8`), texto de alto contraste (`#1f2428`).

---

## 2. Arquitectura de Seguridad (BFF - Backend For Frontend)

Para garantizar que ningún token o credencial de Directus quede expuesto en el navegador, el panel opera bajo un patrón **BFF** a través de endpoints internos de Next.js:

```
[Navegador del Redactor]
       │
       ▼ (Cookies HttpOnly: directus_access_token)
[Next.js App Router: /api/panel/*]
       │
       ▼ (Bearer Authorization JWT)
[Directus REST API: :8055]
       │
       ▼
[PostgreSQL Database]
```

### Características de Seguridad:
1. **Cookies HttpOnly y SameSite=Lax:** Los tokens `directus_access_token` (vigencia 15 min) y `directus_refresh_token` (vigencia 7 días) se almacenan exclusivamente en cookies del servidor protegidas contra ataques XSS.
2. **Protección de Rutas:** El layout de servidor en `/panel/(dashboard)/layout.js` verifica la sesión activa (`getValidToken()`) y redirige automáticamente a `/panel/login` si no hay sesión válida o si el token expiró y no puede renovarse.
3. **Aislamiento del Portal Público:** El componente `SiteLayoutWrapper` detecta rutas bajo `/panel` y omite la cabecera del portal (clima, radio, publicidad) y el pie de página público, montando la estructura de redacción dedicada.

---

## 3. Endpoints Implementados

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/panel/auth` | Inicio de sesión contra `POST /auth/login` de Directus y emisión de cookies HttpOnly. |
| `GET` | `/api/panel/auth` | Consulta del perfil del usuario en sesión (`GET /users/me`). |
| `DELETE` | `/api/panel/auth` | Cierre de sesión, revocación de tokens y eliminación de cookies. |
| `GET` | `/api/panel/articles` | Listado de noticias con filtros de estado (`all`, `published`, `draft`), categoría y búsqueda. |
| `POST` | `/api/panel/articles` | Creación de nueva noticia (borrador o publicada) con generación automática de slug. |
| `GET` | `/api/panel/articles/[id]` | Obtención de los datos completos de una noticia para edición. |
| `PATCH` | `/api/panel/articles/[id]` | Actualización de campos de una noticia existente. |
| `DELETE` | `/api/panel/articles/[id]` | Eliminación de noticia en Directus. |
| `GET` | `/api/panel/categories` | Obtención de las secciones/categorías activas ordenadas por posición y nombre. |
| `POST` | `/api/panel/upload` | Subida de imágenes a Directus (`POST /files`) con validación de tipo (JPG, PNG, WebP) y peso (< 10 MB). |

---

## 4. Pantallas y Experiencia de Usuario

### A. Acceso Editorial (`/panel/login`)
* Formulario limpio y austero con logo oficial de Jujuy247.
* Validación y manejo de errores con alertas claras.
* Redirección inmediata a `/panel` tras autenticación exitosa.

### B. Listado de Noticias (`/panel`)
* **Barra lateral de navegación:** Acceso directo a *Noticias*, *Crear noticia* y enlace directo para abrir el diario online en pestaña nueva. Muestra el avatar y nombre del usuario conectado, junto con el botón de cierre de sesión.
* **Barra de control y filtros:**
  * Pestañas rápidas: `Todas` | `Publicadas` | `Borradores`.
  * Buscador en tiempo real por título o bajada.
  * Selector desplegable para filtrar por sección.
* **Tabla de noticias:**
  * Título y slug.
  * Chip indicador si la nota está destacada en **Portada**.
  * Sección en color rojo de acento.
  * Estado con badge de color: `Publicada` (verde) o `Borrador` (gris neutro).
  * Fecha formateada.
  * Acciones rápidas: *Ver en la web* (si está publicada), *Editar* y *Eliminar* con modal de confirmación.

### C. Editor de Noticias (`/panel/nueva` y `/panel/[id]`)
Distribución periodística en dos columnas:

1. **Lienzo Principal (Izquierda):**
   * **Título:** Entrada tipográfica amplia estilo titular periodístico.
   * **URL amigable (Slug):** Generación automática a partir del título con previsualización de ruta.
   * **Bajada / Copete:** Campo para el resumen que acompaña a la nota en portada y listados.
   * **Cuerpo del artículo (Markdown):**
     * Barra de herramientas superior con accesos directos: **Negrita**, *Cursiva*, **Subtítulo H2**, **Cita**, **Lista con viñetas** y **Enlace**.
     * Contador en vivo de palabras y caracteres.
     * Soporte nativo de Markdown compatible con el renderizado del portal público.
   * **Video de YouTube:** Campo con validación inmediata de enlaces (`watch?v=`, `youtu.be/`, `/shorts/`) con advertencia en caso de URL inválida.
   * **Optimización para Google (SEO):** Acordeón colapsable con simulador visual del resultado de búsqueda de Google.

2. **Panel Lateral de Configuración (Derecha):**
   * **Sección:** Selector vinculado a las categorías reales de Directus.
   * **Portada:** Checkbox para destacar la noticia en el inicio del diario (`front_page: true`).
   * **Foto Principal:** Zona de carga para arrastrar o seleccionar imágenes. Al subir, se conecta con `/api/panel/upload`, almacena el archivo en Directus y muestra una miniatura con botón para quitarla y campo de texto para epígrafe/pie de foto.
   * **Lista de Comprobaciones:** Guía visual con tildes que valida si el título, el cuerpo y la foto están listos antes de publicar.

3. **Barra Inferior Flotante (Sticky Actions):**
   * Indicador del estado de guardado (*Borrador guardado*, *Guardando...*, *Tenés cambios sin guardar*).
   * **Vista previa:** Abre el modal de previsualización idéntico a la publicación final.
   * **Guardar borrador:** Guarda los cambios con `status: 'draft'`.
   * **Publicar noticia:** Abre un diálogo de confirmación y publica en la web con `status: 'published'`.

### D. Vista Previa Integrada (`ArticlePreviewModal`)
* Renderiza el artículo en pantalla completa utilizando los mismos componentes y tipografías que el diario público.
* Muestra una barra superior fija de aviso: *"Vista previa editorial · Esta noticia se encuentra en borrador y no es visible al público"*.
* Permite al redactor verificar cabecera, titulares, bajada, foto con epígrafe, desarrollo en markdown y reproductor de YouTube antes de publicar.

---

## 5. Validación y Pruebas

Las pruebas se ejecutan con `node --test scripts/*.test.mjs` y la compilación con `npm run build`. El render del flyer y las pantallas con sesión se revisan además en el navegador, porque esas pruebas no cubren el dibujo en Canvas.

---

## 6. Dirección A: Mesa de redacción (noviembre de 2026)

Esta sección reemplaza lo descripto arriba sobre barra lateral, encabezado, pestañas y barra flotante del editor. El diseño aprobado es la dirección A del lienzo «Panel Jujuy247 y Estudio de Flyers».

* **Navegación:** barra de 76 px con Noticias, Flyers, Diario y Salir (`PanelNav`). En celular pasa a la parte inferior.
* **Tema:** claro u oscuro con `data-theme` en `.panel-body-wrapper`, guardado en `localStorage` (`panel-theme`). Sin elección previa, sigue al sistema. Los colores son variables `--panel-*` definidas al inicio de `panel.css`. La vista previa de una noticia queda siempre en claro, como el diario.
* **Noticias:** los contadores son los filtros (`EDITORIAL_VIEWS` en `lib/panel-views.mjs`) y se calculan en el servidor con `GET /api/panel/articles/stats`, de modo que no dependen de las notas cargadas. El listado acepta `view` y pagina con «Cargar más noticias».
* **Editor:** las acciones viven en la barra superior. En una nota publicada no existe «Guardar borrador»: hay «Actualizar», que conserva la fecha de publicación, y «Pasar a borrador», ambas con confirmación.

### Estudio de Flyers (`/panel/flyers?noticia=ID`)

* **Render:** Canvas 2D nativo en el navegador, a 1080×1350. `lib/flyer/render.js` dibuja y `lib/flyer/layout.mjs` calcula cortes de línea, tamaños y encuadre. La vista previa y el archivo exportado son el mismo lienzo.
* **Datos:** el flyer se arma con la noticia, pero editarlo no la modifica. Los ajustes quedan por noticia en `localStorage` (`flyer-draft:v1:ID`); una foto reemplazada no se sube a Directus ni se conserva al recargar.
* **Fotos:** `GET /api/panel/flyer-image?id=` exige sesión, entrega la imagen en el mismo origen y fija el tamaño en el servidor para no superar el límite de respuesta de Vercel.
* **Marca:** `public/logo3-white.png` es el logo oficial `logo-main3(fix-size white-text).png`. `public/isotipo.png` e `isotipo-white.png` son recortes de los logos oficiales.
* **Exportación:** PNG o WebP, y copia al portapapeles solo en PNG. WebP se deshabilita si el navegador no lo genera.

## 7. Fecha, imágenes y galerías en la noticia (noviembre de 2026)

* **Fecha de publicación:** en Ajustes del editor, en hora de Argentina (`datetime-local`). Se guarda en UTC en `published_at`. Si una nota sin publicar no tiene fecha, al publicarla se usa la del momento. Una nota publicada conserva la suya salvo que se cambie. No se aceptan fechas futuras, ni en el editor ni en la API (`validatePublishedAtInput` en `lib/datetime.js`): el diario no programa notas y las mostraría de inmediato.
* **Imagen en el cuerpo:** el botón «Imagen» sube el archivo con `/api/panel/upload` e inserta `![](URL "Epígrafe")` donde está el cursor. El título de la imagen es el epígrafe que ve el lector.
* **Galería:** el botón «Galería» sube varias fotos e inserta un bloque en el mismo Markdown, sin campos nuevos en Directus:

  ````
  ```galeria
  ![Epígrafe de la foto](https://…/assets/ID)
  ```
  ````

  `GalleryAwarePre` lo reconoce en el diario y en las vistas previas del panel, y `ArticleGallery` muestra la grilla y el visor a pantalla completa, que se usa con flechas, teclado y deslizando en el celular. Las miniaturas se piden achicadas a Directus (`?width=`). Formato y lectura en `lib/article-gallery.mjs`.
