// server.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import database from "./config/database.js";
import userRouter from "./routes/auth/authRoutes.js";
import productRouter from "./routes/productRoute.js";

dotenv.config();
database();

const app = express();
const PORT = process.env.PORT || 8999;

// CORS for frontend
app.use(
  cors({
    origin: process.env.ORIGIN_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, secure: false, sameSite: "lax" },
  })
);

// Passport (only if using redirect flow elsewhere)
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.BACKENDURL,
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());

// Mount auth routes
app.use("/user", userRouter);
app.use("/products" , productRouter)

app.get("/", (req, res) => res.send("Mahakal Backend Server is Live."));

app.listen(PORT, () => {
  console.log(`🗿 Mahakal Server is host at port no ${PORT}....`);
});
