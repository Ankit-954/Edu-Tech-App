import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";
import {
  addLectures,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllStats,
  getAllUser,
  updateTopCoursePriority,
  updateRole,
  updateRolesBulk,
} from "../controllers/admin.js";
import { uploadCourseImage, uploadLectureVideo } from "../middlewares/multer.js";

const router = express.Router();

router.post("/course/new", isAuth, isAdmin, uploadCourseImage, createCourse);
router.post("/course/:id", isAuth, isAdmin, uploadLectureVideo, addLectures);
router.put("/course/:id/top", isAuth, isAdmin, updateTopCoursePriority);
router.delete("/course/:id", isAuth, isAdmin, deleteCourse);
router.delete("/lecture/:id", isAuth, isAdmin, deleteLecture);
router.get("/stats", isAuth, isAdmin, getAllStats);
router.put("/user/:id", isAuth, isAdmin, updateRole);
router.put("/users/roles", isAuth, isAdmin, updateRolesBulk);
router.get("/users", isAuth, isAdmin, getAllUser);

export default router;
