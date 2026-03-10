import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./database/db.js";
import Razorpay from "razorpay";
import cors from "cors";
import rateLimit from "express-rate-limit";
import axios from "axios"; // Import axios for making HTTP requests to OpenAI

dotenv.config();

const REQUIRED_ENV_VARS = ["GROQ_API_KEY", "Razorpay_Key", "Razorpay_Secret"];
const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required env vars: ${missingEnvVars.join(", ")}`);
}
if (process.env.NODE_ENV === "production" && String(process.env.Razorpay_Key).startsWith("rzp_test_")) {
  throw new Error("Production cannot run with Razorpay test key");
}

// Initialize Razorpay instance
export const instance = new Razorpay({
  key_id: process.env.Razorpay_Key,
  key_secret: process.env.Razorpay_Secret,
});

const app = express();

// Razorpay webhook must receive raw body for signature verification.
import { razorpayWebhook } from "./controllers/course.js";
app.post("/api/razorpay/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "token"],
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

// AI request cache and request-dedupe store
const cache = new Map();
const inflight = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
const testDomains = [
  { name: "Ethical Hacking", id: "ethical-hacking" },
  { name: "Backend Development", id: "backend" },
  { name: "Node.js", id: "nodejs" },
  { name: "React", id: "react" },
  { name: "Python", id: "python" },
  { name: "Data Science", id: "data-science" },
  { name: "Machine Learning", id: "machine-learning" },
  { name: "Cybersecurity", id: "cybersecurity" },
  { name: "Frontend Development", id: "frontend" },
  { name: "JavaScript", id: "javascript" },
  { name: "Web Development", id: "web-dev" },
  { name: "UI/UX Design", id: "ui-ux" },
  { name: "Android Development", id: "android" },
  { name: "iOS Development", id: "ios" },
  { name: "Cloud Computing", id: "cloud" },
  { name: "DevOps", id: "devops" },
  { name: "Artificial Intelligence", id: "ai" },
  { name: "Blockchain", id: "blockchain" },
  { name: "Internet of Things (IoT)", id: "iot" },
  { name: "Game Development", id: "game-dev" },
  { name: "Software Testing", id: "software-testing" },
  { name: "Database Management", id: "database" },
  { name: "Networking", id: "networking" },
  { name: "Linux", id: "linux" },
  { name: "Windows", id: "windows" },
  { name: "MacOS", id: "macos" },
  { name: "Mobile Development", id: "mobile-dev" },
  { name: "Web Design", id: "web-design" },
  { name: "SEO", id: "seo" },
  { name: "Digital Marketing", id: "digital-marketing" },
  { name: "Content Writing", id: "content-writing" },
  { name: "Graphic Design", id: "graphic-design" },
  { name: "Video Editing", id: "video-editing" },
  { name: "Photography", id: "photography" },
  { name: "Animation", id: "animation" },
  { name: "Music Production", id: "music-production" },
  { name: "Film Making", id: "film-making" },
  { name: "Business", id: "business" },
  { name: "Finance", id: "finance" },
  { name: "Accounting", id: "accounting" },
  { name: "Sales", id: "sales" },
  { name: "Marketing", id: "marketing" },
  { name: "Human Resources (HR)", id: "hr" },
  { name: "Project Management", id: "project-management" },
  { name: "Product Management", id: "product-management" },
  { name: "Customer Service", id: "customer-service" },
];

const RETRYABLE_OPENAI_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Try again in a minute." },
});

const logEvent = (level, event, meta = {}) => {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...meta,
  });
  if (level === "error") {
    console.error(line);
    return;
  }
  console.log(line);
};

const stripCodeFences = (text = "") =>
  String(text)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const extractJSONArrayString = (text = "") => {
  const clean = stripCodeFences(text);
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  return clean.slice(start, end + 1);
};

const extractJSONObjectString = (text = "") => {
  const clean = stripCodeFences(text);
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return clean.slice(start, end + 1);
};

async function repairJSONWithGroq(invalidJSON, shape = "array") {
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const prompt = `Fix this invalid JSON and return ONLY valid ${shape === "array" ? "JSON array" : "JSON object"}.
Do not add comments or markdown.
Invalid JSON:
${invalidJSON}`;

  const response = await requestGroqWithRetry(
    {
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0,
    },
    {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    1,
    700
  );

  return response?.data?.choices?.[0]?.message?.content || "";
}

async function parseJSONArrayOrRepair(raw) {
  const candidate = extractJSONArrayString(raw);
  if (!candidate) throw new Error("AI response does not contain a JSON array");

  try {
    return JSON.parse(candidate);
  } catch (error) {
    const repaired = await repairJSONWithGroq(candidate, "array");
    const repairedCandidate = extractJSONArrayString(repaired);
    if (!repairedCandidate) throw new Error("Failed to repair AI JSON array");
    return JSON.parse(repairedCandidate);
  }
}

async function parseJSONObjectOrRepair(raw) {
  const candidate = extractJSONObjectString(raw);
  if (!candidate) throw new Error("AI response does not contain a JSON object");

  try {
    return JSON.parse(candidate);
  } catch (error) {
    const repaired = await repairJSONWithGroq(candidate, "object");
    const repairedCandidate = extractJSONObjectString(repaired);
    if (!repairedCandidate) throw new Error("Failed to repair AI JSON object");
    return JSON.parse(repairedCandidate);
  }
}

function isRetryableOpenAIError(error) {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return !status || RETRYABLE_OPENAI_STATUS.has(status);
}

async function requestGroqWithRetry(body, headers, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await axios.post(GROQ_CHAT_COMPLETIONS_URL, body, { headers });
    } catch (error) {
      lastError = error;
      if (!isRetryableOpenAIError(error) || attempt === maxRetries) {
        throw error;
      }

      const retryAfterHeader = Number(error.response?.headers?.["retry-after"]);
      const retryAfterMs =
        Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
          ? retryAfterHeader * 1000
          : baseDelayMs * 2 ** attempt;

      console.warn(
        `Groq request retry ${attempt + 1}/${maxRetries} in ${retryAfterMs}ms (status: ${error.response?.status || "network"})`
      );
      await sleep(retryAfterMs);
    }
  }

  throw lastError;
}

function shuffleArray(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeDifficulty(value) {
  const difficulty = String(value || "medium").toLowerCase();
  return VALID_DIFFICULTIES.has(difficulty) ? difficulty : "medium";
}

function normalizeQuestionPayload(rawQuestions, requestedDifficulty) {
  if (!Array.isArray(rawQuestions)) return [];

  const seen = new Set();
  const normalized = [];

  for (const q of rawQuestions) {
    const question = String(q?.question || "").trim();
    const options = Array.isArray(q?.options)
      ? q.options.map((opt) => String(opt).trim()).filter(Boolean)
      : [];
    const rawCorrectAnswer = String(q?.correctAnswer || "").trim();
    let correctAnswer = rawCorrectAnswer;
    const letterMatch = rawCorrectAnswer.match(/^[A-Ea-e]$/);
    if (letterMatch) {
      const idx = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
      if (options[idx]) correctAnswer = options[idx];
    } else if (/^\d+$/.test(rawCorrectAnswer)) {
      const idx = Number(rawCorrectAnswer) - 1;
      if (options[idx]) correctAnswer = options[idx];
    }
    const difficulty = normalizeDifficulty(q?.difficulty || requestedDifficulty);
    const topic = String(q?.topic || "General Concepts").trim();
    const key = question.toLowerCase();

    if (!question || options.length < 2 || !correctAnswer || seen.has(key)) continue;

    seen.add(key);
    normalized.push({
      question,
      options,
      correctAnswer,
      difficulty,
      topic,
    });
  }

  return normalized;
}

app.get("/", (req, res) => {
  res.send("Server is running...");
});

// ✅ Optimized API to Generate MCQs with Caching
app.get("/api/domains", (req, res) => {
  res.json({ success: true, domains: testDomains });
});

app.post("/api/generate-questions", aiLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const { domain, numQuestions = 10 } = req.body;
    const difficulty = normalizeDifficulty(req.body?.difficulty);
    const fresh = Boolean(req.body?.fresh);
    const sessionId = String(req.body?.sessionId || Date.now());

    if (!domain || typeof domain !== "string" || domain.trim().length < 2) {
      return res.status(400).json({ error: "Invalid domain parameter" });
    }
    if (!Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > 30) {
      return res.status(400).json({ error: "numQuestions must be an integer between 1 and 30" });
    }

    const cacheKey = `${domain}-${difficulty}-${numQuestions}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (!fresh && cached && cached.expiresAt > now) {
      console.log("Serving questions from cache...");
      const shuffledCached = shuffleArray(cached.value).map((q) => ({
        ...q,
        options: shuffleArray(q.options || []),
      }));
      return res.json({ success: true, questions: shuffledCached, fromCache: true });
    }

    const inflightKey = fresh ? `${cacheKey}-${sessionId}` : cacheKey;
    if (inflight.has(inflightKey)) {
      const sharedQuestions = await inflight.get(inflightKey);
      return res.json({ success: true, questions: sharedQuestions, shared: true });
    }

    const task = (async () => {
      const prompt = `Generate ${numQuestions} unique ${difficulty} MCQs about ${domain}. Seed: ${sessionId}.
      Avoid repeating common question phrasings from previous attempts.
      Return ONLY valid JSON object in this exact shape:
      {
        "questions": [
          {
            "question": "text",
            "options": ["a","b","c","d"],
            "correctAnswer": "exact option text",
            "difficulty": "easy/medium/hard",
            "topic": "short topic area"
          }
        ]
      }`;

      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured");
      }

      const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
      const groqResponse = await requestGroqWithRetry(
        {
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          response_format: { type: "json_object" },
        },
        {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        3,
        1000
      );

      const rawContent = groqResponse.data.choices?.[0]?.message?.content || "{}";
      const parsedObject = await parseJSONObjectOrRepair(rawContent);
      const parsedArray = Array.isArray(parsedObject?.questions)
        ? parsedObject.questions
        : Array.isArray(parsedObject)
          ? parsedObject
          : [];
      const questions = normalizeQuestionPayload(parsedArray, difficulty);

      if (!Array.isArray(questions) || !questions[0]?.question) {
        throw new Error("Invalid question format from AI");
      }

      const shuffled = shuffleArray(questions).map((q) => ({
        ...q,
        options: shuffleArray(q.options || []),
      }));

      if (!fresh) {
        cache.set(cacheKey, { value: shuffled, expiresAt: now + CACHE_TTL_MS });
      }
      return shuffled;
    })();

    inflight.set(inflightKey, task);
    const questions = await task;
    logEvent("info", "generate_questions_success", {
      domain,
      difficulty,
      numQuestions,
      elapsedMs: Date.now() - startedAt,
      fresh,
    });

    res.json({ success: true, questions });
  } catch (error) {
    logEvent("error", "generate_questions_failed", {
      status: error.response?.status || 500,
      message: error.message,
      elapsedMs: Date.now() - startedAt,
    });
    res.status(error.response?.status || 503).json({
      error: "Failed to generate questions",
      details: error.response?.data?.error?.message || error.message,
    });
  } finally {
    const { domain, numQuestions = 10 } = req.body;
    const difficulty = normalizeDifficulty(req.body?.difficulty);
    const fresh = Boolean(req.body?.fresh);
    const sessionId = String(req.body?.sessionId || "");
    if (domain && typeof domain === "string") {
      const cacheKey = `${domain}-${difficulty}-${numQuestions}`;
      inflight.delete(fresh ? `${cacheKey}-${sessionId}` : cacheKey);
    }
  }
});

