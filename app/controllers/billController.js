import Bill from '../models/bill.js';
import { Op } from 'sequelize';

const BillController = {
  async index(req, res) {
    try {
      const billTypeMode = req.query.billTypeMode ?? 'all'; // all | custom
      const billTypeTextRaw = req.query.billTypeText ?? '';
      const paymentMode = req.query.paymentMode ?? 'all';   // all | Igen | Nem
      const periodRaw = req.query.periodMonths ?? '1';      // '1'|'3'|'6'|'12'|'all'

      const billTypeText = String(billTypeTextRaw).trim();
      const period = String(periodRaw).trim();

      const where = { userId: req.userId };

      // paymentStatus szűrés
      if (paymentMode !== 'all') {
        where.paymentStatus = paymentMode;
      }

      // billType szűrés (custom + szöveg esetén pontos egyezés)
      if (billTypeMode === 'custom' && billTypeText.length > 0) {
        where.billType = billTypeText;
      }

      // ✅ Időtartam: 1/3/6/12 hónap vagy "all" (összes)
      if (period !== 'all') {
        const n = Number(period);
        const allowed = [1, 3, 6, 12];
        const months = allowed.includes(n) ? n : 1;

        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);

        where.date = { [Op.gte]: fromDate };
      }

      const bills = await Bill.findAll({
        where,
        order: [['date', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: bills
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message
      });
    }
  },

  async show(req, res) {
    try {
      const bill = await Bill.findOne({
        where: { id: req.params.id, userId: req.userId }
      });

      if (!bill) {
        return res.status(404).json({ success: false, message: 'Fail! Record not found!' });
      }

      return res.status(200).json({ success: true, data: bill });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message
      });
    }
  },

  async store(req, res) {
    try {
      if (req.body.id) delete req.body.id;
      if (req.body.userId) delete req.body.userId;

      const payload = { ...req.body, userId: req.userId };
      const bill = await Bill.create(payload);

      return res.status(201).json({ success: true, data: bill });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message
      });
    }
  },

  async update(req, res) {
    try {
      if (req.body.id) delete req.body.id;
      if (req.body.userId) delete req.body.userId;

      const [affectedRows] = await Bill.update(req.body, {
        where: { id: req.params.id, userId: req.userId }
      });

      if (affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Fail! Record not found!' });
      }

      const bill = await Bill.findOne({
        where: { id: req.params.id, userId: req.userId }
      });

      return res.status(200).json({ success: true, data: bill });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Fail! The query is failed!',
        error: error.message
      });
    }
  },

  async destroy(req, res) {
    try {
      const deletedRows = await Bill.destroy({
        where: { id: req.params.id, userId: req.userId }
      });

      if (deletedRows === 0) {
        return res.status(404).json({ success: false, message: 'Fail! Record not found!' });
      }

      return res.status(200).json({ success: true, data: deletedRows });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error! The query is failed!',
        error: error.message
      });
    }
  }
};

export default BillController;
