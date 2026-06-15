"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Quiz {
  id: number;
  title: string;
}

interface Question {
  id: number;
  question: string;
  time_required: number;
  score: number;
}

interface OptimizeResult {
  bestScore: number;
  questions: Question[];
}

export default function OptimizePage() {
  const searchParams = useSearchParams();
  const initialQuizId = searchParams.get("quizId");

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [availableTime, setAvailableTime] = useState<number>(10);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [isOptimizing, startOptimizing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const res = await fetch("/api/quizzes");
        if (!res.ok) throw new Error("Failed to fetch quizzes");
        const data = await res.json();
        setQuizzes(data);
        if (data.length > 0) {
          // If a quizId is provided in URL query params, select it. Otherwise select the first.
          const matched = data.find((q: Quiz) => q.id.toString() === initialQuizId);
          setSelectedQuizId(matched ? matched.id.toString() : data[0].id.toString());
        }
      } catch (err: any) {
        setError("Could not load quizzes. Ensure backend database is set up.");
      } finally {
        setLoadingQuizzes(false);
      }
    }
    fetchQuizzes();
  }, [initialQuizId]);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId) return;

    setError(null);
    startOptimizing(async () => {
      try {
        const res = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId: parseInt(selectedQuizId, 10),
            availableTime: availableTime,
          }),
        });

        if (!res.ok) {
          throw new Error("Optimization failed");
        }

        const data = await res.json();
        setResult(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during optimization.");
      }
    });
  };

  const totalRecommendedTime = result?.questions.reduce((sum, q) => sum + q.time_required, 0) || 0;

  return (
    <div className="flex-1 min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Study Optimizer
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400">
            Let the knapsack algorithm optimize your score based on your remaining available time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Form Controls */}
          <div className="md:col-span-1 border border-slate-800 bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Config Settings</h2>

            <form onSubmit={handleOptimize} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Quiz
                </label>
                {loadingQuizzes ? (
                  <div className="h-10 bg-slate-800 rounded animate-pulse" />
                ) : (
                  <select
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                  >
                    {quizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Available Time
                  </label>
                  <span className="text-xs font-bold text-indigo-400">
                    {availableTime} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={availableTime}
                  onChange={(e) => setAvailableTime(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={availableTime}
                  onChange={(e) => setAvailableTime(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white mt-1"
                />
              </div>

              <button
                type="submit"
                disabled={isOptimizing || !selectedQuizId}
                className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {isOptimizing ? "Optimizing..." : "Find Best Questions"}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <div className="md:col-span-2 space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {!result && !error && (
              <div className="rounded-2xl border border-dashed border-slate-850 bg-slate-900/10 p-12 text-center text-slate-500">
                <p className="text-lg">No recommendation calculated yet.</p>
                <p className="text-sm mt-1">Configure options on the left and click Find Best Questions.</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-fadeIn">
                {/* Result Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-850 bg-slate-900/40 rounded-2xl p-6 text-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Best Achievable Score
                    </span>
                    <p className="text-4xl font-extrabold text-indigo-400 mt-2">
                      {result.bestScore}
                    </p>
                  </div>
                  <div className="border border-slate-850 bg-slate-900/40 rounded-2xl p-6 text-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Time Required
                    </span>
                    <p className="text-4xl font-extrabold text-purple-400 mt-2">
                      {totalRecommendedTime} <span className="text-lg">/ {availableTime}m</span>
                    </p>
                  </div>
                </div>

                {/* Recommended Questions List */}
                <div className="border border-slate-850 bg-slate-900/20 rounded-2xl p-6 space-y-4">
                  <h2 className="text-lg font-bold text-white">Recommended Questions</h2>

                  {result.questions.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No questions can be completed in the given available time. Try increasing the time limit.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {result.questions.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-start justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60"
                        >
                          <div className="flex gap-3">
                            <span className="text-emerald-400 font-semibold mt-0.5">✓</span>
                            <div>
                              <p className="text-sm font-medium text-slate-100">{q.question}</p>
                              <div className="flex gap-4 mt-1">
                                <span className="text-xs text-slate-400">⏱️ {q.time_required}m</span>
                                <span className="text-xs text-indigo-400 font-semibold">★ {q.score} points</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct link to execute Quiz */}
                <div className="flex justify-end">
                  <Link
                    href={`/quiz/${selectedQuizId}`}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-850 hover:text-white transition-all"
                  >
                    Open Quiz & Answer Questions →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
