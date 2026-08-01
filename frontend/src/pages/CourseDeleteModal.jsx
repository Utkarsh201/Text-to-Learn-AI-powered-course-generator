import { useState } from "react";

export default function CourseDeleteModal({ isOpen, onClose, onConfirm, course }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !course) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(course.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete course:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
      onClick={!isDeleting ? onClose : undefined}
    >
      <div
        className="w-full max-w-md bg-surface-container-low border border-outline-variant/20 rounded-lg overflow-hidden shadow-[0_8px_64px_-12px_rgba(0,0,0,0.8)] p-8"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error-container/40 text-error border border-error/20">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface font-headline">
              Delete Course?
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant leading-relaxed mb-8 bg-surface-container p-4 rounded-lg border border-outline-variant/10">
          You are about to permanently delete <span className="font-semibold text-on-surface">"{course.title || course.topic}"</span> and all its generated chapters, lessons, and quizzes.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isDeleting}
            className="px-5 py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold text-sm hover:bg-surface-bright hover:text-on-surface transition-all disabled:opacity-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="px-6 py-3 rounded-xl bg-error-container text-on-error-container border border-error/30 font-bold text-sm hover:bg-error hover:text-on-error transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 active:scale-95"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>Delete Forever</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
