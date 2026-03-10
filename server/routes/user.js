import express from "express";
import {
  askChatbot,
  addTestAttempt,
  forgotPassword,
  getTestHistory,
  getSearchSuggestions,
  generateRoadmap,
  runAIInterviewTurn,
  loginUser,
  myProfile,
  updateMyProfile,
  requestCallback,
  register,
  resetPassword,
  verifyUser,
} from "../controllers/user.js";
import { isAuth } from "../middlewares/isAuth.js";
import { addProgress, getYourProgress } from "../controllers/course.js";
import { uploadProfileImage } from "../middlewares/multer.js";

const router = express.Router();

router.post("/user/register", register);
router.post("/user/verify", verifyUser);
router.post("/user/login", loginUser);
router.get("/user/me", isAuth, myProfile);
router.put("/user/me", isAuth, uploadProfileImage, updateMyProfile);
router.post("/user/forgot", forgotPassword);
router.post("/user/reset", resetPassword);
router.post("/user/progress", isAuth, addProgress);
router.get("/user/progress", isAuth, getYourProgress);
router.post("/user/test-history", isAuth, addTestAttempt);
router.get("/user/test-history", isAuth, getTestHistory);
router.post("/chatbot/ask", askChatbot);
router.post("/interview/turn", runAIInterviewTurn);
router.get("/roadmap/generate", generateRoadmap);
router.get("/search/suggest", getSearchSuggestions);
router.post("/callback-request", requestCallback);

export default router;
