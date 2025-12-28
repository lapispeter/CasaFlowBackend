import Router from 'express'
const router = Router()

import AuthController from '../controllers/authController.js'
import UserController from '../controllers/userController.js'
import verifyToken from '../middleware/authjwt.js'
import BillController from '../controllers/billController.js'
import MeterReadingController from '../controllers/meterReadingController.js'
import ReminderController from '../controllers/reminderController.js'
import ShoppingListController from '../controllers/shoppingListController.js'


// Auth
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.get('/verify-email', AuthController.verifyEmail)

// Elfelejtett jelszó
router.post('/forgot-password', AuthController.forgotPassword)
router.post('/reset-password', AuthController.resetPassword)

// User műveletek (védett)
router.get('/users', [verifyToken], UserController.index)
router.get('/users/:id', [verifyToken], UserController.show)
router.put('/users/:id', [verifyToken], UserController.updateProfile)
router.put('/users/:id/password', [verifyToken], UserController.updatePassword)

// Bills (védett)
router.get('/bills', [verifyToken], BillController.index)
router.get('/bills/:id', [verifyToken], BillController.show)
router.post('/bills', [verifyToken], BillController.store)
router.put('/bills/:id', [verifyToken], BillController.update)
router.delete('/bills/:id', [verifyToken], BillController.destroy)

// Meter readings (védett)
router.get('/meter-readings', [verifyToken], MeterReadingController.index)
router.get('/meter-readings/:id', [verifyToken], MeterReadingController.show)
router.post('/meter-readings', [verifyToken], MeterReadingController.store)
router.put('/meter-readings/:id', [verifyToken], MeterReadingController.update)
router.delete('/meter-readings/:id', [verifyToken], MeterReadingController.destroy)

// Reminders (védett)
router.get('/reminders', [verifyToken], ReminderController.index)
router.get('/reminders/:id', [verifyToken], ReminderController.show)
router.post('/reminders', [verifyToken], ReminderController.store)
router.put('/reminders/:id', [verifyToken], ReminderController.update)
router.delete('/reminders/:id', [verifyToken], ReminderController.destroy)

// Shopping lists (védett)
router.get('/shopping-lists', [verifyToken], ShoppingListController.index)
router.get('/shopping-lists/:id', [verifyToken], ShoppingListController.show)
router.post('/shopping-lists', [verifyToken], ShoppingListController.store)
router.put('/shopping-lists/:id', [verifyToken], ShoppingListController.update)
router.delete('/shopping-lists/:id', [verifyToken], ShoppingListController.destroy)



export default router
