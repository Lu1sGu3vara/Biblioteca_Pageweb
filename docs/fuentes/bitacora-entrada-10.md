# Entrada 10 — 18/11/2026 · Revisión general y prueba del sitio en un servidor PHP

> Sirve para el Capítulo 6 (Pruebas) y el Capítulo 7 (Implementación).

## 1. Revisión general

| Revisión | Resultado |
|---|---|
| Repositorio en GitHub | Sincronizado, sin cambios pendientes antes de esta entrada |
| Enlaces y archivos internos de las 10 páginas | 352 revisados, ninguno roto |
| Anclas internas (por ejemplo `historia.html#meira-delmar`) | Ninguna rota |
| Estructura HTML | Etiquetas balanceadas y un solo `h1` por página |
| `data/noticias.json` | Válido, 8 entradas |
| JavaScript (`main.js`, `idiomas.js`) | Sin errores de sintaxis (verificado con Node.js) |
| `enviar.php` | Sin errores de sintaxis (verificado con PHP 8.3) |

## 2. Prueba en un servidor PHP real

Se instaló **PHP 8.3.36**, la versión más común en servidores de hosting y la que requieren las versiones actuales de Joomla, la plataforma del portal de la Gobernación. El sitio se publicó con el servidor web de PHP. Para verificar los correos sin enviar nada a internet, se usó un **buzón SMTP de prueba local** que recibe y guarda los mensajes.

PHP se ejecutó **sin la extensión `mbstring`**, para comprobar que el formulario funciona aun en el servidor más básico.

### Archivos servidos

Las páginas, la hoja de estilos, los scripts, el JSON de noticias, las imágenes WebP y las fuentes WOFF2 respondieron con código 200 y el tipo de contenido correcto.

### Batería de pruebas del formulario

| N.º | Caso | Respuesta esperada | Resultado |
|---|---|---|---|
| P-50 | Abrir `enviar.php` directamente (GET) | 405, método no permitido | Correcto |
| P-51 | Formulario vacío | 422 con un mensaje por cada campo | Correcto |
| P-52 | Correo inválido y sin autorización de datos | 422 indicando ambos errores | Correcto |
| P-53 | Tipo de solicitud inventado | 422 | Correcto |
| P-54 | Campos enviados como lista (`nombre[]=x`), intento de ataque | 422, sin error del servidor | Correcto, tras la corrección 1 |
| P-55 | Bot que llena el campo trampa | 200 aparente; el mensaje se descarta | Correcto |
| P-56 | Envío en menos de 3 segundos | 429 | Correcto |
| P-57 | Inyección de cabeceras (`Bcc:` en el nombre) | El texto queda como parte del nombre y no se crea un destinatario oculto | Correcto |
| P-58 | Nombre y mensaje con tildes y ñ (UTF-8) | 200 y correo con tildes correctas | Correcto |
| P-59 | Tildes en otra codificación (Windows-1252) | 200, texto convertido | Correcto, tras la corrección 2 |
| P-60 | Envío sin JavaScript | Redirección a `contacto.html?enviado=1` | Correcto |
| P-61 | Sexto envío en la misma hora | 429, "Has enviado varios mensajes seguidos" | Correcto |
| P-62 | Formulario completo desde el navegador | Mensaje verde de confirmación y formulario limpio | Correcto |

### Correo recibido (ejemplo real de la prueba)

- **Para:** atencionalciudadano@atlantico.gov.co
- **De:** Portal Biblioteca Meira Delmar
- **Responder a:** el correo del visitante, para contestarle directamente.
- **Asunto:** "[Portal Biblioteca] Visita guiada — María Peñaranda"
- **Cuerpo:** tipo, nombre, correo, teléfono, institución, número de personas, fecha, constancia de la autorización (Ley 1581) y el mensaje, con todas las tildes correctas.

## 3. Correcciones aplicadas durante la prueba

1. **Campos enviados como lista.** Si un bot enviaba `nombre[]=x`, PHP producía un error fatal (500). Ahora todos los campos se leen con una función que solo acepta texto.
2. **Codificación distinta de UTF-8.** Los datos que no llegan en UTF-8 se convierten en lugar de rechazarse.
3. **Servidor sin `mbstring`.** Se agregó un respaldo para las funciones de texto con tildes, de modo que el formulario funcione aunque la extensión no esté instalada.
4. **Cuerpo del correo en base64.** El cuerpo se envía codificado (`Content-Transfer-Encoding: base64`) para que las tildes lleguen intactas aunque algún servidor de correo intermedio no acepte texto de 8 bits.

## 4. Requisitos para publicar en el servidor de la Gobernación

| Requisito | Detalle |
|---|---|
| PHP | 7.4 o superior; probado en 8.3 |
| Servidor web | Apache para aprovechar el `.htaccess`. En Nginx o IIS hay que traducir esas reglas |
| Correo | La función `mail()` de PHP debe estar configurada en el servidor (sendmail o SMTP). **Es lo único que no se puede probar fuera del servidor real** |
| Configuración de `enviar.php` | Cambiar `DESTINO` por el correo de la biblioteca y `REMITENTE` por una dirección del dominio del servidor, para que el correo no se marque como spam |
| Permisos | PHP debe poder escribir en la carpeta temporal del sistema, donde guarda el límite de envíos por hora |
| HTTPS | Recomendado: protege los datos personales que viajan en el formulario |
| Ubicación | El sitio debe publicarse en la raíz del dominio o del subdominio, por la regla `ErrorDocument 404 /404.html` |
