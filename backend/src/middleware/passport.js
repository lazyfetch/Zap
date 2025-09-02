import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config()

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/v1/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try 
    {
      let user = await User.findOne({ 
        provider: "google", 
        providerId: profile.id 
      });

      if (user) 
      {
        return done(null, user)
      }

      const existingUser = await User.findOne({ email: profile.emails[0].value })
      if (existingUser)
      {
        existingUser.provider = "google";
        existingUser.providerId = profile.id;
        if (profile.photos && profile.photos[0])
        {
          existingUser.avatar = profile.photos[0].value
        }
        await existingUser.save()
        return done(null, existingUser)
      }

      const newUser = await User.create({
        username: profile.displayName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000),
        email: profile.emails[0].value,
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : "/avatars/default.png",
        provider: "google",
        providerId: profile.id,
        password: "google_oauth_" + Math.random().toString(36).substring(7) // Generate random password
      });

      return done(null, newUser)
    } 
    catch (error) 
    {
      return done(error, null)
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try 
  {
    const user = await User.findById(id)
    done(null, user)
  } 
  catch (error) 
  {
    done(error, null)
  }
});

export default passport