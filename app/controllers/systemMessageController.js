import SystemMessage from '../models/systemMessage.js'

const SystemMessageController = {
  async show(req, res) {
    try {
      const row = await SystemMessage.findOne({ order: [['id', 'ASC']] })

      return res.status(200).json({
        success: true,
        data: { message: row?.message ?? '' }
      })
    } catch (err) {
      console.error('SystemMessageController.show error:', err)
      return res.status(500).json({
        success: false,
        message: 'System message load failed',
        error: err.message
      })
    }
  },

  async update(req, res) {
    try {
      const msg = String(req.body?.message ?? '').trim()

      // egyszerű validáció
      if (msg.length > 2000) {
        return res.status(422).json({
          success: false,
          message: 'Túl hosszú üzenet (max 2000 karakter).'
        })
      }

      // 1 soros táblát tartunk fenn
      let row = await SystemMessage.findOne({ order: [['id', 'ASC']] })

      if (!row) {
        row = await SystemMessage.create({ message: msg })
      } else {
        row.message = msg
        await row.save()
      }

      return res.status(200).json({
        success: true,
        data: { message: row.message }
      })
    } catch (err) {
      console.error('SystemMessageController.update error:', err)
      return res.status(500).json({
        success: false,
        message: 'System message update failed',
        error: err.message
      })
    }
  }
}

export default SystemMessageController
