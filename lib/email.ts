import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendContactEmail(data: {
  name: string
  email: string
  phone?: string
  message: string
}) {
  await transporter.sendMail({
    from: `same'z <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER || 'contact@samez.fr',
    replyTo: data.email,
    subject: `Nouveau message de ${data.name} — same'z`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Nouveau message reçu</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 100px;">Nom</td>
            <td style="padding: 8px 0;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${data.email}">${data.email}</a></td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Téléphone</td>
            <td style="padding: 8px 0;">${data.phone}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Message</td>
            <td style="padding: 8px 0; white-space: pre-wrap;">${data.message}</td>
          </tr>
        </table>
      </div>
    `,
  })
}

export async function sendClientInviteEmail(data: {
  name: string
  email: string
  actionLink: string
}) {
  await transporter.sendMail({
    from: `same'z <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: `Bienvenue chez same'z — Créez votre mot de passe`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #059669; padding: 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0; font-weight: 700;">same'z</h1>
          <p style="color: #d1fae5; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Solutions logicielles sur mesure</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Bonjour ${data.name},</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
            Votre espace client same'z a été créé avec succès. Pour y accéder, 
            il vous suffit de définir votre mot de passe en cliquant sur le bouton ci-dessous.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.actionLink}" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Créer mon mot de passe
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0 0 16px;">
            Une fois votre mot de passe défini, vous pourrez vous connecter à tout moment sur 
            <a href="https://samez.fr/espace-client" style="color: #059669;">samez.fr/espace-client</a> 
            pour suivre vos devis et factures.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 0;">
            Cet email a été envoyé automatiquement. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.<br />
            same'z — contact@samez.fr — 07 52 08 74 16
          </p>
        </div>
      </div>
    `,
  })
}
