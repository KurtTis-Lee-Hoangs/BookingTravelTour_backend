import express from 'express';
import {handleChatRequest } from '../utils/chatBot.js';
const router = express.Router();


router.post('/chatbot', handleChatRequest)

export default router;