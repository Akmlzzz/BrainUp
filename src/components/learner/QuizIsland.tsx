import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Mock Data ────────────────────────────────────────────────────────────────
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
    text: 'Perhatikan istilah berikut. Manakah yang sering dikaitkan dengan pemrograman dimana suatu fungsi memanggil dirinya sendiri?',
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

const LOCAL_STORAGE_KEY   = 'brainup_quiz_progress';
const LOCAL_STORAGE_START = 'brainup_quiz_start';
const OPTION_LETTERS      = ['A', 'B', 'C', 'D', 'E'];

interface QuizIslandProps { title: string; }

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuizIsland({ title }: QuizIslandProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers]       = useState<Record<string, string>>({});
  const [isClient,  setIsClient]                    = useState(false);
  const [isFinished, setIsFinished]                 = useState(false);
  const [startTime,  setStartTime]                  = useState<number | null>(null);
  const [timeTaken,  setTimeTaken]                  = useState('');
  const [animKey,    setAnimKey]                    = useState(0); // re-trigger slide-in

  // Init client
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedAnswers)           setSelectedAnswers(parsed.selectedAnswers);
        if (parsed.currentQuestionIdx !== undefined) setCurrentQuestionIdx(parsed.currentQuestionIdx);
      } catch {}
    }
    let st = localStorage.getItem(LOCAL_STORAGE_START);
    if (!st) { st = Date.now().toString(); localStorage.setItem(LOCAL_STORAGE_START, st); }
    setStartTime(parseInt(st));
  }, []);

  // Persist progress
  useEffect(() => {
    if (isClient && !isFinished) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ currentQuestionIdx, selectedAnswers }));
    }
  }, [currentQuestionIdx, selectedAnswers, isClient, isFinished]);

  if (!isClient) return <div style={{ minHeight: '100vh' }} />;

  const totalQuestions   = mockQuestions.length;
  const currentQuestion  = mockQuestions[currentQuestionIdx];
  const answeredCount    = Object.keys(selectedAnswers).length;
  const progressPct      = (answeredCount / totalQuestions) * 100;
  const isCurrentAnswered = !!selectedAnswers[currentQuestion.id];
  const isLastQuestion   = currentQuestionIdx === totalQuestions - 1;

  // Score calc
  let correctCount = 0;
  mockQuestions.forEach(q => { if (selectedAnswers[q.id] === q.correctOptionId) correctCount++; });
  const incorrectCount = totalQuestions - correctCount;
  const finalScore     = Math.round((correctCount / totalQuestions) * 100);

  // Handlers
  const handleSelect = (optionId: string) =>
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));

  const handleNext = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx(p => p + 1);
      setAnimKey(k => k + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(p => p - 1);
      setAnimKey(k => k + 1);
    }
  };

  const handleSubmit = () => {
    if (answeredCount < totalQuestions) {
      if (!window.confirm('Anda belum menjawab semua soal. Yakin ingin mengumpulkan?')) return;
    }
    const end  = Date.now();
    const diff = Math.floor((end - (startTime || end)) / 1000);
    setTimeTaken(`${Math.floor(diff / 60)}m ${diff % 60}s`);
    setIsFinished(true);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_START);
  };

  const handleRetry = () => {
    setIsFinished(false);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setAnimKey(0);
    const st = Date.now().toString();
    localStorage.setItem(LOCAL_STORAGE_START, st);
    setStartTime(parseInt(st));
  };

  // Score badge
  const scoreBadge =
    finalScore >= 80 ? { label: 'Luar Biasa! 🏆', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' }
    : finalScore >= 60 ? { label: 'Bagus! 👍', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' }
    : { label: 'Perlu Latihan 💪', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };

  // Circle progress
  const CIRCLE_R  = 52;
  const CIRCLE_C  = 2 * Math.PI * CIRCLE_R;
  const dashOffset = CIRCLE_C - (finalScore / 100) * CIRCLE_C;

  /* ══════════════════════════════════════════════════════════════
     RESULT VIEW
  ══════════════════════════════════════════════════════════════ */
  if (isFinished) {
    return (
      <div style={S.resultPage}>
        {/* Ambient blobs */}
        <div style={{ ...S.blob, top: -80, right: -60, background: 'rgba(59,130,246,0.08)' }} />
        <div style={{ ...S.blob, bottom: -100, left: -80, background: 'rgba(139,92,246,0.07)' }} />

        {/* ── HEADER ── */}
        <div style={S.resultHeader}>
          <div style={S.resultHeaderLeft}>
            <div style={S.resultIconBox}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 style={S.resultTitle}>Hasil Kuis</h2>
              <p style={S.resultSubtitle}>{title}</p>
            </div>
          </div>
          <div style={{ ...S.scorePill, background: scoreBadge.bg, border: `1px solid ${scoreBadge.border}`, color: scoreBadge.color }}>
            {scoreBadge.label}
          </div>
        </div>

        {/* ── SCORE SUMMARY ROW ── */}
        <div style={S.scoreSummaryRow}>

          {/* Circle Score */}
          <div style={S.circleCard}>
            <svg width="140" height="140" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={finalScore >= 80 ? '#10b981' : finalScore >= 60 ? '#3b82f6' : '#f59e0b'} />
                  <stop offset="100%" stopColor={finalScore >= 80 ? '#34d399' : finalScore >= 60 ? '#06b6d4' : '#fbbf24'} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r={CIRCLE_R} stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="transparent" />
              <circle
                cx="60" cy="60" r={CIRCLE_R}
                stroke="url(#scoreGrad)"
                strokeWidth="10" fill="transparent"
                strokeLinecap="round"
                strokeDasharray={CIRCLE_C}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
            <div style={S.circleInner}>
              <span style={S.circleValue}>{finalScore}</span>
              <span style={S.circleLabel}>Skor</span>
            </div>
          </div>

          {/* Stats grid */}
          <div style={S.statsGrid}>
            <div style={{ ...S.statBox, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 18 }}>
              <span style={{ ...S.statNum, color: '#34d399' }}>{correctCount}</span>
              <span style={{ ...S.statLabel, color: 'rgba(52,211,153,0.7)' }}>✓ Benar</span>
            </div>
            <div style={{ ...S.statBox, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 18 }}>
              <span style={{ ...S.statNum, color: '#f87171' }}>{incorrectCount}</span>
              <span style={{ ...S.statLabel, color: 'rgba(248,113,113,0.7)' }}>✗ Salah</span>
            </div>
            <div style={{ ...S.statBox, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 18 }}>
              <span style={{ ...S.statNum, color: '#60a5fa' }}>{totalQuestions}</span>
              <span style={{ ...S.statLabel, color: 'rgba(96,165,250,0.7)' }}>Total Soal</span>
            </div>
            <div style={{ ...S.statBox, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 18 }}>
              <span style={{ ...S.statNum, color: '#a78bfa', fontSize: 22 }}>{timeTaken}</span>
              <span style={{ ...S.statLabel, color: 'rgba(167,139,250,0.7)' }}>⏱ Waktu</span>
            </div>
          </div>
        </div>

        {/* ── REVIEW ── */}
        <div style={S.reviewSection}>
          <div style={S.reviewHeader}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 style={S.reviewTitle}>Review Jawaban</h3>
          </div>

          <div style={S.reviewBody}>
            {mockQuestions.map((q, i) => {
              const userAnswerId = selectedAnswers[q.id];
              const isCorrect    = userAnswerId === q.correctOptionId;
              return (
                <div key={q.id} style={{ ...S.reviewItem, borderBottom: i < mockQuestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  {/* Question row */}
                  <div style={S.reviewQRow}>
                    <div style={{ ...S.reviewQNum, background: isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: isCorrect ? '#34d399' : '#f87171', border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                      {i + 1}
                    </div>
                    <p style={S.reviewQText}>{q.text}</p>
                    <span style={{ ...S.reviewBadge, background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isCorrect ? '#34d399' : '#f87171', border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                      {isCorrect ? '✓ Benar' : '✗ Salah'}
                    </span>
                  </div>

                  {/* Options */}
                  <div style={S.reviewOptions}>
                    {q.options.map(opt => {
                      const isSel     = userAnswerId === opt.id;
                      const isCorrectOpt = q.correctOptionId === opt.id;
                      const style =
                        isCorrectOpt ? { background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.40)', color: '#d1fae5' }
                        : isSel && !isCorrect ? { background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.40)', color: '#fecaca' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' };
                      return (
                        <div key={opt.id} style={{ ...S.reviewOpt, ...style }}>
                          <span style={S.reviewOptLetter}>{OPTION_LETTERS[q.options.indexOf(opt)]}</span>
                          <span style={{ flex: 1, fontSize: 14 }}>{opt.text}</span>
                          {isCorrectOpt && (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {isSel && !isCorrectOpt && (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ACTIONS ── */}
        <div style={S.actions}>
          <button onClick={handleRetry} style={S.btnSecondary}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Ulangi Kuis
          </button>
          <button onClick={() => (window.location.href = '/dashboard')} style={S.btnPrimary}>
            Kembali ke Dashboard
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     ACTIVE QUIZ VIEW
  ══════════════════════════════════════════════════════════════ */
  return (
    <div style={S.quizShell}>
      {/* Ambient glow */}
      <div style={{ ...S.blob, top: -40, right: 60, background: 'rgba(59,130,246,0.08)' }} />

      {/* ── TOP BAR ── */}
      <div style={S.quizTopBar}>
        {/* Left: icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={S.quizTitleIcon}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p style={S.quizTitleLabel}>Sedang Mengerjakan</p>
            <h1 style={S.quizTitleText}>{title}</h1>
          </div>
        </div>

        {/* Right: progress pill + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={S.progressPill}>
            <span style={S.progressPillNum}>{answeredCount}</span>
            <span style={S.progressPillSep}>/</span>
            <span style={S.progressPillTotal}>{totalQuestions}</span>
            <span style={S.progressPillLabel}>Dijawab</span>
          </div>
          <button onClick={() => {
            if (window.confirm('Kembali ke menu utama? Progres Anda tersimpan.'))
              window.location.href = '/dashboard';
          }} style={S.closeBtn} title="Tutup Kuis">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={S.progressBarWrap}>
        <div style={S.progressBarTrack}>
          <div style={{ ...S.progressBarFill, width: `${progressPct}%` }} />
        </div>
        <span style={S.progressBarLabel}>{Math.round(progressPct)}% selesai</span>
      </div>

      {/* ── QUESTION NAVIGATOR (dots) ── */}
      <div style={S.dotsRow}>
        {mockQuestions.map((q, i) => {
          const answered = !!selectedAnswers[q.id];
          const active   = i === currentQuestionIdx;
          return (
            <button
              key={q.id}
              onClick={() => { setCurrentQuestionIdx(i); setAnimKey(k => k + 1); }}
              style={{
                ...S.dot,
                background: active ? '#3b82f6' : answered ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)',
                border: active ? '2px solid rgba(96,165,250,0.6)' : answered ? '2px solid rgba(52,211,153,0.4)' : '2px solid transparent',
                transform: active ? 'scale(1.25)' : 'scale(1)',
                color: active ? '#fff' : answered ? '#d1fae5' : 'rgba(255,255,255,0.38)',
                boxShadow: active ? '0 0 12px rgba(59,130,246,0.55)' : 'none',
              }}
              title={`Soal ${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* ── QUESTION BODY ── */}
      <div key={animKey} style={S.questionBody}>
        {/* Question number chip */}
        <div style={S.questionChip}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
          </svg>
          Pertanyaan {currentQuestionIdx + 1} dari {totalQuestions}
        </div>

        {/* Question text */}
        <h2 style={S.questionText}>{currentQuestion.text}</h2>

        {/* Image (if any) */}
        {currentQuestion.mediaUrl && (
          <div style={S.questionImage}>
            <img src={currentQuestion.mediaUrl} alt="Ilustrasi Soal" style={{ width: '100%', maxHeight: 280, objectFit: 'cover' }} />
          </div>
        )}

        {/* Options */}
        <div style={S.optionsGrid}>
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentQuestion.id] === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                style={{
                  ...S.optionBtn,
                  background: isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '2px solid rgba(96,165,250,0.6)' : '2px solid rgba(255,255,255,0.07)',
                  boxShadow: isSelected ? '0 0 24px rgba(37,99,235,0.18), inset 0 0 0 1px rgba(96,165,250,0.15)' : 'none',
                  transform: isSelected ? 'translateY(-1px)' : 'none',
                }}
              >
                {/* Letter badge */}
                <div style={{
                  ...S.optionLetter,
                  background: isSelected ? 'rgba(37,99,235,0.9)' : 'rgba(255,255,255,0.06)',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: isSelected ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                  {OPTION_LETTERS[idx]}
                </div>

                <span style={{ ...S.optionText, color: isSelected ? '#e0f2fe' : 'rgba(255,255,255,0.72)' }}>
                  {option.text}
                </span>

                {isSelected && (
                  <div style={S.optionCheck}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" fill="rgba(59,130,246,0.9)" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER NAV ── */}
      <div style={S.quizFooter}>
        {/* Back button */}
        <button
          onClick={handleBack}
          disabled={currentQuestionIdx === 0}
          style={{ ...S.navBtnSecondary, opacity: currentQuestionIdx === 0 ? 0 : 1, pointerEvents: currentQuestionIdx === 0 ? 'none' : 'auto' }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Sebelumnya
        </button>

        {/* Center: unanswered hint */}
        {!isCurrentAnswered && (
          <span style={S.hintText}>⇡ Pilih jawaban terlebih dahulu</span>
        )}

        {/* Next / Submit */}
        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            style={{
              ...S.navBtnPrimary,
              background: isCurrentAnswered
                ? 'linear-gradient(135deg, #059669, #10b981)'
                : 'rgba(255,255,255,0.06)',
              boxShadow: isCurrentAnswered ? '0 0 28px rgba(16,185,129,0.35)' : 'none',
              color: isCurrentAnswered ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: isCurrentAnswered ? 'pointer' : 'not-allowed',
            }}
          >
            Kumpulkan
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              ...S.navBtnPrimary,
              background: isCurrentAnswered
                ? 'linear-gradient(135deg, #1d4ed8, #0891b2)'
                : 'rgba(255,255,255,0.06)',
              boxShadow: isCurrentAnswered ? '0 0 28px rgba(37,99,235,0.35)' : 'none',
              color: isCurrentAnswered ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: isCurrentAnswered ? 'pointer' : 'not-allowed',
            }}
          >
            Selanjutnya
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STYLE TOKENS  (all inline, zero class conflict)
══════════════════════════════════════════════════════════════ */
const S: Record<string, React.CSSProperties> = {

  // ── Shared ──────────────────────────────────────────────────
  blob: {
    position: 'absolute', borderRadius: '50%',
    width: 320, height: 320,
    filter: 'blur(80px)',
    pointerEvents: 'none', zIndex: 0,
  },

  // ── Quiz Shell ──────────────────────────────────────────────
  quizShell: {
    position: 'relative',
    background: 'linear-gradient(160deg, #07142a 0%, #060f20 100%)',
    border: '1px solid rgba(59,130,246,0.12)',
    borderRadius: 24,
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
    display: 'flex', flexDirection: 'column',
    fontFamily: "'Montserrat', system-ui, sans-serif",
    overflow: 'hidden',
    minHeight: 620,
    maxWidth: 860, marginLeft: 'auto', marginRight: 'auto',
    width: '100%',
  },

  // Quiz topbar
  quizTopBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '22px 28px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(0,0,0,0.2)',
    gap: 16, flexWrap: 'wrap' as const,
    position: 'relative', zIndex: 10,
  },
  quizTitleIcon: {
    width: 42, height: 42, borderRadius: 12,
    background: 'rgba(59,130,246,0.12)',
    border: '1px solid rgba(59,130,246,0.22)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  quizTitleLabel: {
    fontSize: 10, fontWeight: 700,
    color: 'rgba(96,165,250,0.7)',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    marginBottom: 2,
  },
  quizTitleText: {
    fontSize: 15, fontWeight: 700, color: '#e0f2fe', margin: 0,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    maxWidth: 340,
  },
  progressPill: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.18)',
    borderRadius: 99, padding: '6px 16px',
    fontSize: 12, color: 'rgba(255,255,255,0.5)',
  },
  progressPillNum: { fontSize: 16, fontWeight: 800, color: '#60a5fa' },
  progressPillSep: { color: 'rgba(255,255,255,0.2)', margin: '0 2px' },
  progressPillTotal: { fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.45)' },
  progressPillLabel: { marginLeft: 6, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer', transition: 'all 0.18s',
    flexShrink: 0,
  },

  // Progress bar
  progressBarWrap: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 28px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(0,0,0,0.15)',
  },
  progressBarTrack: {
    flex: 1, height: 6, borderRadius: 99,
    background: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 99,
    background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
    boxShadow: '0 0 12px rgba(37,99,235,0.5)',
    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
  },
  progressBarLabel: {
    fontSize: 11, fontWeight: 700,
    color: 'rgba(255,255,255,0.28)',
    whiteSpace: 'nowrap',
  },

  // Dots navigator
  dotsRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '16px 28px 4px',
    overflowX: 'auto',
    position: 'relative', zIndex: 10,
  },
  dot: {
    width: 32, height: 32, borderRadius: 10,
    fontSize: 12, fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    flexShrink: 0,
  },

  // Question body
  questionBody: {
    flex: 1, padding: '28px 28px 20px',
    display: 'flex', flexDirection: 'column', gap: 24,
    position: 'relative', zIndex: 10,
    animation: 'slideUp 0.3s ease forwards',
  },
  questionChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.18)',
    borderRadius: 99, padding: '6px 14px',
    fontSize: 12, fontWeight: 700,
    color: 'rgba(96,165,250,0.9)',
    letterSpacing: '0.03em',
    alignSelf: 'flex-start',
  },
  questionText: {
    fontSize: 20, fontWeight: 700, lineHeight: 1.55,
    color: '#f0f8ff', margin: 0,
    letterSpacing: '-0.2px',
  },
  questionImage: {
    borderRadius: 14, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.07)',
    maxWidth: 560,
  },

  // Options
  optionsGrid: {
    display: 'flex', flexDirection: 'column', gap: 12,
    marginTop: 4,
  },
  optionBtn: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '16px 20px',
    borderRadius: 16,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    position: 'relative',
  },
  optionLetter: {
    width: 42, height: 42, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, fontWeight: 800,
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  optionText: {
    flex: 1, fontSize: 16, fontWeight: 500, lineHeight: 1.5,
    transition: 'color 0.2s',
  },
  optionCheck: {
    marginLeft: 'auto', flexShrink: 0,
    animation: 'scaleIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
  },

  // Footer nav
  quizFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 28px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(0,0,0,0.2)',
    gap: 16, flexWrap: 'wrap' as const,
    position: 'relative', zIndex: 10,
  },
  navBtnSecondary: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 24px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: "'Montserrat', system-ui, sans-serif",
  },
  navBtnPrimary: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 28px',
    borderRadius: 14, border: 'none',
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: "'Montserrat', system-ui, sans-serif",
    letterSpacing: '0.02em',
  },
  hintText: {
    fontSize: 12, color: 'rgba(255,255,255,0.25)',
    fontWeight: 500, textAlign: 'center',
    flex: 1,
  },

  /* ── Result Page ── */
  resultPage: {
    position: 'relative',
    background: 'linear-gradient(160deg, #07142a 0%, #060f20 100%)',
    border: '1px solid rgba(59,130,246,0.12)',
    borderRadius: 24,
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
    fontFamily: "'Montserrat', system-ui, sans-serif",
    overflow: 'hidden',
    maxWidth: 900, marginLeft: 'auto', marginRight: 'auto',
    width: '100%',
    animation: 'fadeIn 0.4s ease',
    display: 'flex', flexDirection: 'column', gap: 0,
  },

  resultHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(0,0,0,0.2)',
    flexWrap: 'wrap' as const, gap: 16,
  },
  resultHeaderLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  resultIconBox: {
    width: 48, height: 48, borderRadius: 14,
    background: 'rgba(59,130,246,0.10)',
    border: '1px solid rgba(59,130,246,0.22)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  resultTitle: { fontSize: 20, fontWeight: 800, color: '#f0f8ff', margin: 0 },
  resultSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
  scorePill: {
    padding: '8px 18px', borderRadius: 99,
    fontSize: 13, fontWeight: 800, letterSpacing: '0.02em',
  },

  // Score row
  scoreSummaryRow: {
    display: 'flex', alignItems: 'center', gap: 28,
    padding: '36px 32px',
    flexWrap: 'wrap' as const,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    position: 'relative', zIndex: 1,
  },

  // Circle
  circleCard: {
    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    width: 140, height: 140,
  },
  circleInner: {
    position: 'absolute',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  circleValue: { fontSize: 38, fontWeight: 900, color: '#f0f8ff', lineHeight: 1 },
  circleLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' },

  // Stats grid
  statsGrid: {
    flex: 1, display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 14,
    minWidth: 240,
  },
  statBox: {
    padding: '20px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  statNum: { fontSize: 32, fontWeight: 900, lineHeight: 1 },
  statLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 },

  // Review
  reviewSection: {
    margin: '0',
    position: 'relative', zIndex: 1,
  },
  reviewHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '18px 32px',
    background: 'rgba(0,0,0,0.15)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    borderTop: 'none',
  },
  reviewTitle: { fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' },
  reviewBody: { padding: '0 32px' },
  reviewItem: {
    padding: '28px 0',
    display: 'flex', flexDirection: 'column', gap: 18,
  },
  reviewQRow: {
    display: 'flex', alignItems: 'flex-start', gap: 14,
    flexWrap: 'wrap' as const,
  },
  reviewQNum: {
    width: 34, height: 34, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 800, flexShrink: 0,
  },
  reviewQText: {
    flex: 1, fontSize: 15, fontWeight: 600, color: '#e2efff', lineHeight: 1.6,
    margin: 0, minWidth: 180,
  },
  reviewBadge: {
    fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 99,
    whiteSpace: 'nowrap', alignSelf: 'flex-start', marginTop: 2,
    letterSpacing: '0.04em',
  },
  reviewOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 10,
    paddingLeft: 48,
  },
  reviewOpt: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderRadius: 12,
    transition: 'all 0.18s',
  },
  reviewOptLetter: {
    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
    background: 'rgba(255,255,255,0.05)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)',
  },

  // Actions (result page)
  actions: {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14,
    padding: '24px 32px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(0,0,0,0.2)',
    flexWrap: 'wrap' as const,
  },
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 24px', borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Montserrat', system-ui, sans-serif",
    transition: 'all 0.2s',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 28px', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg, #1d4ed8, #0891b2)',
    boxShadow: '0 0 28px rgba(37,99,235,0.35)',
    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Montserrat', system-ui, sans-serif",
    transition: 'all 0.2s',
  },
};
