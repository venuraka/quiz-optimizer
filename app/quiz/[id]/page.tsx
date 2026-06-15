"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

interface Question {
  id: number;
  quiz_id: number;
  question: string;
  time_required: number;
  score: number;
}

export default function QuizDetailsPage() {
  const params = useParams();
  const quizId = params.id as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}/questions`);
        if (!res.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await res.json();
        setQuestions(data);
      } catch (err: any) {
        setError(err.message || "Failed to load questions");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [quizId, user]);

  const handleInputChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser) {
      setError("User profile not loaded. Please try again.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitSuccess(false);

    try {
      // Filter out empty answers
      const activeAnswers = Object.entries(answers).filter(
        ([_, text]) => text.trim() !== ""
      );

      if (activeAnswers.length === 0) {
        throw new Error("Please write at least one answer before submitting.");
      }

      // Submit each answer individually (as required by POST /api/answers)
      const submitPromises = activeAnswers.map(async ([qId, answerText]) => {
        const payload = {
          user_id: dbUser.id,
          question_id: parseInt(qId, 10),
          answer: answerText,
        };

        const res = await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Failed to submit answer for question ID ${qId}`);
        }
      });

      await Promise.all(submitPromises);
      setSubmitSuccess(true);
      setAnswers({});
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your answers.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Verifying session...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/quizzes"
              className="text-xs font-semibold text-slate-500 hover:text-indigo-400 transition-colors"
            >
              ← Back to Available Quizzes
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              Complete Quiz
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span className="text-xs font-medium text-slate-400">Submitting as:</span>
            <span className="text-sm font-semibold text-white">
              {dbUser ? `${dbUser.email} (ID: ${dbUser.id})` : "Syncing profile..."}
            </span>
          </div>
        </div>


        {submitSuccess && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center text-emerald-400 space-y-2 animate-fadeIn">
            <p className="font-semibold text-lg">🎉 Answers Submitted Successfully!</p>
            <p className="text-sm">Your submissions have been saved to the database.</p>
            <div className="pt-2">
              <Link
                href="/optimize"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                Go to Optimizer Page
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
                <div className="h-6 w-1/4 bg-slate-800 rounded" />
                <div className="h-24 bg-slate-800/40 rounded-lg" />
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-12 text-center text-slate-400">
            <p className="text-lg">No questions found in this quiz.</p>
            <Link
              href="/quizzes"
              className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm mt-2 block"
            >
              Choose another quiz
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-indigo-400">
                      Question {index + 1}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        ⏱️ {question.time_required}m
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-400 font-medium">
                        ★ {question.score} pts
                      </span>
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-slate-100">
                    {question.question}
                  </h3>
                  <textarea
                    rows={4}
                    placeholder="Type your response here..."
                    value={answers[question.id] || ""}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-4">
              <Link
                href="/quizzes"
                className="rounded-xl border border-slate-800 hover:bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-400 hover:text-slate-100 transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
              >
                {submitting ? "Submitting Answers..." : "Submit Answers"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
