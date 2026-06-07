import { useState } from "react";

const depthOptions = [
  { value: "overview", label: "Overview" },
  { value: "basic", label: "Basic" },
  { value: "detailed", label: "Detailed" },
];

export default function CourseSettingsPopup({ isOpen, onClose, onGenerate }) {
  const [depth, setDepth] = useState("basic");
  const [quizzes, setQuizzes] = useState("yes");
  const [videoRef] = useState("no");

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate?.({
      depth,
      includeQuizzes: quizzes === "yes",
      includeVideoReferences: false,
      includePdfDownload: false,
    });
  };

  return (
    /* ── Backdrop Overlay ── */
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* ── Settings Modal Box ── */}
      <div
        className="w-full max-w-lg bg-surface-container-low border border-outline-variant/20 rounded-lg overflow-hidden shadow-[0_8px_64px_-12px_rgba(0,0,0,0.8)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-generation-settings-title"
        aria-describedby="course-generation-settings-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-8 pt-8 pb-6 border-b border-outline-variant/10">
          <div className="flex justify-between items-start">
            <div>
              <h2
                id="course-generation-settings-title"
                className="text-2xl font-bold tracking-tight text-on-surface font-headline"
              >
                Course Generation Settings
              </h2>
              <p
                id="course-generation-settings-description"
                className="text-on-surface-variant text-sm mt-1"
              >
                Configure how the intelligence engine curates your content.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close settings"
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={onClose}
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-8 space-y-8">
          {/* Course Depth */}
          <section className="space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-tertiary-fixed">
              Course Depth
            </span>
            <div className="grid grid-cols-3 gap-3">
              {depthOptions.map((opt) => (
                <label key={opt.value} className="cursor-pointer group">
                  <input
                    className="sr-only peer"
                    type="radio"
                    name="depth"
                    value={opt.value}
                    checked={depth === opt.value}
                    onChange={() => setDepth(opt.value)}
                  />
                  <div className="px-4 py-3 rounded-lg bg-surface-container border border-outline-variant/20 text-center text-sm font-medium peer-checked:bg-surface-container peer-checked:border-tertiary-fixed peer-checked:text-on-surface text-on-surface-variant hover:bg-surface-bright transition-all">
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Toggle Row */}
          <div className="grid grid-cols-2 gap-8">
            {/* Generate Quizzes */}
            <section className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-tertiary-fixed">
                Generate Quizzes
              </span>
              <div className="flex gap-2 p-1 bg-surface-container rounded-lg border border-outline-variant/10">
                {["yes", "no"].map((val) => (
                  <label key={val} className="flex-1 cursor-pointer">
                    <input
                      className="sr-only peer"
                      type="radio"
                      name="quizzes"
                      value={val}
                      checked={quizzes === val}
                      onChange={() => setQuizzes(val)}
                    />
                    <div className="py-2 text-center text-xs font-semibold rounded-md peer-checked:bg-surface-bright peer-checked:text-on-surface text-on-surface-variant transition-all">
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Include Video Reference */}
            <section className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-tertiary-fixed">
                Video Reference
              </span>
              <div className="flex gap-2 p-1 bg-surface-container rounded-lg border border-outline-variant/10">
                {["yes", "no"].map((val) => (
                  <label key={val} className="flex-1 cursor-pointer">
                    <input
                      className="sr-only peer"
                      type="radio"
                      name="video"
                      value={val}
                      checked={videoRef === val}
                      disabled
                      readOnly
                    />
                    <div className="py-2 text-center text-xs font-semibold rounded-md peer-checked:bg-surface-bright peer-checked:text-on-surface text-on-surface-variant transition-all opacity-60">
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-[10px] leading-4 text-on-surface-variant">
                Placeholder only. Backend generation for videos is not enabled yet.
              </p>
            </section>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-8 pb-8 pt-2">
          <button
            className="w-full py-4 bg-gradient-to-r from-tertiary-fixed to-tertiary rounded-xl text-background font-black tracking-tight text-lg shadow-[0_20px_50px_rgba(129,140,248,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            onClick={handleGenerate}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            Generate Course
          </button>
          <p className="text-center text-[10px] text-primary-container mt-4 uppercase tracking-[0.15em]">
            Neural engine will process your request in ~30 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
