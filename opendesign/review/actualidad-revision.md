# Revisión independiente · Actualidad local

La variante ofrece una estructura distinta de Diario editorial: logo lateral, titulares sans Archivo, principal horizontal con foto a la derecha, secundarias debajo y últimas en franja horizontal. No modifica producción.

## Evidencia revisada

El verificador revisó independientemente el CSS, los archivos y las capturas `actualidad-desktop.png` y `actualidad-mobile.png`. El navegador no estuvo disponible en su superficie CUA; las capturas y las mediciones del navegador fueron ejecutadas por el agente principal. No se atribuyen esas interacciones al verificador.

Escritorio: titular y fotografía equilibrados, sin solapamientos; rostro reconocible y logo original. Las secundarias y la franja de últimas hacen la diferencia estructural visible. Móvil: texto legible, fotografía contenida, clima/hora y aviso de demostración visibles. La barra de navegación conserva desplazamiento horizontal intencional.

Mediciones comunicadas por el ejecutor del navegador en 1280 px: documento de 1265 px, fotografía principal de 360×230 px, franja de últimas de 1160 px, fotografía de coberturas de 180 px de alto, imágenes cargadas y titular con Archivo.

El logo de la variante tiene el mismo SHA256 que `frontend/public/logo3.png`: `12F68A9DB9390D72F44D224C3E41B9F2C9CB7BFA220EDC3D321B2EED5FDF321B`.

## Revisión del código

La variante comparte lógica de navegación, búsqueda y cabecera con la editorial, evitando duplicaciones. Los overrides de fotografías de coberturas se aplican después de la regla base `height:auto`, con alturas explícitas coherentes para esta variante. La apertura y las últimas dejan de heredar las columnas de la primera propuesta.

No se detectaron defectos visuales bloqueantes en las capturas disponibles. Esta revisión no certifica accesibilidad completa, rendimiento productivo ni integración con Directus.

## Evidencia final adicional

Revisada independientemente la captura completa `actualidad-completa.png`: la banda grafito de producción propia, fotografía de equipo y enlaces se muestran sin cortes ni solapamientos. La parte inferior conserva ritmo y jerarquía coherentes.

El agente principal ejecutó y comunicó estas pruebas de navegador: portada 320/390/768/1280 px con anchos de documento 305/375/753/1265 px; artículo 390/768/1280 px sin desborde. En móvil la imagen de artículo mide 225 px de alto. Cabecera oculta al bajar y compacta al subir, con origen del contenido estable en 260 px; retorno a cabecera completa al inicio. Búsqueda compacta dentro del viewport, menú con categorías oficiales y cierre con Escape. Viewport restaurado y pestaña conservada como entregable.
