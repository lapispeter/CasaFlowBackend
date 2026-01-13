import nodemailer from 'nodemailer'

// ─────────────────────────────────────────────────────────────
// DEBUG / DIAGNÓZIS (vizsgán/élesben nem kell)
// Ha kell hibát keresni, vedd ki a kommentet.
// console.log('MAIL_HOST =', process.env.MAIL_HOST)
// console.log('MAIL_PORT =', process.env.MAIL_PORT)
// console.log('MAIL_SECURE =', process.env.MAIL_SECURE)
// ─────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  // DEBUG / DIAGNÓZIS (élesben általában kikapcsoljuk)
  // debug: true,
  // logger: true,

  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: String(process.env.MAIL_SECURE).toLowerCase() === 'true',

  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

// DEBUG / DIAGNÓZIS (vizsgán/élesben nem kell)
// console.log('TRANSPORT PORT  =', transporter?.options?.port)
// console.log('TRANSPORT HOST  =', transporter?.options?.host)

// SMTP VERIFY (hasznos fejlesztéskor, de zajos lehet élesben)
// Ha élesben is akarod, hagyd bent – ártani nem árt, csak logol.
// transporter.verify()
//   .then(() => console.log('SMTP OK ✅'))
//   .catch((err) => console.log('SMTP VERIFY ERROR ❌', err?.message || err))

const EmailService = {
  async send({ to, subject, text, html, from }) {
    // Fontos: Gmailnél a default FROM legyen Gmail-es, ne freemail.
    // A legjobb, ha a .env-ben MAIL_FROM="CasaFlow <casaflow2026@gmail.com>"
    const finalFrom = from || process.env.MAIL_FROM || process.env.MAIL_USER

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
