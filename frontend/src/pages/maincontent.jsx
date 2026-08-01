import { useMemo, useState } from "react";

const dummyCourse = {
  id: "preview-course",
  title: "Quantum Mechanics: A Modern Introduction",
  topic: "Quantum Mechanics",
  description: "Preview content shown until a generated course is opened.",
  estimatedDuration: 4.5,
  generationRun: { status: "COMPLETED" },
  chapters: [
    {
      id: "preview-chapter",
      title: "Quantum States and Observables",
      objective: "Understand how quantum states differ from classical states.",
      order: 1,
      lessons: [
        {
          id: "preview-lesson",
          title: "Quantum States",
          content:
            "The fundamental concept that distinguishes quantum mechanics from classical physics is the nature of the state of a system.\n\n## Superposition\n\nIf a quantum system can exist in state A and state B, it can also exist in a linear combination of both states.",
          keyTakeaways: [
            "Quantum systems are described by state vectors.",
            "Superposition allows combinations of possible states.",
            "Measurement changes the state into a definite outcome.",
          ],
          videoReferences: [],
          quiz: null,
        },
      ],
    },
  ],
};

const formatDuration = (hours) => {
  if (!hours) return "Estimated reading time";
  if (hours < 1) return `${Math.round(hours * 60)} min course`;
  return `${hours} hour course`;
};

function MarkdownLite({ content }) {
  const blocks = String(content || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block, index) => {
        if (block.startsWith("### ")) {
          return (
            <h4 className="font-display mt-10 text-2xl font-bold text-on-surface" key={`${block}-${index}`}>
              {block.replace(/^###\s+/, "")}
            </h4>
          );
        }

        if (block.startsWith("## ")) {
          return (
            <h3 className="font-display mt-14 text-3xl font-bold tracking-tight text-on-surface" key={`${block}-${index}`}>
              {block.replace(/^##\s+/, "")}
            </h3>
          );
        }

        if (block.startsWith("- ")) {
          return (
            <ul className="list-disc space-y-2 pl-6 text-base leading-7" key={`${block}-${index}`}>
              {block.split("\n").map((item) => (
                <li key={item}>{item.replace(/^-\s+/, "")}</li>
              ))}
            </ul>
          );
        }

        if (block.startsWith("```")) {
          return (
            <pre className="overflow-auto rounded-lg bg-surface-container-high p-5 text-sm text-on-surface" key={`${block}-${index}`}>
              <code>{block.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "")}</code>
            </pre>
          );
        }

        return (
          <p className="text-lg leading-[1.8] text-on-surface-variant" key={`${block}-${index}`}>
            {block}
          </p>
        );
      })}
    </>
  );
}

