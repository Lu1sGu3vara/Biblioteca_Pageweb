<?php
/**
 * Procesa el formulario de contacto — Portal Biblioteca Meira Delmar.
 *
 * - Valida de nuevo todos los datos en el servidor (nunca se confía solo en el navegador).
 * - Bloquea spam: campo trampa (honeypot), tiempo mínimo de llenado y límite de envíos por IP.
 * - Evita inyección de cabeceras de correo.
 * - Responde en JSON si la petición viene de JavaScript; si no, redirige con un mensaje.
 *
 * CONFIGURACIÓN: copie config-correo.ejemplo.php como config-correo.php y complete los datos.
 * Sin ese archivo se usan los valores por defecto y la función mail() del servidor.
 */

declare(strict_types=1);

date_default_timezone_set('America/Bogota');

$CONFIG =array_replace_recursive([
    'destino'   => 'atencionalciudadano@atlantico.gov.co', // PENDIENTE: correo propio de la biblioteca
    'remitente' => 'no-responder@atlantico.gov.co',        // Debe pertenecer al dominio del servidor
    'smtp'      => ['host' => ''],                          // Vacío: se usa mail() del servidor
], is_file(__DIR__ . '/config-correo.php') ? (array) require __DIR__ . '/config-correo.php' : []);

const MAX_POR_HORA   = 5;                                       // Envíos máximos por IP en una hora
const SEGUNDOS_MIN   = 3;                                       // Un humano tarda más de 3 s en llenar el formulario

$TIPOS = [
    'consulta'   => 'Consulta general',
    'visita'     => 'Visita guiada',
    'afiliacion' => 'Afiliación a la Llave del Saber',
    'donacion'   => 'Donación de libros',
    'actividad'  => 'Inscripción a una actividad',
    'sugerencia' => 'Sugerencia o felicitación',
];

$esAjax = (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch');

function responder(bool $ok, string $mensaje, array $errores = [], int $codigo = 200): void
{
    global $esAjax;
    if ($esAjax) {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'mensaje' => $mensaje, 'errores' => $errores], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: contacto.html?' . ($ok ? 'enviado=1' : 'error=1'));
    }
    exit;
}

// Respaldo si el servidor no tiene la extensión mbstring (necesaria para recortar textos con tildes)
if (!function_exists('mb_substr')) {
    function mb_substr(string $texto, int $inicio, ?int $largo = null): string
    {
        if (preg_match_all('/./us', $texto, $m) === false) {
            return substr($texto, $inicio, $largo);
        }
        return implode('', array_slice($m[0], $inicio, $largo));
    }
}
if (!function_exists('mb_strlen')) {
    function mb_strlen(string $texto): int
    {
        $n = preg_match_all('/./us', $texto);
        return $n === false ? strlen($texto) : $n;
    }
}

/**
 * Envía el correo por SMTP autenticado (Gmail, Office 365 o el servidor de correo de la entidad).
 * Usa STARTTLS en el puerto 587 o TLS directo en el 465. Los errores se registran en el log del
 * servidor, nunca se muestran al visitante.
 */
