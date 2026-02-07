import { Op } from 'sequelize'
import User from '../models/user.js'
import Bill from '../models/bill.js'
import MeterReading from '../models/meterReading.js'
import Reminder from '../models/reminder.js'
import ShoppingList from '../models/shoppingList.js'

const AdminController = {
  // ---------------- USER KERESÉS (név/email) ----------------
  // GET /api/admin/users?query=valami
  async users(req, res) {
    try {
      const query = String(req.query.query ?? '').trim()

      // ha üres, akkor is visszaadhatjuk az összeset limitálva
      const where = query
        ? {
            [Op.or]: [
              { name: { [Op.like]: `%${query}%` } },
              { email: { [Op.like]: `%${query}%` } }
            ]
          }
        : {}

      const users = await User.findAll({
        where,
        order: [['id', 'ASC']],
        attributes: ['id', 'name', 'email', 'roleId', 'isVerified', 'lastActivityAt', 'createdAt', 'updatedAt']
      })

      return res.status(200).json({
        success: true,
        data: users
      })
    } catch (error) {
      console.error('AdminController.users error:', error)
      return res.status(500).json({
        success: false,
        message: 'Admin users query failed!',
        error: error.message
      })
    }
  },

  // ---------------- USER TÖRLÉS + KASZKÁD INFO ----------------
  // DELETE /api/admin/users/:id
  async deleteUser(req, res) {
    try {
      const id = Number(req.params.id)
      if (!id) {
        return res.status(400).json({ success: false, message: 'Bad user id!' })
      }

      // Admin saját magát ne törölje véletlen
      if (req.userId && Number(req.userId) === id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own admin account.'
        })
      }

      const user = await User.findByPk(id)
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found!' })
      }

      // előbb számolunk, hogy tudjunk pipákat adni válaszban
      const billsCount = await Bill.count({ where: { userId: id } })
      const meterCount = await MeterReading.count({ where: { userId: id } })
      const remindersCount = await Reminder.count({ where: { userId: id } })
      const shoppingCount = await ShoppingList.count({ where: { userId: id } })

      // törlünk mindent (ha CASCADE jól be van állítva, akkor elég lehet a User.destroy is,
      // de így vizsgán is "egyértelmű" és biztos)
      await Bill.destroy({ where: { userId: id } })
      await MeterReading.destroy({ where: { userId: id } })
      await Reminder.destroy({ where: { userId: id } })
      await ShoppingList.destroy({ where: { userId: id } })

      await User.destroy({ where: { id } })

      return res.status(200).json({
        success: true,
        message: 'User and related data deleted.',
        checks: {
          userDeleted: true,
          billsDeleted: billsCount,
          meterReadingsDeleted: meterCount,
          remindersDeleted: remindersCount,
          shoppingListDeleted: shoppingCount
        }
      })
    } catch (error) {
      console.error('AdminController.deleteUser error:', error)
      return res.status(500).json({
        success: false,
        message: 'Admin delete user failed!',
        error: error.message
      })
    }
  },

  // ---------------- AKTÍV / PASSZÍV STAT ----------------
  // GET /api/admin/stats/users
  async userStats(req, res) {
    try {
      const now = new Date()
      const twoYearsAgo = new Date(now)
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

      // Aktív: lastActivityAt >= twoYearsAgo
      // Passzív: lastActivityAt < twoYearsAgo vagy NULL (sose volt aktív)
      const activeCount = await User.count({
        where: {
          lastActivityAt: {
            [Op.gte]: twoYearsAgo
          }
        }
      })

      const passiveCount = await User.count({
        where: {
          [Op.or]: [
            { lastActivityAt: { [Op.lt]: twoYearsAgo } },
            { lastActivityAt: null }
          ]
        }
      })

      return res.status(200).json({
        success: true,
        data: {
          activeCount,
          passiveCount,
          borderDate: twoYearsAgo
        }
      })
    } catch (error) {
      console.error('AdminController.userStats error:', error)
      return res.status(500).json({
        success: false,
        message: 'Admin stats failed!',
        error: error.message
      })
    }
  },

  // ---------------- PASSZÍV USER LISTA ----------------
  // GET /api/admin/users/passive
  async passiveUsers(req, res) {
    try {
      const now = new Date()
      const twoYearsAgo = new Date(now)
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

      const users = await User.findAll({
        where: {
          [Op.or]: [
            { lastActivityAt: { [Op.lt]: twoYearsAgo } },
            { lastActivityAt: null }
          ]
        },
        order: [['id', 'ASC']],
        attributes: ['id', 'name', 'email', 'roleId', 'isVerified', 'lastActivityAt', 'createdAt', 'updatedAt']
      })

      return res.status(200).json({
        success: true,
        data: users
      })
    } catch (error) {
      console.error('AdminController.passiveUsers error:', error)
      return res.status(500).json({
        success: false,
        message: 'Admin passive users query failed!',
        error: error.message
      })
    }
  }
}

export default AdminController