function QuizPanel({ courseId, lesson, onRevealQuiz }) {
  const quiz = lesson?.quiz;
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedQuiz, setRevealedQuiz] = useState(null);
  const [error, setError] = useState(null);

  if (!quiz?.questions?.length) {
    return null;
  }

  const revealAnswers = async () => {
    setIsRevealing(true);
    setError(null);

    try {
      const result = await onRevealQuiz({ courseId, quizId: quiz.id });
      setRevealedQuiz(result);
    } catch (revealError) {
      setError(revealError.message || "Could not reveal answers.");
    } finally {
      setIsRevealing(false);
    }
  };

  const answerByQuestionId = new Map(
    (revealedQuiz?.questions || []).map((question) => [question.id, question])
  );

  return (
    <section className="mt-14 rounded-lg border border-outline-variant/20 bg-surface-container-low p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-bold text-on-surface">Quiz</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Answers stay hidden until you reveal them.
          </p>
        </div>
        <button
          className="rounded-lg bg-tertiary-fixed px-4 py-2 text-sm font-bold text-on-tertiary-fixed disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isRevealing || Boolean(revealedQuiz)}
          onClick={revealAnswers}
          type="button"
        >
          {revealedQuiz ? "Answers Revealed" : isRevealing ? "Revealing" : "Reveal Answers"}
        </button>
      </div>

      <div className="space-y-5">
        {quiz.questions.map((question, index) => {
          const revealed = answerByQuestionId.get(question.id);
          return (
            <div className="rounded-lg bg-surface-container p-5" key={question.id}>
              <p className="font-semibold text-on-surface">
                {index + 1}. {question.question}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(question.options || []).map((option) => (
                  <div className="rounded-md border border-outline-variant/20 px-3 py-2 text-sm text-on-surface-variant" key={option}>
                    {option}
                  </div>
                ))}
              </div>
              {revealed && (
                <div className="mt-4 rounded-md border border-tertiary-fixed/30 bg-tertiary-fixed/10 px-4 py-3 text-sm">
                  <p className="font-bold text-on-surface">Answer: {revealed.answer}</p>
                  {revealed.explanation && (
                    <p className="mt-2 text-on-surface-variant">{revealed.explanation}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-on-error-container">
          {error}
        </p>
      )}
    </section>
  );
}

export default function MainContent({ course = dummyCourse, onBack, onRevealQuiz }) {
  const chapters = course?.chapters?.length ? course.chapters : dummyCourse.chapters;
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id);

  const activeChapter = useMemo(() => {
    return chapters.find((chapter) => chapter.id === activeChapterId) || chapters[0];
  }, [activeChapterId, chapters]);

  const activeChapterIndex = chapters.findIndex((chapter) => chapter.id === activeChapter?.id);
  const activeLesson = activeChapter?.lessons?.[0];
  const nextChapter = chapters[activeChapterIndex + 1];

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen selection:bg-tertiary-fixed selection:text-on-tertiary-fixed lg:flex">
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-col bg-surface-container-low py-8 shadow-[40px_0_40px_-15px_rgba(0,0,0,0.5)] lg:flex">
        <div className="mb-12 px-6">
          <h1 className="font-display text-2xl font-black tracking-tight text-on-surface">
            Text to Learn
          </h1>
        </div>

        <div className="mb-6 px-4">
          <button
            className="group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-on-surface-variant transition-colors duration-200 hover:bg-surface-container hover:text-on-surface"
            onClick={onBack}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] transition-colors duration-200 group-hover:text-tertiary-fixed">
              arrow_back
            </span>
            <span className="font-body text-sm font-medium">Go Back</span>
          </button>
        </div>

        <nav className="flex flex-grow flex-col gap-1 overflow-y-auto px-4">
          <div className="mb-4 mt-2 px-2">
            <span className="font-label text-xs uppercase tracking-[0.1em] text-on-surface-variant">
              Course Structure
            </span>
          </div>

          {chapters.map((chapter, index) => {
            const isActive = chapter.id === activeChapter?.id;
            return (
              <button
                className={`group flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-all duration-300 ${
                  isActive
                    ? "border-l-2 border-tertiary-fixed bg-surface-container text-on-surface"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
                key={chapter.id}
                onClick={() => setActiveChapterId(chapter.id)}
                type="button"
              >
                <span className={`font-display mt-0.5 text-sm font-bold ${isActive ? "text-tertiary-fixed" : "opacity-60"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-body text-sm font-medium leading-tight">{chapter.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 px-4 pt-6">
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-on-surface-variant opacity-50" type="button">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="font-body text-sm font-medium">Settings</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-on-surface-variant opacity-50" type="button">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span className="font-body text-sm font-medium">PDF Coming Later</span>
          </button>
        </div>
      </aside>

      <main className="relative w-full flex-grow pb-32 lg:ml-64">
        <header className="mx-auto w-full max-w-4xl px-6 pb-12 pt-10 sm:px-12 sm:pt-24">
          <button
            className="mb-8 flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2 text-sm text-on-surface-variant transition-colors hover:text-on-surface lg:hidden"
            onClick={onBack}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-tertiary-fixed">
            {course?.generationRun?.status || "Course"}
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-on-surface md:text-6xl">
            {course?.title || course?.topic || dummyCourse.title}
          </h1>
          {course?.description && (
            <p className="mt-5 max-w-2xl text-base leading-7 text-on-surface-variant">
              {course.description}
            </p>
          )}
        </header>

        <article className="mx-auto w-full max-w-3xl px-6 sm:px-12">
          <div className="mb-12 flex items-center gap-4 border-b border-surface-container-high/50 pb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
              <span className="font-display font-bold text-tertiary-fixed">
                {String(activeChapterIndex + 1).padStart(2, "0")}
              </span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-on-surface">
                {activeChapter?.title}
              </h2>
              <p className="mt-1 flex items-center gap-2 font-body text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                {formatDuration(course?.estimatedDuration)}
              </p>
            </div>
          </div>

          {activeChapter?.objective && (
            <blockquote className="relative my-10 overflow-hidden rounded-lg bg-surface-container-high py-6 pl-8 pr-6">
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-tertiary-fixed" />
              <p className="font-display text-xl font-medium leading-relaxed text-on-surface">
                {activeChapter.objective}
              </p>
            </blockquote>
          )}

          <div className="editorial-content font-body space-y-8">
            <MarkdownLite content={activeLesson?.content} />
          </div>

          {activeLesson?.keyTakeaways?.length > 0 && (
            <section className="mt-14 rounded-lg border border-outline-variant/20 bg-surface-container-low p-6">
              <h3 className="font-display text-2xl font-bold text-on-surface">Key Takeaways</h3>
              <ul className="mt-5 space-y-3">
                {activeLesson.keyTakeaways.map((takeaway) => (
                  <li className="flex gap-3 text-sm leading-6 text-on-surface-variant" key={takeaway}>
                    <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">check_circle</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-14 rounded-lg border border-outline-variant/20 bg-surface-container-low p-6">
            <h3 className="font-display text-2xl font-bold text-on-surface">Video References</h3>
            {activeLesson?.videoReferences?.length ? (
              <div className="mt-5 space-y-3">
                {activeLesson.videoReferences.map((video) => (
                  <a
                    className="block rounded-lg bg-surface-container p-4 text-sm text-on-surface-variant hover:text-on-surface"
                    href={video.url}
                    key={video.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {video.title}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-on-surface-variant">
                No video references available for this lesson.
              </p>
            )}
          </section>

          <QuizPanel courseId={course.id} lesson={activeLesson} onRevealQuiz={onRevealQuiz} />
        </article>

        {nextChapter && (
          <div className="fixed bottom-8 right-6 z-40 sm:right-12">
            <button
              className="glass-panel group flex items-center gap-3 rounded-full border border-outline-variant/20 px-6 py-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-outline-variant/40 hover:bg-surface-container/80"
              onClick={() => setActiveChapterId(nextChapter.id)}
              type="button"
            >
              <span className="font-body text-sm font-semibold tracking-wide text-on-surface">
                Continue to {nextChapter.title}
              </span>
              <span className="material-symbols-outlined text-tertiary-fixed transition-transform duration-300 group-hover:translate-x-1">
                arrow_forward
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
