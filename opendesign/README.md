# Jujuy247 · propuestas de diseño guardadas

Punto de partida guardado el 16/10/2026. La propuesta actual es **Actualidad local**, todavía en evaluación del cliente; no es una aprobación ni una implementación en producción.

## Retomar el diseño

- Propuesta actual: `mockups/actualidad/index.html`.
- Alternativa anterior: `mockups/editorial/index.html`.
- Lógica compartida: `mockups/editorial/app.jsx`.
- Estilos comunes: `mockups/editorial/style.css`; variante actual: `mockups/actualidad/layout.css`.
- Marca y tokens: `design-systems/jujuy247-editorial/`. La variante Actualidad cambia la tipografía mediante su CSS; el sistema editorial original es una referencia histórica.
- Diagnóstico: `diagnostico-y-alcance.md`.
- Decisiones: `plan-de-diseno.md`, `comparacion-y-nuevo-layout.md` y `analisis-footer-editorial.md`.
- Siguiente trabajo: `panel-de-contenidos.md`.

Desde la raíz del repositorio:

```powershell
python -m http.server 8289 --bind 127.0.0.1 --directory opendesign
```

Abrir http://127.0.0.1:8289/mockups/actualidad/ o el visor http://127.0.0.1:8289/. El servidor solo expone esta carpeta en el equipo local. La maqueta requiere conexión para fuentes, React y YouTube.

## Decisiones conservadas

Logo original intacto, identidad roja, titulares sans, apertura horizontal con foto contenida, últimas noticias debajo, clima y hora, cabecera que se oculta al bajar y reaparece compacta al subir, videos reproducibles de YouTube y footer editorial con secciones y contactos existentes.

No cambiar el CMS: mantener Next.js + Directus. No reintroducir el texto SEO visible retirado. No mezclar este trabajo con los cambios locales previos de FlyerGenerator o scripts de carga de Directus.

## Límites de la referencia

El código de la maqueta es la referencia vigente. Las capturas de `review/` documentan distintas iteraciones y algunas son anteriores a los videos o al footer. `youtube-mobile.png` fue una captura fallida y no forma parte del punto de partida versionado.

El clima es una muestra identificada; el reloj es real. Los artículos son ejemplos/archivo y los tres videos son una selección fija. Las búsquedas son locales. Las acciones de suscripción y consultas de demostración no envían datos. Antes de producción, conectar datos reales, confirmar contactos e identidad editorial y probar autenticación/operación del CMS por separado.
