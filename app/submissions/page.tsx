"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

interface SubmittedAnswer {
  id: number;
  answer: string;
  question_id: number;
  questions: {
    id: number;
    question: string;
    score: number;
    quizzes: {
      id: number;
      title: string;
    };
  };
}

export default function SubmissionsPage() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<SubmittedAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!dbUser) return;
    const userId = dbUser.id;

    async function fetchSubmissions() {
      try {
        const res = await fetch(`/api/answers?userId=${userId}`);
        if (!res.ok) {
          throw new Error("Failed to load your submissions.");
        }
        const data = await res.json();
        setSubmissions(data);
      } catch (err: any) {
        setError(err.message || "Failed to load submissions.");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [dbUser]);

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Verifying session...</div>
      </div>
    );
  }

  // Group submissions by quiz title
  const groupedSubmissions: Record<string, SubmittedAnswer[]> = {};
  submissions.forEach((sub) => {
    const quizTitle = sub.questions?.quizzes?.title || "Unknown Quiz";
    if (!groupedSubmissions[quizTitle]) {
      groupedSubmissions[quizTitle] = [];
    }
    groupedSubmissions[quizTitle].push(sub);
  });

  return (
    <div className="flex-1 min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-indigo-400 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              Your Submissions
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Review your submitted answers for all attempted quizzes.
            </p>
          </div>
          <Link
            href="/quizzes"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 transition-all cursor-pointer"
          >
            Attempt New Quiz
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
                <div className="h-6 w-1/3 bg-slate-800 rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-slate-800/60 rounded" />
                  <div className="h-16 w-full bg-slate-800/40 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
            <p className="font-semibold">Error loading history</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : Object.keys(groupedSubmissions).length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-12 text-center text-slate-400">
            <p className="text-lg">No submissions found.</p>
            <p className="text-sm mt-1">You haven&apos;t attempted any quiz questions yet.</p>
            <Link
              href="/quizzes"
              className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm mt-4 inline-block"
            >
              Start browsing quizzes →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSubmissions).map(([quizTitle, answersList]) => (
              <div 
                key={quizTitle} 
                className="border border-slate-800 bg-slate-900/20 rounded-2xl p-6 space-y-4 shadow-sm"
              >
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white tracking-tight">{quizTitle}</h2>
                  <span className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">
                    {answersList.length} Answers
                  </span>
                </div>

                <div className="space-y-5">
                  {answersList.map((sub, idx) => (
                    <div 
                      key={sub.id} 
                      className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 flex flex-col gap-2.5"
                    >
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="font-medium text-slate-500">Submission #{idx + 1}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-400 font-medium">
                          ★ {sub.questions?.score || 0} pts
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-200">
                        Q: {sub.questions?.question || "Deleted question"}
                      </h3>

                      <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-3 text-sm text-slate-300">
                        <span className="text-xs text-slate-500 font-medium block mb-1">Your Answer:</span>
                        <p className="whitespace-pre-wrap">{sub.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
