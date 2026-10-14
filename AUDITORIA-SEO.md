# Auditoría técnica y SEO de Jujuy247

Fecha: 14 de octubre de 2026. Sitio: https://www.jujuy247.com.ar/.

## Alcance y conclusión

Revisión del repositorio, respuestas HTTP y HTML público, robots, sitemap y artículos publicados en la API pública de Directus. No se accedió a Search Console, Analytics, logs del hosting ni configuración privada del CMS. No se modificaron noticias ni datos de producción.

Hay problemas concretos de descubrimiento del archivo, metadatos y manejo de URLs inexistentes. Se implementó una primera etapa para resolverlos. Esos problemas pueden perjudicar el rastreo; no prueban por sí solos por qué Google posiciona poco al medio. La antigüedad de un dominio no garantiza visibilidad. La causa y magnitud de las exclusiones deben contrastarse con Search Console.

`git fetch origin` y comparación: `main` local y `origin/main` coincidían en `a2e7eea` (0 commits de diferencia). Se conservaron los cambios locales preexistentes de flyers, dependencias y scripts. El proxy local de imágenes se restringió por un problema de seguridad detectado al revisarlo. No se hizo push ni despliegue.

## Hallazgos comprobados

| Prioridad | Evidencia antes de los cambios | Consecuencia | Estado |
| --- | --- | --- | --- |
| Alta | API pública: 868 noticias publicadas. Sitemap publicado: 109 URLs, de las cuales solo 100 eran noticias. | 768 noticias publicadas quedaban fuera de esta vía de descubrimiento; esto no demuestra que estuvieran desindexadas. | Corregido: sitemap completo, por lotes, sin descargar cuerpos de notas. |
| Alta | Categorías: 10 notas iniciales y botón que agrega otras mediante JavaScript. | No había enlaces HTML para recorrer el archivo antiguo. Google no pulsa esos botones. | Corregido: páginas con enlaces anterior/siguiente y canonical propio. |
| Media | `/noticias/auditoria-url-inexistente-20261014` y `/categoria/auditoria-url-inexistente-20261014` devolvieron HTTP 200, con `noindex`. | Señal HTTP incorrecta y posible clasificación como soft 404. El `noindex` existente ya desaconsejaba su indexación. | Implementado `notFound()` y página de error. Falta comprobar HTTP en ejecución después del despliegue. |
| Media | Portada sin canonical; `/?category=...` también renderizaba secciones. | Variantes de URL con señales incompletas para consolidar el contenido. | Canonical en portada y redirección permanente de la variante antigua a categoría. |
| Media | `metadataBase` y generador de URLs caían en localhost si faltaba configuración. | Un despliegue sin variable podía publicar referencias a localhost. | Dominio público por defecto; configuración central y ejemplo de variables. |
| Media | `lastmod` de portada/categorías usaba la hora de cada generación. Fechas de notas sin zona horaria. | Fechas que no reflejaban cambios editoriales y ambigüedad de horarios. | Se quitaron fechas inventadas; fechas publicadas normalizadas con UTC−03:00. |
| Media | Datos `NewsArticle` sin identidad estable del editor ni logo; categorías sin imagen social explícita. | Información incompleta del medio y previsualizaciones inconsistentes. | Editor y sitio con identificadores estables, logo, breadcrumbs y metadatos sociales. |
| Media | Imagen principal como fondo CSS en portada; imágenes originales sin tamaños adaptables en notas. | Riesgo de descargar más bytes de los necesarios y descubrir tarde la imagen principal. | `next/image`, tamaños responsivos y precarga en portada/notas. La mejora de LCP no está medida. |
| Editorial | Cuatro pares de títulos repetidos; 51 notas con menos de 100 palabras; 8 sin extracto. | Señales para revisar contenido similar, escaso contexto y presentaciones incompletas. | Revisión editorial pendiente; no se borró ni reescribió contenido. |
| Seguridad | Proxy local `/api/proxy-image` pedía cualquier URL, seguía redirecciones y copiaba su tipo de contenido. | Posibles solicitudes internas desde el servidor y publicación de contenido ajeno bajo el dominio. | Restringido a UUIDs de assets del Directus configurado, sin redirecciones, con formatos de imagen permitidos, 10 segundos y máximo 15 MiB. |

También se comprobó que HTTP y el dominio sin `www` terminan en HTTPS con `www`, robots permite rastreo y las noticias llegan en HTML sin requerir interacción. No se detectó un bloqueo general en esa muestra. Una consulta `site:` sin resultados en el buscador disponible no se tomó como prueba de ausencia en Google.

