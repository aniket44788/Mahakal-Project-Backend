import Review from "../../models/reviewSchema.js";
import Product from "../../models/productSchema.js";
import Temple from "../../models/dashboardtempleschema.js";

export const addReview = async (req, res) => {
  try {
    const { productId, templeId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!productId && !templeId) {
      return res.status(400).json({ message: "Product or Temple ID required" });
    }

    if (productId && templeId) {
      return res
        .status(400)
        .json({ message: "Review can belong to only one item" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    if (!comment || comment.trim().length < 5) {
      return res
        .status(400)
        .json({ message: "Comment must be at least 5 characters" });
    }

    // ❌ duplicate review
    const existingReview = await Review.findOne({
      user: userId,
      ...(productId ? { product: productId } : { temple: templeId }),
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You already reviewed this item" });
    }

    // ✅ create review
    const review = await Review.create({
      user: userId,
      product: productId || null,
      temple: templeId || null,
      rating,
      comment,
    });

    // 🔄 update ratings
    if (productId) {
      const reviews = await Review.find({ product: productId });
      const avg =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await Product.findByIdAndUpdate(productId, {
        "rating.average": Number(avg.toFixed(1)),
        "rating.count": reviews.length,
      });
    }

    if (templeId) {
      const reviews = await Review.find({ temple: templeId });
      const avg =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await Temple.findByIdAndUpdate(templeId, {
        "templePrasadRating.average": Number(avg.toFixed(1)),
        "templePrasadRating.count": reviews.length,
      });
    }

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
