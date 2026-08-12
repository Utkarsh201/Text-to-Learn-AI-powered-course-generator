export default function LandingPage({ onNavigateToLogin, onNavigateToSignup }) {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-tertiary-container selection:text-on-tertiary-container">
      {/* ── Top Navigation ── */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-outline-variant/10 bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span
              className="material-symbols-outlined text-2xl text-tertiary-fixed"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              school
            </span>
            <span className="font-headline text-lg font-black uppercase tracking-wider text-on-surface">
              Text to Learn
            </span>
          </div>

          {/* Center Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            {["Courses", "Features", "Pricing", "About"].map((link) => (
              <button
                key={link}
                type="button"
                className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
                onClick={onNavigateToLogin}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Sign In Button */}
          <button
            onClick={onNavigateToLogin}
            type="button"
            className="rounded-full border border-tertiary-fixed/40 bg-tertiary-fixed/10 px-5 py-2 text-sm font-bold text-tertiary-fixed transition-all hover:bg-tertiary-fixed/20 hover:border-tertiary-fixed/60 active:scale-[0.97]"
          >
            Sign In
          </button>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-20">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-tertiary-fixed/5 blur-[120px]" />

        {/* Badge */}
        <div className="relative mb-8 flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container px-5 py-2 shadow-lg">
          <span
            className="material-symbols-outlined text-base text-tertiary-fixed"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span className="text-xs font-semibold text-on-surface-variant">
            AI-powered educational ecosystem
          </span>
        </div>

        {/* Headline */}
        <h1 className="relative max-w-3xl text-center font-headline text-5xl font-black leading-[1.1] tracking-tight text-on-surface sm:text-6xl lg:text-7xl">
          The AI platform that
          <br />
          helps you{" "}
          <em className="not-italic bg-gradient-to-r from-tertiary-fixed via-tertiary to-primary bg-clip-text text-transparent">
            Learn
          </em>
        </h1>

        {/* Subtitle */}
        <p className="relative mt-6 max-w-2xl text-center text-base leading-7 text-on-surface-variant sm:text-lg">
          Text to Learn is an intelligent ecosystem designed to transform how you
          acquire knowledge, manage your study materials, and master new skills
          through AI-driven insights.
        </p>

        {/* CTA Button */}
        <button
          onClick={onNavigateToSignup}
          type="button"
          className="relative mt-10 rounded-full bg-tertiary-fixed px-8 py-3.5 text-sm font-bold text-on-tertiary-fixed shadow-xl shadow-tertiary-fixed/20 transition-all hover:brightness-110 hover:shadow-tertiary-fixed/30 active:scale-[0.97]"
        >
          Get started for free
        </button>

        {/* ── Feature Cards (Fanned Overlap) ── */}
        <div className="relative mt-24 w-full max-w-5xl overflow-hidden px-4" style={{ perspective: "1200px" }}>
          <div className="relative mx-auto flex h-[340px] w-full max-w-[700px] items-end justify-center sm:h-[400px]">
            {/* Card 1 – leftmost, most rotated */}
            <div
              className="absolute bottom-0 left-[5%] z-10 flex h-[280px] w-[180px] flex-col justify-between rounded-3xl p-6 shadow-2xl sm:left-[8%] sm:h-[340px] sm:w-[220px]"
              style={{
                background: "linear-gradient(160deg, #5b21b6 0%, #7c3aed 40%, #4c1d95 100%)",
                transform: "rotateY(25deg) rotateZ(-3deg)",
                transformOrigin: "bottom center",
              }}
            >
              <span
                className="material-symbols-outlined text-4xl text-white/80"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                menu_book
              </span>
              <div>
                <p className="text-lg font-black leading-tight text-white sm:text-xl">
                  AI Study
                  <br />
                  Guide
                </p>
              </div>
            </div>

            {/* Card 2 – center-left */}
            <div
              className="absolute bottom-0 left-[22%] z-20 flex h-[290px] w-[180px] flex-col justify-between rounded-3xl p-6 shadow-2xl sm:left-[24%] sm:h-[350px] sm:w-[220px]"
              style={{
                background: "linear-gradient(160deg, #6d28d9 0%, #8b5cf6 40%, #5b21b6 100%)",
                transform: "rotateY(15deg) rotateZ(-1.5deg)",
                transformOrigin: "bottom center",
              }}
            >
              <span
                className="material-symbols-outlined text-4xl text-white/80"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
              <div>
                <p className="text-lg font-black leading-tight text-white sm:text-xl">
                  Interactive
                  <br />
                  Courses
                </p>
              </div>
            </div>

            {/* Card 3 – center */}
            <div
              className="absolute bottom-0 left-1/2 z-30 flex h-[300px] w-[180px] -translate-x-1/2 flex-col justify-between rounded-3xl p-6 shadow-2xl sm:h-[360px] sm:w-[220px]"
              style={{
                background: "linear-gradient(160deg, #818cf8 0%, #6366f1 40%, #4f46e5 100%)",
                transform: "translateX(-50%) rotateY(0deg)",
                transformOrigin: "bottom center",
              }}
            >
              <span
                className="material-symbols-outlined text-4xl text-white/80"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                quiz
              </span>
              <div>
                <p className="text-lg font-black leading-tight text-white sm:text-xl">
                  Smart
                  <br />
                  Quizzes
                </p>
              </div>
            </div>

            {/* Card 4 – center-right */}
            <div
              className="absolute bottom-0 right-[22%] z-20 flex h-[290px] w-[180px] flex-col justify-between rounded-3xl p-6 shadow-2xl sm:right-[24%] sm:h-[350px] sm:w-[220px]"
              style={{
                background: "linear-gradient(160deg, #3730a3 0%, #4338ca 40%, #312e81 100%)",
                transform: "rotateY(-15deg) rotateZ(1.5deg)",
                transformOrigin: "bottom center",
              }}
            >
              <span
                className="material-symbols-outlined text-4xl text-white/80"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                description
              </span>
              <div>
                <p className="text-lg font-black leading-tight text-white sm:text-xl">
                  Smart
                  <br />
                  Summaries
                </p>
              </div>
            </div>

            {/* Card 5 – rightmost, most rotated */}
            <div
              className="absolute bottom-0 right-[5%] z-10 flex h-[280px] w-[180px] flex-col justify-between rounded-3xl p-6 shadow-2xl sm:right-[8%] sm:h-[340px] sm:w-[220px]"
              style={{
                background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)",
                transform: "rotateY(-25deg) rotateZ(3deg)",
                transformOrigin: "bottom center",
              }}
            >
              <span
                className="material-symbols-outlined text-4xl text-white/80"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                video_library
              </span>
              <div>
                <p className="text-lg font-black leading-tight text-white sm:text-xl">
                  Video
                  <br />
                  References
                </p>
              </div>
            </div>
          </div>

          {/* Fade-out gradient at the bottom */}
          <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent" />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-outline-variant/10 bg-surface-container-lowest">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-8">
          {["RESEARCH", "ANALYZE", "LEARN"].map((link) => (
            <span
              className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant opacity-50"
              key={link}
            >
              {link}
            </span>
          ))}
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-outline">
            Text to Learn © 2024–2026
          </span>
        </div>
      </footer>
    </div>
  );
}