function enviarPorSmtp(array $cfg, string $asunto, string $cuerpo, string $cabeceras): bool
{
    $s = $cfg['smtp'];
    $tlsDirecto = ($s['seguridad'] ?? 'tls') === 'ssl';
    $conexion = @stream_socket_client(
        ($tlsDirecto ? 'ssl://' : 'tcp://') . $s['host'] . ':' . (int) ($s['puerto'] ?? 587),
        $errno, $errstr, 15
    );
    if (!$conexion) {
        error_log("SMTP: no se pudo conectar ({$errstr})");
        return false;
    }
    stream_set_timeout($conexion, 15);

    $leer = function () use ($conexion): string {
        $respuesta = '';
        while (($linea = fgets($conexion, 515)) !== false) {
            $respuesta .= $linea;
            if (isset($linea[3]) && $linea[3] === ' ') break;   // última línea de una respuesta multilínea
        }
        return $respuesta;
    };
    $orden = function (string $comando, array $esperados) use ($conexion, $leer): bool {
        if ($comando !== '') fwrite($conexion, $comando . "\r\n");
        $respuesta = $leer();
        if (!in_array((int) substr($respuesta, 0, 3), $esperados, true)) {
            $visible = strncmp($comando, 'AUTH', 4) === 0 || strlen($comando) > 60 ? '(credenciales)' : $comando;
            error_log("SMTP: '{$visible}' respondió " . trim($respuesta));
            return false;
        }
        return true;
    };

    $dominio = $_SERVER['SERVER_NAME'] ?? 'localhost';
    $ok = $orden('', [220]) && $orden("EHLO {$dominio}", [250]);
    if ($ok && !$tlsDirecto && ($s['seguridad'] ?? 'tls') !== 'ninguna') {
        $ok = $orden('STARTTLS', [220])
            && stream_socket_enable_crypto($conexion, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)
            && $orden("EHLO {$dominio}", [250]);
    }
    if ($ok && ($s['usuario'] ?? '') !== '') {
        $ok = $orden('AUTH LOGIN', [334])
            && $orden(base64_encode($s['usuario']), [334])
            && $orden(base64_encode((string) $s['clave']), [235]);
    }
    $ok = $ok
        && $orden("MAIL FROM:<{$cfg['remitente']}>", [250])
        && $orden("RCPT TO:<{$cfg['destino']}>", [250, 251])
        && $orden('DATA', [354]);
    if ($ok) {
        $mensaje = "Date: " . date(DATE_RFC2822) . "\r\n"
            . "To: <{$cfg['destino']}>\r\n"
            . "Subject: {$asunto}\r\n"
            . "Message-ID: <" . bin2hex(random_bytes(12)) . "@{$dominio}>\r\n"
            . $cabeceras . "\r\n\r\n"
            . str_replace("\n.", "\n..", str_replace(["\r\n", "\n"], ["\n", "\r\n"], $cuerpo));
        $ok = $orden($mensaje . "\r\n.", [250]);
    }
    fwrite($conexion, "QUIT\r\n");
    fclose($conexion);
    return $ok;
}

/** Lee un campo del formulario solo si es texto (un bot puede enviar listas, p. ej. nombre[]=x). */
function campo(string $nombre): string
{
    $valor = $_POST[$nombre] ?? '';
    if (!is_string($valor)) {
        return '';
    }
    // Los navegadores envían UTF-8; si llega otra codificación (Windows-1252) se convierte
    if (!preg_match('//u', $valor)) {
        if (function_exists('mb_convert_encoding')) {
            $valor = mb_convert_encoding($valor, 'UTF-8', 'Windows-1252');
        } elseif (function_exists('iconv')) {
            $valor = (string) iconv('Windows-1252', 'UTF-8//IGNORE', $valor);
        } else {
            $valor = (string) preg_replace('/[\x80-\xFF]/', '', $valor);
        }
    }
    return $valor;
}

function limpiar(string $valor, int $max): string
{
    $valor = trim(strip_tags($valor));
    $valor = preg_replace('/[\r\n]+/', ' ', $valor) ?? '';   // sin saltos de línea (anti-inyección)
    return mb_substr($valor, 0, $max);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, 'Método no permitido.', [], 405);
}

// 1. Anti-spam: honeypot y tiempo de llenado
if (campo('sitio_web') !== '') {
    responder(true, 'Gracias, recibimos tu mensaje.');            // Se finge éxito ante bots
}
$inicio = (int) campo('inicio');
if ($inicio > 0 && (time() - intdiv($inicio, 1000)) < SEGUNDOS_MIN) {
    responder(false, 'Por favor revisa el formulario e inténtalo de nuevo.', [], 429);
}

// 2. Límite de envíos por IP (archivo temporal, sin base de datos)
$ip      = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';
$archivo = sys_get_temp_dir() . '/bmd_contacto_' . hash('sha256', $ip) . '.json';
$marcas  = is_file($archivo) ? (json_decode((string) file_get_contents($archivo), true) ?: []) : [];
$marcas  = array_values(array_filter($marcas, fn($t) => $t > time() - 3600));
if (count($marcas) >= MAX_POR_HORA) {
    responder(false, 'Has enviado varios mensajes seguidos. Intenta de nuevo en una hora.', [], 429);
}

