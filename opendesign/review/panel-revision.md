# Revisión independiente del panel de contenidos

Se probó directamente el prototipo con el navegador CUA, sin conexión a Directus ni publicación externa.

## Recorridos comprobados

- Listado, búsqueda sin resultados y limpieza de filtros.
- Filtro Borradores y filtro Cultura y Espectáculos.
- Crear noticia con título, bajada, cuerpo Markdown e imagen de muestra.
- Enlace YouTube inválido muestra mensaje y bloquea guardado/publicación hasta corregirlo.
- Vista previa conserva contenido y convierte subtítulo Markdown; regreso al editor sin pérdida.
- Guardar borrador y confirmar publicación simulada. La nota aparece en Publicadas y se encuentra por búsqueda.
- Cambios sin guardar presentan un diálogo; descartarlos conserva la versión guardada.
- Recargar conserva el contenido guardado localmente.
- Editor y listado en 320 y 390 px sin desborde; escritorio de 1280 px revisado visualmente. Anchos de documento móvil: 305 y 375 px.

Capturas: `panel-listado.png` y `panel-editor.png`. La segunda muestra la nota inicial de Mujeres en movimiento, sin modificar sus datos guardados. La prueba creó una noticia titulada «Prueba de revisión del panel» exclusivamente en el almacenamiento local del navegador.

## Límites

Carga real de archivos no ejecutada. Se revisó en código la validación de tipo JPG/PNG/WebP y máximo de 5 MB, uso de object URL y exclusión de la imagen cargada de localStorage. No se verificaron autenticación, permisos, conflictos de edición ni integración productiva; el prototipo no implementa esos servicios.

Sin defectos bloqueantes en el recorrido probado. Viewport restaurado y pestaña del editor conservada para revisión.
