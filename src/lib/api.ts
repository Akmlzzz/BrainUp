const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

// ── Submit Quiz to FastAPI ─────────────────────────────
export async function submitQuizToAPI(
  quizId: string,
  answers: Record<string, string>,
  accessToken: string
): Promise<{ score: number; total: number; correct: number; message: string }> {
  const res = await fetch(`${API_BASE}/api/quiz/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ quiz_id: quizId, answers }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? `API error ${res.status}`);
  }

  return res.json();
}

// ── Get Quiz Questions from FastAPI ────────────────────
export async function getQuizQuestions(
  quizId: string,
  accessToken: string
): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/quiz/${quizId}/questions`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
