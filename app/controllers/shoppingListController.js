import ShoppingList from '../models/shoppingList.js'
import { Op } from 'sequelize'

const ShoppingListController = {
  // ✅ LISTA + SZŰRÉS
  // query:
  // - titleMode=all|custom
  // - titleText=...
  // - periodMonths=1|3|6|12|all  (purchaseDate alapján szűr)
  // - boughtMode=all|true|false
  // - expiryMode=all|onlyWithExpiry|expired|expiringSoon (opcionális)
  async index(req, res) {
    try {
      const titleMode = req.query.titleMode ?? 'all'
      const titleTextRaw = req.query.titleText ?? ''
      const periodRaw = req.query.periodMonths ?? '1'  // '1'|'3'|'6'|'12'|'all'
      const boughtMode = req.query.boughtMode ?? 'all' // 'all'|'true'|'false'
      const expiryMode = req.query.expiryMode ?? 'all' // opcionális

      const titleText = String(titleTextRaw).trim()
      const period = String(periodRaw).trim()

      const where = { userId: req.userId }

      // ✅ title szűrés (pontos egyezés, mint a többi modulban)
      if (titleMode === 'custom' && titleText.length > 0) {
        where.title = titleText
      }

      // ✅ bought szűrés
      if (boughtMode === 'true') where.isBought = true
      if (boughtMode === 'false') where.isBought = false

      // ✅ időtartam szűrés: purchaseDate szerint (ha nincs purchaseDate, nem fog beleesni)
      // ha "all", akkor nincs dátumszűrés
      if (period !== 'all') {
        const n = Number(period)
        const allowed = [1, 3, 6, 12]
        const months = allowed.includes(n) ? n : 1

        const fromDate = new Date()
        fromDate.setMonth(fromDate.getMonth() - months)

        // purchaseDate legyen >= fromDate
        where.purchaseDate = { [Op.gte]: fromDate }
      }

      // ✅ lejárat szűrés (extra, egyszerű)
      // all: semmi
      // onlyWithExpiry: csak ahol van expiryDate
      // expired: expiryDate < today
      // expiringSoon: expiryDate 7 napon belül
      if (expiryMode && expiryMode !== 'all') {
        const now = new Date()

        if (expiryMode === 'onlyWithExpiry') {
          where.expiryDate = { [Op.not]: null }
        }

        if (expiryMode === 'expired') {
          where.expiryDate = { [Op.lt]: now }
        }

        if (expiryMode === 'expiringSoon') {
          const soon = new Date()
          soon.setDate(soon.getDate() + 7)
          where.expiryDate = { [Op.between]: [now, soon] }
        }
      }

      const items = await ShoppingList.findAll({
        where,
        order: [['createdAt', 'DESC']],
      })

      return res.status(200).json({
        success: true,
        data: items,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message,
      })
    }
  },

  // ✅ EGY ITEM: csak saját
  async show(req, res) {
    try {
      const item = await ShoppingList.findOne({
        where: { id: req.params.id, userId: req.userId },
      })

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Fail! Record not found!',
        })
      }

      return res.status(200).json({
        success: true,
        data: item,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message,
      })
    }
  },

  // ✅ LÉTREHOZÁS: userId automatikus
  async store(req, res) {
    try {
      if (req.body.id) delete req.body.id
      if (req.body.userId) delete req.body.userId

      const payload = {
        ...req.body,
        userId: req.userId,
      }

      const item = await ShoppingList.create(payload)

      return res.status(201).json({
        success: true,
        data: item,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message,
      })
    }
  },

  // ✅ MÓDOSÍTÁS: csak saját
  async update(req, res) {
    try {
      if (req.body.id) delete req.body.id
      if (req.body.userId) delete req.body.userId

      const [affectedRows] = await ShoppingList.update(req.body, {
        where: { id: req.params.id, userId: req.userId },
      })

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fail! Record not found!',
        })
      }

      const item = await ShoppingList.findOne({
        where: { id: req.params.id, userId: req.userId },
      })

      return res.status(200).json({
        success: true,
        data: item,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Fail! The query is failed!',
        error: error.message,
      })
    }
  },

  // ✅ TÖRLÉS: csak saját
  async destroy(req, res) {
    try {
      const deletedRows = await ShoppingList.destroy({
        where: { id: req.params.id, userId: req.userId },
      })

      if (deletedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fail! Record not found!',
        })
      }

      return res.status(200).json({
        success: true,
        data: deletedRows,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message,
      })
    }
  },
}

export default ShoppingListController
