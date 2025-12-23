// server.js

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import database from "./config/database.js";
import userRouter from "./routes/auth/authRoutes.js";
import productRouter from "./routes/productRoute.js";
import adminRouter from "./routes/auth/adminRouter.js";
import paymentRouter from "./routes/paymentRoutes.js";
// import orderRouter from "./routes/orderRoute.js";
import cartRouter from "./routes/cartRoute.js";
import DashboardProductRouter from "./routes/Dasboard Products Route/Dashboardproductroutes.js";

import MandirRoute from "./routes/MandirRoute.js";

database();

const app = express();
const PORT = process.env.PORT || 8999;

// CORS for frontend
app.use(
  cors({
    // origin: process.env.ORIGIN_URL,
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Mount auth routes
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/products", productRouter);
app.use("/api/payment", paymentRouter);
// app.use("/oders", orderRouter);
app.use("/cart", cartRouter);
app.use("/dashboard/product", DashboardProductRouter);
app.use("/mandir", MandirRoute);

app.get("/", (req, res) => res.send("Mahakal Backend Server is Live."));

app.listen(PORT, () => {
  console.log(`🗿 Mahakal Server is host at port no ${PORT}....`);
});
