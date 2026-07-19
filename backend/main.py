import json
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATA_DIR = Path(__file__).parent / "data"

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "postgres"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "dbname": os.getenv("DB_NAME", "trainer"),
    "user": os.getenv("DB_USER", "trainer"),
    "password": os.getenv("DB_PASSWORD", "trainer"),
}

app = FastAPI(title="QA Interview Trainer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- helpers ----------------
def load_json(name: str) -> Any:
    path = DATA_DIR / name
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_conn():
    return psycopg2.connect(**DB_CONFIG)


def run_sql(query: str) -> Dict[str, Any]:
    """Выполняет SELECT и возвращает колонки + строки."""
    conn = get_conn()
    try:
        conn.set_session(readonly=True, autocommit=True)
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SET search_path TO ecommerce, banking, public")
            cur.execute(query)
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description] if cur.description else []
            return {"columns": cols, "rows": [dict(r) for r in rows]}
    finally:
        conn.close()


def normalize(result_rows: List[Dict[str, Any]]) -> set:
    """Приводит результат к множеству кортежей для сравнения без учёта порядка."""
    norm = set()
    for row in result_rows:
        norm.add(tuple(str(v) for v in row.values()))
    return norm


# ---------------- progress storage ----------------
def init_progress_table():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS app_progress (
                    user_id   TEXT NOT NULL,
                    bank      TEXT NOT NULL,
                    question_id TEXT NOT NULL,
                    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
                    updated_at TIMESTAMP DEFAULT now(),
                    PRIMARY KEY (user_id, bank, question_id)
                );
                """
            )
        conn.commit()
    finally:
        conn.close()


@app.on_event("startup")
def startup():
    try:
        init_progress_table()
    except Exception as e:
        print("WARN: progress table init failed:", e)


# ---------------- models ----------------
class SqlCheckRequest(BaseModel):
    question_id: str
    query: str


class ProgressRequest(BaseModel):
    user_id: str = "default"
    bank: str
    question_id: str
    is_correct: bool


# ---------------- question banks ----------------
@app.get("/health")
def health():
    try:
        con = get_conn()
        con.close()
        return {"status": "ok", "db": "up"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"db down: {e}")


@app.get("/api/sql")
def get_sql_questions():
    return load_json("sql_question_bank.json")


@app.get("/api/java-trainer")
def get_java_trainer():
    return load_json("java_trainer_bank.json")


@app.get("/api/java-core")
def get_java_core():
    return load_json("java_core_questions.json")


@app.get("/api/qa")
def get_qa():
    return load_json("qa_questions.json")


@app.get("/api/question-of-the-day")
def question_of_the_day():
    import datetime, hashlib
    qa = load_json("qa_questions.json")
    items = qa if isinstance(qa, list) else qa.get("questions", [])
    if not items:
        return {}
    day = datetime.date.today().isoformat()
    idx = int(hashlib.md5(day.encode()).hexdigest(), 16) % len(items)
    return items[idx]


# ---------------- SQL checking ----------------
def _find_sql_question(qid: str) -> Optional[Dict[str, Any]]:
    bank = load_json("sql_question_bank.json")
    items = bank if isinstance(bank, list) else bank.get("sql_questions", [])
    for q in items:
        if str(q.get("id")) == str(qid):
            return q
    return None


@app.post("/api/sql/check")
def check_sql(req: SqlCheckRequest):
    q = _find_sql_question(req.question_id)
    if not q:
        raise HTTPException(404, "Question not found")

    # запрет на изменяющие операции
    lowered = req.query.strip().lower()
    forbidden = ("insert", "update", "delete", "drop", "alter", "truncate", "create", "grant")
    if any(lowered.startswith(f) or f" {f} " in lowered for f in forbidden):
        raise HTTPException(400, "Разрешены только SELECT-запросы")

    try:
        user_res = run_sql(req.query)
    except Exception as e:
        return {"correct": False, "error": str(e), "user_result": None}

    reference_sql = q.get("answer") or q.get("solution") or q.get("reference_sql")
    ref_res = None
    correct = None
    if reference_sql:
        try:
            ref_res = run_sql(reference_sql)
            correct = normalize(user_res["rows"]) == normalize(ref_res["rows"])
        except Exception as e:
            ref_res = {"error": str(e)}

    return {
        "correct": correct,
        "user_result": user_res,
        "reference_result": ref_res,
    }


# ---------------- progress ----------------
@app.post("/api/progress")
def save_progress(req: ProgressRequest):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO app_progress (user_id, bank, question_id, is_correct, updated_at)
                VALUES (%s, %s, %s, %s, now())
                ON CONFLICT (user_id, bank, question_id)
                DO UPDATE SET is_correct = EXCLUDED.is_correct, updated_at = now();
                """,
                (req.user_id, req.bank, req.question_id, req.is_correct),
            )
        conn.commit()
        return {"status": "saved"}
    finally:
        conn.close()


@app.get("/api/progress/{user_id}")
def get_progress(user_id: str):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT bank,
                       COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE is_correct) AS correct
                FROM app_progress
                WHERE user_id = %s
                GROUP BY bank;
                """,
                (user_id,),
            )
            return {"by_bank": [dict(r) for r in cur.fetchall()]}
    finally:
        conn.close()
