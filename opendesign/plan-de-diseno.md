# Plan visual · antes de implementar

## Nueva dirección para revisar: Actualidad local

La dirección Diario editorial que se describe más abajo queda como alternativa anterior, conservada para comparar. El cliente señaló una similitud excesiva con TodoJujuy. La nueva propuesta se encuentra en `mockups/actualidad/` y no cambia producción ni declara canónico un nuevo sistema de marca.

La revisión visual del 16/10/2026 de https://www.todojujuy.com/ confirmó cabecera centrada, titulares serif y apertura con noticia principal, columna secundaria y últimas a la derecha. El parecido proviene de esa combinación; compartir clima, hora y rojo no obliga a repetir la composición.

Nueva composición: logo a izquierda, datos de clima/hora a derecha, apertura horizontal de texto/foto y secundarias en una fila inferior. Últimas noticias ocupa una franja de ancho completo debajo de la apertura, no una columna lateral. Coberturas propias se diferencia mediante una superficie grafito con imagen contenida. En móvil se apilan los elementos sin depender de desplazamiento lateral para leer noticias.

Tipografía propuesta para esta variante: Archivo en titulares y Source Sans 3 en interfaz/cuerpo. Paleta heredada con blanco #ffffff, tinta #202124, gris #585b61, superficie #f8f9fa y rojo original #c23434; grafito #292b30 reservado a producción propia. Se eliminan las reglas negras gruesas, el logo centrado y los titulares serif. No se adopta una portada de marketing ni se agregan datos ficticios de audiencia o transmisiones.

Se conservan el archivo exacto del logo, hora de Argentina, clima identificado como muestra, cabecera dinámica y altura contenida de fotografías. Antes de reemplazar la dirección anterior, revisar identidad, jerarquía, navegación y lectura en móvil con el cliente.

## Brief confirmado

Medio digital jujeño con producción audiovisual propia. Público general local y lectores que llegan directamente a noticias desde buscadores o redes. Tono informativo; lectura rápida de portada y lectura sostenida del artículo. Dirección «Diario editorial». Logo intacto y rojo original. Fidelidad alta para revisar con el cliente, sin publicación ni cambios al CMS.

## Decisiones

Paleta: rojo marca #c23434, rojo de interacción #a52727, tinta #202124, texto secundario #585b61, papel #ffffff y superficie secundaria #f8f9fa. Borde #d9dadd como estructura secundaria.

Tipografía: Libre Baskerville para títulos, Source Sans 3 para interfaz y cuerpo. Dos familias, sin tipografía condensada adicional. Texto de noticia 18px como punto de partida, hasta 68ch; títulos fluidos y alineados a izquierda.

## Composición

```text
ESCRITORIO / PORTADA
marca original                  fecha / accesos
secciones oficiales                         buscar
principal + foto        secundarias        últimas
entrevistas y coberturas propias
secciones con noticias                       anuncio
footer institucional y redes

MÓVIL / PORTADA                 ARTÍCULO
marca / menú / buscar           marca / navegación
noticia principal               sección
secundarias                     título + bajada
últimas                         firma + fecha + lectura
entrevistas                     foto + crédito
secciones                       resumen si aporta
footer                          cuerpo / video opcional
                                relacionados / footer
```

El esquema se valida con contenido y titulares de longitud real. Las secundarias deben conservar legibilidad antes de intentar mostrar ocho categorías completas en la cabecera.

## Revisión del plan contra el brief

Se descarta la portada promocional con un solo CTA: un diario debe ofrecer múltiples recorridos editoriales. Se descarta una columna por categoría en la apertura: reproduce el problema actual de densidad y truncamiento. Las líneas divisorias se usan para distinguir noticias, no para simular un periódico impreso completo. No se agregan radio «en vivo», cifras de audiencia, formularios comerciales ni estados de servicios no confirmados para llenar la maqueta.

El rasgo reconocible es la combinación del logo actual, rojo de marca, una fotografía periodística dominante y titulares editoriales. La producción audiovisual ocupa un bloque propio conectado con las notas, sin convertir la portada en una plataforma de streaming.

## Validación

Probar portada → noticia → regreso, menú móvil, filtros/búsqueda, resultado vacío y enlaces externos. Revisar 320/390/768/1280px, foco, contraste, imágenes cargadas y copia idéntica del logo. El prototipo no prueba rendimiento del futuro frontend ni permisos de Directus: esas pruebas pertenecen a implementación.


## Ajustes solicitados sobre el prototipo

Los videos de YouTube deben verse y reproducirse en la portada. Se reemplaza el bloque ilustrativo de coberturas por «Jujuy247 en video», antes del espacio comercial: reproductor integrado, selección de tres videos reales del canal, miniaturas, títulos, fechas y enlaces a YouTube. Sin reproducción automática. Los videos de esta maqueta son una selección fija validada mediante oEmbed, no un feed actualizado; al implementar se reutilizará la integración existente de YouTube y su fallback público.

Conservar clima y hora también en móvil y cabecera compacta. El reloj usa la zona America/Argentina/Jujuy; el clima está identificado como muestra, sin consulta meteorológica. La cabecera permanece en flujo al inicio, se oculta al bajar y reaparece compacta al subir, manteniéndose visible mientras se opera con teclado, búsqueda o menú. La foto principal ocupa menos altura y la de artículo se reduce, conservando el encuadre del rostro. Logo original sin alteraciones; solo se ajusta su tamaño de presentación.
