# Panel editorial · propuesta de interacción

Prototipo para una persona con publicación directa. Reutiliza la identidad de Actualidad local: logo original, rojo #c23434, texto #202124, gris #585b61, superficie #f8f9fa, blanco y grafito. Tipografías Archivo para títulos y Source Sans 3 para controles/lectura. No es un cambio del portal público ni un panel conectado a Directus.

## Decisión visual

La prioridad es reconocer el próximo paso, no decorar un dashboard. Navegación lateral breve, listado como pantalla inicial y un botón claro «Nueva noticia». Sin gráficos de audiencia ni tarjetas de estadísticas. El rojo distingue la acción principal; estados de borrador/publicado usan texto además de color.

```text
LISTADO
marca / Noticias       Noticias                  Nueva noticia
                      buscar / estado / sección
                      título    sección    estado    editar

EDITOR
marca / Noticias       volver / título             guardar
                      bajada / contenido           publicar
                      foto / video                 sección
                      opciones SEO secundarias

VISTA PREVIA
volver al editor       noticia con apariencia Actualidad local
                      aviso visible de vista previa
```

El listado adapta las columnas antes de reducir el texto. En móvil, navegación compacta y formularios de una columna; las acciones no tapan el contenido ni el foco. El editor debe permitir completar una noticia sin recorrer opciones técnicas del CMS.

## Recorrido de demostración

Crear noticia → escribir título/bajada/cuerpo → elegir sección → seleccionar foto y/o agregar enlace de YouTube → previsualizar → volver a editar → guardar borrador → publicar con confirmación de demostración. El listado debe reflejar los cambios y permitir encontrar la nota por estado o búsqueda.

Las operaciones se realizan únicamente en el navegador; la maqueta no crea usuarios, no almacena contraseñas y no envía noticias a Directus. Mantener un aviso visible de prototipo. La persistencia local es una comodidad de prueba, no un backup editorial. Las imágenes locales no se suben ni se guardan como grandes cadenas en localStorage.

## Revisión del plan

No se replica la navegación completa de Directus. Se deja fuera la administración de usuarios, permisos, colecciones, integraciones y publicidad. El editor se centra en los campos que consume la web; Markdown sigue siendo el formato del cuerpo. No prometer autosave ni colaboración si el prototipo no los implementa.

## Validación

Comprobar listado y vacío, búsqueda, filtros, nueva noticia, validación de campos y video, vista previa, cambios sin guardar y confirmación de publicación. Verificar diseño a 320/390/768/1280 px, teclado, etiquetas, foco y mensajes. Al conectar el panel real se deberán probar aparte autenticación, autorización, conflictos de edición, permisos de archivos y publicación segura.
