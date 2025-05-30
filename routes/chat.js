import express from 'express';
import { getMessages, sendMessage }  from '../controllers/chatController.js';
import { verifyUser } from '../utils/verifyToken.js';
const router = express.Router();

// Route to get messages for a specific room
// GET /api/messages/:room
router.post('/send/:id1', verifyUser, sendMessage);
router.get('/:id1', verifyUser, getMessages);
// You could add more HTTP routes here if needed, e.g., for posting messages via HTTP (though we use sockets for that)

export default router;