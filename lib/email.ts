import { Resend } from 'resend'

export async function sendContactEmail(data: {
  name: string
  email: string
  phone?: string
  message: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: "same'z <noreply@samez.fr>",
    to: process.env.CONTACT_EMAIL || 'presta@samez.fr',
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
