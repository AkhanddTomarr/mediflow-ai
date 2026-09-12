"""Clinical-intake rules and evidence-first data shaping for MediFlow AI.

This module intentionally does *not* diagnose or prescribe.  It turns patient-
reported answers and document text into an editable clinical-intake record, then
uses transparent deterministic rules to surface items a clinician may review.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


LANGUAGES = {
    "en": {"label": "English", "native": "English"},
    "hi": {"label": "Hindi", "native": "हिंदी"},
}


@dataclass(frozen=True)
class Question:
    id: str
    kind: str
    prompt: dict[str, str]
    helper: dict[str, str]
    options: list[dict[str, str]] | None = None
    required: bool = True

    def to_dict(self, language: str = "en") -> dict[str, Any]:
        language = language if language in LANGUAGES else "en"
        return {
            "id": self.id,
            "kind": self.kind,
            "prompt": self.prompt.get(language, self.prompt["en"]),
            "helper": self.helper.get(language, self.helper["en"]),
            "options": self.options,
            "required": self.required,
        }


def _option(value: str, en: str, hi: str) -> dict[str, str]:
    return {"value": value, "en": en, "hi": hi}


CORE_QUESTIONS = [
    Question(
        "chief_complaint",
        "text",
        {
            "en": "What brings you here today?",
            "hi": "आज आपको किस परेशानी के लिए सहायता चाहिए?",
        },
        {
            "en": "Use your own words. This is recorded as patient-reported information.",
            "hi": "अपने शब्दों में बताइए। इसे रोगी द्वारा बताई गई जानकारी के रूप में दर्ज किया जाएगा।",
        },
    ),
    Question(
        "duration",
        "text",
        {
            "en": "How long has this been happening?",
            "hi": "यह परेशानी कब से हो रही है?",
        },
        {
            "en": "For example: three days, since yesterday evening, or two weeks.",
            "hi": "जैसे: तीन दिन, कल शाम से, या दो हफ्तों से।",
        },
    ),
    Question(
        "severity",
        "scale",
        {
            "en": "How severe is the discomfort right now?",
            "hi": "इस समय तकलीफ़ कितनी गंभीर है?",
        },
        {
            "en": "0 means no discomfort; 10 means the worst imaginable discomfort.",
            "hi": "0 का अर्थ कोई तकलीफ़ नहीं और 10 का अर्थ सबसे अधिक तकलीफ़ है।",
        },
    ),
    Question(
        "onset",
        "choice",
        {
            "en": "How did it start?",
            "hi": "यह कैसे शुरू हुआ?",
        },
        {
            "en": "Choose the closest answer.",
            "hi": "सबसे सही उत्तर चुनें।",
        },
        [
            _option("sudden", "Suddenly", "अचानक"),
            _option("gradual", "Gradually", "धीरे-धीरे"),
            _option("unknown", "I'm not sure", "मुझे नहीं पता"),
        ],
    ),
    Question(
        "associated_symptoms",
        "multi_choice",
        {
            "en": "Are you experiencing any of these symptoms?",
            "hi": "क्या आपको इनमें से कोई लक्षण है?",
        },
        {
            "en": "Select all that apply. You can skip anything you are unsure about.",
            "hi": "लागू होने वाले सभी विकल्प चुनें। जिनके बारे में आपको पता न हो उन्हें छोड़ सकते हैं।",
        },
        [
            _option("fever", "Fever", "बुखार"),
            _option("vomiting", "Vomiting", "उल्टी"),
            _option("breathing_difficulty", "Difficulty breathing", "सांस लेने में तकलीफ़"),
            _option("chest_pain", "Chest pain", "सीने में दर्द"),
            _option("blood", "Bleeding / blood in stool or vomit", "खून आना / मल या उल्टी में खून"),
            _option("fainting", "Fainting or severe dizziness", "बेहोशी या बहुत चक्कर"),
            _option("none", "None of these", "इनमें से कोई नहीं"),
        ],
    ),
    Question(
        "allergies",
        "text",
        {
            "en": "Do you have any known medicine or food allergies?",
            "hi": "क्या आपको किसी दवा या भोजन से ज्ञात एलर्जी है?",
        },
        {
            "en": "If you are not sure of the name, say so. We will mark it for clinician verification.",
            "hi": "यदि नाम पता नहीं है तो ऐसा लिखें। इसे चिकित्सक के सत्यापन के लिए चिह्नित किया जाएगा।",
        },
        required=False,
    ),
    Question(
        "current_medicines",
        "text",
        {
            "en": "What medicines or supplements are you currently taking?",
            "hi": "आप इस समय कौन-सी दवाएँ या सप्लीमेंट ले रहे हैं?",
        },
        {
            "en": "Include names or a photo/document if available. It is okay to leave this blank.",
            "hi": "यदि संभव हो तो नाम या फोटो/दस्तावेज़ दें। खाली छोड़ना भी ठीक है।",
        },
        required=False,
    ),
]


ABDOMINAL_FOLLOW_UP = [
    Question(
        "pain_location",
        "choice",
        {
            "en": "Where is the pain or discomfort located?",
            "hi": "दर्द या तकलीफ़ कहाँ है?",
        },
        {
            "en": "Choose the closest location.",
            "hi": "सबसे सही स्थान चुनें।",
        },
        [
            _option("upper_abdomen", "Upper abdomen", "पेट का ऊपरी भाग"),
            _option("lower_abdomen", "Lower abdomen", "पेट का निचला भाग"),
            _option("right_side", "Right side", "दायाँ भाग"),
            _option("left_side", "Left side", "बायाँ भाग"),
            _option("around_navel", "Around the navel", "नाभि के आसपास"),
            _option("unknown", "I'm not sure", "मुझे नहीं पता"),
        ],
    )
]


CHEST_FOLLOW_UP = [
    Question(
        "chest_trigger",
        "choice",
        {
            "en": "Does the chest discomfort worsen with activity, breathing, or rest?",
            "hi": "क्या सीने की तकलीफ़ गतिविधि, सांस लेने या आराम के साथ बदलती है?",
        },
        {
            "en": "This does not provide a diagnosis; it helps the clinician understand the history.",
            "hi": "यह निदान नहीं देता; यह चिकित्सक को इतिहास समझने में मदद करता है।",
        },
        [
            _option("activity", "Worse with activity", "गतिविधि से बढ़ता है"),
            _option("breathing", "Worse with breathing", "सांस लेने से बढ़ता है"),
            _option("rest", "Present at rest", "आराम में भी है"),
            _option("unknown", "I'm not sure", "मुझे नहीं पता"),
        ],
    )
]


AYUSH_QUESTIONS = [
    Question(
        "prakriti",
        "choice",
        {
            "en": "Optional AYUSH history: has a clinician ever recorded your Prakriti?",
            "hi": "वैकल्पिक आयुष इतिहास: क्या किसी चिकित्सक ने पहले आपकी प्रकृति दर्ज की है?",
        },
        {
            "en": "Only choose a value previously explained or recorded by a qualified clinician.",
            "hi": "केवल वही विकल्प चुनें जो किसी योग्य चिकित्सक ने पहले बताया या दर्ज किया हो।",
        },
        [
            _option("vata", "Vata", "वात"),
            _option("pitta", "Pitta", "पित्त"),
            _option("kapha", "Kapha", "कफ"),
            _option("unknown", "Not known / not assessed", "ज्ञात नहीं / मूल्यांकन नहीं हुआ"),
        ],
        required=False,
    )
]


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(str(item).strip() for item in value if str(item).strip())
    return re.sub(r"\s+", " ", str(value).strip())


def _symptom_set(value: Any) -> set[str]:
    if isinstance(value, list):
        return {str(item).strip().lower() for item in value}
    return {item.strip().lower() for item in normalize_text(value).split(",") if item.strip()}


def is_abdominal_case(chief_complaint: str) -> bool:
    terms = ("abdominal", "abdomen", "stomach", "belly", "पेट", "पेट में")
    text = chief_complaint.lower()
    return any(term in text for term in terms)


def is_chest_case(chief_complaint: str) -> bool:
    terms = ("chest", "सीने", "सीना")
    text = chief_complaint.lower()
    return any(term in text for term in terms)


def question_sequence(answers: dict[str, Any], include_ayush: bool = True) -> list[Question]:
    """Return a deterministic, inspectable sequence based on patient answers."""
    sequence = [CORE_QUESTIONS[0]]
    complaint = normalize_text(answers.get("chief_complaint"))
    if complaint:
        sequence.extend(CORE_QUESTIONS[1:4])
        if is_abdominal_case(complaint):
            sequence.extend(ABDOMINAL_FOLLOW_UP)
        if is_chest_case(complaint):
            sequence.extend(CHEST_FOLLOW_UP)
        sequence.extend(CORE_QUESTIONS[4:])
        if include_ayush:
            sequence.extend(AYUSH_QUESTIONS)
    return sequence


def next_question(answers: dict[str, Any], language: str = "en") -> dict[str, Any] | None:
    for question in question_sequence(answers):
        if question.id not in answers or normalize_text(answers.get(question.id)) == "":
            return question.to_dict(language)
    return None


def red_flags(answers: dict[str, Any]) -> list[dict[str, Any]]:
    """Return explainable attention flags, never a diagnosis or triage decision."""
    findings: list[dict[str, Any]] = []
    symptoms = _symptom_set(answers.get("associated_symptoms"))
    severity_raw = normalize_text(answers.get("severity"))
    try:
        severity = int(float(severity_raw))
    except ValueError:
        severity = 0

    def add(flag_id: str, title: str, explanation: str, evidence: list[str], priority: str) -> None:
        findings.append(
            {
                "id": flag_id,
                "title": title,
                "explanation": explanation,
                "evidence": evidence,
                "priority": priority,
                "disclaimer": "Potential attention item only — clinician review required.",
            }
        )

    if "breathing_difficulty" in symptoms:
        add(
            "breathing_difficulty",
            "Breathing difficulty reported",
            "The patient selected difficulty breathing during intake.",
            ["Patient-reported associated symptom: difficulty breathing"],
            "high",
        )
    if "chest_pain" in symptoms or (is_chest_case(normalize_text(answers.get("chief_complaint"))) and severity >= 7):
        add(
            "chest_symptom",
            "Chest symptom needs review",
            "Chest pain was selected or severe chest discomfort was described.",
            ["Patient-reported chief complaint / associated symptom"],
            "high",
        )
    if "blood" in symptoms:
        add(
            "bleeding",
            "Bleeding mentioned",
            "The patient selected bleeding or blood in stool/vomit.",
            ["Patient-reported associated symptom: bleeding"],
            "high",
        )
    if "fainting" in symptoms:
        add(
            "fainting",
            "Fainting or severe dizziness reported",
            "The patient selected fainting or severe dizziness.",
            ["Patient-reported associated symptom: fainting or severe dizziness"],
            "high",
        )
    if severity >= 8:
        add(
            "severe_discomfort",
            "Severe discomfort score",
            "The patient reported a severity score of %s/10." % severity,
            ["Patient-reported severity: %s/10" % severity],
            "medium",
        )
    if (
        is_abdominal_case(normalize_text(answers.get("chief_complaint")))
        and "vomiting" in symptoms
        and severity >= 7
    ):
        add(
            "abdominal_vomiting_pattern",
            "Abdominal pain with vomiting",
            "The patient reported abdominal symptoms, vomiting, and a high discomfort score.",
            [
                "Patient-reported chief complaint: abdominal symptoms",
                "Patient-reported associated symptom: vomiting",
                "Patient-reported severity: %s/10" % severity,
            ],
            "medium",
        )
    return findings


MEDICINE_PATTERN = re.compile(
    r"(?im)^\s*(?P<name>[A-Z][A-Za-z0-9+ -]{2,40}?)\s+"
    r"(?P<dose>\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml))"
    r"(?:\s+(?P<frequency>(?:OD|BD|TDS|QDS|BID|daily|once daily|twice daily|[0-9]+[x×]\s*daily)))?"
)
LAB_PATTERN = re.compile(
    r"(?im)^\s*(?P<name>[A-Za-z][A-Za-z0-9 %/()-]{1,45}?)\s*[:=-]\s*"
    r"(?P<value>\d+(?:\.\d+)?)\s*(?P<unit>%|mg/dL|mmol/L|g/dL|IU/L|mIU/L|cells/mm3)?"
    r"(?:\s*\((?P<status>high|low|normal|H|L)\))?\s*$"
)


def extract_document_entities(text: str) -> dict[str, Any]:
    """Conservative regex extraction from already OCR'd/pasted text.

    Every entity retains the raw source fragment and is marked for clinician
    verification.  An absent match means "not extracted", not "not present".
    """
    source = normalize_text(text)
    medications = []
    labs = []
    for match in MEDICINE_PATTERN.finditer(text):
        medications.append(
            {
                "name": match.group("name").strip(),
                "dose": match.group("dose").strip(),
                "frequency": (match.group("frequency") or "Not stated").strip(),
                "confidence": 0.78,
                "source_excerpt": match.group(0).strip(),
                "verification_status": "requires_clinician_verification",
            }
        )
    for match in LAB_PATTERN.finditer(text):
        name = match.group("name").strip()
        if name.lower() in {"date", "patient", "name", "age"}:
            continue
        status = (match.group("status") or "not_interpreted").lower()
        labs.append(
            {
                "test_name": name,
                "value": match.group("value"),
                "unit": (match.group("unit") or "").strip(),
                "reported_status": status,
                "confidence": 0.82,
                "source_excerpt": match.group(0).strip(),
                "verification_status": "requires_clinician_verification",
            }
        )
    dates = re.findall(r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b", text)
    return {
        "raw_text_present": bool(source),
        "medications": medications,
        "labs": labs,
        "dates_mentioned": dates[:5],
        "warning": "Automated extraction from supplied text; clinician verification is required before clinical use.",
    }


def clinical_summary(
    patient: dict[str, Any],
    answers: dict[str, Any],
    documents: list[dict[str, Any]],
) -> dict[str, Any]:
    """Create an evidence-linked, editable draft summary without inference."""
    chief_complaint = normalize_text(answers.get("chief_complaint"))
    history_rows = []
    labels = {
        "duration": "Duration",
        "severity": "Patient-reported severity",
        "onset": "Onset",
        "pain_location": "Location",
        "chest_trigger": "Pattern / trigger",
        "associated_symptoms": "Associated symptoms",
        "allergies": "Allergies",
        "current_medicines": "Current medicines (patient-reported)",
        "prakriti": "AYUSH history — Prakriti",
    }
    for key, label in labels.items():
        value = normalize_text(answers.get(key))
        if value and value.lower() not in {"none", "unknown", "not known / not assessed"}:
            history_rows.append(
                {
                    "label": label,
                    "value": value,
                    "provenance": "Patient conversation",
                    "confidence": 1.0,
                }
            )

    medications: list[dict[str, Any]] = []
    labs: list[dict[str, Any]] = []
    for document in documents:
        extraction = document.get("extraction", {})
        for medicine in extraction.get("medications", []):
            medications.append({**medicine, "document_name": document.get("name", "Uploaded document")})
        for lab in extraction.get("labs", []):
            labs.append({**lab, "document_name": document.get("name", "Uploaded document")})

    return {
        "summary_type": "clinician_review_draft",
        "generated_at": datetime.now(UTC).isoformat(),
        "patient": {
            "name": normalize_text(patient.get("name")) or "Not stated",
            "age": normalize_text(patient.get("age")) or "Not stated",
            "gender": normalize_text(patient.get("gender")) or "Not stated",
        },
        "chief_complaint": {
            "value": chief_complaint or "Not stated",
            "provenance": "Patient conversation" if chief_complaint else "Not available",
            "confidence": 1.0 if chief_complaint else 0.0,
        },
        "history": history_rows,
        "medications": medications,
        "labs": labs,
        "red_flags": red_flags(answers),
        "safety_note": (
            "This is an editable intake summary, not a diagnosis, prescription, "
            "or emergency decision. Information must be reviewed by a clinician."
        ),
    }


def fhir_bundle(encounter: dict[str, Any]) -> dict[str, Any]:
    """Create a small FHIR R4-compatible demonstration bundle.

    It intentionally uses a local identifier, has no ABDM authentication claim,
    and contains only patient-provided/demo data.
    """
    patient = encounter["patient"]
    summary = encounter["summary"]
    encounter_id = encounter["id"]
    entries: list[dict[str, Any]] = [
        {
            "fullUrl": "urn:uuid:patient-%s" % patient["id"],
            "resource": {
                "resourceType": "Patient",
                "id": "patient-%s" % patient["id"],
                "name": [{"text": patient.get("name") or "Not stated"}],
                "gender": patient.get("gender") or "unknown",
            },
        },
        {
            "fullUrl": "urn:uuid:encounter-%s" % encounter_id,
            "resource": {
                "resourceType": "Encounter",
                "id": "encounter-%s" % encounter_id,
                "status": "finished" if encounter.get("status") == "completed" else "in-progress",
                "subject": {"reference": "Patient/patient-%s" % patient["id"]},
                "class": {"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "AMB"},
            },
        },
    ]
    if summary["chief_complaint"]["value"] != "Not stated":
        entries.append(
            {
                "resource": {
                    "resourceType": "Condition",
                    "clinicalStatus": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                                "code": "active",
                            }
                        ]
                    },
                    "subject": {"reference": "Patient/patient-%s" % patient["id"]},
                    "encounter": {"reference": "Encounter/encounter-%s" % encounter_id},
                    "code": {"text": summary["chief_complaint"]["value"]},
                    "note": [{"text": "Patient-reported intake complaint; not a diagnosis."}],
                }
            }
        )
    for item in summary.get("history", []):
        entries.append(
            {
                "resource": {
                    "resourceType": "Observation",
                    "status": "preliminary",
                    "subject": {"reference": "Patient/patient-%s" % patient["id"]},
                    "encounter": {"reference": "Encounter/encounter-%s" % encounter_id},
                    "code": {"text": item["label"]},
                    "valueString": item["value"],
                    "note": [{"text": "Source: %s" % item["provenance"]}],
                }
            }
        )
    return {
        "resourceType": "Bundle",
        "type": "collection",
        "timestamp": datetime.now(UTC).isoformat(),
        "identifier": {"system": "https://mediflow.demo/local", "value": encounter_id},
        "entry": entries,
        "meta": {
            "tag": [
                {
                    "system": "https://mediflow.demo/tags",
                    "code": "demo-only",
                    "display": "Mock ABDM/FHIR interoperability demonstration",
                }
            ]
        },
    }
