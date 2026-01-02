import express from 'express';
const router = express.Router();
import { uploadMessage, getAllMessages } from '../controllers/messageController.js';

router.post('/new', uploadMessage);
router.get('/all', getAllMessages);

export default router;