// 3. Validación de campos
$nombre   = limpiar(campo('nombre'), 100);
$correo   = limpiar(campo('correo'), 120);
$telefono = limpiar(campo('telefono'), 20);
$tipo     = campo('tipo');
$mensaje  = mb_substr(trim(strip_tags(campo('mensaje'))), 0, 1000);
$acepto   = campo('acepto') === 'si';
$institucion = limpiar(campo('institucion'), 120);
$personas    = (int) campo('personas');

$errores = [];
if (mb_strlen($nombre) < 3)                              $errores['nombre']   = 'Escribe tu nombre completo.';
if (!filter_var($correo, FILTER_VALIDATE_EMAIL))         $errores['correo']   = 'Escribe un correo válido.';
if ($telefono !== '' && !preg_match('/^[0-9+\s()-]{7,20}$/', $telefono)) $errores['telefono'] = 'Escribe un teléfono válido.';
if (!array_key_exists($tipo, $TIPOS))                    $errores['tipo']     = 'Selecciona el tipo de solicitud.';
if (mb_strlen($mensaje) < 10)                            $errores['mensaje']  = 'El mensaje debe tener al menos 10 caracteres.';
if (!$acepto)                                            $errores['acepto']   = 'Debes autorizar el tratamiento de datos.';

if ($errores) {
    responder(false, 'Revisa los campos marcados.', $errores, 422);
}

// 4. Envío del correo
$asunto = '=?UTF-8?B?' . base64_encode('[Portal Biblioteca] ' . $TIPOS[$tipo] . ' — ' . $nombre) . '?=';
$cuerpo  = "Nueva solicitud desde el portal de la Biblioteca Meira Delmar\n";
$cuerpo .= str_repeat('-', 60) . "\n";
$cuerpo .= "Tipo:      {$TIPOS[$tipo]}\n";
$cuerpo .= "Nombre:    {$nombre}\n";
$cuerpo .= "Correo:    {$correo}\n";
$cuerpo .= 'Teléfono:  ' . ($telefono ?: 'No indicado') . "\n";
if ($tipo === 'visita') {
    $cuerpo .= 'Institución: ' . ($institucion ?: 'No indicada') . "\n";
    $cuerpo .= 'Personas:    ' . ($personas > 0 ? $personas : 'No indicado') . "\n";
}
$cuerpo .= "Fecha:     " . date('Y-m-d H:i') . "\n";
$cuerpo .= "Autorizó tratamiento de datos (Ley 1581): Sí\n";
$cuerpo .= str_repeat('-', 60) . "\n\n" . $mensaje . "\n";

$cabeceras  = "From: Portal Biblioteca Meira Delmar <{$CONFIG['remitente']}>\r\n";
$cabeceras .= "Reply-To: {$correo}\r\n";
$cabeceras .= "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
// Base64: las tildes y la ñ llegan intactas aunque algún servidor intermedio no acepte texto de 8 bits
$cabeceras .= "Content-Transfer-Encoding: base64";
$cuerpoCodificado = chunk_split(base64_encode($cuerpo));

$enviado = $CONFIG['smtp']['host'] !== ''
    ? enviarPorSmtp($CONFIG, $asunto, $cuerpoCodificado, $cabeceras)
    : mail($CONFIG['destino'], $asunto, $cuerpoCodificado, $cabeceras);

if (!$enviado) {
    responder(false, 'No pudimos enviar tu mensaje en este momento. Inténtalo más tarde o escríbenos al correo de atención al ciudadano.', [], 500);
}

$marcas[] = time();
@file_put_contents($archivo, json_encode($marcas));

responder(true, '¡Gracias, ' . explode(' ', $nombre)[0] . '! Recibimos tu mensaje y te responderemos a ' . $correo . '.');
