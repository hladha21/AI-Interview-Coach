const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const fetch = require("node-fetch");

const prisma = new PrismaClient();

router.use(requireAuth);

// POST /sessions
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      role: z.string().min(1),
      difficulty: z.enum(["easy", "intermediate", "hard"]),
    });
    const data = schema.parse(req.body);
    const session = await prisma.session.create({
      data: { userId: req.user.id, role: data.role, difficulty: data.difficulty },
    });
    res.status(201).json(session);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

// GET /sessions
router.get("/", async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { answers: { select: { id: true } } },
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

// GET /sessions/:id
router.get("/:id", async (req, res, next) => {
  try {
    const session = await prisma.session.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { answers: true },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

// POST /sessions/:id/answer
router.post("/:id/answer", async (req, res, next) => {
  try {
    const schema = z.object({
      questionText: z.string().min(1),
      answerText: z.string().min(1),
    });
    const data = schema.parse(req.body);

    const session = await prisma.session.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const aiResponse = await fetch(`${process.env.AI_SERVICE_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: session.role,
        difficulty: session.difficulty,
        question: data.questionText,
        answer: data.answerText,
      }),
    });

    if (!aiResponse.ok) throw new Error("AI service error");
    const feedback = await aiResponse.json();

    const answer = await prisma.answer.create({
      data: {
        sessionId: session.id,
        questionText: data.questionText,
        answerText: data.answerText,
        clarityScore: feedback.scores.clarity,
        depthScore: feedback.scores.depth,
        relevanceScore: feedback.scores.relevance,
        confidenceScore: feedback.scores.confidence,
        feedbackText: feedback.summary,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
      },
    });

    res.json({ answer, feedback });
  } catch (err) {
    next(err);
  }
});

// PATCH /sessions/:id/complete
router.patch("/:id/complete", async (req, res, next) => {
  try {
    const session = await prisma.session.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { answers: true },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const scores = session.answers.map(
      (a) => (a.clarityScore + a.depthScore + a.relevanceScore + a.confidenceScore) / 4
    );
    const overallScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    const updated = await prisma.session.update({
      where: { id: session.id },
      data: { status: "completed", overallScore, completedAt: new Date() },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;