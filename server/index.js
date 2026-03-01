import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./database/db.js";
import Razorpay from "razorpay";
import cors from "cors";
import axios from "axios"; // Import axios for making HTTP requests to DeepSeek AI

dotenv.config();

// Initialize Razorpay instance
export const instance = new Razorpay({
  key_id: process.env.Razorpay_Key,
  key_secret: process.env.Razorpay_Secret,
});

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Simple cache to store generated questions temporarily (to reduce API calls)
const cache = new Map();

app.get("/", (req, res) => {
  res.send("Server is running...");
});

// ✅ Optimized API to Generate MCQs with Caching
app.post("/api/generate-questions", async (req, res) => {
  try {
    const { domain, numQuestions = 10 } = req.body;

    if (!domain || typeof domain !== "string") {
      return res.status(400).json({ error: "Invalid domain parameter" });
    }

    const cacheKey = `${domain}-${numQuestions}`;
    if (cache.has(cacheKey)) {
      console.log("Serving questions from cache...");
      return res.json({ success: true, questions: cache.get(cacheKey) });
    }

    const prompt = `Generate ${numQuestions} MCQs about ${domain}. Return ONLY JSON:
    [{
      "question": "text",
      "options": ["a","b","c","d"],
      "correctAnswer": "a",
      "difficulty": "easy/medium/hard"
    }]`;

    // Make a request to DeepSeek AI API
    const deepSeekResponse = await axios.post(
      "https://api.deepseek.ai/v1/completions", // Replace with the actual DeepSeek API endpoint
      {
        prompt: prompt,
        max_tokens: 500, // Adjust as needed
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawContent = deepSeekResponse.data.choices[0].text;
    const cleanJSON = rawContent.match(/\[.*\]/s)?.[0];
    const questions = JSON.parse(cleanJSON);

    if (!Array.isArray(questions) || !questions[0]?.question) {
      throw new Error("Invalid question format from AI");
    }

    cache.set(cacheKey, questions);
    setTimeout(() => cache.delete(cacheKey), 10 * 60 * 1000); // Cache for 10 minutes

    res.json({ success: true, questions });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(error.message.includes("quota") ? 429 : 500).json({
      error: error.message,
      details: error.message.includes("quota")
        ? "Rate limit exceeded. Try again later."
        : undefined,
    });
  }
});

// Static files
app.use("/uploads", express.static("uploads"));

// Import routes
import userRoutes from "./routes/user.js";
import courseRoutes from "./routes/course.js";
import adminRoutes from "./routes/admin.js";
import reviewRoutes from "./routes/review.js";

// Apply routes
app.use("/api", userRoutes);
app.use("/api", courseRoutes);
app.use("/api", adminRoutes);
app.use("/api/reviews", reviewRoutes);

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Start Server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  connectDb();
});