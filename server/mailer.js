import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const resend = apiKey ? new Resend(apiKey) : null;

if (!apiKey) {
  console.warn(
    '[mailer] RESEND_API_KEY no configurada. Los correos de invitación no se enviarán de verdad; ' +
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

  if (!resend) {
    console.log(`[mailer] (simulado) Invitación para ${to}`);
    console.log(`[mailer] Enlace: ${link}`);
    return { sent: false, link };
  }

  const { data, error } = await resend.emails.send({ from: fromEmail, to, subject, html });
  if (error) {
    console.error('[mailer] Error enviando email con Resend:', error);
    throw new Error('No se pudo enviar el correo: ' + (error.message || 'error desconocido'));
  }
  return { sent: true, id: data?.id, link };
}
