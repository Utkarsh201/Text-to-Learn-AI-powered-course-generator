import { useState } from "react";

const searchHistory = [
  { label: "Quantum Physics", icon: "history" },
  { label: "Modern Architecture", icon: "history" },
  { label: "UI Design Trends", icon: "history" },
];

const suggestions = [
  {
    icon: "science",
    title: "Advanced Biology",
    description:
      "Synthesize complex cellular pathways into editorial digests.",
  },
  {
    icon: "architecture",
    title: "Sustainable Urbanism",
    description:
      "Analyze the intersection of green tech and modern living.",
  },
  {
    icon: "history_edu",
    title: "Global Philosophies",
    description:
      "Explore the evolution of thought through curated learning paths.",
  },
];

export default function Homepage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="font-body selection:bg-tertiary selection:text-on-tertiary min-h-screen relative">
      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low flex flex-col p-6 space-y-12 z-50">
        {/* Brand Identity */}
        <div className="flex items-center space-x-3">
          <span className="material-symbols-outlined text-tertiary-fixed">
            school
          </span>
          <span className="text-xl font-bold tracking-tighter text-on-surface font-headline">
            Text to Learn
          </span>
        </div>

        {/* Primary Navigation */}
        <nav className="flex flex-col space-y-2">
          {/* Active: My Courses */}
          <a
            href="#"
            className="flex items-center space-x-3 px-4 py-3 bg-primary-container text-on-surface rounded-lg border-l-2 border-tertiary-fixed transition-all duration-300"
          >
            <span className="material-symbols-outlined">school</span>
            <span className="font-medium">My Courses</span>
          </a>

          {/* Create New */}
          <button className="flex items-center space-x-3 px-4 py-3 text-primary opacity-70 hover:opacity-100 hover:text-on-surface transition-all duration-300 hover:bg-surface-bright rounded-lg">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="font-medium">Create New</span>
          </button>
        </nav>

        {/* Search History */}
        <div className="flex-grow">
          <h3 className="text-[10px] tracking-[0.2em] font-bold uppercase text-on-surface-variant mb-6 px-4">
            SEARCH HISTORY
          </h3>
          <div className="flex flex-col space-y-1">
            {searchHistory.map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex items-center space-x-3 px-4 py-2 text-primary opacity-70 hover:opacity-100 hover:text-on-surface transition-all duration-300 hover:bg-surface-bright rounded-lg text-sm"
              >
                <span className="material-symbols-outlined text-xs">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col space-y-2 pt-6">
          <a
            href="#"
            className="flex items-center space-x-3 px-4 py-2 text-primary opacity-70 hover:opacity-100 hover:text-on-surface transition-all duration-300 hover:bg-surface-bright rounded-lg text-sm"
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 px-4 py-2 text-primary opacity-70 hover:opacity-100 hover:text-on-surface transition-all duration-300 hover:bg-surface-bright rounded-lg text-sm"
          >
            <span className="material-symbols-outlined">help</span>
            <span>Help</span>
          </a>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="ml-72 min-h-screen flex flex-col relative">
        {/* Top App Bar */}
        <header className="flex justify-end items-center w-full px-12 py-8 bg-transparent">
          <div className="flex items-center space-x-4">
            <button className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/20 hover:border-tertiary-fixed transition-colors">
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV_9HgmluE9Uut7xjiYDRaqg_ncPWBEsmI-8SWA0o1JPSEq4lcVfYvIroqvipsG1ee50cyZQhJgr7eQr23XRXnEqq5Zbns33HxWcYXciCK38SpEQHRxJZKr1nV-kL6Rt2MtjeOD0RCsRyJwcWbwMbn_NDIEAHeu1OMTZfAzPi1XPb_Jv3ONdQ24C35_X0iWEaH2JPpyvZYKOZostenW0TSgGvrVIoALdOX_xpzo-leBXHA_0dV7AIlF7R7ssvsTNfs7FOAnQOoZw"
              />
            </button>
          </div>
        </header>

        {/* Central Hero Area */}
        <div className="flex-grow flex flex-col items-center justify-center -mt-16 px-6">
          {/* Sparkle Icon */}
          <div className="mb-6">
            <span
              className="material-symbols-outlined text-5xl text-tertiary-fixed"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>

          {/* Hero Brand Logo */}
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-on-surface font-headline mb-12 select-none">
            TEXT TO LEARN
          </h1>

          {/* Search Bar */}
          <div className="w-full max-w-3xl relative group">
            {/* Outer Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-tertiary-fixed/20 to-primary/10 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />

            <div className="relative flex items-center bg-surface-container-high rounded-xl px-8 py-6 border border-outline-variant/10 shadow-2xl">
              <span className="material-symbols-outlined text-on-surface-variant mr-4">
                search
              </span>
              <input
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-xl w-full text-on-surface placeholder:text-on-surface-variant font-body"
                placeholder="What would you like to learn today?"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="ml-4 w-12 h-12 flex items-center justify-center rounded-full bg-primary-container text-on-primary-container hover:bg-tertiary-fixed hover:text-on-tertiary-fixed transition-all active:scale-95 shadow-lg">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mic
                </span>
              </button>
            </div>
          </div>

          {/* Suggestion Cards */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl px-4">
            {suggestions.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/5 hover:border-tertiary-fixed/30 transition-all cursor-pointer group"
              >
                <span className="material-symbols-outlined text-tertiary-fixed mb-4 block">
                  {item.icon}
                </span>
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full py-12 flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center space-x-12">
            {["RESEARCH", "ANALYZE", "LEARN"].map((link, i) => (
              <span key={link} className="flex items-center space-x-12">
                {i > 0 && (
                  <span className="text-outline-variant opacity-30 text-xs mr-12">
                    •
                  </span>
                )}
                <a
                  href="#"
                  className="text-[10px] tracking-[0.2em] font-bold uppercase text-primary hover:text-tertiary-fixed transition-colors font-label"
                >
                  {link}
                </a>
              </span>
            ))}
          </div>
          <div className="text-[9px] tracking-widest text-on-surface-variant font-medium uppercase opacity-50">
            Text to Learn © 2024–2026
          </div>
        </footer>
      </main>

      {/* ── Floating Background Blobs ── */}
      <div className="fixed top-[10%] right-[5%] w-[400px] h-[400px] bg-tertiary-fixed/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[10%] left-[20%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
    </div>
  );
}