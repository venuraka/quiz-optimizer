"use client";

import { useEffect, useState, useTransition } from "react";
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

        if (!res.ok) {
          throw new Error("Failed to fetch quizzes");
        }

        const data = await res.json();

        setQuizzes(data);

        if (data.length > 0) {
          setSelectedQuizId(data[0].id.toString());
        }
      } catch (error) {
        setError("Could not load quizzes.");
      } finally {
        setLoadingQuizzes(false);
      }
    }

    fetchQuizzes();
  }, []);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuizId) return;

    setError(null);

    startOptimizing(async () => {
      try {
        const res = await fetch("/api/optimize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId: parseInt(selectedQuizId),
            availableTime,
          }),
        });

        if (!res.ok) {
          throw new Error("Optimization failed");
        }

        const data = await res.json();

        setResult(data);
      } catch (error: any) {
        setError(error.message);
      }
    });
  };

  const totalRecommendedTime =
    result?.questions.reduce(
      (sum, question) => sum + question.time_required,
      0
    ) || 0;

  return (
    <div className="flex-1 min-h-screen py-12 px-4 bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-white">
          Study Optimizer
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900 rounded-xl p-6">
            <form onSubmit={handleOptimize} className="space-y-4">
              {loadingQuizzes ? (
                <p className="text-white">Loading quizzes...</p>
              ) : (
                <select
                  value={selectedQuizId}
                  onChange={(e) =>
                    setSelectedQuizId(e.target.value)
                  }
                  className="w-full p-2 rounded bg-slate-800 text-white"
                >
                  {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="number"
                min="1"
                value={availableTime}
                onChange={(e) =>
                  setAvailableTime(Number(e.target.value))
                }
                className="w-full p-2 rounded bg-slate-800 text-white"
              />

              <button
                type="submit"
                disabled={isOptimizing}
                className="w-full bg-indigo-600 text-white p-2 rounded"
              >
                {isOptimizing
                  ? "Optimizing..."
                  : "Find Best Questions"}
              </button>
            </form>
          </div>

          <div className="md:col-span-2">
            {error && (
              <div className="bg-red-900 text-white p-4 rounded">
                {error}
              </div>
            )}

            {result && (
              <div className="bg-slate-900 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-4">
                  Best Score: {result.bestScore}
                </h2>

                <p className="mb-4">
                  Time Required: {totalRecommendedTime} /
                  {availableTime} minutes
                </p>

                <div className="space-y-3">
                  {result.questions.map((question) => (
                    <div
                      key={question.id}
                      className="border border-slate-700 rounded p-3"
                    >
                      <p>{question.question}</p>
                      <p className="text-sm text-slate-400">
                        {question.time_required} min •{" "}
                        {question.score} points
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/quiz/${selectedQuizId}`}
                  className="inline-block mt-6 bg-indigo-600 px-4 py-2 rounded"
                >
                  Open Quiz
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}