import SystemMessage from '../models/systemMessage.js'

const SystemMessageController = {
  // GET /api/system-message  (login oldalon is kell, ezért csak verifyToken NEM kell)
  async show(req, res) {
    try {
      let row = await SystemMessage.findOne({ order: [['id', 'ASC']] })

      // ha még nincs rekord, létrehozunk egyet üresen
      if (!row) {
        row = await SystemMessage.create({ message: '' })
      }

      return res.status(200).json({
        success: true,
        data: { message: row.message, updatedAt: row.updatedAt }
      })
    } catch (error) {
      console.error('SystemMessageController.show error:', error)
      return res.status(500).json({
        success: false,
        message: 'System message query failed!',
        error: error.message
      })
    }
  },

  // PUT /api/admin/system-message (admin)
  async update(req, res) {
    try {
      const message = String(req.body?.message ?? '').trim()

      let row = await SystemMessage.findOne({ order: [['id', 'ASC']] })
      if (!row) {
        row = await SystemMessage.create({ message: '' })
      }

      row.message = message
      row.updatedByUserId = req.userId ?? null
      await row.save()

      return res.status(200).json({
        success: true,
        message: 'System message updated.',
        data: { message: row.message, updatedAt: row.updatedAt }
      })
    } catch (error) {
      console.error('SystemMessageController.update error:', error)
      return res.status(500).json({
        success: false,
        message: 'System message update failed!',
        error: error.message
      })
    }
  }
}

export default SystemMessageController
