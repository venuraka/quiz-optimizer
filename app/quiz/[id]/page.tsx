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
  difficulty: number;
}

export default function QuizDetailsPage() {
  const params = useParams();
  const quizId = params.id as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Optimizer modal states
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [optimizerTime, setOptimizerTime] = useState<number>(1);
  const [optimizerResult, setOptimizerResult] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);
  const [filteredQuestionIds, setFilteredQuestionIds] = useState<number[] | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | "all">("all");

  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // Filter questions based on optimizer and difficulty
  const activeQuestions = questions.filter(
    (q) =>
      (filteredQuestionIds === null || filteredQuestionIds.includes(q.id)) &&
      (selectedDifficulty === "all" || q.difficulty === selectedDifficulty)
  );
  const currentQuestion = activeQuestions[currentQuestionIndex];
  const totalRemainingSeconds = timerActive
    ? timeLeft +
      activeQuestions
        .slice(currentQuestionIndex + 1)
        .reduce((sum, q) => sum + q.time_required * 60, 0)
    : 0;

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

  // Set individual question timer when list/filter changes or we transition to a new index
  useEffect(() => {
    if (activeQuestions.length > 0 && currentQuestion) {
      setTimeLeft(currentQuestion.time_required * 60);
      setTimerActive(true);
    }
  }, [currentQuestionIndex, filteredQuestionIds, questions]);

  // Main countdown timer handler
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleNextQuestion();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeLeft, timerActive]);

  const handleInputChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const submitAllFilledAnswers = async () => {
    if (!dbUser) return;
    setSubmitting(true);
    setError(null);

    try {
      const activeAnswers = Object.entries(answers).filter(
        ([_, text]) => text.trim() !== ""
      );

      if (activeAnswers.length > 0) {
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
      }

      alert("Quiz finished! Submitted answers have been saved.");
      router.push("/quizzes");
    } catch (err: any) {
      alert("Quiz completed! Some answers could not be submitted. Moving to quizzes page.");
      router.push("/quizzes");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setTimerActive(false);
      await submitAllFilledAnswers();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const openOptimizerModal = () => {
    // We can optimize based on remaining questions time sum
    const totalRemainingMins = activeQuestions
      .slice(currentQuestionIndex)
      .reduce((sum, q) => sum + q.time_required, 0);
      
    setOptimizerTime(Math.max(1, totalRemainingMins));
    setOptimizerResult(null);
    setOptimizerError(null);
    setShowOptimizer(true);
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    setOptimizerError(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: parseInt(quizId),
          availableTime: optimizerTime,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to optimize question selection");
      }

      const data = await res.json();
      setOptimizerResult(data);
    } catch (err: any) {
      setOptimizerError(err.message || "An error occurred");
    } finally {
      setOptimizing(false);
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={openOptimizerModal}
                className="flex items-center gap-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 px-3 py-2 text-xs font-semibold text-indigo-400 transition-all cursor-pointer"
              >
                ⏱️ Optimize Plan
              </button>

              {/* Optimizer Popup Card */}
              {showOptimizer && (
                <div 
                  className="absolute right-0 mt-2 z-50 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col animate-fadeIn"
                  style={{ 
                    width: '480px',
                    maxWidth: 'calc(100vw - 2rem)',
                    padding: '2rem', 
                    gap: '1.5rem', 
                    boxShadow: '0 25px 60px -15px rgba(99, 102, 241, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white">Study Plan Optimizer</h3>
                    <button 
                      onClick={() => setShowOptimizer(false)}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Quiz Remaining:</span>
                        <span className="font-bold text-white">
                          {activeQuestions.slice(currentQuestionIndex).reduce((sum, q) => sum + q.time_required, 0)}m
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Target Time Limit
                      </label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="1" 
                          max={Math.max(1, activeQuestions.slice(currentQuestionIndex).reduce((sum, q) => sum + q.time_required, 0))} 
                          value={optimizerTime}
                          onChange={(e) => setOptimizerTime(parseInt(e.target.value))}
                          className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-extrabold text-indigo-400 w-8 text-right">
                          {optimizerTime}m
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleOptimize}
                      disabled={optimizing}
                      className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 cursor-pointer"
                      style={{ padding: '0.625rem', border: 'none' }}
                    >
                      {optimizing ? "Analyzing..." : "Find Best Questions"}
                    </button>

                    {optimizerError && (
                      <div className="p-2 rounded-lg border border-red-500/20 bg-red-500/10 text-[10px] text-red-400">
                        {optimizerError}
                      </div>
                    )}

                    {optimizerResult && (
                      <div className="flex flex-col gap-2 mt-1 border-t border-slate-800 pt-3">
                        <div className="flex justify-between items-center bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2.5">
                          <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Est. Best Score:</span>
                          <span className="text-sm font-extrabold text-white">{optimizerResult.bestScore} pts</span>
                        </div>

                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recommended:</span>
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {optimizerResult.questions.map((q: any) => (
                            <div 
                              key={q.id} 
                              className="p-2 rounded-lg border border-slate-800/80 bg-slate-950/40 flex justify-between items-center gap-2"
                            >
                              <span className="text-[10px] text-slate-300 line-clamp-1 flex-1">{q.question}</span>
                              <div className="flex gap-1.5 shrink-0">
                                <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                                  ⏱️ {q.time_required}m
                                </span>
                                <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-400 font-medium">
                                  ★ {q.score}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-800 pt-3 mt-1">
                    <button
                      onClick={() => setShowOptimizer(false)}
                      className="rounded-lg border border-slate-800 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                    >
                      Close
                    </button>
                    {optimizerResult && (
                      <button
                        onClick={() => {
                          setFilteredQuestionIds(optimizerResult.questions.map((q: any) => q.id));
                          setCurrentQuestionIndex(0);
                          setShowOptimizer(false);
                        }}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        OK
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {timerActive && (
              <>
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <span className="text-xs font-medium text-slate-400">Question Timer:</span>
                  <span className={`text-sm font-extrabold ${timeLeft <= 20 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
                    ⏱️ {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <span className="text-xs font-medium text-slate-400">Total Quiz Time:</span>
                  <span className="text-sm font-extrabold text-purple-400">
                    ⏱️ {formatTime(totalRemainingSeconds)}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
              <span className="text-xs font-medium text-slate-400">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  const val = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
                  setSelectedDifficulty(val);
                  setCurrentQuestionIndex(0);
                }}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="1">1 (Easy)</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5 (Hard)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
              <span className="text-xs font-medium text-slate-400">Submitting as:</span>
              <span className="text-sm font-semibold text-white">
                {dbUser ? `${dbUser.email} (ID: ${dbUser.id})` : "Syncing profile..."}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {filteredQuestionIds !== null && (
          <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-indigo-400 text-sm animate-fadeIn">
            <span>
              Showing only the <strong className="text-white">{filteredQuestionIds.length}</strong> optimized questions for your target time.
            </span>
            <button 
              onClick={() => {
                setFilteredQuestionIds(null);
                setCurrentQuestionIndex(0);
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
            >
              Show All Questions
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="animate-pulse border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
              <div className="h-6 w-1/4 bg-slate-800 rounded" />
              <div className="h-24 bg-slate-800/40 rounded-lg" />
            </div>
          </div>
        ) : activeQuestions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-12 text-center text-slate-400">
            <p className="text-lg">No questions found in this quiz.</p>
            <Link
              href="/quizzes"
              className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm mt-2 block"
            >
              Choose another quiz
            </Link>
          </div>
        ) : !currentQuestion ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-12 text-center text-slate-400">
            <p className="text-lg">Quiz completed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-4 shadow-sm relative">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-indigo-400">
                  Question {currentQuestionIndex + 1} of {activeQuestions.length}
                </span>
                <span className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    ⏱️ Allocated: {currentQuestion.time_required}m
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-400 font-medium">
                    ★ {currentQuestion.score} pts
                  </span>
                </span>
              </div>
              <h3 className="text-lg font-medium text-slate-100">
                {currentQuestion.question}
              </h3>
              <textarea
                rows={5}
                placeholder="Type your response here... (Leaving it empty will submit as null)"
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Quiz automatically submits when the last question time expires.
              </span>
              <div className="flex items-center gap-4">
                {currentQuestionIndex > 0 && (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-800 hover:bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={handleNextQuestion}
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : currentQuestionIndex < activeQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
