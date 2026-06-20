import { Router } from "express";
import { z } from "zod";
import { db, ObjectId } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const courseSchema = z.object({
    name: z.string().min(1),
    description: z.string().or(z.literal("")).optional(),
});
// GET /courses - List all courses
router.get("/", requireAuth, async (_req, res) => {
    const coursesList = await db.collection("courses")
        .find()
        .sort({ createdAt: -1 })
        .toArray();
    const courses = coursesList.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        description: c.description || "",
    }));
    return res.json({ courses });
});
// POST /courses - Create course
router.post("/", requireAuth, async (req, res) => {
    const data = courseSchema.parse(req.body);
    const newCourse = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await db.collection("courses").insertOne(newCourse);
    const course = {
        id: result.insertedId.toString(),
        ...newCourse,
    };
    return res.status(201).json({ course });
});
// PUT /courses/:id - Update course
router.put("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const data = courseSchema.partial().parse(req.body);
    const updateData = {
        ...data,
        updatedAt: new Date(),
    };
    await db.collection("courses").updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    return res.json({ success: true });
});
// DELETE /courses/:id - Delete course
router.delete("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    await db.collection("courses").deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
});
export const coursesRouter = router;