Los títulos repetidos detectados son: “Talleres de fortalecimiento para emprendedores en distintos puntos de la provincia”, “Mano a mano de estadísticas mundiales”, “Agosto Cultural de la Pachamama: un mes para celebrar tras un julio récord” y “Educación: cuando innovar no alcanza”. Hay que comparar los cuerpos antes de decidir si consolidarlos. Una noticia breve puede ser suficiente: 100 palabras es una señal de revisión, no un requisito de Google.

## Implementación incluida

- Sitemap general con 877 URLs únicas en el build verificado: 868 noticias, 8 categorías y portada. Omite noticias con `noindex`, canonical distinto o publicación futura; falla ante errores del CMS en lugar de publicar silenciosamente un archivo parcial.
- Sitemap de noticias independiente en `/news-sitemap.xml`: solo publicaciones de las últimas 48 horas, hasta 1.000 entradas. Se anuncia junto al general en robots. En el build había 4 entradas; el número cambia con el tiempo.
- Paginación HTML en `/categoria/[slug]?page=2`, títulos diferenciados y canonical de cada página. `?page=1` redirige a la categoría base; índices inválidos y páginas posteriores vacías invocan `notFound()`.
- Portada con título y descripción orientados a noticias de Jujuy, canonical y encabezado visible. Metadatos sociales consistentes y permiso `max-image-preview:large`.
- Datos estructurados del sitio/editor y breadcrumbs visibles y estructurados. `NewsArticle` con fecha inequívoca y logo; serialización segura del JSON-LD. No se inventó autor ni fecha de actualización.
- Imágenes principales responsivas y eliminación del cuerpo completo de las noticias en la consulta de listados. El dominio permitido para optimización se obtiene de `NEXT_PUBLIC_DIRECTUS_URL`.
- Archivo `frontend/.env.local.example` con las variables públicas y verificación opcional de Search Console.
- Pruebas automatizadas en `frontend/scripts/seo.test.mjs`.

La paginación reemplaza “Cargar más” por navegación entre páginas. La portada sigue renderizándose en servidor; no se introdujo caché de página para todo el portal. El sitemap tiene revalidación declarada de 300 segundos; las consultas compartidas a Directus usan 10 segundos y Next puede reducir el intervalo efectivo a ese mínimo.

El sitemap actual tiene margen para crecer. La consulta protege contra superar unas 49.000 noticias; antes de llegar a ese volumen hay que dividirlo en varios archivos con un índice. No hace falta hacerlo para las 868 actuales.

## Propuestas pendientes, en orden

1. **Desplegar y verificar la primera etapa.** Confirmar variables públicas durante build y ejecución. Revisar estado HTTP de notas y categorías válidas/inexistentes, redirecciones, canonical de página 2, navegación, imagen optimizada y generación de flyers. La política del entorno bloqueó iniciar el servidor local, por lo que no se afirma que esas pruebas de ejecución hayan pasado. No se solicitó ni realizó un despliegue.
2. **Diagnóstico con Search Console.** Verificar la propiedad de dominio, enviar ambos sitemaps y exportar rendimiento e indexación. Revisar especialmente “Rastreada: actualmente sin indexar”, “Descubierta: actualmente sin indexar”, duplicadas/canonical, errores de servidor y acciones manuales. Inspeccionar una nota reciente, una antigua, una categoría y página 2. Distinguir problemas de indexación de páginas indexadas con baja posición o CTR.
3. **Identidad editorial.** Crear páginas públicas de quiénes somos, contacto y política editorial/correcciones con datos reales aprobados por el medio. Agregar firma visible y perfil de cada autor, con el mismo autor en el JSON-LD. El contacto actual está en un modal. No hay que atribuir todas las notas a una persona por defecto. Añadir fecha de actualización solo cuando el CMS registre una modificación editorial real; comprobar permisos de lectura para esos campos y para overrides SEO.
4. **Revisar duplicados y fortalecer cobertura propia.** Comparar los cuatro pares de títulos. Si son duplicados reales, elegir una URL, fusionar contenido y redirigir la descartada. Si cubren hechos diferentes, diferenciar títulos y contexto. Priorizar información original local, fuentes identificables, entrevistas y seguimiento; evitar depender de republicaciones de noticias nacionales para competir por consultas amplias.
5. **Plan de contenidos basado en consultas.** Usar Search Console para elegir temas y localidades. Proponer páginas de referencia sobre trámites, transporte, agenda y servicios de Jujuy solo cuando el medio pueda mantenerlas actualizadas. Enlazar notas relacionadas dentro del texto y actualizar coberturas con novedades verificadas. No crear páginas por palabra clave sin contenido propio.
6. **Medir rendimiento.** Obtener PageSpeed Insights móvil y datos de campo de Core Web Vitals en portada, categoría y nota. Medir LCP, INP y CLS; después decidir sobre caché de páginas, consultas por categoría, clima/YouTube y espacios reservados para publicidad. No se asignó una puntuación de Lighthouse ni se inventaron métricas de campo.
7. **Revisar operación del proyecto.** Confirmar versión y mantenimiento del Directus realmente desplegado; el compose local referencia 10.13.1 y no prueba la versión de producción. Revisar backups, restauración y permisos públicos del CMS. El comando de lint del proyecto usa `next lint`; conviene migrarlo a una configuración explícita compatible con Next 16 en una tarea de mantenimiento.

