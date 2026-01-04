import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import database from "./config/database.js";
import userRouter from "./routes/auth/authRoutes.js";
import productRouter from "./routes/productRoute.js";
import adminRouter from "./routes/auth/adminRouter.js";
import paymentRouter from "./routes/paymentRoutes.js";
// import orderRouter from "./routes/orderRoute.js";
import cartRouter from "./routes/cartRoute.js";
import DashboardProductRouter from "./routes/Dasboard Products Route/Dashboardproductroutes.js";

import MandirRoute from "./routes/MandirRoute.js";
import reviewroute from "./routes/reviewroute/reviewroute.js";

database();

const app = express();
console.log("port", process.env.PORT);
const PORT = process.env.PORT;

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

//reviews
app.use("/review" , reviewroute )

app.get("/", (req, res) => res.send("Mahakal Backend Server is Live."));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🗿 Mahakal Server is host at port no ${PORT}....`);
});
