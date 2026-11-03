import nodemailer from 'nodemailer';
import { HttpError } from '../utils/http.js';
export async function sendResetCode(email, code) {
  const subject = 'FitManager | Código para redefinir sua senha';
  const text = `Seu código de redefinição de senha é ${code}. Ele expira em 10 minutos. Se você não solicitou, ignore esta mensagem.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px"><h2>FitManager</h2><p>Use este código para redefinir sua senha:</p><p style="font-size:32px;font-weight:bold;letter-spacing:5px">${code}</p><p>Validade: 10 minutos. Se não foi você, ignore este e-mail.</p></div>`;
  // HTTPS: funciona no Render Free, que bloqueia as portas SMTP mais comuns.
  if (process.env.RESEND_API_KEY) {
    if (!process.env.RESEND_FROM)
      throw new HttpError(503, 'Configure RESEND_FROM.');
    let response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.RESEND_FROM, to: [email], subject, text, html }),
        signal: AbortSignal.timeout(12000)
      });
    }
    catch {
      throw new HttpError(502, 'Serviço de e-mail indisponível. Tente novamente.');
    }
    if (!response.ok)
      throw new HttpError(502, 'Falha ao enviar e-mail. Confira a configuração do remetente.');
    return;
  }
  if (!process.env.SMTP_HOST)
    throw new HttpError(503, 'Servidor de e-mail não configurado.');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } } : {})
  });
  await transporter.sendMail({ from: process.env.MAIL_FROM || 'FitManager <no-reply@fitmanager.local>', to: email, subject, text, html });
}
