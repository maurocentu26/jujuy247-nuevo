# Jujuy247 editorial · sistema propuesto

Estado: propuesta de etapa 2, pendiente de validación del cliente.

Fuentes: `frontend/app/globals.css`, `frontend/app/layout.js`, `frontend/app/page.js`, `frontend/app/noticias/[slug]/page.js`, `frontend/app/components/SiteHeaderClient.js`, `FooterClient.js`, `YouTubeCarouselCard.js` y `frontend/public/logo3.png`; revisión pública del 16/10/2026.

## Conservado y propuesto

Conservar: logo original, rojo actual #c23434, idioma y categorías del medio. La marca actual usa Inter / Space Grotesk, superficies #f8f9fa y texto #1a1a2e, tarjetas redondeadas y sombras. El cambio propuesto usa Libre Baskerville para titulares y Source Sans 3 para interfaz/cuerpo, blanco neutral, menos contenedores y una apertura con más contraste entre noticia principal y secundarias. Las familias deben validarse en el prototipo antes de incorporarse vía next/font; fuentes locales de marca no fueron aportadas.

- `tokens/colors_and_type.css`: valores actuales documentados y semántica propuesta.
- `brand/style-notes.md`: composición, interacción y voz.
- `../../diagnostico-y-alcance.md`: evidencia, backlog y aceptación.
- `../../mockups/editorial/`: prototipo de pantallas propuestas; no es una réplica de componentes actuales.

## Inventario de componentes actuales

SiteHeader/Client: logo, clima/hora, categorías, menú móvil y variante compacta. Footer/Client: marca, secciones, modal de contacto y consulta comercial. Apertura de NewsLanding: principal, lista y destacados. YouTubeCarouselCard: miniatura/enlace y paginación. AdCarousel/GoogleAdSlot: publicidad. ArticlePage: breadcrumbs, metadata, fecha/fuente, foto, Markdown, video opcional y relacionados. CategoryFeedClient: archivo paginado.

No se generan duplicados JSX de estos componentes en la etapa de diseño: la fuente vigente sigue en frontend/app. La maqueta permite revisar el nuevo sistema sin modificarla. Revisar fidelidad del logo, legibilidad de titulares largos y operación editorial antes de declarar este sistema canónico.
