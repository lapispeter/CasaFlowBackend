import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import dotenv from '@dotenvx/dotenvx'
import crypto from 'crypto'

import EmailService from '../services/emailService.js'

dotenv.config({ quiet: true })

function isValidEmail(email) {
  if (!email) return false
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

      if (!name) errors.name = ['Name is required!']
      if (!email) errors.email = ['Email is required!']
      if (!password) errors.password = ['Password is required!']
      if (!password_confirmation)
        errors.password_confirmation = ['Password confirmation is required!']

      if (email && !isValidEmail(email)) {
        errors.email = errors.email || []
        errors.email.push('Invalid email format!')
      }

      if (password && password_confirmation && password !== password_confirmation) {
        errors.password_confirmation = errors.password_confirmation || []
        errors.password_confirmation.push('The two password is not same!')
      }

      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ success: false, errors })
      }

      const existingUserByName = await User.findOne({ where: { name } })
      if (existingUserByName) {
        errors.name = errors.name || []
        errors.name.push('This username is already exists!')
      }

      const existingUserByEmail = await User.findOne({ where: { email } })
      if (existingUserByEmail) {
        errors.email = errors.email || []
        errors.email.push('This email is already exists!')
      }

      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ success: false, errors })
      }

      req.body.name = name
      req.body.email = email

      await AuthController.tryRegister(req, res)
    } catch (error) {
      console.error(error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error! The register is failed!',
          error: error.message,
        })
      }
    }
  },

  async tryRegister(req, res) {
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const user = {
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password),

      roleId: 0,                 // ✅ alap: normál user
      isVerified: false,
      verificationToken,
      verificationTokenExpires,

      lastActivityAt: null        // ✅ még nem aktív (majd login/CRUD frissíti)
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
          <div style="max-width:600px;margin:0 auto;font-family:Arial, Helvetica, sans-serif;color:#333;line-height:1.6;">
            <p>Szia <strong>${req.body.name}</strong>!</p>
            <p>
              Köszönjük, hogy regisztráltál a <strong>CasaFlow</strong> rendszerbe.
              Kérlek, erősítsd meg a regisztrációdat az alábbi gombra kattintva:
            </p>

            <div style="text-align:center; margin:32px 0;">
              <a href="${verifyUrl}" style="background-color:#5a9c8a;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                Regisztráció megerősítése
              </a>
            </div>

            <p style="font-size:14px; color:#666;">
              Ha nem te regisztráltál, nyugodtan hagyd figyelmen kívül ezt az emailt.
            </p>

            <hr style="border:none; border-top:1px solid #eee; margin:32px 0;">

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
      succes: true, // meghagyva
      data: result,
      message: 'Registration successful. Please verify your email before login.',
    })
  },

  // ---------------- BEJELENTKEZÉS ----------------
  async login(req, res) {
    try {
      if (!req.body.name || !req.body.password) {
        return res.status(400).json({
          success: false,
          message: 'Bad request: name and password are required.',
        })
      }

      const user = await User.findOne({ where: { name: req.body.name } })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found!',
        })
      }

      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Email not verified. Please verify your email before login.',
        })
      }

      const passwordIsValid = await bcrypt.compare(req.body.password, user.password)

      if (!passwordIsValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password!',
        })
      }

      // ✅ aktivitás frissítés (admin statisztika)
      user.lastActivityAt = new Date()
      await user.save()

      await AuthController.tryLogin(req, res, user)
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: 'Error! The login is failed!',
        error: error.message,
      })
    }
  },

  async tryLogin(req, res, user) {
    const token = jwt.sign({ id: user.id }, process.env.APP_KEY, {
      expiresIn: 86400,
    })

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,          // ✅ FRONTEND admin redirecthez kell
      accessToken: token,
    })
  },

  // ---------------- EMAIL MEGERŐSÍTÉS ----------------
  async verifyEmail(req, res) {
    try {
      const token = req.query.token

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Missing token!',
        })
      }

      const user = await User.findOne({ where: { verificationToken: token } })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Invalid token!',
        })
      }

      if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Token expired!',
        })
      }

      user.isVerified = true
      user.verificationToken = null
      user.verificationTokenExpires = null

      await user.save()

      return res.status(200).json({
        success: true,
        message: 'Email successfully verified!',
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: 'Error! Email verification failed!',
        error: error.message,
      })
    }
  },

  // ---------------- ELFELELEJTETT JELSZÓ: TOKEN KÜLDÉSE ----------------
  async forgotPassword(req, res) {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required!',
        })
      }

      const user = await User.findOne({ where: { email } })

      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If this email exists, a reset link has been sent.',
        })
      }

      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000)

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
            <div style="max-width:600px;margin:0 auto;font-family:Arial, Helvetica, sans-serif;color:#333;line-height:1.6;">
              <p>Szia!</p>
              <p>
                Úgy tűnik, jelszó-visszaállítást kértél a <strong>CasaFlow</strong> fiókodhoz.
              </p>
              <p>Kérlek, kattints az alábbi gombra az új jelszó beállításához:</p>

              <div style="text-align:center; margin:32px 0;">
                <a href="${resetUrl}" style="background-color:#5a9c8a;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                  Jelszó visszaállítása
                </a>
              </div>

              <p style="font-size:14px; color:#666;">
                Ha nem te kérted a jelszóváltoztatást, egyszerűen hagyd figyelmen kívül ezt az emailt.
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

      return res.status(200).json({
        success: true,
        message: 'If this email exists, a reset link has been sent.',
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: 'Error! Password reset request failed!',
        error: error.message,
      })
    }
  },

  // ---------------- ÚJ JELSZÓ BEÁLLÍTÁSA ----------------
  async resetPassword(req, res) {
    try {
      const { token, password, password_confirmation } = req.body

      if (!token || !password || !password_confirmation) {
        return res.status(400).json({
          success: false,
          message: 'Bad request data!',
        })
      }

      if (password !== password_confirmation) {
        return res.status(400).json({
          success: false,
          message: 'The two password is not same!',
        })
      }

      const user = await User.findOne({ where: { passwordResetToken: token } })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Invalid token!',
        })
      }

      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Token expired!',
        })
      }

      user.password = bcrypt.hashSync(password)
      user.passwordResetToken = null
      user.passwordResetExpires = null

      await user.save()

      return res.status(200).json({
        success: true,
        message: 'Password successfully reset!',
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: 'Error! Password reset failed!',
        error: error.message,
      })
    }
  },
}

export default AuthController
