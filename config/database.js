import mongoose from "mongoose";

const database = async () => {
  try {
    await mongoose.connect(process.env.DB_LINK);
    console.log("😎 Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

export default database;
