import Reminder from '../models/reminder.js'
import { Op } from 'sequelize'

const ReminderController = {
  // ✅ LISTA + SZŰRÉS (ugyanaz mint MeterReading)
  async index(req, res) {
    try {
      const titleMode = req.query.titleMode ?? 'all'   // all | custom
      const titleTextRaw = req.query.titleText ?? ''
      const periodRaw = req.query.periodMonths ?? '1'  // 1|3|6|12|all

      const titleText = String(titleTextRaw).trim()
      const period = String(periodRaw).trim()

      const where = { userId: req.userId }

      // cím szűrés
      if (titleMode === 'custom' && titleText.length > 0) {
        where.title = titleText
      }

      // időtartam szűrés
      if (period !== 'all') {
        const n = Number(period)
        const allowed = [1, 3, 6, 12]
        const months = allowed.includes(n) ? n : 1

        const fromDate = new Date()
        fromDate.setMonth(fromDate.getMonth() - months)

        where.date = { [Op.gte]: fromDate }
      }

      const reminders = await Reminder.findAll({
        where,
        order: [['date', 'ASC']]
      })

      return res.status(200).json({
        success: true,
        data: reminders
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message
      })
    }
  },

  async show(req, res) {
    try {
      const reminder = await Reminder.findOne({
        where: { id: req.params.id, userId: req.userId }
      })

      if (!reminder) {
        return res.status(404).json({
          success: false,
          message: 'Fail! Record not found!'
        })
      }

      return res.status(200).json({
        success: true,
        data: reminder
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message
      })
    }
  },

  async store(req, res) {
    try {
      if (req.body.id) delete req.body.id
      if (req.body.userId) delete req.body.userId

      const payload = {
        ...req.body,
        userId: req.userId
      }

      const reminder = await Reminder.create(payload)

      return res.status(201).json({
        success: true,
        data: reminder
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message
      })
    }
  },

  async update(req, res) {
    try {
      if (req.body.id) delete req.body.id
      if (req.body.userId) delete req.body.userId

      const [affectedRows] = await Reminder.update(req.body, {
        where: { id: req.params.id, userId: req.userId }
      })

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fail! Record not found!'
        })
      }

      const reminder = await Reminder.findOne({
        where: { id: req.params.id, userId: req.userId }
      })

      return res.status(200).json({
        success: true,
        data: reminder
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Fail! The query is failed!',
        error: error.message
      })
    }
  },

  async destroy(req, res) {
    try {
      const deletedRows = await Reminder.destroy({
        where: { id: req.params.id, userId: req.userId }
      })

      if (deletedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fail! Record not found!'
        })
      }

      return res.status(200).json({
        success: true,
        data: deletedRows
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message
      })
    }
  }
}

export default ReminderController
