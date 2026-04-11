import prisma from '../utils/prisma.js';

// Dynamically import emailQueue — it requires Redis, so we make it optional
let emailQueue = null;
try {
  const module = await import('../services/emailQueue.js');
  emailQueue = module.default;
} catch (err) {
  console.warn('Email queue not available (Redis not running). Welcome emails will be skipped.');
}

const getBearerToken = (req) => {
  const [scheme, token] = req.headers.authorization?.split(' ') || [];
  return scheme === 'Bearer' ? token : null;
};

const fetchAuth0UserInfo = async (token) => {
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
  let userinfoResponse;
  try {
    userinfoResponse = await fetch(`${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (fetchError) {
    console.error('Network error reaching Auth0:', fetchError.message);
    throw new Error('Could not reach Auth0 servers to verify user');
  }

  if (!userinfoResponse.ok) {
    const errorBody = await userinfoResponse.text();
    console.error('Auth0 /userinfo failed:', userinfoResponse.status, errorBody);
    throw new Error('Failed to verify user with Auth0');
  }

  return userinfoResponse.json();
};

// Logic for POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    let userInfo;
    try {
      userInfo = await fetchAuth0UserInfo(token);
    } catch (authError) {
      return res.status(401).json({ error: authError.message });
    }
    // Check if user exists to definitively know if they are new
    let user = await prisma.user.findUnique({
      where: { auth0Id: userInfo.sub }
    });

    let isNewUser = false;

    if (!user) {
      // User doesn't exist, create them
      user = await prisma.user.create({
        data: {
          auth0Id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name || userInfo.nickname || 'User',
          picture: userInfo.picture
        }
      });
      isNewUser = true;
    } else {
      // User exists, update them
      user = await prisma.user.update({
        where: { auth0Id: userInfo.sub },
        data: {
          email: userInfo.email,
          name: userInfo.name || userInfo.nickname || 'User',
          picture: userInfo.picture
        }
      });
    }

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
    let userinfoResponse;
    try {
      userinfoResponse = await fetch(`${auth0Domain}/userinfo`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (fetchError) {
      console.error('Network error reaching Auth0:', fetchError.message);
      return res.status(502).json({ error: 'Could not reach Auth0 servers to verify user' });
    }

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
