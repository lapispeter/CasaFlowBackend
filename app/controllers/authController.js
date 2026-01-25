import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import dotenv from '@dotenvx/dotenvx'
import crypto from 'crypto'

import EmailService from '../services/emailService.js'

dotenv.config({ quiet: true })

// nagyon egyszerű email formátum ellenőrzés (frontend mellett jó, backendben is legyen)
function isValidEmail(email) {
  if (!email) return false
  // nem tökéletes RFC, de elég jó alap validáció
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
}

const AuthController = {
  // ---------------- REGISZTRÁCIÓ ----------------
  async register(req, res) {
    try {
      const errors = {}

      const name = (req.body.name || '').trim()
      const email = (req.body.email || '').trim()
      const password = req.body.password || ''
      const password_confirmation = req.body.password_confirmation || ''

      // 1) Kötelező mezők
      if (!name) errors.name = ['Name is required!']
      if (!email) errors.email = ['Email is required!']
      if (!password) errors.password = ['Password is required!']
      if (!password_confirmation)
        errors.password_confirmation = ['Password confirmation is required!']

      // 2) Email formátum
      if (email && !isValidEmail(email)) {
        errors.email = errors.email || []
        errors.email.push('Invalid email format!')
      }

      // 3) Jelszó egyezés
      if (password && password_confirmation && password !== password_confirmation) {
        errors.password_confirmation = errors.password_confirmation || []
        errors.password_confirmation.push('The two password is not same!')
      }

      // 4) Ha már van alap hiba, ne menjünk DB-hez feleslegesen
      // (de akár mehetne, csak gyorsítás így)
      // Megjegyzés: ha szeretnéd, hogy foglaltságot akkor is nézze,
      // amikor más mezőhibák is vannak, ezt a "return"-t vedd ki.
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({
          success: false,
          errors,
        })
      }

      // 5) Foglaltság ellenőrzés DB-ben (name + email)
      const existingUserByName = await User.findOne({
        where: { name: name },
      })
      if (existingUserByName) {
        errors.name = errors.name || []
        errors.name.push('This username is already exists!')
      }

      const existingUserByEmail = await User.findOne({
        where: { email: email },
      })
      if (existingUserByEmail) {
        errors.email = errors.email || []
        errors.email.push('This email is already exists!')
      }

      // 6) Ha bármelyik foglalt, egyszerre küldjük vissza a hibákat
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({
          success: false,
          errors,
        })
      }

      // 7) ha minden oké -> regisztrálás
      // visszaírjuk a req.body-ba a trimelt értékeket, hogy tryRegister ezeket használja
      req.body.name = name
      req.body.email = email

      await AuthController.tryRegister(req, res)
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error! The register is failed!',
          error: error.message,
        })
      } else {
        console.error(error)
      }
    }
  },

  async tryRegister(req, res) {
    // Email megerősítéshez token + lejárat
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 óra

    const user = {
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password),
      isVerified: false,
      verificationToken: verificationToken,
      verificationTokenExpires: verificationTokenExpires,
    }

    const result = await User.create(user)

    const frontendBaseUrl = process.env.APP_FRONTEND_URL || 'http://localhost:4200'
    const verifyUrl = `${frontendBaseUrl}/verify-email?token=${verificationToken}`

    try {
      await EmailService.send({
        to: req.body.email,
        subject: 'CasaFlow – Regisztráció megerősítése',

        text:
          `Szia ${req.body.name}!\n\n` +
          `Kérlek, erősítsd meg a regisztrációdat az alábbi linken:\n\n` +
          `${verifyUrl}\n\n` +
          `Üdvözlettel:\nA CasaFlow csapata`,

        html: `
          <div style="
            max-width:600px;
            margin:0 auto;
            font-family:Arial, Helvetica, sans-serif;
            color:#333;
            line-height:1.6;
          ">

            <!-- SZÖVEG -->
            <p>Szia <strong>${req.body.name}</strong>!</p>

            <p>
              Köszönjük, hogy regisztráltál a <strong>CasaFlow</strong> rendszerbe.
              Kérlek, erősítsd meg a regisztrációdat az alábbi gombra kattintva:
            </p>

            <!-- GOMB -->
            <div style="text-align:center; margin:32px 0;">
              <a
                href="${verifyUrl}"
                style="
                  background-color:#5a9c8a;
                  color:#ffffff;
                  padding:14px 28px;
                  text-decoration:none;
                  border-radius:6px;
                  display:inline-block;
                  font-weight:bold;
                "
              >
                Regisztráció megerősítése
              </a>
            </div>

            <p style="font-size:14px; color:#666;">
              Ha nem te regisztráltál, nyugodtan hagyd figyelmen kívül ezt az emailt.
            </p>

            <hr style="border:none; border-top:1px solid #eee; margin:32px 0;">

            <!-- ALÁÍRÁS -->
            <p style="font-size:14px;">
              Üdvözlettel,<br>
              <strong>A CasaFlow csapata</strong>
            </p>

          </div>
        `,
      })

      console.log('Verification email sent to:', req.body.email)
    } catch (mailError) {
      console.error('Error sending verification email:', mailError)
    }

    res.status(201).json({
      succes: true, // meghagyva, hogy ne törjön semmi nálad
      data: result,
    })
  },

  // ---------------- BEJELENTKEZÉS ----------------
  async login(req, res) {
    try {
      if (!req.body.name || !req.body.password) {
        res.status(400)
        throw new Error('Error! Bad name or password!')
      }

      const user = await User.findOne({
        where: { name: req.body.name },
      })

      if (!user) {
        res.status(404)
        throw new Error('Error! User not found!')
      }

      const passwordIsValid = await bcrypt.compare(req.body.password, user.password)

      if (!passwordIsValid) {
        res.status(401)
        throw new Error('Error! Invalid password!')
      }

      await AuthController.tryLogin(req, res, user)
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error! The login is failed!',
          error: error.message,
        })
      } else {
        console.error(error)
      }
    }
  },

  async tryLogin(req, res, user) {
    const token = jwt.sign({ id: user.id }, process.env.APP_KEY, {
      expiresIn: 86400, // 24 óra
    })

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      accessToken: token,
    })
  },

  // ---------------- EMAIL MEGERŐSÍTÉS ----------------
  async verifyEmail(req, res) {
    try {
      const token = req.query.token

      if (!token) {
        res.status(400)
        throw new Error('Error! Missing token!')
      }

      const user = await User.findOne({
        where: { verificationToken: token },
      })

      if (!user) {
        res.status(404)
        throw new Error('Error! Invalid token!')
      }

      if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
        res.status(400)
        throw new Error('Error! Token expired!')
      }

      user.isVerified = true
      user.verificationToken = null
      user.verificationTokenExpires = null

      await user.save()

      res.status(200).json({
        success: true,
        message: 'Email successfully verified!',
      })
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error! Email verification failed!',
          error: error.message,
        })
      } else {
        console.error(error)
      }
    }
  },

  // ---------------- ELFELEJTETT JELSZÓ: TOKEN KÜLDÉSE ----------------
  // POST /api/forgot-password  { email }
  async forgotPassword(req, res) {
    try {
      const { email } = req.body

      if (!email) {
        res.status(400)
        throw new Error('Error! Email is required!')
      }

      const user = await User.findOne({ where: { email: email } })

      // Biztonsági okból: akkor is "siker"-t mondunk, ha nincs ilyen user
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If this email exists, a reset link has been sent.',
        })
      }

      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 óra

      user.passwordResetToken = resetToken
      user.passwordResetExpires = resetExpires

      await user.save()

      const frontendBaseUrl = process.env.APP_FRONTEND_URL || 'http://localhost:4200'
      const resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}`

      try {
        await EmailService.send({
          to: email,
          subject: 'Password reset',
          text:
            `Hello!\n\n` +
            `Kérlek, állítsd vissza a jelszavad az alábbi linken:\n\n${resetUrl}\n\n` +
            `Ha nem te kérted, hagyd figyelmen kívül.`,
          html: `
            <div style="
              max-width:600px;
              margin:0 auto;
              font-family:Arial, Helvetica, sans-serif;
              color:#333;
              line-height:1.6;
            ">

              <p>Szia!</p>

              <p>
                Úgy tűnik, jelszó-visszaállítást kértél a
                <strong>CasaFlow</strong> fiókodhoz.
              </p>

              <p>
                Kérlek, kattints az alábbi gombra az új jelszó beállításához:
              </p>

              <!-- GOMB -->
              <div style="text-align:center; margin:32px 0;">
                <a
                  href="${resetUrl}"
                  style="
                    background-color:#5a9c8a;
                    color:#ffffff;
                    padding:14px 28px;
                    text-decoration:none;
                    border-radius:6px;
                    display:inline-block;
                    font-weight:bold;
                  "
                >
                  Jelszó visszaállítása
                </a>
              </div>

              <p style="font-size:14px; color:#666;">
                Ha nem te kérted a jelszóváltoztatást, egyszerűen hagyd figyelmen kívül
                ezt az emailt.
              </p>

              <hr style="border:none; border-top:1px solid #eee; margin:32px 0;">

              <p style="font-size:14px;">
                Üdvözlettel,<br>
                <strong>A CasaFlow csapata</strong>
              </p>

            </div>
          `,
        })
        console.log('Password reset email sent to:', email)
      } catch (mailError) {
        console.error('Error sending password reset email:', mailError)
      }

      res.status(200).json({
        success: true,
        message: 'If this email exists, a reset link has been sent.',
      })
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error! Password reset request failed!',
          error: error.message,
        })
      } else {
        console.error(error)
      }
    }
  },

  // ---------------- ÚJ JELSZÓ BEÁLLÍTÁSA ----------------
  // POST /api/reset-password  { token, password, password_confirmation }
  async resetPassword(req, res) {
    try {
      const { token, password, password_confirmation } = req.body

      if (!token || !password || !password_confirmation) {
        res.status(400)
        throw new Error('Error! Bad request data!')
      }

      if (password !== password_confirmation) {
        res.status(400)
        throw new Error('Error! The two password is not same!')
      }

      const user = await User.findOne({
        where: { passwordResetToken: token },
      })

      if (!user) {
        res.status(404)
        throw new Error('Error! Invalid token!')
      }

      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        res.status(400)
        throw new Error('Error! Token expired!')
      }

      user.password = bcrypt.hashSync(password)
      user.passwordResetToken = null
      user.passwordResetExpires = null

      await user.save()

      res.status(200).json({
        success: true,
        message: 'Password successfully reset!',
      })
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error! Password reset failed!',
          error: error.message,
        })
      } else {
        console.error(error)
      }
    }
  },
}

export default AuthController
