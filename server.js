import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import database from "./config/database.js";
import userRouter from "./routes/auth/authRoutes.js";
import adminRouter from "./routes/auth/adminRouter.js";
import productRouter from "./routes/productRoute.js";
dotenv.config();
database();

const app = express();
const port = process.env.PORT; // port number

app.use(express.json()); // for JSON

//Routes ----------->
app.use("/user", userRouter);
app.use("/admin", adminRouter);

app.use("/products" , productRouter)

app.get("/", (req, res) => {
  res.send(` Mahakal Backend Server is Active.............. `);
});

app.listen(port, async () => {
  console.log(`🗿 Mahakal Server is host at port no ${port}....`);
});
