<?php
/**
 * Configuración del correo del formulario de contacto.
 *
 * 1. Copie este archivo con el nombre config-correo.php (en la misma carpeta).
 * 2. Complete los datos. config-correo.php NO se sube a GitHub porque contiene la clave.
 * 3. Si deja 'host' vacío, el formulario usa la función mail() del servidor.
 *
 * Ejemplos de servidor SMTP:
 *   Gmail ........ smtp.gmail.com, puerto 587, seguridad 'tls' (requiere una "contraseña de aplicación")
 *   Office 365 ... smtp.office365.com, puerto 587, seguridad 'tls'
 */
return [
    'destino'   => 'correo-de-la-biblioteca@atlantico.gov.co', // Quién recibe los mensajes del formulario
    'remitente' => 'cuenta-que-envia@atlantico.gov.co',        // Debe ser la misma cuenta del usuario SMTP
    'smtp'      => [
        'host'      => '',          // p. ej. smtp.office365.com
        'puerto'    => 587,
        'seguridad' => 'tls',       // 'tls' (STARTTLS, 587), 'ssl' (465) o 'ninguna' (solo relés internos)
        'usuario'   => '',
        'clave'     => '',
    ],
];
