import express from 'express';
import { checkJwt } from '../middlewares/auth.js';
import { loginUser, getUserProfile, verifyToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', checkJwt, loginUser);
router.get('/profile', checkJwt, getUserProfile);
// this is just for checking the token
router.get('/me', checkJwt, verifyToken);

export default router;
