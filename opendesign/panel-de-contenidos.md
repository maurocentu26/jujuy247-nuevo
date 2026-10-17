# Panel de contenidos · punto de partida

16/10/2026. Alcance inicial propuesto a partir del código del proyecto. Prototipo de interfaz en `mockups/panel-contenidos/`; no hay un panel productivo conectado ni se modificó Directus.

## Qué existe

El frontend es Next.js y consume artículos publicados de Directus. El repositorio no contiene un panel editorial propio ni rutas de autenticación para editores. `backend-directus/docker-compose.yml` declara Directus y PostgreSQL; esto no confirma el esquema ni la versión desplegada actualmente.

Campos consultados en `frontend/lib/directus.js`: título, slug, extracto, contenido, destacada (`front_page`), fecha, estado, categoría, etiquetas, portada y metadatos SEO. Fuente y video de YouTube tienen compatibilidad opcional. El cuerpo se interpreta como Markdown en la web; un editor visual deberá conservar ese formato o introducir una conversión explícita y probada.

## Objetivo

Una interfaz editorial sencilla sobre el Directus existente: permitir preparar y publicar una noticia sin mostrar al cliente la complejidad de un administrador de base de datos. Directus seguirá siendo la fuente de datos, usuarios, archivos y permisos.

Flujo confirmado por el cliente: una sola persona publica directamente. La primera versión tendrá un único perfil editorial con acceso a sus tareas de contenido; no requiere un circuito de aprobación ni gestión de redactores. Podrá guardar borradores, previsualizar y publicar. Esto no exige concederle permisos de administrador de Directus.

## Primera entrega funcional

1. **Acceso:** iniciar/cerrar sesión y gestionar sesión vencida; usar los usuarios y permisos de Directus.
2. **Noticias:** listado con estado, fecha, sección, búsqueda y filtros; acceder a edición y crear borrador.
3. **Editor:** título, bajada, cuerpo, sección, foto y crédito cuando el esquema lo permita, enlace YouTube, fuente y etiquetas. SEO en un apartado secundario.
4. **Revisión:** vista previa local del borrador con apariencia de la propuesta pública; no exponer borradores mediante una ruta pública.
5. **Guardar/publicar:** acciones distintas, validación, confirmación de publicación y feedback de error. No perder cambios al navegar ni sobrescribir ediciones ajenas silenciosamente.

La primera entrega no incluye cuentas de anuncios, automatización IA, bot, estadísticas complejas, administración de usuarios ni un clon completo de Directus. Publicidad y gestión de portada pueden añadirse después de completar el flujo de noticia.

## Antes de escribir datos

- Obtener un snapshot del esquema y revisar permisos con una cuenta de prueba; no ejecutar los scripts de seed contra producción.
- Confirmar valores reales de `status`, relaciones de categorías/etiquetas y campos obligatorios. No asumir que los campos opcionales del frontend existen.
- Aplicar el flujo confirmado de publicación directa con permisos mínimos sobre contenido y archivos; comprobar los permisos reales antes de conectar escrituras.
- Mantener el token fuera del código cliente y de localStorage. Definir sesión mediante cookie HttpOnly y validar autorización en servidor para cada lectura privada y escritura; no usar una credencial administrativa compartida como atajo.
- Al implementar, contrastar el flujo de autenticación con la documentación de la versión de Directus realmente desplegada. La configuración local por sí sola no basta.
- Usar primero una instancia o datos de prueba y un usuario de permisos mínimos. Conservar el acceso al administrador Directus para contingencia.

## Orden de trabajo

**A. Contrato y recorrido:** revisar esquema/permisos y validar listado → editor → vista previa → guardar/publicar con el cliente.

**B. Acceso y listado:** implementar autenticación, comprobaciones de servidor y lectura privada paginada. Probar sesión vencida y usuario sin permiso.

**C. Borradores e imágenes:** crear/editar sin publicar, validar archivos, evitar pérdida de cambios y comprobar conflictos de edición.

**D. Publicación:** respetar roles, validar campos y verificar que la noticia publicada se ve en la web con URL estable. No borrar automáticamente ni cambiar slugs de noticias publicadas sin redirección.

## Aceptación

El editor puede crear una noticia con foto y video, guardar un borrador, previsualizarla, corregirla y publicarla con permisos adecuados. Un usuario sin permiso no puede publicar mediante una petición directa. Un fallo de red no muestra un falso éxito ni pierde el texto. Las credenciales no aparecen en HTML, bundles, logs o respuestas públicas. Las operaciones de prueba no alteran noticias productivas.

El diseño del portal permanece guardado y puede retomarse independientemente del panel. No se presupone que todas las funciones del administrador Directus deban reconstruirse.
