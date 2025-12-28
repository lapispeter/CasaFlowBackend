import bcrypt from 'bcryptjs'
import User from '../models/user.js'


const UserController = {
    async index(req, res) {
        try {
            await UserController.tryIndex(req, res)
        } catch (error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!'
            })
        }
    },

    async tryIndex(req, res) {
        const users = await User.findAll()
        res.status(200)
        res.json({
            success: true,
            data: users
        })
    },

    async show(req, res) {
        try {
            await UserController.tryShow(req, res)
        } catch (error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!'
            })
        }
    },

    async tryShow(req, res) {
        const user = await User.findByPk(req.params.id)
        res.status(200)
        res.json({
            success: true,
            data: user
        })
    },

    // 🌸 ÚJ: profil adatok (név + email) frissítése
    async updateProfile(req, res) {
        let clientError = false
        try {
            if (!req.body.name || !req.body.email) {
                clientError = true
                throw new Error('Error! Bad request data!')
            }

            const user = await User.findByPk(req.params.id)

            if (!user) {
                clientError = true
                res.status(404)
                throw new Error('Error! User not found!')
            }

            // opcionális: email egyediség ellenőrzés
            const existing = await User.findOne({
                where: { email: req.body.email }
            })

            if (existing && existing.id !== user.id) {
                clientError = true
                res.status(400)
                throw new Error('Error! Email already in use!')
            }

            user.name = req.body.name
            user.email = req.body.email

            await user.save()

            res.status(200)
            res.json({
                success: true,
                data: user
            })
        } catch (error) {
            if (!res.headersSent) {
                if (clientError) {
                    res.status(400)
                } else {
                    res.status(500)
                }
                res.json({
                    success: false,
                    message: 'Error! The profile update is failed!',
                    error: error.message
                })
            } else {
                console.error(error)
            }
        }
    },

    // régi: create (ha kell)
    async create(req, res) {
        let clientError = false
        try {
            if (!req.body.name ||
                !req.body.email ||
                !req.body.password ||
                !req.body.password_confirmation) {
                clientError = true
                throw new Error('Error! Bad request data!')
            }
            if (req.body.password != req.body.password_confirmation) {
                clientError = true
                throw new Error('Error! The two password is not same!')
            }
            const user = await User.findOne({
                where: { name: req.body.name }
            })
            if (user) {
                clientError = true
                throw new Error('Error! User already exists: ' + user.name)
            }
            await UserController.tryCreate(req, res)
        } catch (error) {
            if (clientError) {
                res.status(400)
            } else {
                res.status(500)
            }
            res.json({
                success: false,
                message: 'Error! The query is failed!',
                error: error.message
            })
        }
    },

    async tryCreate(req, res) {
        const newUser = {
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password)
        }
        const userData = await User.create(newUser)
        res.status(201)
        res.json({
            success: true,
            data: userData
        })
    },

    // 🌸 Jelszó módosítás régi jelszó ellenőrzéssel
    async updatePassword(req, res) {
        let clientError = false
        try {
            if (!req.body.old_password ||
                !req.body.password ||
                !req.body.password_confirmation) {
                clientError = true
                throw new Error('Error! Bad request data!')
            }

            if (req.body.password != req.body.password_confirmation) {
                clientError = true
                throw new Error('Error! The two password is not same!')
            }

            await UserController.tryUpdatePassword(req, res)
        } catch (error) {
            if (clientError) {
                res.status(400)
            } else {
                res.status(500)
            }
            if (!res.headersSent) {
                res.json({
                    success: false,
                    message: 'Error! The query is failed!',
                    error: error.message
                })
            } else {
                console.error(error)
            }
        }
    },

    async tryUpdatePassword(req, res) {
        const user = await User.findByPk(req.params.id)

        if (!user) {
            res.status(404)
            res.json({
                success: false,
                message: 'Error! User not found!'
            })
            return
        }

        // 🌸 régi jelszó ellenőrzése
        const isOldPasswordValid = await bcrypt.compare(
            req.body.old_password,
            user.password
        )

        if (!isOldPasswordValid) {
            res.status(401)
            res.json({
                success: false,
                message: 'Error! Old password is not valid!'
            })
            return
        }

        user.password = bcrypt.hashSync(req.body.password)
        await user.save()

        res.status(200)
        res.json({
            success: true,
            data: user
        })
    }

    
}

export default UserController
