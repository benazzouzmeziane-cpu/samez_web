import nodemailer from 'nodemailer'
import { escapeHtml } from '@/lib/escape-html'

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
  const name = escapeHtml(data.name)
  const email = escapeHtml(data.email)
  const phone = data.phone ? escapeHtml(data.phone) : ''
  const message = escapeHtml(data.message)

  await transporter.sendMail({
    from: `same'z <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER || 'contact@samez.fr',
    replyTo: data.email,
    subject: `Nouveau message de ${data.name.replace(/[\r\n]/g, ' ').slice(0, 80)} — same'z`,
    text: [
      `Nouveau message reçu`,
      ``,
      `Nom: ${data.name}`,
      `Email: ${data.email}`,
      data.phone ? `Téléphone: ${data.phone}` : null,
      ``,
      `Message:`,
      data.message,
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Nouveau message reçu</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 100px;">Nom</td>
            <td style="padding: 8px 0;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Téléphone</td>
            <td style="padding: 8px 0;">${phone}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Message</td>
            <td style="padding: 8px 0; white-space: pre-wrap;">${message}</td>
          </tr>
        </table>
      </div>
    `,
  })
}

function sanitizeSamezUrl(url: string): string {
  if (/^https:\/\/samez\.fr\//.test(url)) return url
  if (
    process.env.NODE_ENV !== 'production' &&
    /^http:\/\/localhost:3000\//.test(url)
  ) {
    return url
  }
  return 'https://samez.fr/espace-client'
}

export async function sendClientInviteEmail(data: {
  name: string
  email: string
  inviteUrl: string
}) {
  const name = escapeHtml(data.name)
  const safeUrl = sanitizeSamezUrl(data.inviteUrl)

  await transporter.sendMail({
    from: `same'z <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: `Bienvenue chez same'z — Créez votre mot de passe`,
    text: [
      `Bonjour ${data.name},`,
      ``,
      `Votre espace client same'z a été créé. Définissez votre mot de passe :`,
      safeUrl,
      ``,
      `Puis connectez-vous sur https://samez.fr/espace-client`,
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #059669; padding: 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0; font-weight: 700;">same'z</h1>
          <p style="color: #d1fae5; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Solutions logicielles sur mesure</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Bonjour ${name},</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
            Votre espace client same'z a été créé avec succès. Pour y accéder, 
            il vous suffit de définir votre mot de passe en cliquant sur le bouton ci-dessous.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${safeUrl}" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
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

export async function sendBookingAdminEmail(data: {
  name: string
  email: string
  phone?: string
  startsAtLabel: string
  notes?: string
}) {
  const name = escapeHtml(data.name)
  const email = escapeHtml(data.email)
  const phone = data.phone ? escapeHtml(data.phone) : ''
  const when = escapeHtml(data.startsAtLabel)
  const notes = data.notes ? escapeHtml(data.notes) : ''

  await transporter.sendMail({
    from: `same'z <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER || 'contact@samez.fr',
    replyTo: data.email,
    subject: `Nouveau RDV — ${data.startsAtLabel} — ${data.name.replace(/[\r\n]/g, ' ').slice(0, 60)}`,
    text: [
      'Nouveau rendez-vous réservé',
      '',
      `Quand: ${data.startsAtLabel}`,
      `Nom: ${data.name}`,
      `Email: ${data.email}`,
      data.phone ? `Téléphone: ${data.phone}` : null,
      data.notes ? `Notes: ${data.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Nouveau rendez-vous</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: 600; width: 120px;">Quand</td><td style="padding: 8px 0;">${when}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 600;">Nom</td><td style="padding: 8px 0;">${name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 600;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; font-weight: 600;">Téléphone</td><td style="padding: 8px 0;">${phone}</td></tr>` : ''}
          ${notes ? `<tr><td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Notes</td><td style="padding: 8px 0; white-space: pre-wrap;">${notes}</td></tr>` : ''}
        </table>
      </div>
    `,
  })
}

export async function sendBookingConfirmationEmail(data: {
  name: string
  email: string
  startsAtLabel: string
  icsContent: string
  meetLink?: string
}) {
  const name = escapeHtml(data.name)
  const when = escapeHtml(data.startsAtLabel)
  const meet = data.meetLink ? escapeHtml(data.meetLink) : ''

  await transporter.sendMail({
    from: `same'z <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: `Confirmation — Échange same'z le ${data.startsAtLabel}`,
    text: [
      `Bonjour ${data.name},`,
      '',
      `Votre échange de 45 minutes est bien réservé.`,
      `Quand: ${data.startsAtLabel} (heure de Paris)`,
      data.meetLink
        ? `Lien visio: ${data.meetLink}`
        : 'Le lien visio Google Meet vous sera confirmé par email avant le rendez-vous.',
      '',
      'Un fichier calendrier (.ics) est joint à cet email.',
      '',
      "À bientôt — same'z",
      'contact@samez.fr — 07 52 08 74 16',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #059669; padding: 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0; font-weight: 700;">same'z</h1>
          <p style="color: #d1fae5; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Échange confirmé</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Bonjour ${name},</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
            Votre échange de <strong>45 minutes</strong> est bien réservé.
          </p>
          <p style="color: #047857; font-size: 16px; font-weight: 600; margin: 0 0 16px;">${when}</p>
          ${
            meet
              ? `<p style="color: #374151; font-size: 14px; margin: 0 0 16px;">Lien visio : <a href="${meet}" style="color: #059669;">${meet}</a></p>`
              : `<p style="color: #6b7280; font-size: 14px; margin: 0 0 16px;">Le lien visio Google Meet vous sera confirmé par email avant le rendez-vous.</p>`
          }
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Un fichier calendrier (.ics) est joint — ajoutez-le à votre agenda.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">same'z — contact@samez.fr — 07 52 08 74 16</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'rendez-vous-samez.ics',
        content: data.icsContent,
        contentType: 'text/calendar; charset=utf-8',
      },
    ],
  })
}

export async function sendClientFollowUpEmail(data: {
  name: string
  email: string
  subject: string
  body: string
}) {
  const name = escapeHtml(data.name)
  const subject = data.subject.replace(/[\r\n]/g, ' ').slice(0, 120)
  const body = escapeHtml(data.body)

  await transporter.sendMail({
    from: `same'z <${process.env.SMTP_USER}>`,
    to: data.email,
    replyTo: process.env.SMTP_USER || 'contact@samez.fr',
    subject,
    text: [`Bonjour ${data.name},`, '', data.body, '', "same'z — contact@samez.fr — 07 52 08 74 16"].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #059669; padding: 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0; font-weight: 700;">same'z</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">Bonjour ${name},</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${body}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 0;">
            same'z — contact@samez.fr — 07 52 08 74 16
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(data: {
  name: string
  email: string
  resetUrl: string
}) {
  const name = escapeHtml(data.name)
  const safeUrl = sanitizeSamezUrl(data.resetUrl)

  await transporter.sendMail({
    from: `same'z <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: `same'z — Réinitialisation de votre mot de passe`,
    text: [
      `Bonjour ${data.name},`,
      ``,
      `Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien suivant :`,
      safeUrl,
      ``,
      `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #059669; padding: 32px; text-align: center;">
          <h1 style="color: #fff; font-size: 24px; margin: 0; font-weight: 700;">same'z</h1>
          <p style="color: #d1fae5; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Solutions logicielles sur mesure</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Bonjour ${name},</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
            Vous avez demandé à réinitialiser le mot de passe de votre espace client.
            Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${safeUrl}" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0 0 16px;">
            Ce lien expire rapidement. Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 0;">
            same'z — contact@samez.fr — 07 52 08 74 16
          </p>
        </div>
      </div>
    `,
  })
}
