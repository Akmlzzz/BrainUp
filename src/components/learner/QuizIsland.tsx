import React, { useState, useEffect } from 'react';

// Data Struktur
interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  mediaUrl?: string;
  options: Option[];
  correctOptionId: string;
}

const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Manakah dari berikut ini yang merupakan struktur data First-In-First-Out (FIFO)?',
    correctOptionId: 'opt2',
    options: [
      { id: 'opt1', text: 'Stack' },
      { id: 'opt2', text: 'Queue' },
      { id: 'opt3', text: 'Tree' },
      { id: 'opt4', text: 'Graph' },
    ],
  },
  {
    id: 'q2',
    text: 'Perhatikan istilah berikut. Manakah yang sering dikaitkan dengan metode pemrograman dimana sebuah fungsi memanggil dirinya sendiri?',
    correctOptionId: 'opt1',
    options: [
      { id: 'opt1', text: 'Rekursi' },
      { id: 'opt2', text: 'Iterasi' },
      { id: 'opt3', text: 'Enkapsulasi' },
      { id: 'opt4', text: 'Polimorfisme' },
    ],
  },
  {
    id: 'q3',
    text: 'Apa kepanjangan dari CPU pada sistem komputer modern?',
    correctOptionId: 'opt3',
    options: [
      { id: 'opt1', text: 'Computer Personal Unit' },
      { id: 'opt2', text: 'Central Process Unit' },
      { id: 'opt3', text: 'Central Processing Unit' },
      { id: 'opt4', text: 'Central Protocol Unit' },
    ],
  },
];

const LOCAL_STORAGE_KEY = 'brainup_quiz_progress';
const LOCAL_STORAGE_START = 'brainup_quiz_start';

interface QuizIslandProps {
  title: string;
}

