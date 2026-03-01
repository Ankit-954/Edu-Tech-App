import Review from "../models/Review.js";

// @desc    Add a new review
// @route   POST /api/reviews
// @access  Public
export const addReview = async (req, res) => {
  const { name, comment, rating } = req.body;

  try {
    const newReview = await Review.create({ name, comment, rating });
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};