app.post("/api/analyze-test-performance", aiLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const { domain, score = 0, totalQuestions = 0, answers = [] } = req.body;
    if (!domain || typeof domain !== "string" || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid analysis payload" });
    }
    if (!Number.isFinite(score) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) {
      return res.status(400).json({ error: "Invalid score payload" });
    }

    const wrongAnswers = answers.filter((a) => a && !a.isCorrect).slice(0, 8).map((a) => ({
      question: a.question,
      selectedAnswer: a.selectedAnswer,
      correctAnswer: a.correctAnswer,
      difficulty: a.difficulty,
      topic: a.topic,
    }));

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const prompt = `Analyze this test performance and provide concise learning feedback.
Domain: ${domain}
Score: ${score}/${totalQuestions}
Wrong answers: ${JSON.stringify(wrongAnswers)}

Respond as JSON only:
{
  "summary": "one short paragraph",
  "focusAreas": ["area1", "area2", "area3"],
  "practicePlan": "2-3 sentence practical plan"
}`;

    const aiResponse = await requestGroqWithRetry(
      {
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" },
      },
      {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      2,
      800
    );

    const raw = aiResponse.data.choices?.[0]?.message?.content || "{}";
    const parsed = await parseJSONObjectOrRepair(raw);

    logEvent("info", "analyze_performance_success", {
      domain,
      totalQuestions,
      wrongAnswers: wrongAnswers.length,
      elapsedMs: Date.now() - startedAt,
    });

    return res.json({
      success: true,
      analysis: {
        summary: parsed.summary || "You are improving steadily. Keep practicing consistently.",
        focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas.slice(0, 5) : [],
        practicePlan: parsed.practicePlan || "Build 2-3 small exercises around weak topics and review mistakes after each attempt.",
      },
    });
  } catch (error) {
    logEvent("error", "analyze_performance_failed", {
      status: error.response?.status || 500,
      message: error.message,
      elapsedMs: Date.now() - startedAt,
    });
    return res.status(error.response?.status || 503).json({
      error: "Failed to analyze performance",
      details: error.response?.data?.error?.message || error.message,
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

// Start Server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  connectDb();
});
