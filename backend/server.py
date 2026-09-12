"""Dependency-free local server for the MediFlow AI hackathon MVP.

Run from the project root:
    python backend/server.py
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from domain import LANGUAGES, fhir_bundle, next_question
from store import Store


ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
DATABASE = ROOT / "data" / "mediflow.db"
STORE = Store(DATABASE)


def demo_encounter() -> dict:
    encounter = STORE.create_encounter(
        {
            "name": "Asha Verma",
            "age": "48",
            "gender": "female",
            "language": "en",
            "consent_acknowledged": True,
        }
    )
    answers = {
        "chief_complaint": "Lower abdominal pain for three days",
        "duration": "3 days",
        "severity": "8",
        "onset": "gradual",
        "pain_location": "lower_abdomen",
        "associated_symptoms": ["vomiting", "fever"],
        "allergies": "Possible allergy to an antibiotic — patient cannot recall the name.",
        "current_medicines": "Metformin and amlodipine (patient-reported)",
        "prakriti": "unknown",
    }
    for question_id, value in answers.items():
        STORE.save_answer(encounter["id"], question_id, value)
    STORE.add_document(
        encounter["id"],
        "Prescription and lab report (demo OCR text)",
        "prescription_and_lab_report",
        """Date: 12 Aug 2026
Metformin 500 mg BID
Amlodipine 5 mg OD

HbA1c: 8.2 % (high)
Glucose: 182 mg/dL (high)
Creatinine: 0.9 mg/dL (normal)
""",
    )
    STORE.complete_encounter(encounter["id"])
    return STORE.get_encounter(encounter["id"])


class MediFlowHandler(BaseHTTPRequestHandler):
    server_version = "MediFlow/0.1"

    def log_message(self, format: str, *args: object) -> None:
        # Keep the demo terminal readable without losing useful request traces.
        sys.stdout.write("[MediFlow] %s - %s\n" % (self.address_string(), format % args))

    def _send_json(self, status: HTTPStatus | int, payload: dict | list) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(int(status))
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1_000_000:
            raise ValueError("Request is too large for the offline demo.")
        raw = self.rfile.read(length)
        if not raw:
            return {}
        value = json.loads(raw.decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("JSON request body must be an object.")
        return value

    def _path_parts(self) -> list[str]:
        parsed = urlparse(self.path)
        return [unquote(part) for part in parsed.path.split("/") if part]

    def _serve_static(self, requested_path: str) -> None:
        relative = requested_path.lstrip("/") or "index.html"
        candidate = (FRONTEND / relative).resolve()
        try:
            candidate.relative_to(FRONTEND.resolve())
        except ValueError:
            self._send_json(HTTPStatus.FORBIDDEN, {"error": "Invalid static path."})
            return
        if not candidate.exists() or not candidate.is_file():
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Page not found."})
            return
        content = candidate.read_bytes()
        content_type, _ = mimetypes.guess_type(candidate.name)
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", (content_type or "application/octet-stream") + "; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self) -> None:  # noqa: N802
        parts = self._path_parts()
        try:
            if parts == ["api", "health"]:
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "status": "ok",
                        "service": "MediFlow AI",
                        "storage": "SQLite local demo",
                        "encounters": STORE.count_encounters(),
                    },
                )
                return
            if parts == ["api", "config"]:
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "languages": [
                            {"code": code, **details} for code, details in LANGUAGES.items()
                        ],
                        "safety_message": (
                            "MediFlow supports clinical intake and clinician review. "
                            "It does not diagnose, prescribe, or replace emergency services."
                        ),
                    },
                )
                return
            if len(parts) == 3 and parts[:2] == ["api", "encounters"]:
                self._send_json(HTTPStatus.OK, STORE.get_encounter(parts[2]))
                return
            if len(parts) == 4 and parts[:2] == ["api", "encounters"] and parts[3] == "fhir":
                self._send_json(HTTPStatus.OK, fhir_bundle(STORE.get_encounter(parts[2])))
                return
            self._serve_static(urlparse(self.path).path)
        except KeyError:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Encounter not found."})
        except Exception as error:  # noqa: BLE001 - request boundary
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})

    def do_POST(self) -> None:  # noqa: N802
        parts = self._path_parts()
        try:
            body = self._read_json()
            if parts == ["api", "encounters"]:
                patient = body.get("patient")
                if not isinstance(patient, dict):
                    raise ValueError("A patient object is required.")
                if not bool(patient.get("consent_acknowledged")):
                    self._send_json(
                        HTTPStatus.BAD_REQUEST,
                        {"error": "Consent acknowledgement is required to start an intake."},
                    )
                    return
                encounter = STORE.create_encounter(patient)
                encounter["next_question"] = next_question(
                    encounter["answers"], encounter["patient"]["language"]
                )
                self._send_json(HTTPStatus.CREATED, encounter)
                return
            if parts == ["api", "demo"]:
                self._send_json(HTTPStatus.CREATED, demo_encounter())
                return
            if len(parts) == 4 and parts[:2] == ["api", "encounters"] and parts[3] == "answers":
                question_id = str(body.get("question_id", "")).strip()
                value = body.get("value")
                if not question_id or value in (None, "", []):
                    raise ValueError("A question id and answer are required.")
                STORE.save_answer(parts[2], question_id, value)
                encounter = STORE.get_encounter(parts[2])
                encounter["next_question"] = next_question(
                    encounter["answers"], encounter["patient"]["language"]
                )
                self._send_json(HTTPStatus.OK, encounter)
                return
            if len(parts) == 4 and parts[:2] == ["api", "encounters"] and parts[3] == "documents":
                source_text = str(body.get("source_text", "")).strip()
                if not source_text:
                    raise ValueError(
                        "Paste OCR text or extracted document text for this offline demonstration."
                    )
                document = STORE.add_document(
                    parts[2],
                    str(body.get("name", "Uploaded document")),
                    str(body.get("document_type", "other")),
                    source_text,
                )
                self._send_json(HTTPStatus.CREATED, document)
                return
            if len(parts) == 4 and parts[:2] == ["api", "encounters"] and parts[3] == "complete":
                STORE.complete_encounter(parts[2])
                self._send_json(HTTPStatus.OK, STORE.get_encounter(parts[2]))
                return
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "API route not found."})
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON request body."})
        except ValueError as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
        except KeyError:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Encounter not found."})
        except Exception as error:  # noqa: BLE001 - request boundary
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})

    def do_PATCH(self) -> None:  # noqa: N802
        parts = self._path_parts()
        try:
            body = self._read_json()
            if len(parts) == 4 and parts[:2] == ["api", "encounters"] and parts[3] == "review":
                STORE.review_encounter(
                    parts[2],
                    str(body.get("status", "pending")),
                    str(body.get("note", "")),
                )
                self._send_json(HTTPStatus.OK, STORE.get_encounter(parts[2]))
                return
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "API route not found."})
        except ValueError as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
        except KeyError:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Encounter not found."})
        except Exception as error:  # noqa: BLE001 - request boundary
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the MediFlow AI offline demo.")
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("PORT", os.environ.get("MEDIFLOW_PORT", "8080"))),
        help="Local port to serve (default: 8080).",
    )
    args = parser.parse_args()
    httpd = ThreadingHTTPServer(("0.0.0.0", args.port), MediFlowHandler)
    print("\nMediFlow AI is ready on port %s" % args.port)
    print("Press Ctrl+C to stop the local demo.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nMediFlow AI stopped.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
