"""Small SQLite persistence layer for the offline MediFlow demo."""

from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from domain import clinical_summary, extract_document_entities


class Store:
    def __init__(self, database_path: str | Path) -> None:
        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._connection = sqlite3.connect(
            self.database_path, check_same_thread=False, isolation_level=None
        )
        self._connection.row_factory = sqlite3.Row
        self._initialize()

    def _initialize(self) -> None:
        with self._lock:
            self._connection.executescript(
                """
                PRAGMA foreign_keys = ON;

                CREATE TABLE IF NOT EXISTS patients (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    age TEXT,
                    gender TEXT,
                    language TEXT NOT NULL,
                    consent_acknowledged INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS encounters (
                    id TEXT PRIMARY KEY,
                    patient_id TEXT NOT NULL REFERENCES patients(id),
                    status TEXT NOT NULL DEFAULT 'in_progress',
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    doctor_review_status TEXT NOT NULL DEFAULT 'pending',
                    doctor_note TEXT NOT NULL DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS answers (
                    encounter_id TEXT NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
                    question_id TEXT NOT NULL,
                    value_json TEXT NOT NULL,
                    source TEXT NOT NULL DEFAULT 'patient_conversation',
                    confidence REAL NOT NULL DEFAULT 1.0,
                    captured_at TEXT NOT NULL,
                    PRIMARY KEY (encounter_id, question_id)
                );

                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    encounter_id TEXT NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
                    name TEXT NOT NULL,
                    document_type TEXT NOT NULL,
                    source_text TEXT NOT NULL,
                    extraction_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )

    @staticmethod
    def _now() -> str:
        return datetime.now(UTC).isoformat()

    def create_encounter(self, patient_input: dict[str, Any]) -> dict[str, Any]:
        patient_id = str(uuid.uuid4())
        encounter_id = str(uuid.uuid4())
        now = self._now()
        patient = {
            "id": patient_id,
            "name": str(patient_input.get("name", "")).strip() or "Anonymous patient",
            "age": str(patient_input.get("age", "")).strip(),
            "gender": str(patient_input.get("gender", "")).strip().lower() or "unknown",
            "language": str(patient_input.get("language", "en")).strip().lower() or "en",
            "consent_acknowledged": bool(patient_input.get("consent_acknowledged")),
        }
        with self._lock:
            self._connection.execute(
                """
                INSERT INTO patients (id, name, age, gender, language, consent_acknowledged, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    patient["name"],
                    patient["age"],
                    patient["gender"],
                    patient["language"],
                    int(patient["consent_acknowledged"]),
                    now,
                ),
            )
            self._connection.execute(
                "INSERT INTO encounters (id, patient_id, created_at) VALUES (?, ?, ?)",
                (encounter_id, patient_id, now),
            )
        return self.get_encounter(encounter_id)

    def save_answer(self, encounter_id: str, question_id: str, value: Any) -> None:
        encoded_value = json.dumps(value, ensure_ascii=False)
        with self._lock:
            self._connection.execute(
                """
                INSERT INTO answers (encounter_id, question_id, value_json, captured_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(encounter_id, question_id) DO UPDATE SET
                    value_json = excluded.value_json,
                    captured_at = excluded.captured_at
                """,
                (encounter_id, question_id, encoded_value, self._now()),
            )

    def add_document(
        self,
        encounter_id: str,
        name: str,
        document_type: str,
        source_text: str,
    ) -> dict[str, Any]:
        document_id = str(uuid.uuid4())
        extraction = extract_document_entities(source_text)
        created_at = self._now()
        with self._lock:
            self._connection.execute(
                """
                INSERT INTO documents
                    (id, encounter_id, name, document_type, source_text, extraction_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    document_id,
                    encounter_id,
                    name.strip() or "Untitled document",
                    document_type.strip() or "other",
                    source_text,
                    json.dumps(extraction, ensure_ascii=False),
                    created_at,
                ),
            )
        return {
            "id": document_id,
            "name": name.strip() or "Untitled document",
            "document_type": document_type.strip() or "other",
            "source_text": source_text,
            "extraction": extraction,
            "created_at": created_at,
        }

    def complete_encounter(self, encounter_id: str) -> None:
        with self._lock:
            self._connection.execute(
                """
                UPDATE encounters
                SET status = 'completed', completed_at = ?
                WHERE id = ?
                """,
                (self._now(), encounter_id),
            )

    def review_encounter(self, encounter_id: str, status: str, note: str) -> None:
        allowed_statuses = {"pending", "reviewed", "accepted", "needs_follow_up"}
        if status not in allowed_statuses:
            raise ValueError("Unsupported clinician review status.")
        with self._lock:
            self._connection.execute(
                """
                UPDATE encounters
                SET doctor_review_status = ?, doctor_note = ?
                WHERE id = ?
                """,
                (status, note.strip(), encounter_id),
            )

    def _answers_for(self, encounter_id: str) -> dict[str, Any]:
        rows = self._connection.execute(
            """
            SELECT question_id, value_json, source, confidence, captured_at
            FROM answers WHERE encounter_id = ?
            ORDER BY captured_at ASC
            """,
            (encounter_id,),
        ).fetchall()
        answers: dict[str, Any] = {}
        for row in rows:
            answers[row["question_id"]] = json.loads(row["value_json"])
        return answers

    def _documents_for(self, encounter_id: str) -> list[dict[str, Any]]:
        rows = self._connection.execute(
            """
            SELECT id, name, document_type, source_text, extraction_json, created_at
            FROM documents WHERE encounter_id = ?
            ORDER BY created_at ASC
            """,
            (encounter_id,),
        ).fetchall()
        return [
            {
                "id": row["id"],
                "name": row["name"],
                "document_type": row["document_type"],
                "source_text": row["source_text"],
                "extraction": json.loads(row["extraction_json"]),
                "created_at": row["created_at"],
            }
            for row in rows
        ]

    def get_encounter(self, encounter_id: str) -> dict[str, Any]:
        with self._lock:
            row = self._connection.execute(
                """
                SELECT
                    e.id AS encounter_id, e.status, e.created_at AS encounter_created_at,
                    e.completed_at, e.doctor_review_status, e.doctor_note,
                    p.id AS patient_id, p.name, p.age, p.gender, p.language,
                    p.consent_acknowledged, p.created_at AS patient_created_at
                FROM encounters e
                JOIN patients p ON p.id = e.patient_id
                WHERE e.id = ?
                """,
                (encounter_id,),
            ).fetchone()
            if not row:
                raise KeyError("Encounter not found.")
            patient = {
                "id": row["patient_id"],
                "name": row["name"],
                "age": row["age"],
                "gender": row["gender"],
                "language": row["language"],
                "consent_acknowledged": bool(row["consent_acknowledged"]),
                "created_at": row["patient_created_at"],
            }
            answers = self._answers_for(encounter_id)
            documents = self._documents_for(encounter_id)
            encounter = {
                "id": row["encounter_id"],
                "status": row["status"],
                "created_at": row["encounter_created_at"],
                "completed_at": row["completed_at"],
                "doctor_review": {
                    "status": row["doctor_review_status"],
                    "note": row["doctor_note"],
                },
                "patient": patient,
                "answers": answers,
                "documents": documents,
            }
            encounter["summary"] = clinical_summary(patient, answers, documents)
            return encounter

    def count_encounters(self) -> int:
        with self._lock:
            row = self._connection.execute("SELECT COUNT(*) AS count FROM encounters").fetchone()
            return int(row["count"])
