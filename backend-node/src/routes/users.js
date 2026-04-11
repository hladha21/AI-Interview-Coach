const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const prisma = new PrismaClient();

router.use(requireAuth);

// GET /users/stats
router.get("/stats", async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [totalSessions, completedSessions, answers] = await Promise.all([
      prisma.session.count({ where: { userId } }),
      prisma.session.count({ where: { userId, status: "completed" } }),
      prisma.answer.findMany({
        where: { session: { userId } },
        select: {
          clarityScore: true,
          depthScore: true,
          relevanceScore: true,
          confidenceScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const avg = (arr, key) => {
      const vals = arr.filter((a) => a[key] != null).map((a) => a[key]);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    res.json({
      totalSessions,
      completedSessions,
      totalAnswers: answers.length,
      averageScores: {
        clarity: parseFloat(avg(answers, "clarityScore").toFixed(1)),
        depth: parseFloat(avg(answers, "depthScore").toFixed(1)),
        relevance: parseFloat(avg(answers, "relevanceScore").toFixed(1)),
        confidence: parseFloat(avg(answers, "confidenceScore").toFixed(1)),
      },
      scoreTrend: answers.slice(-10).map((a) => ({
        date: a.createdAt,
        score: parseFloat(
          (
            (a.clarityScore + a.depthScore + a.relevanceScore + a.confidenceScore) / 4
          ).toFixed(1)
        ),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;