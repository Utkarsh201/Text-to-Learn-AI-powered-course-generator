import prisma from '../utils/prisma.js';

// Dynamically import emailQueue — it requires Redis, so we make it optional
let emailQueue = null;
try {
  const module = await import('../services/emailQueue.js');
  emailQueue = module.default;
} catch (err) {
  console.warn('Email queue not available (Redis not running). Welcome emails will be skipped.');
}

// Logic for POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Fetch user info from Auth0's /userinfo endpoint
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
    const userinfoResponse = await fetch(`${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!userinfoResponse.ok) {
      const errorBody = await userinfoResponse.text();
      console.error('Auth0 /userinfo failed:', userinfoResponse.status, errorBody);
      return res.status(401).json({ error: 'Failed to verify user with Auth0' });
    }

    const userInfo = await userinfoResponse.json();

    // Upsert user — create if new, update if existing
    const user = await prisma.user.upsert({
      where: { auth0Id: userInfo.sub },
      update: {
        email: userInfo.email,
        name: userInfo.name || userInfo.nickname || 'User',
        picture: userInfo.picture
      },
      create: {
        auth0Id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name || userInfo.nickname || 'User',
        picture: userInfo.picture
      }
    });

    // Check if this was a newly created user (createdAt === updatedAt within 1 second)
    const isNewUser = Math.abs(user.createdAt.getTime() - user.updatedAt.getTime()) < 1000;

    // Send welcome email only for brand new users (if email queue is available)
    if (isNewUser && emailQueue) {
      try {
        await emailQueue.add({
          email: user.email,
          name: user.name
        });
      } catch (emailErr) {
        console.warn('Failed to queue welcome email:', emailErr.message);
      }
    }

    res.json({
      message: isNewUser ? 'New user created and synced' : 'Existing user synced',
      user: {
        id: user.id,
        auth0Id: user.auth0Id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Logic for GET /api/auth/profile
export const getUserProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Fetch user info from Auth0
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
    const userinfoResponse = await fetch(`${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!userinfoResponse.ok) {
      return res.status(401).json({ error: 'Failed to verify user with Auth0' });
    }

    const userInfo = await userinfoResponse.json();

    // Find user in our database
    const user = await prisma.user.findUnique({
      where: { auth0Id: userInfo.sub }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please login first.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error in /api/auth/profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Logic for GET /api/auth/me
export const verifyToken = (req, res) => {
  // req.auth is populated by express-oauth2-jwt-bearer after JWT verification
  res.json({
    message: 'Token is valid',
    auth: req.auth?.payload
  });
};
