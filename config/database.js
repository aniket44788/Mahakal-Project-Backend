import mongoose from "mongoose";

const database = async () => {
  try {
    await mongoose.connect(process.env.DB_LINK);
    console.log("😎 Database connected successfully");

    // 🔹 Drop the old phone index if it still exists
    const userCollection = mongoose.connection.collection("users");
    const indexes = await userCollection.indexes();

    const phoneIndex = indexes.find((idx) => idx.name === "phone_1");
    if (phoneIndex) {
      await userCollection.dropIndex("phone_1");
      console.log("🗑️ Dropped old 'phone_1' index successfully");
    } else {
      console.log("✅ No 'phone_1' index found — all good");
    }
  } catch (error) {
    console.log("❌ Database connection or index cleanup error:", error);
  }
};

export default database;
