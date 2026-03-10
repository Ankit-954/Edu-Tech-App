import fs from "fs";
import Review from "../models/Review.js";

// @desc    Add a new review
// @route   POST /api/reviews
// @access  Public
export const addReview = async (req, res) => {
  const { name, comment, rating } = req.body;

  try {
    if (!name || !comment || !rating) {
      return res.status(400).json({ message: "Name, comment and rating are required" });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const imagePath = req.file ? `uploads/${req.file.filename}` : "";

    const newReview = await Review.create({
      name: name.trim(),
      comment: comment.trim(),
      rating: parsedRating,
      image: imagePath,
    });

    res.status(201).json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.message?.includes("File too large")) {
      return res.status(400).json({ message: "Image size must be 30KB or less" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Toggle featured review (Admin only)
// @route   PUT /api/reviews/:id/feature
// @access  Admin
export const toggleFeaturedReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.isFeatured = !review.isFeatured;
    await review.save();

    res.status(200).json({
      message: `Review ${review.isFeatured ? "featured" : "removed from testimonials"}`,
      review,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a review (Admin only)
// @route   DELETE /api/reviews/:id
// @access  Admin
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.image) {
      const imagePath = review.image.replace(/\\/g, "/");
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
