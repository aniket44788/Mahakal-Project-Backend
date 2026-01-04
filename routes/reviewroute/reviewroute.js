import express from "express";
import { addReview, getAllProductReviews } from "../../controllers/reviewcontroller/reviewcontroller.js";
import { protect } from "../../middleware/protectuser.js";

const reviewroute = express.Router();

reviewroute.post("/addreview", protect, addReview);

reviewroute.get("/allreviews/:productId" , getAllProductReviews)

export default reviewroute;
