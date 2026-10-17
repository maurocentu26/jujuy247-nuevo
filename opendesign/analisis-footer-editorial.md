# Footer editorial: referencias de Jujuy y aplicación

Revisión: 16/10/2026. Muestra de cuatro medios relevantes de Jujuy; no constituye un ranking medido de tráfico ni de posicionamiento SEO. Se revisaron sus sitios públicos y la organización de contenidos al pie. La propuesta es local, sin publicación.

| Medio y fuente | Organización observada | Aplicación a Jujuy247 |
|---|---|---|
| [TodoJujuy](https://www.todojujuy.com/) | Repite el acceso a secciones, incorpora una política sobre IA y cierra con derechos de autor. | El footer debe funcionar como segunda navegación, no solo como firma. No copiar políticas ajenas ni enlazar documentos inexistentes. |
| [Somos Jujuy](https://www.somosjujuy.com.ar/) | Identificación y domicilio, contacto de noticias, contacto comercial, media kit, medios del grupo y enlaces legales en grupos separados. | Distinguir la redacción del área publicitaria; hacer visible la forma de contacto sin obligar a abrir un modal. |
| [Jujuy al Momento](https://www.jujuyalmomento.com/) | Secciones y temas del día, newsletter, contacto, términos y una línea final con domicilio y teléfono. | Secciones ordenadas y contacto accesible. No repetir temas del día en el footer si no habrá mantenimiento editorial. |
| [El Tribuno de Jujuy](https://eltribunodejujuy.com/) | Accesos a servicios y productos, redes, director y propietario, domicilio y registro editorial, términos, contacto, media kit y RSS. | Identificar al medio con datos verificables. Director, razón social, domicilio preciso y registros quedan pendientes de que el cliente los aporte; no inventarlos. |

La primera URL consultada de El Tribuno (`eltribuno.com/jujuy`) corresponde a una sección del sitio de Salta. Se siguió su enlace al sitio propio `eltribunodejujuy.com` para evitar atribuirle a Jujuy un footer de otra edición.

## Propuesta de diseño

Conservar la identidad Actualidad local: tipografía sans, fondo claro y acento rojo. Un cierre editorial amplio y legible, sin una grilla de tarjetas ni un gran bloque promocional.

1. Franja superior: logo original, descripción breve y acceso al canal de YouTube.
2. Cuerpo: secciones en dos columnas; bloque de redacción; bloque comercial. Las secciones usan la taxonomía existente.
3. Base: derechos y regreso a portada. En móvil los bloques se apilan; la lista de secciones mantiene dos columnas mientras sean legibles.

Los enlaces a secciones funcionan dentro de la maqueta; los contactos son enlaces reales que el usuario decide abrir. No se envían mensajes automáticamente. La selección de videos y la cabecera dinámica se conservan.

## Datos utilizados

Fuente de contacto: `frontend/app/components/FooterClient.js`, ya presente en el proyecto.

- Redacción: `bertageronimoperiodista@gmail.com`.
- Publicidad: WhatsApp `+54 388 5867757`, con texto de consulta comercial existente.
- Ubicación: San Salvador de Jujuy, Argentina. No se agregó una dirección física.
- YouTube: `https://www.youtube.com/@jujuy247`, confirmado mediante los videos y el canal público.

El correo existente es un Gmail personal utilizado públicamente por el medio. Se conserva para esta propuesta; antes de publicar conviene confirmar que seguirá siendo el contacto editorial y, si el cliente dispone de uno institucional, sustituirlo. El WhatsApp comercial no se presenta como un canal de difusión ni como una línea distinta de redacción.

## Pendientes antes de producción

Confirmar identidad editorial/legal del titular y los perfiles sociales. Añadir «Quiénes somos», privacidad, términos o media kit únicamente cuando haya contenido aprobado y una URL funcional. No hace falta esperar esos documentos para revisar el diseño: se omiten los enlaces vacíos.

El footer mejora navegación y claridad institucional. Esta comparación no demuestra una relación causal con el posicionamiento de los medios ni garantiza una mejora de rankings.
