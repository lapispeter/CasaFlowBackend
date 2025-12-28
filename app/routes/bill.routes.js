import express from 'express';
import verifyToken from '../middleware/authjwt.js';
import BillController from '../controllers/billController.js';

const router = express.Router();

// ✅ MINDEN bill végpont védett: token kell, és req.userId beáll
router.get('/', verifyToken, BillController.index);
router.get('/:id', verifyToken, BillController.show);
router.post('/', verifyToken, BillController.store);
router.put('/:id', verifyToken, BillController.update);
router.delete('/:id', verifyToken, BillController.destroy);

export default router;
