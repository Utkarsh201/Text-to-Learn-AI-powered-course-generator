import { Receiver } from "@upstash/qstash";
import prisma from "../prisma/client.js";
import qstashClient from "../services/qstashClient.js";
import {
  generateCourseOutline,
  generateLessonContent,
  generateQuiz,
  generateVideoReferences,
} from "../services/llmService.js";

// ── QStash Signature Verification ──
// Every request from QStash includes a signature header.
// We verify it so random attackers can't trigger our webhook.
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

/**
 * Publish a job step to QStash.
 * QStash will POST the payload back to our webhook endpoint.
 */
const publishStep = async (payload) => {
  if (!process.env.QSTASH_CALLBACK_URL) {
    throw new Error(
      'QSTASH_CALLBACK_URL is not set. Add it to your .env file (e.g. your ngrok or deployed URL).'
    );
  }
  const callbackUrl = `${process.env.QSTASH_CALLBACK_URL}/api/webhooks/course`;

  await qstashClient.publishJSON({
    url: callbackUrl,
    body: payload,
    retries: 3,
  });
};

/**
 * Main webhook handler — receives HTTP POST from QStash for each step.
 *
 * Each step (generateOutline, generateChapter) is its own HTTP request.
 * If a step fails, QStash retries ONLY that step — already completed
 * steps (saved in Postgres) are never re-executed.
 *
 * Quiz and video references are generated per-chapter inside generateChapter,
 * eliminating the separate generateQuiz step and the race condition.
 */
