# Implementación del diario público

18/10/2026. Rama `codex/rediseno-integral`. Alcance confirmado: solo el diario; el panel conserva su prototipo independiente.

Se trasladó Actualidad local a Next.js: portada horizontal, dos notas secundarias, últimas noticias, secciones, lectura de artículos, cabecera dinámica con clima y reloj, videos reproducibles y footer editorial. Se conserva el logo original, el orden y las destacadas de Directus, los anuncios y AdSense, las URLs públicas, los metadatos y los sitemaps. No se escribe en Directus ni se cambia el esquema.

## Comprobaciones

- `cd frontend` y `node --test scripts/*.test.mjs`: 13 pruebas aprobadas.
- `npm run build`: aprobado.
- Navegación en navegador a portada, noticia y sección; menú móvil y cierre con Escape.
- Portada y menú a 320 px: ancho de documento 305 px, igual al ancho disponible. Sección a 320 px: 305/305 después de corregir mínimos de grilla y miniaturas.
- Revisión visual independiente de capturas en `review/rediseno-diario-*.png`, detallada en `review/rediseno-diario-revision.md`.
- Hash del logo original conservado.

## Límites y siguiente comprobación

El Directus configurado localmente contiene noticias de ejemplo y algunas referencias a imágenes faltantes. No se sustituyeron datos ni se ejecutaron seeds. Falta revisar fotografías y campañas reales con el CMS de producción antes de desplegar. Los videos provienen del canal público, sin autoplay; una restricción de YouTube puede impedir un video individual.

Los cambios locales previos del generador de flyers, sus dependencias, el proxy de imágenes y scripts de carga se conservaron y no se incluyen en este commit. La compilación se ejecutó sobre el workspace, que también contiene esos cambios locales.

No hay push ni despliegue de esta implementación. Para retomar después del apagado: entrar a `frontend` y ejecutar `npm run dev`; la URL aparece en la terminal. La vista de revisión de esta sesión usa el puerto 3003 y deja de estar disponible al apagar.
