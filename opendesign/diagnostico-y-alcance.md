# Jujuy247 · Diagnóstico y alcance de las etapas 1 y 2

Fecha de revisión: 16 de octubre de 2026. Estado: propuesta para revisión, sin cambios en producción.

## Objetivo y punto de partida

Reforzar la presencia de medio digital y facilitar el recorrido portada → noticia → contenido relacionado. Mantener el archivo, las URLs, Next.js + Directus, la identidad roja y el archivo original del logo sin alteración. La dirección elegida es «Diario editorial», incorporando la producción audiovisual propia.

Este trabajo continúa el brief acordado en el chat; no requiere reiniciar una encuesta de marca. La investigación adjunta orienta oportunidades, pero sus órdenes para WordPress/n8n no constituyen el alcance ni describen la arquitectura actual.

## Evidencia y límites

- Código revisado: `frontend/app/page.js`, `frontend/app/noticias/[slug]/page.js`, `frontend/app/globals.css`, layout, header/footer, utilidades de fechas y consultas Directus.
- Inspección visual y DOM del sitio público: portada en escritorio de 1280 px y móvil de 390 px; artículo «Mujeres en movimiento» en móvil.
- Portada: https://www.jujuy247.com.ar/
- Artículo de muestra: https://www.jujuy247.com.ar/noticias/Mesa-politica-de-jujenas
- Investigación aportada: `especificaciones_y_prompts_para_agente_ia_jujuy247.md`.
- Referencia de revisión: https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md
- UX local: búsqueda «readable article typography» devolvió recomendaciones pertinentes sobre tamaño, contraste y ancho de línea. La búsqueda de sistema completo devolvió también patrones de landing comercial poco apropiados para un diario: no se adoptaron el hero comercial ni las llamadas a conversión como estructura editorial.
- No se dispone en esta revisión de exportaciones actuales de Search Console, GA4, datos de lectores ni pruebas con usuarios. No se atribuyen problemas de posicionamiento al diseño ni se prometen aumentos de tráfico.
- Sin medición de campo de Core Web Vitals: no hay puntuaciones inventadas de rendimiento ni accesibilidad. La revisión es una muestra, no una auditoría exhaustiva de todas las rutas.

## Hallazgos priorizados

| Prioridad | Evidencia actual | Cambio propuesto | Criterio verificable |
|---|---|---|---|
| Alta | La apertura ya combina principal, destacadas y últimas, pero la columna central corta titulares con `truncateTitle` y compite con la derecha. | Abrir con una principal, dos secundarias completas y una lista breve de últimas. | Titulares completos, orden de lectura claro y sin duplicar la misma nota en los tres espacios. |
| Alta | `getFeaturedBadgeLabel` llama «Más reciente» a cualquier destacada de más de una hora; Cultura muestra una nota de más de 20 días. | «Destacado» para selección editorial; tiempo relativo solo durante 24 h, luego fecha calendario. Caducidad editorial de destacados. | Ninguna nota antigua se presenta como noticia reciente. Una publicación sin fecha no se etiqueta «Ahora». |
| Alta | Existen notas recientes y videos propios recientes: el diagnóstico anterior de portada de 21 días ya no describe la principal actual. | Vincular nota y cobertura, y priorizar producción local. | La apertura se revisa diariamente; cada entrevista muestra tema, protagonista y fecha real cuando esos datos existen. |
| Alta | El artículo tiene título, fecha, imagen, cuerpo, fuente opcional y relacionados. No renderiza bajada independiente ni firma de autor. | Jerarquía título → bajada → autor/fecha/lectura → foto → cuerpo, con fuentes separadas de autoría. | Sin autores inventados; «Redacción Jujuy247» solo si el medio asume esa firma. No duplicar la bajada como primer párrafo. |
| Alta | Portada sin h1 tras retirar el texto SEO a pedido del usuario. | Usar el titular de la noticia principal como h1, sin reintroducir el texto retirado. | Un h1 editorial descriptivo por pantalla; el artículo mantiene su propio h1. |
| Media | Header sin redes; footer solo contacto y consulta comercial. | Accesos discretos a redes verificadas y canales de comunidad. | Solo enlaces confirmados; no inventar URL del canal de WhatsApp ni confundirlo con chat comercial. |
| Media | Paginación móvil de videos medida en 12×8 px, contacto de footer ~95×19 px, botón menú 40 px de ancho. | Ampliar área táctil, foco visible y estado actual; menú con Escape y retorno de foco. | Área efectiva de 44×44 px para controles; pruebas con teclado y pantalla estrecha. |
| Media | Extracto de Opinión contiene un cuerpo largo; dos notas aparecen con el mismo título «Educación: cuando innovar no alcanza». | Límite editorial de bajada y revisión de duplicados por ID/URL/contenido. | Portada con extractos breves; títulos iguales no se eliminan automáticamente sin comprobar contenido. |
| Media | Autopauta repetida y varias posiciones de banners. | Ubicaciones comerciales delimitadas e identificadas, reserva de espacio y menor repetición. | Sin saltos de diseño por cargar avisos; campañas vigentes respetadas. |
| Media | Datos opcionales de artículo no incluyen autor o resumen estructurado en la selección actual. | Confirmar esquema Directus antes de ampliar datos. Calcular lectura sobre texto real. | Mapa de campos y permisos acordado antes de implementar. |
| Media | HTML dinámico y consultas por sección: cada categoría solicita destacada y luego otras notas; los fallos se convierten en arrays vacíos. | Medir latencias y diseñar degradación clara; revisar paralelismo/caché cuando se implemente. | Mantener enlaces y contenido básico ante fallo de YouTube; registrar fallos de CMS en servidor. |

