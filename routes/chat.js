import express from 'express';
import { getTourByKeywords } from '../utils/chatBot.js';
const router = express.Router();


router.post('/chatbot', getTourByKeywords)

export default router;