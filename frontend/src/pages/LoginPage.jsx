export default function LoginPage({ authError, onLogin, onSwitchToSignup, onBack }) {
  const handleGoogleLogin = () => {
    onLogin?.();
  };

  const handleGitHubLogin = () => {
    onLogin?.();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0e0e0e_0%,#151616_48%,#0e0e0e_100%)] text-on-surface font-body selection:bg-tertiary-container selection:text-on-tertiary-container">
      {/* Header */}
      <header className="fixed left-0 top-0 z-50 flex w-full items-center justify-between px-6 py-6 sm:px-12 sm:py-8">
        <button
          onClick={onBack}
          type="button"
          className="font-headline text-2xl font-black tracking-tight text-on-surface hover:text-tertiary-fixed transition-colors"
        >
          Text to Learn
        </button>
        <span
          className="material-symbols-outlined text-3xl text-tertiary-fixed"
          aria-hidden="true"
        >
          auto_awesome
        </span>
      </header>

      {/* Main Content */}
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-32 sm:px-6">
        {/* Decorative Icons */}
        <span
          className="material-symbols-outlined pointer-events-none absolute right-[12%] top-[16%] hidden text-4xl text-tertiary/25 sm:block"
          aria-hidden="true"
        >
          colors_spark
        </span>
        <span
          className="material-symbols-outlined pointer-events-none absolute bottom-[20%] left-[12%] hidden text-2xl text-tertiary/20 sm:block"
          aria-hidden="true"
        >
          star
        </span>

        <section className="relative z-10 w-full max-w-md">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container/70 p-7 shadow-2xl backdrop-blur-2xl sm:p-10">
            {/* Hero Copy */}
            <div className="mb-10 text-center sm:mb-12">
              <h1 className="mb-3 font-headline text-4xl font-bold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm leading-6 text-on-surface-variant">
                Continue your educational journey with AI intelligence.
              </p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-4">
              {/* Google */}
              <button
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-surface-container-high px-5 py-4 text-on-surface transition-all hover:bg-surface-bright focus:outline-none focus:ring-1 focus:ring-tertiary-fixed active:scale-[0.98]"
                onClick={handleGoogleLogin}
                type="button"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-semibold">
                  Continue with Google
                </span>
              </button>

              {/* GitHub */}
              <button
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-surface-container-high px-5 py-4 text-on-surface transition-all hover:bg-surface-bright focus:outline-none focus:ring-1 focus:ring-tertiary-fixed active:scale-[0.98]"
                onClick={handleGitHubLogin}
                type="button"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span className="text-sm font-semibold">
                  Continue with GitHub
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-outline-variant/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">
                Secure OAuth
              </span>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>

            {/* Info Note */}
            <p className="text-center text-xs leading-5 text-on-surface-variant">
              We use{" "}
              <span className="font-semibold text-tertiary-fixed">Auth0</span>{" "}
              for secure authentication. No passwords are stored on our servers.
            </p>

            {authError && (
              <p className="mt-5 rounded-lg border border-error/30 bg-error-container/30 px-4 py-3 text-center text-xs text-on-error-container">
                {authError}
              </p>
            )}

            {/* Sign Up Link */}
            <div className="mt-10 border-t border-outline-variant/20 pt-8 text-center sm:mt-12">
              <p className="text-sm text-on-surface-variant">
                Don't have an account?
                <button
                  className="ml-1 font-bold text-on-surface transition-colors hover:text-tertiary-fixed"
                  onClick={onSwitchToSignup}
                  type="button"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>

          {/* Bottom Tag */}
          <div className="mt-8 flex justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-outline">
            <span>Edition 2.0</span>
            <span aria-hidden="true">|</span>
            <span>Secure Auth</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 pb-8 pt-4">
        {["RESEARCH", "ANALYZE", "LEARN"].map((link) => (
          <a
            className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant transition-colors hover:text-tertiary-fixed"
            href="#"
            key={link}
          >
            {link}
          </a>
        ))}
        <span className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-outline">
          Text to Learn © 2024–2026
        </span>
      </footer>
    </div>
  );
}
