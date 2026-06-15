"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Quiz {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
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
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchQuizzes();
  }, []);

  return (
    <div className="flex-1 min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Available Quizzes
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400">
            Select a quiz to test your skills and save your answers.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
                <div className="h-6 w-1/3 bg-slate-800 rounded" />
                <div className="h-4 w-3/4 bg-slate-800 rounded" />
                <div className="h-10 w-24 bg-slate-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
            <p className="font-semibold">Error loading quizzes</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-12 text-center text-slate-400">
            <p className="text-lg">No quizzes found.</p>
            <p className="text-sm mt-1">Please populate the database with quizzes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <div>
                  <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {quiz.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {quiz.description || "Test your understanding and benchmark your speed."}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    Open Quiz
                  </Link>
                  <Link
                    href={`/optimize?quizId=${quiz.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Optimize Plan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
