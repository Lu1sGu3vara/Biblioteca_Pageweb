<?php
/**
 * Procesa el formulario de contacto — Portal Biblioteca Meira Delmar.
 *
 * - Valida de nuevo todos los datos en el servidor (nunca se confía solo en el navegador).
 * - Bloquea spam: campo trampa (honeypot), tiempo mínimo de llenado y límite de envíos por IP.
 * - Evita inyección de cabeceras de correo.
 * - Responde en JSON si la petición viene de JavaScript; si no, redirige con un mensaje.
 *
 * CONFIGURACIÓN: cambie DESTINO por el correo oficial que recibirá los mensajes.
 */

declare(strict_types=1);

const DESTINO        = 'atencionalciudadano@atlantico.gov.co'; // PENDIENTE: correo propio de la biblioteca
const REMITENTE      = 'no-responder@atlantico.gov.co';         // Debe pertenecer al dominio del servidor
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
if (!empty($_POST['sitio_web'])) {
    responder(true, 'Gracias, recibimos tu mensaje.');            // Se finge éxito ante bots
}
$inicio = (int) ($_POST['inicio'] ?? 0);
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
$nombre   = limpiar($_POST['nombre'] ?? '', 100);
$correo   = limpiar($_POST['correo'] ?? '', 120);
$telefono = limpiar($_POST['telefono'] ?? '', 20);
$tipo     = $_POST['tipo'] ?? '';
$mensaje  = mb_substr(trim(strip_tags($_POST['mensaje'] ?? '')), 0, 1000);
$acepto   = ($_POST['acepto'] ?? '') === 'si';
$institucion = limpiar($_POST['institucion'] ?? '', 120);
$personas    = (int) ($_POST['personas'] ?? 0);

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

$cabeceras  = "From: Portal Biblioteca Meira Delmar <" . REMITENTE . ">\r\n";
$cabeceras .= "Reply-To: {$correo}\r\n";
$cabeceras .= "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";

if (!mail(DESTINO, $asunto, $cuerpo, $cabeceras)) {
    responder(false, 'No pudimos enviar tu mensaje en este momento. Inténtalo más tarde o escríbenos al correo de atención al ciudadano.', [], 500);
}

$marcas[] = time();
@file_put_contents($archivo, json_encode($marcas));

responder(true, '¡Gracias, ' . explode(' ', $nombre)[0] . '! Recibimos tu mensaje y te responderemos a ' . $correo . '.');
