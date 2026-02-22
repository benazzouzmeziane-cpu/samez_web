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
