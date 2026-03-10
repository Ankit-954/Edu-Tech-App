import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { rm } from "fs";
import { promisify } from "util";
import fs from "fs";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import { sendRoleUpdateMail } from "../middlewares/sendMail.js";

export const createCourse = TryCatch(async (req, res) => {
  const { title, description, category, stream, level, subjects, isTopCourse, topPriority, createdBy, duration, price } = req.body;

  const image = req.file;

  const normalizedImagePath = image?.path ? image.path.replace(/\\/g, "/") : "";
  const normalizedSubjects = String(subjects || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await Courses.create({
    title,
    description,
    category,
    stream: stream || category || "",
    level: level || "All Levels",
    subjects: normalizedSubjects,
    isTopCourse: String(isTopCourse) === "true",
    topPriority: Number(topPriority) || 0,
    createdBy,
    image: normalizedImagePath,
    duration,
    price,
  });

  res.status(201).json({
    message: "Course Created Successfully",
  });
});

export const updateTopCoursePriority = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  const isTopCourse =
    typeof req.body?.isTopCourse === "boolean"
      ? req.body.isTopCourse
      : course.isTopCourse;
  const topPriority = Number.isFinite(Number(req.body?.topPriority))
    ? Number(req.body.topPriority)
    : course.topPriority;

  course.isTopCourse = isTopCourse;
  course.topPriority = Math.max(0, topPriority || 0);
  await course.save();

  return res.json({
    message: "Top course priority updated",
    course,
  });
});

export const addLectures = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  if (!course)
    return res.status(404).json({
      message: "No Course with this id",
    });

  const { title, description } = req.body;

  const file = req.file;
  if (!file?.path) {
    return res.status(400).json({ message: "Lecture video file is required" });
  }
  const normalizedVideoPath = file.path.replace(/\\/g, "/");

  const lecture = await Lecture.create({
    title,
    description,
    video: normalizedVideoPath,
    course: course._id,
  });

  res.status(201).json({
    message: "Lecture Added",
    lecture,
  });
});

export const deleteLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  rm(lecture.video, () => {
    console.log("Video deleted");
  });

  await lecture.deleteOne();

  res.json({ message: "Lecture Deleted" });
});

const unlinkAsync = promisify(fs.unlink);

export const deleteCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  const lectures = await Lecture.find({ course: course._id });

  await Promise.all(
    lectures.map(async (lecture) => {
      await unlinkAsync(lecture.video);
      console.log("video deleted");
    })
  );

  rm(course.image, () => {
    console.log("image deleted");
  });

  await Lecture.find({ course: req.params.id }).deleteMany();

  await course.deleteOne();

  await User.updateMany({}, { $pull: { subscription: req.params.id } });

  res.json({
    message: "Course Deleted",
  });
});

export const getAllStats = TryCatch(async (req, res) => {
  const totalCoures = (await Courses.find()).length;
  const totalLectures = (await Lecture.find()).length;
  const totalUsers = (await User.find()).length;

  const stats = {
    totalCoures,
    totalLectures,
    totalUsers,
  };

  res.json({
    stats,
  });
});

export const getAllUser = TryCatch(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
  );
  const q = String(req.query.q || "").trim();
  const role = String(req.query.role || "all").toLowerCase();

  const filter = { _id: { $ne: req.user._id } };

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  if (role === "admin" || role === "user") {
    filter.role = role;
  }

  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

  res.json({
    users,
    pagination: {
      page,
      limit,
      totalUsers,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

export const updateRole = TryCatch(async (req, res) => {
  if (req.user.mainrole !== "superadmin")
    return res.status(403).json({
      message: "This endpoint is assign to superadmin",
    });
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.mainrole === "superadmin") {
    return res.status(400).json({ message: "Cannot update superadmin role" });
  }

  const requestedRole = String(req.body?.role || "").toLowerCase();
  const nextRole =
    requestedRole === "admin" || requestedRole === "user"
      ? requestedRole
      : user.role === "admin"
        ? "user"
        : "admin";

  user.role = nextRole;
  await user.save();

  if (user.email) {
    sendRoleUpdateMail({
      email: user.email,
      name: user.name,
      role: nextRole,
    }).catch((error) => {
      console.error("Role update email failed:", error?.message || error);
    });
  }

  return res.status(200).json({
    message: `Role updated to ${nextRole}`,
  });
});

export const updateRolesBulk = TryCatch(async (req, res) => {
  if (req.user.mainrole !== "superadmin") {
    return res.status(403).json({
      message: "This endpoint is assign to superadmin",
    });
  }

  const role = String(req.body?.role || "").toLowerCase();
  const rawUserIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
  if (role !== "admin" && role !== "user") {
    return res.status(400).json({ message: "Invalid role" });
  }

  const userIds = rawUserIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!userIds.length) {
    return res.status(400).json({ message: "No valid users selected" });
  }

  const targetUsers = await User.find({
    _id: { $in: userIds, $ne: req.user._id },
    mainrole: { $ne: "superadmin" },
  }).select("_id name email role");

  const result = await User.updateMany(
    {
      _id: { $in: userIds, $ne: req.user._id },
      mainrole: { $ne: "superadmin" },
    },
    { $set: { role } }
  );

  const emailTasks = targetUsers
    .filter((u) => u.role !== role && u.email)
    .map((u) =>
      sendRoleUpdateMail({
        email: u.email,
        name: u.name,
        role,
      })
    );

  if (emailTasks.length) {
    Promise.allSettled(emailTasks).catch(() => {});
  }

  return res.status(200).json({
    message: `${result.modifiedCount} users updated to ${role}`,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });
});

