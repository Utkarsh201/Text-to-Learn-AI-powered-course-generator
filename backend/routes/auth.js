// TODO: Have to use PostgreSQL (via Prisma) here — import Prisma Client to query/create users
import express from 'express';
import { checkJwt } from '../middlewares/auth.js';
import emailQueue from '../services/emailQueue.js';

const router = express.Router();

// Protected route to handle post-login logic (syncing user to DB)
router.get('/profile', checkJwt, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    
    // Fetch user info from Auth0
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
    const userinfoResponse = await fetch(`${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!userinfoResponse.ok) {
        throw new Error('Failed to fetch userinfo from Auth0');
    }
    
    const userInfo = await userinfoResponse.json();
    
    // TODO: Have to use PostgreSQL here — replace User.findOne() with Prisma: prisma.user.findUnique({ where: { auth0Id: userInfo.sub } })
    let user = null; // was: await User.findOne({ auth0Id: userInfo.sub });
    
    if (!user) {
      // TODO: Have to use PostgreSQL here — replace new User().save() with Prisma: prisma.user.create({ data: { auth0Id, email, name, picture } })
      user = {
        auth0Id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name || userInfo.nickname || 'User',
        picture: userInfo.picture
      }; // was: new User({...}); await user.save();
      
      // Add a job to send the welcome email via Redis queue
      // This happens asynchronously in the background
      emailQueue.add({
        email: user.email,
        name: user.name
      });
    }

    
    res.json({ message: 'User profile authenticated and synced', user });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// A protected route example
router.get('/dashboard', checkJwt, (req, res) => {
  res.send('Welcome to the secure dashboard!');
});

export default router;
