"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Verifying session...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
            Now Powered by Supabase
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Maximize Your Quiz Scores <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              In Minimum Time
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400">
            QuizOptimizer is a smart tool designed to help you prepare. Answer full quizzes or use our Knapsack-based optimizer to find the highest-scoring questions within your time limit.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6">
          {/* Quizzes List Card */}
          <Link
            href="/quizzes"
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-300 text-left hover:shadow-2xl hover:shadow-indigo-500/10"
          >
            <div>
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                📚
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                Available Quizzes
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Browse our collection of topic-focused quizzes. Test your knowledge in Java, React, and more with instant saves.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              Browse Quizzes <span className="ml-1">→</span>
            </div>
          </Link>

          {/* Optimizer Card */}
          <Link
            href="/optimize"
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-300 text-left hover:shadow-2xl hover:shadow-purple-500/10"
          >
            <div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                ⏱️
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                Quiz Optimizer
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Short on time? Let our algorithm calculate the best questions for you to tackle to yield the highest possible score.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
              Optimize Study Plan <span className="ml-1">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
