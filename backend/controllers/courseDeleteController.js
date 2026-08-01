import prisma from '../prisma/client.js';

// ── DELETE /api/courses/:courseId ──
// Deletes an entire course along with all nested chapters, lessons, quizzes, and video references.
export const deleteCourse = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: 'Valid access token is required.' });
    }
    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const { courseId } = req.params;
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
    });
    if (!course) {
      return res.status(404).json({ error: 'Course not found or unauthorized.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.generationRun.deleteMany({ where: { courseId } });
      await tx.course.delete({ where: { id: courseId } });
    });

    res.json({ message: 'Course successfully deleted.', courseId });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
