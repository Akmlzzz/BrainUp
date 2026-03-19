import React, { useState, useEffect } from 'react';

// Data Struktur
interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  mediaUrl?: string; // bisa berupa gambar atau video
  options: Option[];
}

const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Manakah dari berikut ini yang merupakan struktur data First-In-First-Out (FIFO)?',
    options: [
      { id: 'opt1', text: 'Stack' },
      { id: 'opt2', text: 'Queue' },
      { id: 'opt3', text: 'Tree' },
      { id: 'opt4', text: 'Graph' },
    ],
  },
  {
    id: 'q2',
    text: 'Perhatikan potongan kode berikut...',
    mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    options: [
      { id: 'opt1', text: 'Akan menghasilkan error saat runtime' },
      { id: 'opt2', text: 'Mencetak angka 1 sampai 10' },
      { id: 'opt3', text: 'Menyebabkan infinite loop berulang' },
      { id: 'opt4', text: 'Kompilasi berhasil namun output kosong' },
    ],
  },
  {
    id: 'q3',
    text: 'Apa kepanjangan dari CPU pada sistem komputer modern?',
    options: [
      { id: 'opt1', text: 'Computer Personal Unit' },
      { id: 'opt2', text: 'Central Process Unit' },
      { id: 'opt3', text: 'Central Processing Unit' },
      { id: 'opt4', text: 'Central Protocol Unit' },
    ],
  },
];

const LOCAL_STORAGE_KEY = 'brainup_quiz_progress';

interface QuizIslandProps {
  title: string;
}

export default function QuizIsland({ title }: QuizIslandProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize client-side state from LocalStorage
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
  }, []);

  // Save to LocalStorage whenever answers or index changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          currentQuestionIdx,
          selectedAnswers,
        })
      );
    }
  }, [currentQuestionIdx, selectedAnswers, isClient]);

  // Handle hydration mismatch by not rendering until client is ready
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
    setIsFinished(true);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleExit = () => {
    const confirmExit = window.confirm('Kembali ke menu utama? Progres Anda tersimpan.');
    if (confirmExit) {
      window.location.href = '/dashboard'; 
    }
  };

  if (isFinished) {
    return (
      <div className="h-[calc(100vh-140px)] min-h-[500px] flex items-center justify-center bg-[#06111f] border border-blue-500/10 rounded-2xl text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="bg-[#040d1e] border border-blue-500/10 p-8 rounded-2xl max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
          
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6 relative z-10 border border-indigo-500/30">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Kuis Selesai!</h2>
          <p className="text-slate-400 mb-8 relative z-10">
            Terima kasih telah berpartisipasi. Anda telah menjawab {answeredCount} dari {totalQuestions} pertanyaan.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full relative z-10 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isCurrentAnswered = !!selectedAnswers[currentQuestion.id];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#06111f] rounded-2xl border border-blue-500/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-slate-200 flex flex-col font-sans selection:bg-blue-500/30 relative">
      
      {/* HEADER STICKY */}
      <header className="sticky top-[60px] z-30 bg-[#06111f]/90 backdrop-blur-xl border-b border-blue-500/10 pt-4 pb-3 rounded-t-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <span className="text-indigo-400 font-semibold tracking-wide uppercase">Progres Anda</span>
              <span className="bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50">
                <span className="text-white">{answeredCount}</span> / {totalQuestions} Terjawab
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/30">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col relative z-10 w-full">
        {/* Glow effect in background */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] bg-indigo-900/10 rounded-[100%] blur-[120px] pointer-events-none -z-10" />

        <div className="flex flex-col gap-8 w-full">
          {/* Question Meta */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
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
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] text-white'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {/* Selected Indicator Background */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                  )}
                  
                  {/* Option Letter */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors relative z-10 ${
                    isSelected 
                      ? 'bg-indigo-500 text-white shadow-md' 
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
                      <svg className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-500/25 border border-indigo-500 border-t-indigo-400'
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
