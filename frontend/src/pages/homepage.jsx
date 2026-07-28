import { useCallback, useState } from "react";
import { useVoiceTranscription } from "../hooks/useVoiceTranscription";

const ideaHistory = [
  { label: "Quantum Physics", icon: "history" },
  { label: "Modern Architecture", icon: "history" },
  { label: "UI Design Trends", icon: "history" },
];

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
  syncError,
  user,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const voice = useVoiceTranscription({
    getToken,
    onTranscription: (text) => {
      setSearchQuery(text);
    },
  });

  const submitTopic = useCallback(
    (topic = searchQuery) => {
      const cleanTopic = topic.trim();
      if (!cleanTopic || generation?.isGenerating) return;
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
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col space-y-10 bg-surface-container-low p-6 lg:flex">
        <div className="flex items-center space-x-3">
          <span className="material-symbols-outlined text-tertiary-fixed">school</span>
          <span className="font-headline text-xl font-bold tracking-tighter text-on-surface">
            Text to Learn
          </span>
        </div>

        <nav className="flex flex-col space-y-2">
          <button
            className="flex items-center space-x-3 rounded-lg border-l-2 border-tertiary-fixed bg-primary-container px-4 py-3 text-on-surface transition-all duration-300"
            type="button"
          >
            <span className="material-symbols-outlined">school</span>
            <span className="font-medium">My Course</span>
          </button>

          <button
            className="flex items-center space-x-3 rounded-lg px-4 py-3 text-primary opacity-70 transition-all duration-300 hover:bg-surface-bright hover:text-on-surface hover:opacity-100"
            onClick={() => submitTopic()}
            type="button"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className="font-medium">Create New</span>
          </button>
        </nav>

        <div className="flex-grow">
          <h3 className="mb-6 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Idea Starters
          </h3>
          <div className="flex flex-col space-y-1">
            {ideaHistory.map((item) => (
              <button
                key={item.label}
                className="flex items-center space-x-3 rounded-lg px-4 py-2 text-left text-sm text-primary opacity-70 transition-all duration-300 hover:bg-surface-bright hover:text-on-surface hover:opacity-100"
                onClick={() => {
                  setSearchQuery(item.label);
                  submitTopic(item.label);
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-xs">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-2 pt-6">
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

          {(generation?.isGenerating || generation?.error || syncError || voice.error || latestCourse) && (
            <div className="mt-8 w-full max-w-3xl rounded-lg border border-outline-variant/20 bg-surface-container-low p-5">
              {generation?.isGenerating && (
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

              {latestCourse && !generation?.isGenerating && (
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
                className="group rounded-lg border border-outline-variant/5 bg-surface-container-low p-6 text-left transition-all hover:border-tertiary-fixed/30"
                onClick={() => {
                  setSearchQuery(item.title);
                  submitTopic(item.title);
                }}
                type="button"
              >
                <span className="material-symbols-outlined mb-4 block text-tertiary-fixed">{item.icon}</span>
                <h4 className="mb-2 font-bold">{item.title}</h4>
                <p className="text-xs leading-relaxed text-on-surface-variant">{item.description}</p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
