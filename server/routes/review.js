import express from "express";
import {
  addReview,
  getReviews,
  deleteReview,
  toggleFeaturedReview,
} from "../controllers/Review.js";
import { isAuth, isAdmin } from "../middlewares/isAuth.js";
import { uploadReviewImage } from "../middlewares/multer.js";

const router = express.Router();

router.post("/", (req, res, next) => {
  uploadReviewImage(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image size must be 30KB or less" });
    }
    return res.status(400).json({ message: err.message || "Invalid image upload" });
  });
}, addReview);
router.get("/", getReviews);
router.put("/:id/feature", isAuth, isAdmin, toggleFeaturedReview);
router.delete("/:id", isAuth, isAdmin, deleteReview);

export default router;
