import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import database from "./config/database.js";
import userRouter from "./routes/auth/authRoutes.js";
import adminRouter from "./routes/auth/adminRouter.js";
import productRouter from "./routes/productRoute.js";

dotenv.config();
database();

const app = express();
const port = process.env.PORT; // port number

// ✅ CORS Middleware
app.use(
  cors({
    origin: "*", // किस domain को allow करना है ("*" मतलब सबको allow)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json()); // for JSON
//Routes ----------->
app.use("/user", userRouter);
app.use("/admin", adminRouter);

app.use("/products", productRouter);

app.get("/", (req, res) => {
  res.send(` Mahakal Backend Server is Now Live.............. `);
});

app.listen(port, async () => {
  console.log(`🗿 Mahakal Server is host at port no ${port}....`);
});
