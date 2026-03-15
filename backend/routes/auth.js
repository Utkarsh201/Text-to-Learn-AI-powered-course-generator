const express = require('express');
const { requiresAuth } = require('express-openid-connect');
const User = require('../models/User');
const emailQueue = require('../services/emailQueue');

const router = express.Router();

// The /login /logout /callback routes are automatically provided by express-openid-connect in server.js
// We will set up a route that handles post-login logic (syncing user to DB)

// Custom protected route to get profile and save to DB
router.get('/profile', requiresAuth(), async (req, res) => {
  try {
    const userInfo = req.oidc.user;
    
    // Find or create user in our DB
    let user = await User.findOne({ auth0Id: userInfo.sub });
    
    if (!user) {
      user = new User({
        auth0Id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name || userInfo.nickname || 'User',
        picture: userInfo.picture
      });
      await user.save();
      
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
router.get('/dashboard', requiresAuth(), (req, res) => {
  res.send('Welcome to the secure dashboard!');
});

module.exports = router;
