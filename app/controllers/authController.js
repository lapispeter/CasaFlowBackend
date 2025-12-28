import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import dotenv from '@dotenvx/dotenvx'
import crypto from 'crypto'

import EmailService from '../services/emailService.js'

dotenv.config({ quiet: true })

const AuthController = {
  // ---------------- REGISZTRÁCIÓ ----------------
  async register(req, res) {
    let clientError = false

    try {
      if (
        !req.body.name ||
        !req.body.email ||
        !req.body.password ||
        !req.body.password_confirmation
      ) {
        clientError = true
        throw new Error('Error! Bad request data!')
      }

      if (req.body.password !== req.body.password_confirmation) {
        clientError = true
        throw new Error('Error! The two password is not same!')
      }

      const existingUserByName = await User.findOne({
        where: { name: req.body.name },
      })
      if (existingUserByName) {
        clientError = true
        throw new Error('Error! This username is already exists!')
      }

      const existingUserByEmail = await User.findOne({
        where: { email: req.body.email },
      })
      if (existingUserByEmail) {
        clientError = true
        throw new Error('Error! This email is already exists!')
      }

      await AuthController.tryRegister(req, res)
    } catch (error) {
      if (!res.headersSent) {
        res.status(clientError ? 400 : 500).json({
          success: false,
          message: clientError ? error.message : 'Error! The register is failed!',
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
        subject: 'Email verification',
        text:
          `Hello ${req.body.name}!\n\n` +
          `Kérlek, erősítsd meg a regisztrációdat az alábbi linken:\n\n${verifyUrl}\n\n` +
          `Ha nem te regisztráltál, nyugodtan hagyd figyelmen kívül ezt az üzenetet.`,
        html: `
          <p>Szia <b>${req.body.name}</b>!</p>
          <p>Kérlek, erősítsd meg a regisztrációdat az alábbi linkre kattintva:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>Ha nem te regisztráltál, egyszerűen hagyd figyelmen kívül ezt az emailt.</p>
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
            <p>Szia!</p>
            <p>Kérlek, állítsd vissza a jelszavad az alábbi linkre kattintva:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>Ha nem te kérted a jelszóváltoztatást, hagyd figyelmen kívül ezt az emailt.</p>
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
