import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from '../storage';
import { User } from '@shared/schema';

// Configure Passport.js local strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      // If user not found or password doesn't match
      if (!user || user.password !== password) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      // Return the authenticated user
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize user to session
passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    
    if (!user) {
      return done(new Error('User not found'));
    }
    
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;