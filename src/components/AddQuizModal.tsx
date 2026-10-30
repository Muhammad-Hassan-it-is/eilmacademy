"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AddQuizModalProps {
  onSuccess: () => void | Promise<void>;
}

interface FormValues {
  id: string;
  title: string;
  sheetUrl: string;
}

const initialForm: FormValues = { id: "", title: "", sheetUrl: "" };

export default function AddQuizModal({ onSuccess }: AddQuizModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting]);

  function closeModal() {
    if (!isSubmitting) setIsOpen(false);
  }

  function updateField(field: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  async function submitQuiz(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/quizzes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Quiz could not be added");
      }

      setForm(initialForm);
      setFeedback({ type: "success", message: result.message ?? "Quiz added successfully" });
      await onSuccess();
    } catch (submitError) {
      setFeedback({ type: "error", message: submitError instanceof Error ? submitError.message : "Quiz could not be added" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => { setFeedback(null); setIsOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
        <Plus size={16} />
        Add Quiz
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="add-quiz-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 id="add-quiz-title" className="text-base font-bold text-slate-950">Add new quiz</h2><p className="mt-1 text-xs text-slate-500">Register the quiz and prepare it for sheet syncing.</p></div>
              <button type="button" onClick={closeModal} disabled={isSubmitting} aria-label="Close add quiz dialog" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><X size={18} /></button>
            </div>

            <form onSubmit={submitQuiz} className="space-y-4 p-5">
              {feedback && <div role="alert" className={`rounded-lg border px-3 py-2.5 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{feedback.message}</div>}
              <label className="block text-sm font-semibold text-slate-700">Quiz number / ID<input required type="number" min="1" step="1" value={form.id} onChange={(event) => updateField("id", event.target.value)} placeholder="49" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
              <label className="block text-sm font-semibold text-slate-700">Quiz title<input required type="text" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Quiz 49: Surah Al-Baqarah" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
              <label className="block text-sm font-semibold text-slate-700">Google Sheet full URL<input required type="url" value={form.sheetUrl} onChange={(event) => updateField("sheetUrl", event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={closeModal} disabled={isSubmitting} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={isSubmitting} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Adding Quiz..." : "Add Quiz"}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}