## Alcance cerrado para la primera implementación futura (etapa 3)

1. Cabecera, navegación móvil y footer comunes. Conservar hora de Argentina y clima de San Salvador de Jujuy. Cabecera completa al inicio; al bajar ocultarse y al subir reaparecer compacta, sin mover el contenido. Mantener accesibles búsqueda y menú mientras se utilizan.
2. Portada editorial: apertura, últimas, producción propia, secciones y publicidad existente.
3. Artículo: bajada, firma verificable, fecha, lectura, foto/crédito, video opcional, cuerpo y relacionados.
4. Búsqueda y filtros: el prototipo prueba el recorrido local; la búsqueda real requiere definir indexación, paginación y permisos de Directus. No se promete una función productiva a partir del demo.
5. Preservación de metadata, canonical, sitemap, URLs y paginación ya existentes.

Fuera de estas etapas: deploy, cambios de contenidos del CMS, panel propio, migración WordPress, bots, audio IA, ingesta automática, mapa vecinal y monitores de servicios en tiempo real. No incorporar nuevas verticales al menú hasta tener responsable y contenido.

## Arquitectura de información y recorridos

Portada → noticia principal/secundaria/última → artículo → misma sección o entrevista relacionada.

Navegación: conservar categorías oficiales y URLs. «Entrevistas» es una agrupación propuesta de producción audiovisual; no crear una categoría nueva sin acordar taxonomía. En móvil, accesos prioritarios y menú desplegable para el resto. La búsqueda devuelve resultados y un estado vacío claro.

Artículo: regreso a portada/sección, noticia, datos de publicación, resumen opcional revisado, imagen con crédito, lectura en columna, video relacionado y próximas lecturas. No FAQ obligatoria ni audio simulado.

## Datos y operación necesarios

| Elemento | Estado observado | Decisión para implementación |
|---|---|---|
| título, slug, fecha, extracto, contenido, imagen, categoría | Consultados actualmente | Reutilizar y validar campos vacíos. |
| source_name / source_url / youtube_url | Soportados como opcionales | Fuente no equivale a autor; no mostrar reproductor vacío. |
| Autor y perfil | No consultados actualmente | Confirmar colección/relación/permisos; fallback editorial acordado. |
| Crédito de foto | Existe soporte para título en imágenes Markdown | Confirmar crédito de portada y metadatos de archivos. |
| Puntos clave / actualización | No verificados | Revisar esquema; no inferir «actualizado» de una edición técnica. |
| Destacada con vencimiento | `front_page` booleano | Proponer expiración y selección editorial con fallback reciente. |
| Canal WhatsApp y redes | Algunas direcciones solo constan en investigación | Validar perfiles con el cliente antes de producción. |

Responsabilidad editorial mínima: revisión diaria de apertura; corrección de títulos y bajadas; confirmación de fuentes, citas y créditos. El diseño hace visible la actualidad, no la produce.

## Medición antes y después

Solicitar cuando estén disponibles: Search Console (90 días, comparar períodos equivalentes: clics, impresiones, CTR, consultas y páginas), analítica (sesiones, móviles, entradas por nota, interacción y recurrentes) y consultas comerciales reales. Registrar fecha de publicación del rediseño para comparar sin confundir estacionalidad y frecuencia editorial.

Eventos propuestos, pendientes de instrumentar: apertura de nota desde portada (posición e ID), clic a relacionado, salida a video, clic a red/WhatsApp y consulta comercial. No registrar texto de búsquedas privadas ni contenido de mensajes. No sumar un proveedor de analítica en esta etapa.

## Aceptación del diseño

- Logo binariamente idéntico a `frontend/public/logo3.png`, sin filtros, recorte o deformación.
- Hora actual de Argentina en la maqueta; clima identificado como muestra. En producción reutilizar el proveedor meteorológico existente y su fallback de datos no disponibles, sin presentar una muestra como dato actual.
- Imagen principal más contenida; no dominar la pantalla móvil ni recortar información importante. Reducir también la altura de la imagen del artículo.
- Portada y artículo revisables en 320, 390, 768 y 1280 px; no desborde horizontal.
- Titulares y cuerpo legibles, imágenes con proporción reservada, teclado y foco visibles.
- Menú, búsqueda, filtros, apertura de noticia y regreso funcionan en el prototipo; acciones externas claramente diferenciadas.
- Ejemplos o extractos se identifican como demostración; ninguna noticia antigua recibe fecha nueva para parecer actual.
- Sin métricas, transmisiones, autores, precios, resultados o alertas de servicios inventados.

## Decisiones para revisión con el cliente

Validar la jerarquía visual, el equilibrio entre notas y videos y la nueva lectura del artículo. Confirmar firma editorial, enlaces de canales y responsable de apertura. Aprobado ese conjunto, convertir el prototipo en componentes Next.js en la etapa 3; este documento y la maqueta no autorizan una publicación en producción.
