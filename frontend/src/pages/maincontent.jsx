import React from "react";

export default function MainContent() {
  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
      {/* Course TOC Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low flex flex-col py-8 z-30 shadow-[40px_0_40px_-15px_rgba(0,0,0,0.5)]">
        {/* Logo Header */}
        <div className="px-6 mb-12">
          <h1 className="font-display text-2xl font-black tracking-[-2%] text-on-surface">
            Text to Learn
          </h1>
        </div>

        {/* Back Action */}
        <div className="px-4 mb-6">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200 text-left group">
            <span className="material-symbols-outlined text-[20px] group-hover:text-tertiary-fixed transition-colors duration-200">
              arrow_back
            </span>
            <span className="font-body text-sm font-medium">Go Back</span>
          </button>
        </div>

        {/* Course Chapters List */}
        <nav className="flex-grow overflow-y-auto px-4 flex flex-col gap-1">
          <div className="px-2 mb-4 mt-2">
            <span className="font-label text-xs tracking-[0.1em] text-on-surface-variant uppercase">
              Course Structure
            </span>
          </div>

          <a
            className="group flex items-start gap-3 px-3 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all duration-300"
            href="#"
          >
            <span className="font-display font-bold text-sm mt-0.5 opacity-60">
              01
            </span>
            <span className="font-body text-sm font-medium leading-tight">
              Introduction to Quantum Mechanics
            </span>
          </a>

          {/* Active Chapter */}
          <a
            className="group flex items-start gap-3 px-3 py-3 rounded-lg bg-surface-container text-on-surface border-l-2 border-tertiary-fixed relative before:absolute before:inset-0 before:bg-surface-bright/5 before:rounded-lg pointer-events-none"
            href="#"
          >
            <span className="font-display font-bold text-sm mt-0.5 text-tertiary-fixed">
              02
            </span>
            <span className="font-body text-sm font-semibold leading-tight">
              Quantum States and Observables
            </span>
          </a>

          <a
            className="group flex items-start gap-3 px-3 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all duration-300"
            href="#"
          >
            <span className="font-display font-bold text-sm mt-0.5 opacity-60">
              03
            </span>
            <span className="font-body text-sm font-medium leading-tight">
              Wave Functions
            </span>
          </a>

          <a
            className="group flex items-start gap-3 px-3 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all duration-300"
            href="#"
          >
            <span className="font-display font-bold text-sm mt-0.5 opacity-60">
              04
            </span>
            <span className="font-body text-sm font-medium leading-tight">
              The Schrödinger Equation
            </span>
          </a>

          <a
            className="group flex items-start gap-3 px-3 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all duration-300"
            href="#"
          >
            <span className="font-display font-bold text-sm mt-0.5 opacity-60">
              05
            </span>
            <span className="font-body text-sm font-medium leading-tight">
              Quantum Entanglement
            </span>
          </a>
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto px-4 pt-6 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200 text-left">
            <span className="material-symbols-outlined text-[20px]">
              settings
            </span>
            <span className="font-body text-sm font-medium">Settings</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200 text-left">
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="font-body text-sm font-medium">Help</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-grow relative w-full pb-32">
        {/* Header Section */}
        <header className="w-full max-w-4xl mx-auto px-12 pt-24 pb-16">
          <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight text-on-surface leading-[1.1]">
            Quantum Mechanics: <br />
            <span className="text-on-surface-variant">
              A Modern Introduction
            </span>
          </h1>
        </header>

        {/* Chapter Content Canvas */}
        <article className="w-full max-w-3xl mx-auto px-12">
          {/* Chapter Metadata */}
          <div className="flex items-center gap-4 mb-12 pb-8 border-b border-surface-container-high/50">
            <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="font-display font-bold text-tertiary-fixed">
                02
              </span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-on-surface">
                Quantum States
              </h2>
              <p className="font-body text-sm text-on-surface-variant mt-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  schedule
                </span>
                45 min read
              </p>
            </div>
          </div>

          {/* Editorial Text Body */}
          <div className="editorial-content font-body text-lg leading-[1.8] text-on-surface-variant space-y-8">
            <p>
              The fundamental concept that distinguishes quantum mechanics from
              classical physics is the nature of the state of a system. In
              classical mechanics, the state of a particle is completely
              specified by its position and momentum at a given time. If we know
              these values, we can predict its future behavior using Newton's
              laws.
            </p>

            <p>
              However, in the quantum realm, this deterministic view breaks
              down. We introduce a mathematical entity called the{" "}
              <strong className="text-on-surface font-semibold">
                state vector
              </strong>{" "}
              or{" "}
              <strong className="text-on-surface font-semibold">
                wave function
              </strong>
              , usually denoted by the Greek letter psi (Ψ). This object
              contains all the information that can possibly be known about the
              system, but it does not specify exact values for position and
              momentum simultaneously.
            </p>

            {/* High-End Blockquote Pattern */}
            <blockquote className="relative my-12 py-8 pl-10 pr-6 bg-surface-container-high rounded-xl overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-fixed"></div>
              <span className="material-symbols-outlined absolute right-6 bottom-6 text-6xl text-surface-bright/30 pointer-events-none -rotate-12 group-hover:scale-110 transition-transform duration-500">
                format_quote
              </span>
              <p className="relative z-10 font-display text-xl font-medium text-on-surface leading-relaxed mb-4">
                &ldquo;I think I can safely say that nobody understands quantum
                mechanics.&rdquo;
              </p>
              <footer className="relative z-10 font-body text-sm text-on-surface-variant tracking-wide uppercase">
                — Richard Feynman,{" "}
                <cite className="normal-case opacity-75">
                  The Character of Physical Law
                </cite>
              </footer>
            </blockquote>

            <h3 className="font-display text-3xl font-bold text-on-surface mt-16 mb-6 tracking-tight">
              Superposition and the Hilbert Space
            </h3>

            <p>
              A profound consequence of the state vector formulation is the
              principle of superposition. If a quantum system can exist in state
              A and state B, it can also exist in a state that is a linear
              combination of both. This is not merely a statistical mixture, but
              a fundamentally new state where the system is, in a sense, in both
              configurations simultaneously until measured.
            </p>

            {/* Asymmetric Concept Card */}
            <div className="my-14 p-[1px] rounded-2xl bg-gradient-to-br from-surface-variant to-background overflow-hidden shadow-[0_40px_40px_-15px_rgba(0,0,0,0.6)]">
              <div className="bg-surface-container-low rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row gap-8 items-start relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary-fixed/5 rounded-full blur-[60px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="shrink-0 h-16 w-16 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/30">
                  <span className="material-symbols-outlined text-3xl text-tertiary-fixed">
                    functions
                  </span>
                </div>
                <div className="relative z-10">
                  <h4 className="font-display text-xl font-bold text-on-surface mb-3">
                    Mathematical Formalism
                  </h4>
                  <p className="font-body text-base text-on-surface-variant leading-relaxed">
                    Mathematically, these states are represented as vectors in a
                    complex vector space known as a{" "}
                    <strong>Hilbert space</strong>. The inner product of these
                    vectors allows us to calculate the probability amplitudes for
                    various measurement outcomes, linking the abstract
                    mathematics to physical reality.
                  </p>
                </div>
              </div>
            </div>

            <p>
              When we perform a measurement on a quantum system, the system is
              forced into one of the definite states associated with the
              measuring device. This abrupt change is often referred to as the
              &ldquo;collapse of the wave function.&rdquo; The deterministic
              evolution described by the Schrödinger equation is briefly
              suspended, replaced by a probabilistic jump.
            </p>
          </div>
        </article>

        {/* Floating Glass Action Button */}
        <div className="fixed bottom-8 right-12 z-40">
          <button className="glass-panel group flex items-center gap-3 px-6 py-4 rounded-full border border-outline-variant/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:bg-surface-container/80 hover:border-outline-variant/40 transition-all duration-300">
            <span className="font-body text-sm font-semibold text-on-surface tracking-wide">
              Continue to Wave Functions
            </span>
            <span className="material-symbols-outlined text-tertiary-fixed group-hover:translate-x-1 transition-transform duration-300">
              arrow_forward
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}