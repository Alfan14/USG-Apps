import { Router } from "express";
import { db } from "../../db/index.js";
import { pregnancyTips } from "../../db/schema.js";
import { patientAuth } from "../../middlewares/patientAuth.js";
import { eq, and, lte, gte } from "drizzle-orm";

const router = Router();

// Apply patient authentication to all tips routes
router.use(patientAuth);

/**
 * @openapi
 * /api/v1/patient/tips:
 *   get:
 *     summary: List Pregnancy Tips and Articles
 *     description: Retrieve educational articles, optionally filtered by trimester or gestational week.
 *     tags:
 *       - Pregnancy Tips
 *     security:
 *       - PatientAuth: []
 *     parameters:
 *       - in: query
 *         name: trimester
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *         description: Trimester number (1, 2, or 3)
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *         description: Gestational age in weeks (e.g. 24)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [nutrition, exercise, fetal_development, warning_signs]
 *     responses:
 *       200:
 *         description: List of pregnancy tips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 tips:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
function formatTip(t) {
  const wordCount = t.content ? t.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    id: t.id,
    trimester: t.trimester,
    min_week: t.minWeek,
    max_week: t.maxWeek,
    minWeek: t.minWeek,
    maxWeek: t.maxWeek,
    title: t.title,
    summary: t.summary,
    content: t.content,
    category: t.category,
    image_url: t.imageUrl,
    imageUrl: t.imageUrl,
    read_time_minutes: readTimeMinutes,
    created_at: t.createdAt,
  };
}

router.get("/tips", async (req, res, next) => {
  try {
    const { trimester, week, category } = req.query;

    const conditions = [];

    if (trimester) {
      conditions.push(eq(pregnancyTips.trimester, parseInt(trimester, 10)));
    }

    if (week) {
      const parsedWeek = parseInt(week, 10);
      conditions.push(lte(pregnancyTips.minWeek, parsedWeek));
      conditions.push(gte(pregnancyTips.maxWeek, parsedWeek));
    }

    if (category) {
      conditions.push(eq(pregnancyTips.category, category));
    }

    let query = db.select().from(pregnancyTips);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const tipsList = await query;

    return res.status(200).json({
      success: true,
      count: tipsList.length,
      tips: tipsList.map(formatTip),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/patient/tips/{id}:
 *   get:
 *     summary: Get Single Pregnancy Tip Detail
 *     tags:
 *       - Pregnancy Tips
 *     security:
 *       - PatientAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tip detail
 *       404:
 *         description: Tip not found
 */
router.get("/tips/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const rows = await db
      .select()
      .from(pregnancyTips)
      .where(eq(pregnancyTips.id, id))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Artikel edukasi kehamilan tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      tip: formatTip(rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
