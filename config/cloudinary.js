import { v2 as cloudinary } from "cloudinary";

import dotenv from "dotenv";

dotenv.config(); // 👈 ensure env is loaded here too

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api.ping((error, result) => {
  console.log(error, result);
});

export default cloudinary;
