import { useCallback, useEffect, useState } from "react";
import { useVoiceTranscription } from "../hooks/useVoiceTranscription";
import { getUserCourses, deleteCourse } from "../services/courseService";
import CourseDeleteModal from "./CourseDeleteModal";

const suggestions = [
  {
    icon: "science",
    title: "Advanced Biology",
    description: "Synthesize complex cellular pathways into focused lessons.",
  },
  {
    icon: "architecture",
    title: "Sustainable Urbanism",
    description: "Build a course on green technology and modern city life.",
  },
  {
    icon: "history_edu",
    title: "Global Philosophies",
    description: "Explore major schools of thought through guided chapters.",
  },
];

const statusCopy = {
  IDLE: "Ready",
  QUEUING: "Sending your topic to the backend",
  PENDING: "Course queued",
  RUNNING: "Generating chapters and lessons",
  COMPLETED: "Course ready",
  FAILED: "Generation failed",
};

export default function Homepage({
  generation,
  getToken,
  isSyncingUser,
  latestCourse,
  onCreateCourse,
  onLogout,
  onOpenCourse,
  isLoadingCourse,
  syncError,
  user,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("create"); // "create" | "library"
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const voice = useVoiceTranscription({
    getToken,
    onTranscription: (text) => {
      setSearchQuery(text);
    },
  });

  const fetchCourses = useCallback(async (page = 1) => {
    if (!getToken) return;
    try {
      setIsLoadingCourses(true);
      const token = await getToken();
      const data = await getUserCourses({ token, page, limit: 12 });
      if (data?.courses) {
        setCourses(data.courses);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch user courses:", error);
    } finally {
      setIsLoadingCourses(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user && !isSyncingUser) {
      fetchCourses(1);
    }
  }, [user, isSyncingUser, fetchCourses]);

  useEffect(() => {
    if (generation?.status === "COMPLETED") {
      fetchCourses(1);
    }
  }, [generation?.status, fetchCourses]);

  const handleConfirmDelete = async (courseId) => {
    try {
      const token = await getToken();
      await deleteCourse({ token, courseId });
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      setCourseToDelete(null);
    } catch (error) {
      console.error("Failed deleting course:", error);
      throw error;
    }
  };

  const submitTopic = useCallback(
    (topic = searchQuery) => {
      const cleanTopic = topic.trim();
      if (!cleanTopic || generation?.isGenerating) return;
      setActiveTab("create");
      onCreateCourse(cleanTopic);
    },
    [generation?.isGenerating, onCreateCourse, searchQuery]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    submitTopic();
  };

  return (
    <div className="font-body selection:bg-tertiary selection:text-on-tertiary min-h-screen relative">
      {/* ── Delete Confirmation Modal ── */}
      <CourseDeleteModal
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDelete}
        course={courseToDelete}
      />

      {/* ── Left Sidebar Navigation ── */}
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col space-y-8 bg-surface-container-low p-6 lg:flex border-r border-outline-variant/10">
        <div className="flex items-center space-x-3">
          <span className="material-symbols-outlined text-tertiary-fixed">school</span>
          <span className="font-headline text-xl font-bold tracking-tighter text-on-surface">
            Text to Learn
          </span>
        </div>

        <nav className="flex flex-col space-y-2">
          <button
            className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-300 ${
              activeTab === "library"
                ? "border-l-2 border-tertiary-fixed bg-primary-container text-on-surface font-medium"
                : "text-primary opacity-70 hover:bg-surface-bright hover:text-on-surface hover:opacity-100"
            }`}
            onClick={() => setActiveTab("library")}
            type="button"
          >
            <span className="material-symbols-outlined">menu_book</span>
            <span className="font-medium">My Courses</span>
          </button>

          <button
            className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-300 ${
              activeTab === "create"
                ? "border-l-2 border-tertiary-fixed bg-primary-container text-on-surface font-medium"
                : "text-primary opacity-70 hover:bg-surface-bright hover:text-on-surface hover:opacity-100"
            }`}
            onClick={() => {
              setActiveTab("create");
              if (!searchQuery && !generation?.isGenerating) {
                // Just switch tab
              }
            }}
            type="button"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className="font-medium">Create New</span>
          </button>
        </nav>

        {/* ── Recent Courses (Sidebar History) ── */}
        <div className="flex-grow overflow-y-auto pr-1">
          <h3 className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Recent Courses
          </h3>
          {isLoadingCourses && courses.length === 0 ? (
            <div className="space-y-2 px-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-9 rounded-lg bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="px-4 text-xs text-on-surface-variant italic">No courses generated yet.</p>
          ) : (
            <div className="flex flex-col space-y-1">
              {courses.slice(0, 10).map((item) => {
                const isComplete = !item.generationRun || item.generationRun.status === "COMPLETED";
                const isFailed = item.generationRun?.status === "FAILED";

                return (
                  <div
                    key={item.id}
                    className="group relative flex items-center justify-between rounded-lg transition-all duration-200 hover:bg-surface-bright"
                  >
                    <button
                      className="flex flex-grow items-center space-x-3 px-3.5 py-2 text-left text-sm text-primary opacity-80 transition-all hover:text-on-surface hover:opacity-100 truncate pr-8"
                      onClick={() => {
                        if (isComplete) {
                          onOpenCourse(item);
                        } else {
                          setActiveTab("library");
                        }
                      }}
                      title={item.title || item.topic}
                      type="button"
                    >
                      <span className={`material-symbols-outlined shrink-0 text-sm ${
                        isComplete ? "text-tertiary-fixed" : isFailed ? "text-error" : "text-tertiary animate-spin"
                      }`}>
                        {isComplete ? "menu_book" : isFailed ? "error_outline" : "progress_activity"}
                      </span>
                      <span className="truncate font-medium text-xs">{item.title || item.topic}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCourseToDelete(item);
                      }}
                      className="absolute right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error-container/40 text-on-surface-variant hover:text-error transition-all"
                      title="Delete course"
                    >
                      <span className="material-symbols-outlined text-sm block">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sidebar Bottom Account Controls ── */}
        <div className="flex flex-col space-y-2 pt-4 border-t border-outline-variant/10">
          <button className="flex items-center space-x-3 rounded-lg px-4 py-2 text-left text-sm text-primary opacity-50" type="button">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </button>
          <button
            className="flex items-center space-x-3 rounded-lg px-4 py-2 text-left text-sm text-primary opacity-70 transition-all hover:bg-surface-bright hover:text-on-surface hover:opacity-100"
            onClick={onLogout}
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace Area ── */}
      <main className="min-h-screen lg:ml-72">
        <header className="flex w-full items-center justify-between px-6 py-6 sm:px-10 lg:justify-end lg:px-12 lg:py-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="material-symbols-outlined text-tertiary-fixed">school</span>
            <span className="font-headline text-lg font-black">Text to Learn</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-on-surface">{user?.name || "Learner"}</p>
              <p className="text-xs text-on-surface-variant">
                {isSyncingUser ? "Syncing profile" : "Ready to generate"}
              </p>
            </div>
            <button
              className="h-10 w-10 overflow-hidden rounded-full border border-outline-variant/20 transition-colors hover:border-tertiary-fixed"
              onClick={onLogout}
              title="Sign out"
              type="button"
            >
              {user?.picture ? (
                <img alt={user?.name || "User profile"} className="h-full w-full object-cover" src={user.picture} />
              ) : (
                <span className="material-symbols-outlined flex h-full w-full items-center justify-center bg-surface-container-high text-tertiary-fixed">
                  person
                </span>
              )}
            </button>
          </div>
        </header>

        {/* ── Tab Content Switcher ── */}
        {activeTab === "create" ? (
          /* ── Hero Search & AI Generator View ── */
          <section className="flex min-h-[calc(100vh-96px)] flex-col items-center justify-center px-6 pb-16 pt-6">
            <div className="mb-6">
              <span className="material-symbols-outlined text-5xl text-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>

            <h1 className="font-headline mb-12 select-none text-center text-5xl font-black tracking-tighter text-on-surface sm:text-7xl lg:text-8xl">
              TEXT TO LEARN
            </h1>

            <form className="group relative w-full max-w-3xl" onSubmit={handleSubmit}>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-tertiary-fixed/20 to-primary/10 opacity-25 blur transition duration-1000 group-hover:opacity-40" />
              <div className="relative flex items-center rounded-xl border border-outline-variant/10 bg-surface-container-high px-5 py-4 shadow-2xl sm:px-8 sm:py-6">
                <span className="material-symbols-outlined mr-4 text-on-surface-variant">search</span>
                <input
                  className="w-full border-none bg-transparent font-body text-base text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-0 sm:text-xl"
                  placeholder="What would you like to learn today?"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <button
                  className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-all hover:bg-surface-bright hover:text-on-surface active:scale-95"
                  onClick={voice.toggleRecording}
                  title={voice.isRecording ? "Stop recording" : "Record voice"}
                  type="button"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: voice.isRecording ? "'FILL' 1" : "'FILL' 0" }}>
                    {voice.isProcessing ? "hourglass_top" : "mic"}
                  </span>
                </button>
                <button
                  className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-lg transition-all hover:bg-tertiary-fixed hover:text-on-tertiary-fixed active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!searchQuery.trim() || generation?.isGenerating}
                  title="Generate course"
                  type="submit"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </form>

            {(generation?.isGenerating || generation?.error || syncError || voice.error || latestCourse || isLoadingCourse) && (
              <div className="mt-8 w-full max-w-3xl rounded-lg border border-outline-variant/20 bg-surface-container-low p-5">
                {isLoadingCourse && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-tertiary-fixed">progress_activity</span>
                    <p className="font-semibold text-on-surface text-sm">Loading complete course contents...</p>
                  </div>
                )}

                {generation?.isGenerating && !isLoadingCourse && (
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined animate-pulse text-tertiary-fixed">progress_activity</span>
                    <div>
                      <p className="font-semibold text-on-surface">{statusCopy[generation.status] || generation.status}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Keep this page open while the backend worker creates chapters, lessons, and quiz questions.
                      </p>
                    </div>
                  </div>
                )}

                {latestCourse && !generation?.isGenerating && !isLoadingCourse && (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-on-surface">{latestCourse.title || latestCourse.topic}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Your latest generated course is ready to read.
                      </p>
                    </div>
                    <button
                      className="rounded-lg bg-tertiary-fixed px-4 py-2 text-sm font-bold text-on-tertiary-fixed transition-transform active:scale-95"
                      onClick={() => onOpenCourse(latestCourse)}
                      type="button"
                    >
                      Open Course
                    </button>
                  </div>
                )}

                {(generation?.error || syncError || voice.error) && (
                  <p className="mt-4 rounded-md border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-on-error-container">
                    {generation?.error || syncError || voice.error}
                  </p>
                )}
              </div>
            )}

            <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((item) => (
                <button
                  key={item.title}
                  className="group rounded-lg border border-outline-variant/10 bg-surface-container-low p-6 text-left transition-all hover:border-tertiary-fixed/30"
                  onClick={() => {
                    setSearchQuery(item.title);
                    submitTopic(item.title);
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined mb-4 block text-tertiary-fixed">{item.icon}</span>
                  <h4 className="mb-2 font-bold text-on-surface">{item.title}</h4>
                  <p className="text-xs leading-relaxed text-on-surface-variant">{item.description}</p>
                </button>
              ))}
            </div>
          </section>
        ) : (
          /* ── Course Library Dashboard Grid View ── */
          <section className="px-6 py-8 sm:px-10 lg:px-12 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-outline-variant/10">
              <div>
                <h1 className="font-headline text-3xl sm:text-4xl font-black tracking-tight text-on-surface">
                  My Courses
                </h1>
                <p className="text-sm text-on-surface-variant mt-1">
                  Explore, review, or remove your generated AI learning guides.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchCourses(1)}
                disabled={isLoadingCourses}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-sm font-bold text-on-surface hover:bg-surface-bright transition-all active:scale-95 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-base ${isLoadingCourses ? "animate-spin" : ""}`}>
                  refresh
                </span>
                <span>Refresh List</span>
              </button>
            </div>

            {isLoadingCourse && (
              <div className="mb-8 p-4 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center gap-3">
                <span className="material-symbols-outlined animate-spin text-tertiary-fixed">progress_activity</span>
                <span className="text-sm font-semibold text-on-surface">Opening course contents...</span>
              </div>
            )}

            {isLoadingCourses && courses.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-56 rounded-xl bg-surface-container-low border border-outline-variant/10 p-6 animate-pulse flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="h-6 w-3/4 bg-surface-container rounded" />
                      <div className="h-4 w-full bg-surface-container rounded" />
                      <div className="h-4 w-5/6 bg-surface-container rounded" />
                    </div>
                    <div className="h-10 w-1/3 bg-surface-container rounded-lg" />
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-xl border border-outline-variant/10 p-8 max-w-2xl mx-auto">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-40">menu_book</span>
                <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Your Library is Empty</h3>
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                  You haven't generated any course guides yet. Enter a topic in the AI generator to start learning!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("create")}
                  className="px-6 py-3 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-lg"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>Create First Course</span>
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    const isComplete = !course.generationRun || course.generationRun.status === "COMPLETED";
                    const isFailed = course.generationRun?.status === "FAILED";
                    const statusText = course.generationRun?.status || "COMPLETED";

                    return (
                      <div
                        key={course.id}
                        className="group relative flex flex-col justify-between rounded-xl border border-outline-variant/10 bg-surface-container-high p-6 shadow-xl transition-all duration-300 hover:border-tertiary-fixed/30 hover:shadow-2xl"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-surface-container text-tertiary-fixed border border-outline-variant/20">
                              {course.depth || "BASIC"}
                            </span>

                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                              isComplete
                                ? "bg-tertiary-fixed/10 text-tertiary-fixed border border-tertiary-fixed/20"
                                : isFailed
                                ? "bg-error-container/30 text-error border border-error/30"
                                : "bg-primary-container text-on-primary-container animate-pulse"
                            }`}>
                              <span className="material-symbols-outlined text-[12px]">
                                {isComplete ? "check_circle" : isFailed ? "error" : "progress_activity"}
                              </span>
                              <span>{statusText}</span>
                            </span>
                          </div>

                          <h3 className="text-lg font-bold tracking-tight text-on-surface font-headline mb-2 line-clamp-1" title={course.title || course.topic}>
                            {course.title || course.topic}
                          </h3>

                          <p className="text-xs text-on-surface-variant line-clamp-2 mb-6 leading-relaxed">
                            {course.description || `AI curated exploration of ${course.topic} presented in structured chapters.`}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            disabled={!isComplete || isLoadingCourse}
                            onClick={() => onOpenCourse(course)}
                            className="flex-grow py-2.5 px-4 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs hover:bg-tertiary-fixed/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow"
                          >
                            <span className="material-symbols-outlined text-sm">menu_book</span>
                            <span>{isComplete ? "Read Course" : "Generating..."}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCourseToDelete(course);
                            }}
                            className="p-2.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-error-container/40 hover:text-error transition-all shrink-0 active:scale-90"
                            title="Delete course"
                          >
                            <span className="material-symbols-outlined text-sm block">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Pagination Footer ── */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12 pt-6 border-t border-outline-variant/10">
                    <button
                      type="button"
                      disabled={pagination.page <= 1 || isLoadingCourses}
                      onClick={() => fetchCourses(pagination.page - 1)}
                      className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-xs font-bold text-on-surface transition-all hover:bg-surface-bright disabled:opacity-30 active:scale-95 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span>Previous</span>
                    </button>

                    <span className="text-xs font-semibold text-on-surface-variant px-3 py-1 bg-surface-container-low rounded">
                      Page <strong className="text-on-surface">{pagination.page}</strong> of <strong className="text-on-surface">{pagination.totalPages}</strong>
                    </span>

                    <button
                      type="button"
                      disabled={pagination.page >= pagination.totalPages || isLoadingCourses}
                      onClick={() => fetchCourses(pagination.page + 1)}
                      className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-xs font-bold text-on-surface transition-all hover:bg-surface-bright disabled:opacity-30 active:scale-95 flex items-center gap-1"
                    >
                      <span>Next</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
