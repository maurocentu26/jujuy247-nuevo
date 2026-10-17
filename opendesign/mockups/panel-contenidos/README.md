# Panel de contenidos · prototipo

Panel propio pensado para una persona de redacción que publica directamente. Lista con búsqueda y filtros; creación y edición de noticias; formato simple; imagen local o de muestra; validación de YouTube; SEO opcional; vista previa; borrador y confirmación de publicación simulada.

No autentica, no consulta ni modifica Directus, no envía archivos y no publica en la web. La banda superior identifica siempre esta limitación. Las noticias iniciales son ejemplos adaptados de archivo, sin métricas ni fechas de actualidad inventadas.

Los textos y estados guardados se conservan en localStorage con lectura y escritura protegidas. Una carga de imagen genera una URL temporal, revocada al reemplazarla o al desmontar la aplicación; los archivos y sus datos no se persisten. Al recargar, las imágenes locales desaparecen. Las imágenes de muestra sí mantienen su referencia. Si el almacenamiento falla, se muestra un aviso.

Recorrido: Crear noticia → título, bajada, desarrollo y sección → Vista previa → Volver a editar → Guardar borrador → Publicar → Confirmar publicación simulada. Cambiar de pantalla con cambios sin guardar pide confirmación; cerrar o recargar utiliza el aviso nativo del navegador.

La vista previa no interpreta HTML y solo convierte negritas, subtítulos y listas simples. Los videos se validan y se enlazan a YouTube; no se carga un reproductor externo. React y Babel se cargan desde las mismas CDN usadas en los otros prototipos; no hay dependencias añadidas al proyecto.
