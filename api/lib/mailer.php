<?php
// Envío del correo de invitación por SMTP con STARTTLS (ej. Microsoft 365).
// Cliente SMTP mínimo, sin dependencias, para que funcione igual en XAMPP y
// en Plesk sin instalar nada.

// $kind: 'invite' (alta o reenvío de acceso, 72 h) | 'reset' (He olvidado mi contraseña, 1 h)
function invite_email_html(string $name, string $link, string $kind = 'invite'): string
{
    $name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $link = htmlspecialchars($link, ENT_QUOTES, 'UTF-8');
    $intro = $kind === 'reset'
        ? 'Hemos recibido una solicitud para cambiar tu contraseña de la <strong>Plataforma AGRIBUSINESS</strong>. Pulsa el botón para elegir una nueva.'
        : 'Te han dado acceso a la <strong>Plataforma AGRIBUSINESS</strong> de Agromillora. Crea tu contraseña para entrar y consultar los modelos compartidos contigo.';
    $button = $kind === 'reset' ? 'Elegir nueva contraseña' : 'Crear mi contraseña';
    $foot = $kind === 'reset'
        ? 'Este enlace caduca en 1 hora y solo sirve una vez. Si no lo has pedido tú, ignora este correo: tu contraseña no cambia.'
        : 'Este enlace caduca en 72 horas y solo sirve una vez. Si no esperabas esta invitación, puedes ignorar este correo.';
    return <<<HTML
  <div style="font-family:'Public Sans',Arial,sans-serif;background:#f3f5f1;padding:32px">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #dde3d8">
      <div style="background:#1e4423;padding:20px 28px">
        <span style="color:#ffffff;font-weight:700;font-size:15px;letter-spacing:.04em">AGROMILLORA</span>
      </div>
      <div style="padding:28px">
        <h1 style="font-size:19px;margin:0 0 12px;color:#182015">Hola {$name},</h1>
        <p style="font-size:14px;line-height:1.6;color:#606b58;margin:0 0 20px">
          {$intro}
        </p>
        <a href="{$link}" style="display:inline-block;background:#2e6b34;color:#ffffff;text-decoration:none;
          font-weight:700;font-size:14px;padding:12px 22px;border-radius:6px">{$button}</a>
        <p style="font-size:12px;line-height:1.6;color:#606b58;margin:24px 0 0">
          {$foot}
        </p>
      </div>
    </div>
  </div>
HTML;
}

/**
 * Devuelve ['sent' => bool]. Sin SMTP configurado no envía nada (sent=false); la API decide
 * qué hacer (error, o el enlace en pantalla solo con dev_show_links en local).
 */
function send_invite_email(string $to, string $name, string $link, string $kind = 'invite'): array
{
    $c = config();
    if ($c['smtp_user'] === '' || $c['smtp_pass'] === '') {
        return ['sent' => false];
    }

    $from = $c['from_email'] !== '' ? $c['from_email'] : $c['smtp_user'];
    $subject = $kind === 'reset'
        ? 'Cambia tu contraseña — Plataforma AGRIBUSINESS'
        : 'Crea tu contraseña — Plataforma AGRIBUSINESS';
    try {
        smtp_send($c['smtp_host'], (int) $c['smtp_port'], $c['smtp_user'], $c['smtp_pass'], $from, $to, $subject,
            invite_email_html($name, $link, $kind));
    } catch (RuntimeException $e) {
        error_log('[mailer] Error enviando email por SMTP: ' . $e->getMessage());
        throw new RuntimeException(
            'No se pudo enviar el correo: ' . $e->getMessage() . '. Si es un fallo de autenticación, comprueba que el ' .
            'buzón tiene el SMTP autenticado activado y que smtp_pass es una contraseña de aplicación (no la ' .
            'contraseña normal de la cuenta).'
        );
    }
    return ['sent' => true];
}

function smtp_send(string $host, int $port, string $user, string $pass, string $from, string $to, string $subject, string $html): void
{
    $sock = @stream_socket_client("tcp://$host:$port", $errno, $errstr, 10);
    if (!$sock) throw new RuntimeException("no se pudo conectar con $host:$port ($errstr)");
    stream_set_timeout($sock, 15);

    $read = function () use ($sock): string {
        $out = '';
        while (($line = fgets($sock, 515)) !== false) {
            $out .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break; // última línea de la respuesta
        }
        return $out;
    };
    $cmd = function (?string $line, int $expect) use ($sock, $read): string {
        if ($line !== null) fwrite($sock, $line . "\r\n");
        $res = $read();
        if ((int) substr($res, 0, 3) !== $expect) {
            throw new RuntimeException(trim($res) !== '' ? trim($res) : 'el servidor SMTP cerró la conexión');
        }
        return $res;
    };

    try {
        $cmd(null, 220);
        $cmd('EHLO agribusiness', 250);
        $cmd('STARTTLS', 220);
        if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new RuntimeException('no se pudo establecer TLS');
        }
        $cmd('EHLO agribusiness', 250);
        $cmd('AUTH LOGIN', 334);
        $cmd(base64_encode($user), 334);
        $cmd(base64_encode($pass), 235);
        $cmd("MAIL FROM:<$from>", 250);
        $cmd("RCPT TO:<$to>", 250);
        $cmd('DATA', 354);

        $headers = [
            'From: ' . $from,
            'To: ' . $to,
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
            'Date: ' . date(DATE_RFC2822),
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ];
        $body = chunk_split(base64_encode($html));
        $cmd(implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.", 250);
        $cmd('QUIT', 221);
    } finally {
        fclose($sock);
    }
}
