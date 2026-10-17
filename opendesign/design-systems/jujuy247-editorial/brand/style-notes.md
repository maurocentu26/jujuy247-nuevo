# Fundamentos de diseño

## Composición propuesta

La diferencia visual se concentra en la apertura: fotografía documental real y titular editorial grande. Secundarias más pequeñas y lista de últimas sin imágenes redundantes. Fondo blanco, rojo como señal de marca y selección; no títulos completos en rojo ni tarjetas con sombra alrededor de cada noticia. Titulares alineados a izquierda; texto sin justificar. No animaciones decorativas ni autoplay.

Escritorio: cabecera → navegación → apertura principal/secundarias/últimas → coberturas propias → secciones → publicidad identificada → footer. Móvil: marca/menú → principal → secundarias → últimas → entrevistas → secciones. En artículo, una columna de lectura de hasta 68ch; el lateral nunca estrecha el cuerpo en móvil.

## Marca e imagen

Usar copia exacta de logo3.png sobre fondo que preserve legibilidad; object-fit: contain y proporciones originales. No inventar isotipo ni cambiar colores del archivo. Imágenes documentales con crédito real cuando exista. No usar fotos genéricas de cerros para representar un hecho específico. No recortar rostros o texto relevante.

## Voz

Español argentino, titulares informativos en oración; nombres propios y siglas correctos. Fechas de Argentina. Bajada complementa, no repite. «Leer nota», «Volver a portada» y «Buscar noticias» describen acciones. Opinión identificada; fuentes atribuidas; redacción y autores no intercambiables. No emojis decorativos ni promesas «en vivo» sin transmisión confirmada.

## Interacción y accesibilidad

Enlaces nativos para navegación y botones para acciones. Foco visible, controles de al menos 44px en móvil, búsqueda etiquetada y estado sin resultados. Menú con estado expandido, Escape y retorno del foco. Hover cambia subrayado o contraste. Transiciones breves de opacidad/color respetando movimiento reducido. Fecha, resumen y opciones esenciales visibles sin hover.

## Publicidad

Separar de noticias mediante etiqueta «Publicidad», dimensiones reservadas y enlace explícito. No repetir autopauta entre cada sección. No suprimir campañas vigentes sin revisar compromisos comerciales.

## Producción futura

Fuentes con next/font, imágenes con next/image, layout principal en servidor e islas cliente solo para interacción. Video diferido y sin reproducción automática. Conservar canonical, JSON-LD, sitemaps y paginación. No agregar biblioteca de UI, animación o estado para reproducir unos pocos elementos.