export default function QuizIsland({ title }: QuizIslandProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeTaken, setTimeTaken] = useState('');

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedAnswers) setSelectedAnswers(parsed.selectedAnswers);
        if (parsed.currentQuestionIdx !== undefined) setCurrentQuestionIdx(parsed.currentQuestionIdx);
      } catch (e) {
        console.error('Failed to parse saved quiz progress', e);
      }
    }

    let st = localStorage.getItem(LOCAL_STORAGE_START);
    if (!st) {
      st = Date.now().toString();
      localStorage.setItem(LOCAL_STORAGE_START, st);
    }
    setStartTime(parseInt(st));
  }, []);

  // Save to LocalStorage whenever answers or index changes
  useEffect(() => {
    if (isClient && !isFinished) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          currentQuestionIdx,
          selectedAnswers,
        })
      );
    }
  }, [currentQuestionIdx, selectedAnswers, isClient, isFinished]);

  if (!isClient) return <div className="min-h-screen bg-slate-950" />;

  const currentQuestion = mockQuestions[currentQuestionIdx];
  const totalQuestions = mockQuestions.length;
  const answeredCount = mockQuestions.filter(q => selectedAnswers[q.id]).length;
  const progress = (answeredCount / totalQuestions) * 100;
  
  const handleSelect = (optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm('Anda belum menjawab semua soal. Yakin ingin mengumpulkan?');
      if (!confirmSubmit) return;
    }

    // Kalkulasi waktu pengerjaan
    const endTime = Date.now();
    const diffInSeconds = Math.floor((endTime - (startTime || endTime)) / 1000);
    const m = Math.floor(diffInSeconds / 60);
    const s = diffInSeconds % 60;
    setTimeTaken(`${m}m ${s}s`);

    setIsFinished(true);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_START);
  };

  const handleRetry = () => {
    setIsFinished(false);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    const st = Date.now().toString();
    localStorage.setItem(LOCAL_STORAGE_START, st);
    setStartTime(parseInt(st));
  };

  const handleExit = () => {
    const confirmExit = window.confirm('Kembali ke menu utama? Progres Anda tersimpan.');
    if (confirmExit) {
      window.location.href = '/dashboard'; 
    }
  };

  // Kalkulasi Skor untuk Tampilan Result
  let correctCount = 0;
  mockQuestions.forEach(q => {
    if (selectedAnswers[q.id] === q.correctOptionId) {
      correctCount++;
    }
  });
  const incorrectCount = totalQuestions - correctCount;
  const rawScore = (correctCount / totalQuestions) * 100;
  const finalScore = Math.round(rawScore);

  // DASHBOARD QUIZ RESULT VIEW
  if (isFinished) {
    const circleCircumference = 2 * Math.PI * 45; // r=45
    const strokeDashoffset = circleCircumference - (finalScore / 100) * circleCircumference;

    return (
      <div className="min-h-[calc(100vh-120px)] bg-[#06111f] border border-blue-500/10 rounded-2xl text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 md:p-10">
        
        {/* HASIL UTAMA */}
        <div className="flex flex-col md:flex-row gap-10 items-center justify-center bg-[#040d1e] border border-blue-500/10 p-8 rounded-2xl mb-10 shadow-xl relative overflow-hidden">
          {/* Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* CIRCLE PROGRESS SKOR */}
          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
            {/* Background Circle */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800/80" />
              {/* Progress Circle */}
              <circle 
                cx="50" cy="50" r="45" 
                stroke="currentColor" 
                strokeWidth="8" 
                fill="transparent" 
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-white">{finalScore}</span>
              <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest mt-1">Skor</span>
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="w-full max-w-sm flex flex-col gap-3 z-10">
            <h2 className="text-2xl font-bold text-white mb-2 text-center md:text-left">Kuis Selesai!</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-emerald-400">{correctCount}</span>
                <span className="text-xs font-medium text-emerald-500/70 uppercase">Benar</span>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-rose-400">{incorrectCount}</span>
                <span className="text-xs font-medium text-rose-500/70 uppercase">Salah</span>
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between px-5 mt-1">
              <span className="text-sm font-medium text-slate-400">Waktu Pengerjaan</span>
              <span className="text-sm font-bold text-white">{timeTaken}</span>
            </div>
          </div>
        </div>

        {/* REVIEW SECTION */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            Review Jawaban Anda
          </h3>
          <div className="flex flex-col gap-6">
            {mockQuestions.map((q, i) => {
              const userAnswerId = selectedAnswers[q.id];
              const isCorrect = userAnswerId === q.correctOptionId;

              return (
                <div key={q.id} className={`p-6 rounded-xl border ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {i + 1}
                    </div>
                    <p className="text-base text-slate-200 font-medium pt-1 leading-relaxed">
                      {q.text}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                    {q.options.map(opt => {
                      const isSelected = userAnswerId === opt.id;
                      const isActualCorrect = q.correctOptionId === opt.id;
                      
                      let optionStyle = "bg-slate-900/40 border-slate-800 text-slate-400"; // default
                      let icon = null;

                      if (isActualCorrect) {
                        optionStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                        icon = <svg className="w-5 h-5 text-emerald-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>;
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "bg-rose-500/10 border-rose-500/40 text-rose-300 font-semibold";
                        icon = <svg className="w-5 h-5 text-rose-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>;
                      }

                      return (
                        <div key={opt.id} className={`p-4 rounded-lg border flex items-center gap-3 transition-colors ${optionStyle}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isActualCorrect ? 'border-emerald-500 bg-emerald-500' : isSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-700'}`}>
                            {isActualCorrect && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            {(isSelected && !isActualCorrect) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <span className="text-sm">{opt.text}</span>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CALL TO ACTION */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Ulangi Kuis
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            Kembali ke Dashboard
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>

      </div>
    );
  }

  // ==== ACTIVE QUIZ VIEW ====
  const isCurrentAnswered = !!selectedAnswers[currentQuestion.id];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#06111f] rounded-2xl border border-blue-500/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-slate-200 flex flex-col font-sans selection:bg-blue-500/30 relative">
      
      {/* HEADER STICKY */}
      <header className="sticky top-[60px] z-30 bg-[#06111f]/90 backdrop-blur-xl border-b border-blue-500/10 pt-4 pb-3 rounded-t-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-100 truncate pb-0.5">
                {title}
              </h1>
            </div>
            <button
              onClick={handleExit}
              className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm font-medium group"
            >
              <span className="hidden sm:inline">Keluar</span>
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-medium text-slate-400">
              <span className="text-blue-400 font-semibold tracking-wide uppercase">Progres Anda</span>
              <span className="bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50">
                <span className="text-white">{answeredCount}</span> / {totalQuestions} Terjawab
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/30">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col relative z-10">
        {/* Glow effect in background */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] bg-blue-900/10 rounded-[100%] blur-[120px] pointer-events-none -z-10" />

        <div className="flex flex-col gap-8 w-full">
          {/* Question Meta */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-sm font-bold tracking-widest text-blue-400 uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Soal {currentQuestionIdx + 1}
            </span>
          </div>

          {/* Question Text */}
          <div className="w-full">
            <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-slate-100 w-full break-words">
              {currentQuestion.text}
            </h2>
          </div>

          {/* Question Media (if any) */}
          {currentQuestion.mediaUrl && (
            <div className="w-full rounded-2xl overflow-hidden border border-slate-800/80 shadow-lg relative group bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={currentQuestion.mediaUrl}
                alt="Pertanyaan visual"
                className="w-full max-h-80 object-cover object-center transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col gap-3.5 mt-2 w-full">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === option.id;
              const optionLetters = ['A', 'B', 'C', 'D', 'E'];

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`group w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 relative overflow-hidden ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)] text-white'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {/* Selected Indicator Background */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
                  )}
                  
                  {/* Option Letter */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors relative z-10 ${
                    isSelected 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                  }`}>
                    {optionLetters[idx] || idx + 1}
                  </div>
                  
                  {/* Option Text */}
                  <span className="text-base md:text-lg select-none relative z-10 font-medium">
                    {option.text}
                  </span>

                  {/* Checked Icon */}
                  {isSelected && (
                    <div className="ml-auto flex-shrink-0 relative z-10 scale-in-center">
                      <svg className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* FOOTER NAVIGATION */}
      <footer className="mt-auto border-t border-blue-500/10 bg-[#06111f]/90 backdrop-blur-md px-4 sm:px-6 py-5 sticky bottom-0 z-30 rounded-b-2xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between w-full">
          {/* Back Button */}
          <button
            onClick={handleBack}
            disabled={currentQuestionIdx === 0}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              currentQuestionIdx === 0
                ? 'opacity-0 pointer-events-none'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white active:scale-[0.98] border border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
            </svg>
            Kembali
          </button>

          {/* Next / Submit Button */}
          {currentQuestionIdx === totalQuestions - 1 ? (
             <button
             onClick={handleSubmit}
             className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-lg active:scale-[0.98] ${
               isCurrentAnswered
                 ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 shadow-emerald-500/25 border-emerald-400 border-t'
                 : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
             }`}
           >
             Kumpulkan
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
             </svg>
           </button>
          ) : (
            <button
              onClick={handleNext}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-lg active:scale-[0.98] ${
                isCurrentAnswered
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 shadow-blue-500/25 border border-blue-500 border-t-blue-400'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50'
              }`}
            >
              Selanjutnya
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          )}
        </div>
      </footer>
      
      {/* Custom Styles for tiny animations using arbitrary classes */}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center {
          animation: scaleIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </div>
  );
}
