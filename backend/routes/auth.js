import express from 'express';
import { checkJwt } from '../middlewares/auth.js';
import { loginUser, getUserProfile, verifyToken } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login — called by frontend after Auth0 login to sync user to DB
router.post('/login', checkJwt, loginUser);

// GET /api/auth/profile — get current user's profile (protected)
router.get('/profile', checkJwt, getUserProfile);

// GET /api/auth/me — lightweight token verification (protected)
router.get('/me', checkJwt, verifyToken);

export default router;
