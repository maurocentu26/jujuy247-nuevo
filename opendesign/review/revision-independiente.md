# Revisión independiente del prototipo editorial

16 de octubre de 2026. Revisión del prototipo local, no de producción.

## Resultado

Revisable con el cliente. Portada y artículo preservan la marca y establecen una jerarquía editorial clara. No se detectó desborde horizontal del documento en 320, 390, 768 y 1280 px. Las barras de secciones y agenda tienen desplazamiento horizontal intencional.

## Verificaciones realizadas

- Portada y artículo comprobados en 320, 390, 768 y 1280 px. Titulares completos, imagen y cuerpo legibles. Columna de lectura y contenidos relacionados se adaptan al ancho.
- Las imágenes visibles cargan correctamente. La foto de la apertura corresponde a Mujeres en movimiento; no se asocia la fotografía con la nota de coparticipación.
- Logo copiado sin cambios: SHA256 de original y copia `12F68A9DB9390D72F44D224C3E41B9F2C9CB7BFA220EDC3D321B2EED5FDF321B`.
- Portada → artículo → botón Atrás del navegador devuelve la portada. Enlaces de la versión final codifican el estado de ruta.
- Menú móvil abre y se cierra con Escape; devuelve el foco a Abrir menú.
- Búsqueda vacía mantiene Buscar deshabilitado. Buscar `zzzz` presenta estado sin resultados y permite cambiar búsqueda. Buscar `educación` devuelve la nota educativa.
- La sección Cultura y Espectáculos devuelve la nota de escritores.
- El diálogo Seguinos recibe foco, cierra con Escape y devuelve foco a Seguinos. Controles de formulario con estado deshabilitado inicial y aviso de demostración.
- El aviso de contenido de archivo y horarios de muestra se conserva también en móvil.
- Capturas guardadas: `portada-desktop.png`, `portada-390.png` y `articulo-390.png`.

## Límites y pendientes

La búsqueda y el contenido son de demostración. No se probó la conexión con Directus, sus permisos, el rendimiento productivo, Core Web Vitals ni una conformidad WCAG completa. Autoría, canales oficiales, fechas y créditos requieren confirmación editorial antes de publicar.

En la apertura todavía se repiten dos secundarias dentro de Últimas; no bloquea la evaluación del diseño, pero conviene decidir la regla editorial de repetición al implementar. Las secciones sin notas de ejemplo muestran el estado vacío del prototipo.

Corrección posterior a la revisión: el botón Buscar recibió `aria-label="Buscar noticias"` para unificar su nombre accesible. No altera la captura visual.

## Segunda revisión: cabecera e imágenes

Comprobados 320, 390 y 1280 px sin desborde. Clima visible y etiquetado «Clima de muestra» también en móvil; reloj observado avanzar de minuto, formateado con zona `America/Argentina/Jujuy`.

La cabecera se oculta al bajar y reaparece compacta al subir. Regresa completa en el inicio. El origen del contenido permanece en aproximadamente 301 px en escritorio y 267 px en móvil; diferencia por redondeo inferior a 1 px al cambiar de estado. Búsqueda y menú compactos funcionan. Con el buscador y foco activos la barra permanece visible; Escape cierra los paneles.

Foto principal: 220 px de alto en escritorio y 180 px en móvil. Foto de artículo: 330 y 240 px respectivamente, con la persona reconocible. Se corrigió además la fotografía de coberturas, que heredaba 1600 px de alto; medida final de aproximadamente 351 px en escritorio.

Evidencias actualizadas: `portada-ajustada-desktop.png` y `header-compacto.png`. Esta revisión es del prototipo y no certifica rendimiento productivo ni conformidad WCAG completa.
