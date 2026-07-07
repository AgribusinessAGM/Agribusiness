import nodemailer from 'nodemailer';

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || 'smtp.office365.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const fromEmail = process.env.FROM_EMAIL || smtpUser;

const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false, // usa STARTTLS en el puerto 587 (estándar para Microsoft 365)
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      })
    : null;

if (!transporter) {
  console.warn(
    '[mailer] SMTP_USER/SMTP_PASS no configurados. Los correos de invitación no se enviarán de verdad; ' +
      'el enlace se imprimirá en esta consola y se devolverá en la respuesta de la API (solo en desarrollo).',
  );
}

function inviteEmailHtml({ name, link }) {
  return `
  <div style="font-family:'Public Sans',Arial,sans-serif;background:#f3f5f1;padding:32px">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #dde3d8">
      <div style="background:#1e4423;padding:20px 28px">
        <span style="color:#ffffff;font-weight:700;font-size:15px;letter-spacing:.04em">AGROMILLORA</span>
      </div>
      <div style="padding:28px">
        <h1 style="font-size:19px;margin:0 0 12px;color:#182015">Hola ${escapeHtml(name)},</h1>
        <p style="font-size:14px;line-height:1.6;color:#606b58;margin:0 0 20px">
          Te han dado acceso a la <strong>Plataforma de modelos financieros</strong> de Agromillora.
          Crea tu contraseña para entrar y consultar los modelos compartidos contigo.
        </p>
        <a href="${link}" style="display:inline-block;background:#2e6b34;color:#ffffff;text-decoration:none;
          font-weight:700;font-size:14px;padding:12px 22px;border-radius:6px">Crear mi contraseña</a>
        <p style="font-size:12px;line-height:1.6;color:#606b58;margin:24px 0 0">
          Este enlace caduca en 7 días. Si no esperabas esta invitación, puedes ignorar este correo.
        </p>
      </div>
    </div>
  </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export async function sendInviteEmail({ to, name, link }) {
  const subject = 'Crea tu contraseña — Plataforma de modelos financieros';
  const html = inviteEmailHtml({ name, link });

  if (!transporter) {
    console.log(`[mailer] (simulado) Invitación para ${to}`);
    console.log(`[mailer] Enlace: ${link}`);
    return { sent: false, link };
  }

  try {
    await transporter.sendMail({ from: fromEmail, to, subject, html });
  } catch (e) {
    console.error('[mailer] Error enviando email por SMTP:', e);
    throw new Error(
      'No se pudo enviar el correo: ' +
        (e.message || 'error desconocido') +
        '. Si es un fallo de autenticación, comprueba que el buzón tiene el SMTP autenticado activado y que ' +
        'SMTP_PASS es una contraseña de aplicación (no la contraseña normal de la cuenta).',
    );
  }
  return { sent: true, link };
}
