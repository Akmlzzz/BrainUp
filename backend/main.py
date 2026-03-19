from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
from dotenv import load_dotenv

# Muat variabel environment dari root folder
load_dotenv(dotenv_path="../.env")

app = FastAPI(title="BrainUp Backend API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Ganti dengan domain frontend Anda (misal "http://localhost:4321") pada versi produksi
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Supabase Client
SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Variabel lingkungan SUPABASE_URL dan SUPABASE_KEY (atau versi anon-nya) belum diatur di .env")

# HTTPX Headers untuk REST API Supabase
supabase_headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# --- Skema Data Pydantic ---

class SelectedOption(BaseModel):
    question_id: str
    option_id: str

class QuizSubmitRequest(BaseModel):
    user_id: str
    quiz_id: str
    selected_options: List[SelectedOption]

class QuizSubmitResponse(BaseModel):
    score: float
    correct_count: int
    incorrect_count: int
    message: str

# --- Endpoints ---

@app.post("/api/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(request: QuizSubmitRequest):
    try:
        # 1. Ambil soal (pertanyaan) beserta kunci jawabannya dari Supabase via HTTP REST API
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{SUPABASE_URL}/rest/v1/questions?quiz_id=eq.{request.quiz_id}&select=id,correct_option_id",
                headers=supabase_headers
            )
            
            if res.status_code != 200:
                print(f"Gagal mengambil data dari Supabase: {res.text}")
                # Jangan error out total jika query gagal (bisa jadi tabel memang tidak ada/masih dummy)
                db_questions = []
            else:
                db_questions = res.json()
        
        if not db_questions:
            # Gunakan data kosong (biarkan logika menghitung salah semua) atau handle sesuai kebutuhan
            print("Peringatan: Kuis tidak ditemukan atau belum ada daftar soal pada database.")

        # Mapping kunci jawaban dari database
        correct_answers_map = { 
            q["id"]: q.get("correct_option_id") 
            for q in db_questions
        }

        # 2. Bandingkan jawaban user dengan kunci jawaban
        correct_count = 0
        incorrect_count = 0
        total_questions = len(db_questions)

        for user_answer in request.selected_options:
            q_id = user_answer.question_id
            selected_opt = user_answer.option_id
            
            # Jika user menjawab pertanyaan yang memang ada di database
            if q_id in correct_answers_map:
                if correct_answers_map[q_id] == selected_opt:
                    correct_count += 1
                else:
                    incorrect_count += 1

        # Jika masih ada soal yang belum dijawab (atau missed) otomatis terhitung salah
        unanswered_count = total_questions - (correct_count + incorrect_count)
        incorrect_count += unanswered_count

        # 3. Hitung total skor
        # Misal skala 1-100
        score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        
        # Format skor jadi 2 angka desimal maksimal
        score = round(score, 2)

        # 4. Simpan hasil ke tabel submissions di Supabase
        submission_data = {
            "user_id": request.user_id,
            "quiz_id": request.quiz_id,
            "score": score,
            "correct_count": correct_count,
            "incorrect_count": incorrect_count
        }
        
        async with httpx.AsyncClient() as client:
            insert_headers = {**supabase_headers, "Prefer": "return=representation"}
            insert_res = await client.post(
                f"{SUPABASE_URL}/rest/v1/submissions",
                headers=insert_headers,
                json=submission_data
            )
            
            if insert_res.status_code not in (200, 201):
                print(f"Gagal merekam submission ke DB. Respons: {insert_res.text}")

        # 5. Output respons backend. Kembali ke frontend
        return QuizSubmitResponse(
            score=score,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            message="Kuis berhasil disubmit"
        )

    except Exception as e:
        print(f"Error pada /api/quiz/submit: {e}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan Internal Server Error.")

# Jika dijalankan terpisah, tambahkan blok uvicorn (Opsional)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