export const handleCourseWebhook = async (req, res) => {
  try {
    // ── Step 1: Verify QStash signature ──
    const signature = req.headers["upstash-signature"];
    if (!signature) {
      return res.status(401).json({ error: "Missing QStash signature" });
    }

    const isValid = await receiver.verify({
      signature,
      body: req.rawBody ?? JSON.stringify(req.body),
    });

    if (!isValid) {
      return res.status(401).json({ error: "Invalid QStash signature" });
    }
  } catch (verifyError) {
    console.error("[Webhook] Signature verification failed:", verifyError.message);
    return res.status(401).json({ error: "Signature verification failed" });
  }

  // ── Step 2: Extract job data ──
  const {
    type,
    generationRunId,
    courseId,
    topic,
    depth,
    language,
    chapterId,
    chapterTitle,
    chapterObjective,
    expectedChapterCount,
    includeQuizzes,
    includeVideoReferences,
  } = req.body;

  try {
    // ────────────────────────────────────────────────
    // STEP TYPE: generateOutline
    // ────────────────────────────────────────────────
    if (type === "generateOutline") {
      console.log(`[Webhook] Generating outline for course: ${courseId}`);

      await prisma.generationRun.update({
        where: { id: generationRunId },
        data: { status: "RUNNING" },
      });

      // ── Idempotency check ──
      // If this is a QStash retry, chapters may already exist from a previous
      // partial attempt. Check first to avoid duplicates.
      const existingChapters = await prisma.chapter.findMany({
        where: { courseId },
        include: { lessons: true },
        orderBy: { order: "asc" },
      });

      if (existingChapters.length > 0) {
        // Chapters already exist — skip LLM call and chapter creation.
        // Only re-enqueue chapter jobs for chapters that don't have lessons yet.
        console.log(
          `[Webhook] Retry detected: ${existingChapters.length} chapters already exist. Re-enqueuing incomplete ones.`
        );

        for (const chapter of existingChapters) {
          if (chapter.lessons.length === 0) {
            await publishStep({
              type: "generateChapter",
              generationRunId,
              courseId,
              chapterId: chapter.id,
              expectedChapterCount: existingChapters.length,
              topic,
              depth,
              language,
              chapterTitle: chapter.title,
              chapterObjective: chapter.objective,
              includeQuizzes,
              includeVideoReferences,
            });
          }
        }

        return res.status(200).json({
          success: true,
          message: "Retry: re-enqueued incomplete chapters",
        });
      }

      // ── First attempt: generate outline from LLM ──
      const {
        title: courseTitle,
        description: courseDescription,
        estimatedDuration,
        chapters: outline,
      } = await generateCourseOutline(topic, depth, language);

      if (!outline || outline.length === 0) {
        throw new Error("LLM returned an empty outline. Aborting.");
      }

      // Persist course-level metadata from the LLM
      await prisma.course.update({
        where: { id: courseId },
        data: {
          title: courseTitle || topic,
          description: courseDescription || null,
          estimatedDuration: estimatedDuration || null,
        },
      });

      // Create chapters and enqueue each as a separate QStash step
      for (const [index, chapter] of outline.entries()) {
        const createdChapter = await prisma.chapter.create({
          data: {
            title: chapter.title,
            objective: chapter.objective,
            order: index + 1,
            courseId,
          },
        });

        // Each chapter becomes its own independent QStash job
        // If chapter 3 fails, chapters 1 & 2 are already saved — no re-work
        await publishStep({
          type: "generateChapter",
          generationRunId,
          courseId,
          chapterId: createdChapter.id,
          expectedChapterCount: outline.length,
          topic,
          depth,
          language,
          chapterTitle: chapter.title,
          chapterObjective: chapter.objective,
          includeQuizzes,
          includeVideoReferences,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Outline generated and chapters queued",
      });
    }

    // ────────────────────────────────────────────────
    // STEP TYPE: generateChapter
    // Generates: lesson content + quiz (if enabled) + video refs (if enabled)
    // All in one step per chapter — no race conditions, no separate quiz step.
    // ────────────────────────────────────────────────
    if (type === "generateChapter") {
      console.log(`[Webhook] Generating content for chapter: ${chapterTitle}`);

      // ── 1. Generate lesson content ──
      const contentData = await generateLessonContent(
        topic,
        chapterTitle,
        chapterObjective,
        depth,
        language
      );

      // Validate lesson content
      if (!contentData?.content || typeof contentData.content !== "string" || !contentData.content.trim()) {
        throw new Error(`LLM returned invalid lesson content for chapter: ${chapterTitle}`);
      }

      // ── 2. Save lesson (upsert pattern for retry safety) ──
      const existingLesson = await prisma.lesson.findFirst({
        where: { chapterId, order: 1 },
        select: { id: true },
      });

      let lessonId;
      if (existingLesson) {
        await prisma.lesson.update({
          where: { id: existingLesson.id },
          data: {
            title: chapterTitle,
            content: contentData.content,
            keyTakeaways: contentData.keyTakeaways || [],
          },
        });
        lessonId = existingLesson.id;
      } else {
        const newLesson = await prisma.lesson.create({
          data: {
            title: chapterTitle,
            content: contentData.content,
            keyTakeaways: contentData.keyTakeaways || [],
            order: 1,
            chapterId,
          },
        });
        lessonId = newLesson.id;
      }

      // ── 3. Generate quiz for THIS chapter (if enabled) ──
      let quizSavedSuccessfully = false;
      if (includeQuizzes) {
        console.log(`[Webhook] Generating quiz for chapter: ${chapterTitle}`);

        const quizQuestions = await generateQuiz(topic, contentData.content, depth, language);

        if (Array.isArray(quizQuestions)) {
          const validQuestions = quizQuestions.filter((q) => {
            return (
              q &&
              typeof q.question === "string" &&
              q.question.trim() &&
              typeof q.answer === "string" &&
              q.answer.trim()
            );
          });

          if (validQuestions.length > 0) {
            // Upsert quiz — safe for duplicate deliveries
            let quiz = await prisma.quiz.findUnique({
              where: { lessonId },
            });
            if (!quiz) {
              quiz = await prisma.quiz.create({
                data: { lessonId },
              });
            }

            // Clear any existing questions (idempotent on retry)
            await prisma.quizQuestion.deleteMany({
              where: { quizId: quiz.id },
            });

            for (const question of validQuestions) {
              await prisma.quizQuestion.create({
                data: {
                  quizId: quiz.id,
                  type: question.type || "FILL_BLANK",
                  question: question.question,
                  options: [], // No options for fill-in-the-blank
                  answer: question.answer,
                  explanation: question.explanation,
                  difficulty: question.difficulty || "Normal",
                },
              });
            }
            quizSavedSuccessfully = true;
            console.log(`[Webhook] Quiz saved for chapter: ${chapterTitle} (${validQuestions.length} questions)`);
          } else {
            console.warn(`[Webhook] No valid quiz questions returned for chapter: ${chapterTitle}`);
          }
        } else {
          console.warn(`[Webhook] generateQuiz did not return an array for chapter: ${chapterTitle}`);
        }

        // Attach a warning to the run if quizzes were requested but none saved
        if (!quizSavedSuccessfully) {
          const warningMsg = `Warning: quiz generation produced no valid questions for chapter "${chapterTitle}".`;
          try {
            const run = await prisma.generationRun.findUnique({
              where: { id: generationRunId },
              select: { error: true },
            });
            const existingWarnings = run?.error || "";
            await prisma.generationRun.update({
              where: { id: generationRunId },
              data: {
                error: existingWarnings
                  ? `${existingWarnings}\n${warningMsg}`
                  : warningMsg,
              },
            });
          } catch (warnErr) {
            console.error(`[Webhook] Failed to attach quiz warning:`, warnErr.message);
          }
        }
      }

      // ── 4. Generate video references for THIS chapter (if enabled) ──
      if (includeVideoReferences) {
        console.log(`[Webhook] Generating video references for chapter: ${chapterTitle}`);

        const videoRefs = await generateVideoReferences(topic, chapterTitle, contentData.content, language);

        if (Array.isArray(videoRefs) && videoRefs.length > 0) {
          // Clear existing video refs for this lesson (idempotent on retry)
          await prisma.videoReference.deleteMany({
            where: { lessonId },
          });

          for (const ref of videoRefs) {
            if (ref?.title && ref?.url) {
              await prisma.videoReference.create({
                data: {
                  lessonId,
                  title: ref.title,
                  platform: ref.platform || "YouTube",
                  url: ref.url,
                  reason: ref.reason || null,
                },
              });
            }
          }
          console.log(`[Webhook] Video references saved for chapter: ${chapterTitle} (${videoRefs.length} refs)`);
        }
      }

      // ── 5. Check if all chapters are done ──
      const chapterCount = Number.isInteger(expectedChapterCount)
        ? expectedChapterCount
        : await prisma.chapter.count({ where: { courseId } });

      const chaptersWithLessons = await prisma.chapter.findMany({
        where: { courseId },
        include: { lessons: { select: { id: true } } },
      });
      const finishedChapters = chaptersWithLessons.filter(
        (ch) => ch.lessons.length > 0
      ).length;

      if (finishedChapters === chapterCount) {
        // All chapters done — check if any quiz warnings exist before marking COMPLETED
        const run = await prisma.generationRun.findUnique({
          where: { id: generationRunId },
          select: { error: true },
        });
        let preservedWarnings = null;
        if (run?.error) {
          const warningLines = run.error
            .split("\n")
            .filter((line) => line.trim().startsWith("Warning:"))
            .join("\n");
          if (warningLines) {
            preservedWarnings = warningLines;
          }
        }

        await prisma.generationRun.update({
          where: { id: generationRunId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            error: preservedWarnings,
          },
        });
        console.log(
          `[Webhook] All chapters completed for course ${courseId}. Run ${generationRunId} marked COMPLETED.`
        );
      }

      return res.status(200).json({
        success: true,
        message: `Chapter ${chapterTitle} completed`,
      });
    }

    // Unknown type
    return res.status(400).json({ error: `Unknown job type: ${type}` });
  } catch (error) {
    console.error(`[Webhook] Error during [${type}]:`, error);

    // QStash sends the current retry count in the `upstash-retried` header.
    // We configured retries: 3 when publishing, so max retried value is 3.
    // Only mark as FAILED on the FINAL attempt — otherwise QStash will retry
    // and the next attempt can succeed, naturally resetting the status.
    const retriedCount = parseInt(req.headers["upstash-retried"] || "0", 10);
    const maxRetries = 3;
    const isLastAttempt = retriedCount >= maxRetries;

    if (generationRunId) {
      try {
        if (isLastAttempt) {
          // Final attempt failed — mark as permanently FAILED
          await prisma.generationRun.update({
            where: { id: generationRunId },
            data: {
              status: "FAILED",
              error: error.message,
              completedAt: new Date(),
            },
          });
          console.error(
            `[Webhook] Final retry exhausted for run ${generationRunId}. Marked FAILED.`
          );
        } else {
          // Transient failure — log error but keep status as RUNNING
          // so the next retry can pick up where it left off
          await prisma.generationRun.update({
            where: { id: generationRunId },
            data: {
              error: `Retrying [${type}] (attempt ${retriedCount + 1}/${maxRetries + 1}): ${error.message}`,
            },
          });
          console.log(
            `[Webhook] Transient error on run ${generationRunId}. QStash will retry (${retriedCount + 1}/${maxRetries + 1}).`
          );
        }
      } catch (markError) {
        console.error(
          `[Webhook] Failed to update status for run ${generationRunId}:`,
          markError.message
        );
      }
    }

    // Return 500 so QStash knows to retry this step
    return res.status(500).json({ error: error.message });
  }
};
