import nodemailer from 'nodemailer'

// 🌸 Egységes EmailService – ezt fogja használni Auth + később a "3 nappal előtte" értesítő is
const transporter = nodemailer.createTransport({
  debug: true,
  logger: true,
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

const EmailService = {
  async send({ to, subject, text, html, from }) {
    const finalFrom = from || process.env.MAIL_FROM || '"My App" <noreply@example.com>'

    // minimál védelem
    if (!to) throw new Error('EmailService.send: missing "to"')
    if (!subject) throw new Error('EmailService.send: missing "subject"')
    if (!text && !html) throw new Error('EmailService.send: missing "text" or "html"')

    return transporter.sendMail({
      from: finalFrom,
      to,
      subject,
      text,
      html
    })
  }
}

export default EmailService
