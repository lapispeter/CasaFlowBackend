import MeterReading from '../models/meterReading.js';
import { Op } from 'sequelize';

const MeterReadingController = {
  async index(req, res) {
    try {
      const meterTypeMode = req.query.meterTypeMode ?? 'all'; // all | custom
      const meterTypeTextRaw = req.query.meterTypeText ?? '';
      const periodRaw = req.query.periodMonths ?? '1';        // '1'|'3'|'6'|'12'|'all'

      const meterTypeText = String(meterTypeTextRaw).trim();
      const period = String(periodRaw).trim();

      const where = { userId: req.userId };

      if (meterTypeMode === 'custom' && meterTypeText.length > 0) {
        where.meterType = meterTypeText;
      }

      if (period !== 'all') {
        const n = Number(period);
        const allowed = [1, 3, 6, 12];
        const months = allowed.includes(n) ? n : 1;

        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);

        where.date = { [Op.gte]: fromDate };
      }

      const readings = await MeterReading.findAll({
        where,
        order: [['date', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: readings
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
      const reading = await MeterReading.findOne({
        where: { id: req.params.id, userId: req.userId }
      });

      if (!reading) {
        return res.status(404).json({ success: false, message: 'Fail! Record not found!' });
      }

      return res.status(200).json({ success: true, data: reading });
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
      const reading = await MeterReading.create(payload);

      return res.status(201).json({ success: true, data: reading });
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

      const [affectedRows] = await MeterReading.update(req.body, {
        where: { id: req.params.id, userId: req.userId }
      });

      if (affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Fail! Record not found!' });
      }

      const reading = await MeterReading.findOne({
        where: { id: req.params.id, userId: req.userId }
      });

      return res.status(200).json({ success: true, data: reading });
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
      const deletedRows = await MeterReading.destroy({
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

export default MeterReadingController;
