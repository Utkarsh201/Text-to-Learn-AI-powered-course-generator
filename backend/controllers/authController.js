import prisma from '../prisma/client.js';
import { sendWelcomeEmail } from '../services/emailService.js';

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
        Authorization: `Bearer ${token}`,
      },
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

    // Auth0 may omit email if the 'email' scope/claim is not configured.
    // email is required & unique in our DB, so guard against undefined.
    if (!userInfo.email || typeof userInfo.email !== 'string') {
      return res.status(400).json({
        error: "Auth0 did not return an email address. Ensure the 'email' scope is requested in your Auth0 configuration.",
      });
    }

    if (!userInfo.email) {
      return res.status(400).json({
        error: "Auth0 did not return an email. Ensure the 'email' scope is requested.",
      });
    }

    let user = await prisma.user.findUnique({
      where: { auth0Id: userInfo.sub },
    });

    let isNewUser = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          auth0Id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name || userInfo.nickname || 'User',
          picture: userInfo.picture,
        },
      });
      isNewUser = true;
    } else {
      user = await prisma.user.update({
        where: { auth0Id: userInfo.sub },
        data: {
          email: userInfo.email,
          name: userInfo.name || userInfo.nickname || 'User',
          picture: userInfo.picture,
        },
      });
    }

    if (isNewUser) {
      try {
        await sendWelcomeEmail(user.email);
      } catch (emailErr) {
        // Keep login successful even if email transport is unavailable.
        console.warn('Failed to send welcome email:', emailErr.message);
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
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Logic for GET /api/auth/profile
export const getUserProfile = async (req, res) => {
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

    // find the user in the DB
    const user = await prisma.user.findUnique({
      where: { auth0Id: userInfo.sub },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please login first.' });
    }

    console.log("Found the user and returning the profile");
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
    auth: req.auth?.payload,
  });
};