## Validación realizada y pendiente

Comandos desde `frontend`:

```powershell
node --test scripts/seo.test.mjs
$env:NEXT_PUBLIC_SITE_URL='https://www.jujuy247.com.ar'
$env:NEXT_PUBLIC_DIRECTUS_URL='https://directus-production-244d.up.railway.app'
npm run build
```

Siete pruebas verifican URLs, canonical, escape de JSON-LD, fechas, extractos, paginación de consultas al CMS, fallos del sitemap y restricciones del proxy. Build de producción verificado con consultas públicas de lectura. Los XML generados se analizaron como XML: 877 URLs únicas en el general y 4 en el de noticias. Robots enumera ambos. `git diff --check` sin errores de espacios.

Pendiente después del despliegue: respuestas HTTP de las rutas nuevas, prueba de Rich Results, navegación móvil/escritorio, funcionamiento de imágenes/flyers y métricas de Search Console. La UI de Next puede transmitir errores mediante streaming; comprobar el status con un agente de usuario de Googlebot además del navegador, y el `noindex` en las respuestas de error.

## Cómo medir resultados

Guardar una línea de base antes del despliegue. Revisar descubrimiento e indexación a las 2 y 4 semanas; comparar períodos de 28 días para impresiones, clics, CTR y posición por URL/consulta. Separar marca (“Jujuy247”) de búsquedas informativas y noticias recientes de archivo. Comparar ventanas editoriales equivalentes, considerando estacionalidad y eventos. No fijar como objetivo indexar indiscriminadamente cada URL ni prometer una posición o plazo.

## Actualización: Search Console configurado

Después de la auditoría inicial, se agregó y verificó la propiedad de dominio `jujuy247.com.ar` en la cuenta del usuario mediante un TXT en los DNS de Vercel. Se envió `https://www.jujuy247.com.ar/sitemap.xml`: Search Console confirmó “El sitemap se ha procesado correctamente” y 109 páginas descubiertas. Esto corresponde al sitemap de la versión publicada; las 877 URLs del build local estarán disponibles cuando se desplieguen las mejoras. Los informes de rendimiento, indexación y experiencia indicaban “Se están procesando los datos; vuelve a comprobar esta sección mañana”. No hay todavía cifras para concluir cuántas páginas están indexadas o cuántas impresiones reciben. No se envió el sitemap de noticias porque aún no está publicado.

## Referencias oficiales

### Preparación de publicación

Se preparó una versión que excluye los cambios locales preexistentes del generador de flyers, su endpoint de proxy y los scripts de carga del backend. El helper de validación del proxy y sus pruebas permanecen disponibles, pero esta publicación no expone ese endpoint. La auditoría de dependencias detectó alertas en las versiones anteriores: se actualizó Next.js a 16.4.0 y sus dependencias compatibles mediante el lockfile. La instalación limpia, las siete pruebas, el build de producción y `npm audit --omit=dev` pasaron; este último informó cero vulnerabilidades conocidas. El servidor local siguió bloqueado por política del entorno; la revisión en ejecución se realiza en Vercel antes y después de publicar.

- [Google: paginación y carga incremental](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading).
- [Google: construir y enviar sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [Google: sitemaps de noticias](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap).
- [Google: datos estructurados de artículos](https://developers.google.com/search/docs/appearance/structured-data/article).
- [Google: consolidar URLs duplicadas](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- [Next.js: notFound](https://nextjs.org/docs/app/api-reference/functions/not-found) y [sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap).
