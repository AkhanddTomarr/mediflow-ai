/* MediFlow AI kiosk and clinician dashboard â€” no third-party dependencies. */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var toastRegion = document.getElementById("toast-region");
  var state = {
    language: "en",
    encounter: null,
    view: "welcome",
    fhir: null,
    highContrast: false
  };

  var copy = {
    en: {
      patient: "Patient kiosk",
      clinician: "Clinician review",
      contrast: "High contrast",
      newIntake: "New intake",
      safety: "Intake support only Â· No diagnosis or prescription",
      start: "Start protected intake",
      demo: "Load judge-ready demo",
      language: "Choose language",
      name: "Patient name",
      age: "Age",
      gender: "Gender",
      selectGender: "Select gender",
      consent: "I understand that this demo collects only the information I enter for a clinician-review intake summary. It does not diagnose, prescribe, or replace emergency services.",
      subtitle: "A multilingual, consent-first clinical intake that gives doctors verified context â€” not an AI doctor.",
      dashboardTitle: "Clinician review workspace",
      dashboardLead: "Every item shows its source and remains editable before clinical use.",
      noDocuments: "No document text has been added yet.",
      saveReview: "Save review",
      fhir: "View FHIR bundle",
      finish: "Finish intake & open review",
      continue: "Continue",
      optional: "Optional",
      skip: "Skip for now",
      speak: "Play audio guidance",
      voice: "Use voice answer",
      listening: "Listeningâ€¦",
      uploadTitle: "Add a document safely",
      uploadText: "For this offline demo, paste OCR text from a prescription, report, or discharge summary. Every extracted value stays marked for clinician verification.",
      useSample: "Use sample OCR text",
      addDocument: "Add document",
      docName: "Document name",
      docType: "Document type",
      documentText: "OCR / extracted text",
      documentPlaceholder: "Example: Metformin 500 mg BID\nHbA1c: 8.2 % (high)",
      source: "Source",
      attention: "Attention items",
      noAttention: "No deterministic attention items were triggered by the recorded answers.",
      history: "Patient-reported history",
      documents: "Document extraction",
      timeline: "Evidence timeline",
      review: "Clinician review decision",
      note: "Clinician note",
      status: "Review status",
      pending: "Pending",
      reviewed: "Reviewed",
      accepted: "Accepted",
      needs_follow_up: "Needs follow-up",
      close: "Close",
      fhirTitle: "FHIR-compatible mock export",
      fhirDescription: "Demo-only, local JSON. Production ABDM integration requires approved sandbox/onboarding and consent workflows."
    },
    hi: {
      patient: "à¤°à¥‹à¤—à¥€ à¤•à¤¿à¤¯à¥‹à¤¸à¥à¤•",
      clinician: "à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤• à¤¸à¤®à¥€à¤•à¥à¤·à¤¾",
      contrast: "à¤‰à¤šà¥à¤š à¤•à¥‰à¤¨à¥à¤Ÿà¥à¤°à¤¾à¤¸à¥à¤Ÿ",
      newIntake: "à¤¨à¤¯à¤¾ à¤‡à¤‚à¤Ÿà¥‡à¤•",
      safety: "à¤•à¥‡à¤µà¤² à¤‡à¤‚à¤Ÿà¥‡à¤• à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ Â· à¤¨à¤¿à¤¦à¤¾à¤¨ à¤¯à¤¾ à¤ªà¤°à¥à¤šà¤¾ à¤¨à¤¹à¥€à¤‚",
      start: "à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤‡à¤‚à¤Ÿà¥‡à¤• à¤¶à¥à¤°à¥‚ à¤•à¤°à¥‡à¤‚",
      demo: "à¤¡à¥‡à¤®à¥‹ à¤²à¥‹à¤¡ à¤•à¤°à¥‡à¤‚",
      language: "à¤­à¤¾à¤·à¤¾ à¤šà¥à¤¨à¥‡à¤‚",
      name: "à¤°à¥‹à¤—à¥€ à¤•à¤¾ à¤¨à¤¾à¤®",
      age: "à¤†à¤¯à¥",
      gender: "à¤²à¤¿à¤‚à¤—",
      selectGender: "à¤²à¤¿à¤‚à¤— à¤šà¥à¤¨à¥‡à¤‚",
      consent: "à¤®à¥ˆà¤‚ à¤¸à¤®à¤à¤¤à¤¾/à¤¸à¤®à¤à¤¤à¥€ à¤¹à¥‚à¤ à¤•à¤¿ à¤¯à¤¹ à¤¡à¥‡à¤®à¥‹ à¤•à¥‡à¤µà¤² à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤•-à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤‡à¤‚à¤Ÿà¥‡à¤• à¤¸à¤¾à¤°à¤¾à¤‚à¤¶ à¤•à¥‡ à¤²à¤¿à¤ à¤®à¥‡à¤°à¥‡ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤¦à¥€ à¤—à¤ˆ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤à¤•à¤¤à¥à¤° à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤ à¤¯à¤¹ à¤¨à¤¿à¤¦à¤¾à¤¨, à¤ªà¤°à¥à¤šà¤¾ à¤¯à¤¾ à¤†à¤ªà¤¾à¤¤à¤•à¤¾à¤²à¥€à¤¨ à¤¸à¥‡à¤µà¤¾ à¤•à¤¾ à¤µà¤¿à¤•à¤²à¥à¤ª à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤",
      subtitle: "à¤¬à¤¹à¥à¤­à¤¾à¤·à¥€, à¤¸à¤¹à¤®à¤¤à¤¿-à¤†à¤§à¤¾à¤°à¤¿à¤¤ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•à¤² à¤‡à¤‚à¤Ÿà¥‡à¤• à¤œà¥‹ à¤¡à¥‰à¤•à¥à¤Ÿà¤°à¥‹à¤‚ à¤•à¥‹ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤¸à¤‚à¤¦à¤°à¥à¤­ à¤¦à¥‡à¤¤à¤¾ à¤¹à¥ˆ â€” AI à¤¡à¥‰à¤•à¥à¤Ÿà¤° à¤¨à¤¹à¥€à¤‚à¥¤",
      dashboardTitle: "à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤• à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤·à¥‡à¤¤à¥à¤°",
      dashboardLead: "à¤¹à¤° à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤•à¤¾ à¤¸à¥à¤°à¥‹à¤¤ à¤¦à¤¿à¤–à¤¤à¤¾ à¤¹à¥ˆ à¤”à¤° à¤‰à¤ªà¤¯à¥‹à¤— à¤¸à¥‡ à¤ªà¤¹à¤²à¥‡ à¤¸à¤‚à¤ªà¤¾à¤¦à¤¿à¤¤ à¤•à¥€ à¤œà¤¾ à¤¸à¤•à¤¤à¥€ à¤¹à¥ˆà¥¤",
      noDocuments: "à¤…à¤­à¥€ à¤•à¥‹à¤ˆ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤ªà¤¾à¤  à¤œà¥‹à¤¡à¤¼à¤¾ à¤¨à¤¹à¥€à¤‚ à¤—à¤¯à¤¾ à¤¹à¥ˆà¥¤",
      saveReview: "à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤¸à¤¹à¥‡à¤œà¥‡à¤‚",
      fhir: "FHIR à¤¬à¤‚à¤¡à¤² à¤¦à¥‡à¤–à¥‡à¤‚",
      finish: "à¤‡à¤‚à¤Ÿà¥‡à¤• à¤ªà¥‚à¤°à¤¾ à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤–à¥‹à¤²à¥‡à¤‚",
      continue: "à¤†à¤—à¥‡ à¤¬à¤¢à¤¼à¥‡à¤‚",
      optional: "à¤µà¥ˆà¤•à¤²à¥à¤ªà¤¿à¤•",
      skip: "à¤…à¤­à¥€ à¤›à¥‹à¤¡à¤¼à¥‡à¤‚",
      speak: "à¤‘à¤¡à¤¿à¤¯à¥‹ à¤®à¤¾à¤°à¥à¤—à¤¦à¤°à¥à¤¶à¤¨ à¤šà¤²à¤¾à¤à¤",
      voice: "à¤†à¤µà¤¾à¤œà¤¼ à¤¸à¥‡ à¤‰à¤¤à¥à¤¤à¤° à¤¦à¥‡à¤‚",
      listening: "à¤¸à¥à¤¨ à¤°à¤¹à¥‡ à¤¹à¥ˆà¤‚â€¦",
      uploadTitle: "à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤°à¥‚à¤ª à¤¸à¥‡ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚",
      uploadText: "à¤‡à¤¸ à¤‘à¤«à¤¼à¤²à¤¾à¤‡à¤¨ à¤¡à¥‡à¤®à¥‹ à¤®à¥‡à¤‚ à¤ªà¤°à¥à¤šà¥‡, à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤¯à¤¾ à¤¡à¤¿à¤¸à¥à¤šà¤¾à¤°à¥à¤œ à¤¸à¤¾à¤°à¤¾à¤‚à¤¶ à¤•à¤¾ OCR à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ à¤ªà¥‡à¤¸à¥à¤Ÿ à¤•à¤°à¥‡à¤‚à¥¤ à¤¹à¤° à¤¨à¤¿à¤•à¤¾à¤²à¥€ à¤—à¤ˆ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤•à¥‹ à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤• à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤šà¤¿à¤¹à¥à¤¨à¤¿à¤¤ à¤°à¤–à¤¾ à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆà¥¤",
      useSample: "à¤¨à¤®à¥‚à¤¨à¤¾ OCR à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ à¤‡à¤¸à¥à¤¤à¥‡à¤®à¤¾à¤² à¤•à¤°à¥‡à¤‚",
      addDocument: "à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚",
      docName: "à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤•à¤¾ à¤¨à¤¾à¤®",
      docType: "à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤ªà¥à¤°à¤•à¤¾à¤°",
      documentText: "OCR / à¤¨à¤¿à¤•à¤¾à¤²à¤¾ à¤—à¤¯à¤¾ à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ",
      documentPlaceholder: "à¤‰à¤¦à¤¾à¤¹à¤°à¤£: Metformin 500 mg BID\nHbA1c: 8.2 % (high)",
      source: "à¤¸à¥à¤°à¥‹à¤¤",
      attention: "à¤§à¥à¤¯à¤¾à¤¨ à¤¦à¥‡à¤¨à¥‡ à¤¯à¥‹à¤—à¥à¤¯ à¤¬à¤¾à¤¤à¥‡à¤‚",
      noAttention: "à¤°à¤¿à¤•à¥‰à¤°à¥à¤¡ à¤•à¤¿à¤ à¤—à¤ à¤‰à¤¤à¥à¤¤à¤°à¥‹à¤‚ à¤¸à¥‡ à¤•à¥‹à¤ˆ à¤¨à¤¿à¤°à¥à¤§à¤¾à¤°à¤¿à¤¤ à¤§à¥à¤¯à¤¾à¤¨-à¤†à¤‡à¤Ÿà¤® à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¨à¤¹à¥€à¤‚ à¤¹à¥à¤†à¥¤",
      history: "à¤°à¥‹à¤—à¥€ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤¬à¤¤à¤¾à¤¯à¤¾ à¤—à¤¯à¤¾ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸",
      documents: "à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤¨à¤¿à¤·à¥à¤•à¤°à¥à¤·à¤£",
      timeline: "à¤¸à¤¾à¤•à¥à¤·à¥à¤¯ à¤¸à¤®à¤¯à¤°à¥‡à¤–à¤¾",
      review: "à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤• à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤¨à¤¿à¤°à¥à¤£à¤¯",
      note: "à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤• à¤¨à¥‹à¤Ÿ",
      status: "à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤¸à¥à¤¥à¤¿à¤¤à¤¿",
      pending: "à¤²à¤‚à¤¬à¤¿à¤¤",
      reviewed: "à¤¸à¤®à¥€à¤•à¥à¤·à¤¿à¤¤",
      accepted: "à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤",
      needs_follow_up: "à¤…à¤¨à¥à¤µà¤°à¥à¤¤à¥€ à¤†à¤µà¤¶à¥à¤¯à¤•",
      close: "à¤¬à¤‚à¤¦ à¤•à¤°à¥‡à¤‚",
      fhirTitle: "FHIR-à¤¸à¤‚à¤—à¤¤ à¤®à¥‰à¤• à¤à¤•à¥à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ",
      fhirDescription: "à¤•à¥‡à¤µà¤² à¤¸à¥à¤¥à¤¾à¤¨à¥€à¤¯ à¤¡à¥‡à¤®à¥‹ JSONà¥¤ à¤ªà¥à¤°à¥‹à¤¡à¤•à¥à¤¶à¤¨ ABDM à¤‡à¤‚à¤Ÿà¥€à¤—à¥à¤°à¥‡à¤¶à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤¸à¥ˆà¤‚à¤¡à¤¬à¥‰à¤•à¥à¤¸/à¤‘à¤¨à¤¬à¥‹à¤°à¥à¤¡à¤¿à¤‚à¤— à¤”à¤° à¤¸à¤¹à¤®à¤¤à¤¿ à¤µà¤°à¥à¤•à¤«à¤¼à¥à¤²à¥‹ à¤†à¤µà¤¶à¥à¤¯à¤• à¤¹à¥ˆà¥¤"
    }
  };

  var optionLabels = {
    sudden: { en: "Suddenly", hi: "à¤…à¤šà¤¾à¤¨à¤•" },
    gradual: { en: "Gradually", hi: "à¤§à¥€à¤°à¥‡-à¤§à¥€à¤°à¥‡" },
    unknown: { en: "I'm not sure", hi: "à¤®à¥à¤à¥‡ à¤¨à¤¹à¥€à¤‚ à¤ªà¤¤à¤¾" },
    upper_abdomen: { en: "Upper abdomen", hi: "à¤ªà¥‡à¤Ÿ à¤•à¤¾ à¤Šà¤ªà¤°à¥€ à¤­à¤¾à¤—" },
    lower_abdomen: { en: "Lower abdomen", hi: "à¤ªà¥‡à¤Ÿ à¤•à¤¾ à¤¨à¤¿à¤šà¤²à¤¾ à¤­à¤¾à¤—" },
    right_side: { en: "Right side", hi: "à¤¦à¤¾à¤¯à¤¾à¤ à¤­à¤¾à¤—" },
    left_side: { en: "Left side", hi: "à¤¬à¤¾à¤¯à¤¾à¤ à¤­à¤¾à¤—" },
    around_navel: { en: "Around the navel", hi: "à¤¨à¤¾à¤­à¤¿ à¤•à¥‡ à¤†à¤¸à¤ªà¤¾à¤¸" },
    activity: { en: "Worse with activity", hi: "à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿ à¤¸à¥‡ à¤¬à¤¢à¤¼à¤¤à¤¾ à¤¹à¥ˆ" },
    breathing: { en: "Worse with breathing", hi: "à¤¸à¤¾à¤‚à¤¸ à¤²à¥‡à¤¨à¥‡ à¤¸à¥‡ à¤¬à¤¢à¤¼à¤¤à¤¾ à¤¹à¥ˆ" },
    rest: { en: "Present at rest", hi: "à¤†à¤°à¤¾à¤® à¤®à¥‡à¤‚ à¤­à¥€ à¤¹à¥ˆ" },
    fever: { en: "Fever", hi: "à¤¬à¥à¤–à¤¾à¤°" },
    vomiting: { en: "Vomiting", hi: "à¤‰à¤²à¥à¤Ÿà¥€" },
    breathing_difficulty: { en: "Difficulty breathing", hi: "à¤¸à¤¾à¤‚à¤¸ à¤²à¥‡à¤¨à¥‡ à¤®à¥‡à¤‚ à¤¤à¤•à¤²à¥€à¤«à¤¼" },
    chest_pain: { en: "Chest pain", hi: "à¤¸à¥€à¤¨à¥‡ à¤®à¥‡à¤‚ à¤¦à¤°à¥à¤¦" },
    blood: { en: "Bleeding / blood in stool or vomit", hi: "à¤–à¥‚à¤¨ à¤†à¤¨à¤¾ / à¤®à¤² à¤¯à¤¾ à¤‰à¤²à¥à¤Ÿà¥€ à¤®à¥‡à¤‚ à¤–à¥‚à¤¨" },
    fainting: { en: "Fainting or severe dizziness", hi: "à¤¬à¥‡à¤¹à¥‹à¤¶à¥€ à¤¯à¤¾ à¤¬à¤¹à¥à¤¤ à¤šà¤•à¥à¤•à¤°" },
    none: { en: "None of these", hi: "à¤‡à¤¨à¤®à¥‡à¤‚ à¤¸à¥‡ à¤•à¥‹à¤ˆ à¤¨à¤¹à¥€à¤‚" },
    vata: { en: "Vata", hi: "à¤µà¤¾à¤¤" },
    pitta: { en: "Pitta", hi: "à¤ªà¤¿à¤¤à¥à¤¤" },
    kapha: { en: "Kapha", hi: "à¤•à¤«" },
    "not stated": { en: "Not stated", hi: "à¤¨à¤¹à¥€à¤‚ à¤¬à¤¤à¤¾à¤¯à¤¾ à¤—à¤¯à¤¾" }
  };

  function t(key) {
    return (copy[state.language] && copy[state.language][key]) || copy.en[key] || key;
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function labelFor(value) {
    if (Array.isArray(value)) {
      return value.map(labelFor).join(", ");
    }
    var normalized = String(value || "").toLowerCase();
    if (optionLabels[normalized]) {
      return optionLabels[normalized][state.language] || optionLabels[normalized].en;
    }
    return String(value || "").replace(/_/g, " ");
  }

  function showToast(message, isError) {
    var node = document.createElement("div");
    node.className = "toast" + (isError ? " error" : "");
    node.textContent = message;
    toastRegion.appendChild(node);
    window.setTimeout(function () {
      node.remove();
    }, 4200);
  }

  async function api(path, options) {
    var settings = options || {};
    settings.headers = Object.assign({ "Content-Type": "application/json" }, settings.headers || {});
    var response = await fetch(path, settings);
    var payload = await response.json().catch(function () {
      return { error: "The server returned an invalid response." };
    });
    if (!response.ok) {
      throw new Error(payload.error || "Request failed.");
    }
    return payload;
  }

  function icon(name) {
    if (name === "pulse") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 12h3.1l1.8-5.2a1 1 0 0 1 1.9.05l2.04 8.38 1.45-4.15A1 1 0 0 1 14.25 10H21v2h-6.04l-2.18 6.25a1 1 0 0 1-1.91-.1L8.75 9.5 7.6 12H3z"/></svg>';
    }
    return "â€¢";
  }

  function renderNav() {
    var hasEncounter = Boolean(state.encounter);
    return [
      '<header class="topbar">',
      '<button class="brand" type="button" data-action="home" aria-label="MediFlow AI home">',
      '<span class="brand-mark">', icon("pulse"), "</span><span>MediFlow <em>AI</em></span></button>",
      '<div class="nav-actions">',
      '<button class="nav-button ', state.view === "kiosk" || state.view === "welcome" ? "is-active" : "", '" type="button" data-action="show-kiosk">', t("patient"), "</button>",
      hasEncounter ? '<button class="nav-button ' + (state.view === "dashboard" ? "is-active" : "") + '" type="button" data-action="show-dashboard">' + t("clinician") + "</button>" : "",
      '<button class="nav-button" type="button" data-action="contrast">â— ', t("contrast"), "</button>",
      hasEncounter ? '<button class="button button-secondary" type="button" data-action="new-intake">ï¼‹ ' + t("newIntake") + "</button>" : "",
      "</div></header>"
    ].join("");
  }

  function renderWelcome() {
    var selectedEn = state.language === "en" ? " is-selected" : "";
    var selectedHi = state.language === "hi" ? " is-selected" : "";
    return [
      '<main class="main">',
      '<section class="hero">',
      '<div class="hero-copy">',
      '<p class="eyebrow">SIH26047 Â· Patient Case-Taking Software</p>',
      "<h1>Context before consultation.</h1>",
      '<p class="lead">', t("subtitle"), "</p>",
      '<div class="button-row"><button class="button button-primary" type="button" data-action="focus-start">Begin a patient intake <span aria-hidden="true">â†’</span></button>',
      '<button class="button button-secondary" type="button" data-action="load-demo">â–¶ ', t("demo"), "</button></div>",
      "</div>",
      '<aside class="hero-panel">',
      "<div><p class=\"eyebrow\">Safety by design</p><h2>Evidence, never invention.</h2>",
      "<p>MediFlow turns a patient conversation and supplied document text into an editable intake draft. It does not diagnose or prescribe.</p></div>",
      '<div class="stat-list">',
      '<div class="stat-row"><span class="stat-icon">â—Ž</span><div><strong>Hindi + English</strong><span>Voice or touch-ready flow</span></div></div>',
      '<div class="stat-row"><span class="stat-icon">âŒ</span><div><strong>Source-backed fields</strong><span>Conversation and document provenance</span></div></div>',
      '<div class="stat-row"><span class="stat-icon">â†—</span><div><strong>FHIR-ready mock export</strong><span>ABDM integration boundary is explicit</span></div></div>',
      "</div></aside></section>",
      '<section class="grid-two">',
      '<section class="card" id="start-intake">',
      "<h2>", t("language"), "</h2><p class=\"card-intro\">Choose how the kiosk speaks. You can change this before starting a new intake.</p>",
      '<div class="language-grid">',
      '<button class="language-button', selectedEn, '" type="button" data-language="en"><strong>English</strong><span>English</span></button>',
      '<button class="language-button', selectedHi, '" type="button" data-language="hi"><strong>à¤¹à¤¿à¤‚à¤¦à¥€</strong><span>Hindi</span></button>',
      "</div>",
      '<form id="start-form">',
      '<div class="field-grid">',
      '<div class="field full"><label for="patient-name">', t("name"), '</label><input id="patient-name" name="name" autocomplete="name" placeholder="Asha Verma" required /></div>',
      '<div class="field"><label for="patient-age">', t("age"), '</label><input id="patient-age" name="age" inputmode="numeric" placeholder="48" required /></div>',
      '<div class="field"><label for="patient-gender">', t("gender"), '</label><select id="patient-gender" name="gender" required><option value="">', t("selectGender"), '</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other / prefer not to say</option></select></div>',
      "</div>",
      '<label class="consent"><input id="consent" type="checkbox" required /><span>', t("consent"), "</span></label>",
      '<button class="button button-primary" type="submit">', t("start"), " <span aria-hidden=\"true\">â†’</span></button>",
      "</form>",
      '<div class="safety-strip"><span class="safety-icon">âœ“</span><div><strong>Consent receipt:</strong> This local MVP records a consent acknowledgement with the encounter. Production deployment needs granular, revocable consent and approved data-security controls.</div></div>',
      "</section>",
      '<aside class="card"><p class="eyebrow">What is in this MVP</p><div class="feature-list">',
      '<div class="feature"><span class="feature-icon">1</span><div><h3>Adaptive intake</h3><p>Question branches are deterministic and inspectable; they never pretend to make a diagnosis.</p></div></div>',
      '<div class="feature"><span class="feature-icon">2</span><div><h3>Document intelligence</h3><p>Extracted medication and lab fields retain their source text, confidence, and clinician-verification state.</p></div></div>',
      '<div class="feature"><span class="feature-icon">3</span><div><h3>Clinician control</h3><p>Review, accept, or flag the editable summary; inspect a mock FHIR export for the integration story.</p></div></div>',
      "</div></aside></section></main>"
    ].join("");
  }

  function answeredCount() {
    return state.encounter ? Object.keys(state.encounter.answers || {}).length : 0;
  }

  function renderProgress() {
    var hasQuestion = state.encounter && state.encounter.next_question;
    var documentStage = !hasQuestion;
    var completeStage = state.encounter && state.encounter.status === "completed";
    var percent = completeStage ? 100 : documentStage ? 84 : Math.min(76, 12 + answeredCount() * 9);
    return [
      '<aside class="card progress-card">',
      '<span class="progress-label">', state.language === "hi" ? "à¤‡à¤‚à¤Ÿà¥‡à¤• à¤ªà¥à¤°à¤—à¤¤à¤¿" : "Intake progress", "</span>",
      '<div class="progress-track"><div class="progress-fill" style="width:', percent, '%"></div></div>',
      '<div class="journey-list">',
      '<div class="journey-step ', answeredCount() ? "is-done" : "is-active", '"><span class="journey-dot"></span><span>', state.language === "hi" ? "à¤¸à¤¹à¤®à¤¤à¤¿ à¤”à¤° à¤®à¥‚à¤² à¤µà¤¿à¤µà¤°à¤£" : "Consent & basic details", "</span></div>",
      '<div class="journey-step ', hasQuestion && answeredCount() ? "is-active" : documentStage ? "is-done" : "", '"><span class="journey-dot"></span><span>', state.language === "hi" ? "à¤°à¥‹à¤—à¥€ à¤•à¤¾ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸" : "Patient history", "</span></div>",
      '<div class="journey-step ', documentStage && !completeStage ? "is-active" : completeStage ? "is-done" : "", '"><span class="journey-dot"></span><span>', state.language === "hi" ? "à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤”à¤° à¤¸à¤¾à¤•à¥à¤·à¥à¤¯" : "Documents & evidence", "</span></div>",
      '<div class="journey-step ', completeStage ? "is-done" : "", '"><span class="journey-dot"></span><span>', state.language === "hi" ? "à¤šà¤¿à¤•à¤¿à¤¤à¥à¤¸à¤• à¤¸à¤®à¥€à¤•à¥à¤·à¤¾" : "Clinician review", "</span></div>",
      "</div>",
      '<div class="safety-strip"><span class="safety-icon">!</span><div>', t("safety"), "</div></div>",
      "</aside>"
    ].join("");
  }

  function renderQuestionInput(question) {
    if (question.kind === "text") {
      return [
        '<textarea id="answer-text" class="answer-textarea" placeholder="',
        escapeHtml(state.language === "hi" ? "à¤…à¤ªà¤¨à¥‡ à¤¶à¤¬à¥à¤¦à¥‹à¤‚ à¤®à¥‡à¤‚ à¤²à¤¿à¤–à¥‡à¤‚â€¦" : "Type in your own wordsâ€¦"),
        '" autofocus></textarea>',
        '<div class="voice-actions">',
        '<button class="subtle-action" type="button" data-action="speak-question">ðŸ”Š ', t("speak"), "</button>",
        '<button class="subtle-action" type="button" data-action="voice-answer">ðŸŽ™ ', t("voice"), "</button>",
        "</div>"
      ].join("");
    }
    if (question.kind === "scale") {
      var scale = [];
      for (var number = 0; number <= 10; number += 1) {
        scale.push('<label class="scale-choice"><input type="radio" name="answer" value="' + number + '" />' + number + "</label>");
      }
      return '<div class="scale-grid" role="radiogroup" aria-label="Severity scale">' + scale.join("") + "</div>";
    }
    var options = question.options || [];
    var type = question.kind === "multi_choice" ? "checkbox" : "radio";
    return '<div class="choice-grid">' + options.map(function (option) {
      return [
        '<label class="choice"><input type="', type, '" name="answer" value="', escapeHtml(option.value), '" />',
        "<span>", escapeHtml(option[state.language] || option.en), "</span></label>"
      ].join("");
    }).join("") + "</div>";
  }

  function renderIntake() {
    if (!state.encounter) {
      state.view = "welcome";
      return renderWelcome();
    }
    var question = state.encounter.next_question;
    var panel;
    if (question) {
      panel = [
        '<section class="card intake-card">',
        '<span class="step-number">', state.language === "hi" ? "à¤¸à¥à¤®à¤¾à¤°à¥à¤Ÿ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸ à¤ªà¥à¤°à¤¶à¥à¤¨" : "Adaptive history question", "</span>",
        '<h1 class="question-prompt">', escapeHtml(question.prompt), "</h1>",
        '<p class="question-helper">', escapeHtml(question.helper), "</p>",
        '<form id="question-form" data-question-id="', escapeHtml(question.id), '" data-question-kind="', escapeHtml(question.kind), '">',
        renderQuestionInput(question),
        '<div class="button-row"><button class="button button-primary" type="submit">', t("continue"), ' <span aria-hidden="true">â†’</span></button>',
        question.required ? "" : '<button class="button button-quiet" type="button" data-action="skip-question">' + t("skip") + "</button>",
        "</div></form></section>"
      ].join("");
    } else {
      panel = renderDocumentStep();
    }
    return [
      '<main class="main"><div class="kiosk-layout">',
      renderProgress(),
      '<div>', panel, "</div>",
      "</div></main>"
    ].join("");
  }

  function renderDocumentStep() {
    var docs = state.encounter.documents || [];
    var docList = docs.length ? '<div class="document-list">' + docs.map(function (document) {
      var extraction = document.extraction || {};
      var count = (extraction.medications || []).length + (extraction.labs || []).length;
      return '<div class="document-chip"><span class="feature-icon">âŒ</span><div><strong>' + escapeHtml(document.name) + "</strong><span>" + count + " extractable item(s) Â· clinician verification required</span></div></div>";
    }).join("") + "</div>" : "";
    return [
      '<section class="card intake-card">',
      '<span class="step-number">', state.language === "hi" ? "à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤šà¤°à¤£" : "Document stage", "</span>",
      '<h1 class="question-prompt">', t("uploadTitle"), "</h1>",
      '<p class="question-helper">', t("uploadText"), "</p>",
      '<div class="document-box">',
      "<h3>âŒ ", state.language === "hi" ? "OCR à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚" : "Add OCR text", "</h3>",
      '<p>Paste text from a prescription, lab report, or discharge summary. Extracted fields remain marked for clinician verification.</p>',
      '<form id="document-form">',
      '<div class="field-grid"><div class="field"><label for="document-name">', t("docName"), '</label><input id="document-name" value="Previous prescription / lab report" /></div>',
      '<div class="field"><label for="document-type">', t("docType"), '</label><select id="document-type"><option value="prescription">Prescription</option><option value="lab_report">Lab report</option><option value="discharge_summary">Discharge summary</option><option value="other">Other</option></select></div>',
      '<div class="field full"><label for="document-text">', t("documentText"), '</label><textarea id="document-text" placeholder="', escapeHtml(t("documentPlaceholder")), '"></textarea></div></div>',
      '<div class="button-row"><button class="button button-secondary" type="button" data-action="sample-document">', t("useSample"), '</button><button class="button button-primary" type="submit">', t("addDocument"), "</button></div>",
      "</form></div>",
      docList,
      '<div class="button-row" style="margin-top: 25px"><button class="button button-primary" type="button" data-action="complete-intake">', t("finish"), ' <span aria-hidden="true">â†’</span></button></div>',
      '<div class="safety-strip"><span class="safety-icon">âœ“</span><div><strong>Transparent extraction:</strong> No value is treated as a fact solely because software extracted it. The dashboard presents all document fields as a review draft.</div></div>',
      "</section>"
    ].join("");
  }

  function statusLabel(status) {
    return t(status || "pending");
  }

  function renderAttention(flags) {
    if (!flags || !flags.length) {
      return '<div class="empty-state">' + t("noAttention") + "</div>";
    }
    return flags.map(function (flag) {
      var evidence = (flag.evidence || []).map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("");
      return [
        '<article class="attention-card ', escapeHtml(flag.priority), '"><h3>âš  ', escapeHtml(flag.title), "</h3>",
        "<p>", escapeHtml(flag.explanation), "</p>",
        "<ul>", evidence, "</ul>",
        '<p class="provenance">', escapeHtml(flag.disclaimer), "</p></article>"
      ].join("");
    }).join("");
  }

  function renderHistory(history) {
    if (!history || !history.length) {
      return '<div class="empty-state">' + t("noHistory") + "</div>";
    }

    return (
      '<table class="history-table"><tbody>' +
      history
        .map(function (row) {
          var sourceLabel =
            row.provenance === "Patient conversation"
              ? "Patient-reported"
              : row.provenance === "Document-derived"
                ? "Document-derived"
                : "System-derived";

          var confidenceLabel =
            row.provenance === "Patient conversation"
              ? ""
              : "Extraction confidence: " +
                Math.round(Number(row.confidence || 0) * 100) +
                "%";

          return [
            "<tr><th>",
            escapeHtml(row.label),
            "</th><td>",
            escapeHtml(labelFor(row.value)),
            '<div class="history-meta">',
            "<span>",
            sourceLabel,
            "</span>",
            confidenceLabel
              ? "<span>" + escapeHtml(confidenceLabel) + "</span>"
              : "",
            "</div>",
            "</td></tr>",
          ].join("");
        })
        .join("") +
      "</tbody></table>"
    );
  }

  function renderDocumentSummary(documents) {
    if (!documents || !documents.length) {
      return '<div class="empty-state">' + t("noDocuments") + "</div>";
    }
    return documents.map(function (document) {
      var extraction = document.extraction || {};
      var medications = extraction.medications || [];
      var labs = extraction.labs || [];
      var items = [];
      medications.forEach(function (medicine) {
        items.push('<div class="extract-item"><strong>' + escapeHtml(medicine.name) + "</strong><br/><span>" + escapeHtml(medicine.dose) + " Â· " + escapeHtml(medicine.frequency) + " Â· " + Math.round(Number(medicine.confidence || 0) * 100) + "% confidence</span></div>");
      });
      labs.forEach(function (lab) {
        items.push('<div class="extract-item"><strong>' + escapeHtml(lab.test_name) + "</strong><br/><span>" + escapeHtml(lab.value) + " " + escapeHtml(lab.unit) + " Â· reported " + escapeHtml(lab.reported_status) + " Â· " + Math.round(Number(lab.confidence || 0) * 100) + "% confidence</span></div>");
      });
      return [
        '<div class="document-summary"><h3><span>âŒ ', escapeHtml(document.name), '</span><span class="tag">Verify</span></h3>',
        '<p>', escapeHtml(extraction.warning || "Clinician verification required."), "</p>",
        items.length ? '<div class="extract-list">' + items.join("") + "</div>" : '<p class="provenance">No discrete fields were extracted from the supplied text.</p>',
        "</div>"
      ].join("");
    }).join("");
  }

  function formatDate(value) {
    if (!value) {
      return "Not recorded";
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString(state.language === "hi" ? "hi-IN" : "en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  function renderTimeline(encounter) {
    var lines = [
      '<div class="timeline-item"><strong>Intake started</strong><span>' + escapeHtml(formatDate(encounter.created_at)) + " Â· Patient consent acknowledgement recorded</span></div>"
    ];
    (encounter.documents || []).forEach(function (document) {
      var dates = (document.extraction && document.extraction.dates_mentioned) || [];
      var label = dates.length ? "Document date mentioned: " + dates.join(", ") : "Uploaded document text";
      lines.push('<div class="timeline-item"><strong>' + escapeHtml(document.name) + "</strong><span>" + escapeHtml(label) + " Â· raw source retained for review</span></div>");
    });
    if (encounter.status === "completed") {
      lines.push('<div class="timeline-item"><strong>Summary prepared</strong><span>' + escapeHtml(formatDate(encounter.completed_at)) + " Â· Awaiting clinician decision</span></div>");
    }
    return '<div class="timeline">' + lines.join("") + "</div>";
  }

  function renderDashboard() {
    if (!state.encounter) {
      state.view = "welcome";
      return renderWelcome();
    }
    var encounter = state.encounter;
    var summary = encounter.summary || {};
    var patient = summary.patient || encounter.patient || {};
    var review = encounter.doctor_review || { status: "pending", note: "" };
    var flags = summary.red_flags || [];
    var reviewStatus = review.status || "pending";
    var options = ["pending", "reviewed", "accepted", "needs_follow_up"].map(function (value) {
      return '<option value="' + value + '"' + (reviewStatus === value ? " selected" : "") + ">" + escapeHtml(statusLabel(value)) + "</option>";
    }).join("");
   var medicationCount = (summary.medications || []).length;
   var labCount = (summary.labs || []).length;

   var submittedAnswers = Object.keys(encounter.answers || {})
     .map(function (questionId) {
       var rawValue = encounter.answers[questionId];

       var label = questionId
         .replace(/_/g, " ")
         .replace(/\b\w/g, function (letter) {
           return letter.toUpperCase();
         });

       return [
         '<article class="response-item">',
         '<div class="response-question">',
         escapeHtml(label),
         "</div>",
         '<div class="response-answer">',
         escapeHtml(labelFor(rawValue)),
         "</div>",
         '<div class="response-source">Patient-reported</div>',
         "</article>",
       ].join("");
     })
     .join("");

   return [
     '<main class="main">',
     '<section class="dashboard-head"><div><p class="eyebrow">Physician-ready, not physician-replacing</p><h1 style="font-size:clamp(2rem,4vw,3.15rem)">',
     t("dashboardTitle"),
     "</h1><p>",
     t("dashboardLead"),
     "</p></div>",
     '<div class="button-row"><span class="status-pill ',
     escapeHtml(reviewStatus),
     '">',
     escapeHtml(statusLabel(reviewStatus)),
     '</span><button class="button button-secondary" type="button" data-action="show-fhir">âŒ ',
     t("fhir"),
     "</button></div></section>",
     '<section class="dashboard-grid">',
     '<div class="clinical-summary">',
     '<section class="card"><div class="summary-title-row"><div><h2>Patient clinical summary</h2><p>Editable intake draft Â· clinician verification required</p></div><div class="patient-badge"><strong>',
     escapeHtml(patient.name || "Not stated"),
     "</strong><span>",
     escapeHtml(patient.age || "Age not stated"),
     " Â· ",
     escapeHtml(patient.gender || "Gender not stated"),
     "</span></div></div>",
     '<div class="complaint"><span class="small-label">Chief complaint</span><strong>',
     escapeHtml((summary.chief_complaint || {}).value || "Not stated"),
     '</strong><span class="provenance">Patient-reported</span></div>',
     "<h3>",
     t("history"),
     "</h3>",
     renderHistory(summary.history),
     "</section>",

     '<section class="card complete-responses">',
     '<div class="summary-title-row">',
     "<div>",
     "<h2>Complete patient responses</h2>",
     "<p>Every answer submitted during the intake, shown exactly as recorded.</p>",
     "</div>",
     '<span class="verify-tag">Patient-reported</span>',
     "</div>",
     '<div class="response-list">',
     submittedAnswers,
     "</div>",
     "</section>",
     '<section class="card"><h2>',
     t("attention"),
     '</h2><p class="card-intro">Deterministic attention items based only on recorded answers. They are not diagnoses or emergency decisions.</p>',
     renderAttention(flags),
     "</section>",
     '<section class="card"><h2>',
     t("documents"),
     '</h2><p class="card-intro">Each candidate field retains an extract confidence and requires clinician verification.</p>',
     renderDocumentSummary(encounter.documents),
     "</section>",
     "</div>",
     '<aside class="side-stack">',
     '<section class="card"><p class="eyebrow">Record snapshot</p><h2>Transparent by default</h2><div class="metric-grid">',
     '<div class="metric"><strong>',
     Object.keys(encounter.answers || {}).length,
     "</strong><span>intake fields</span></div>",
     '<div class="metric"><strong>',
     (encounter.documents || []).length,
     "</strong><span>source documents</span></div>",
     '<div class="metric"><strong>',
     medicationCount,
     "</strong><span>candidate medicines</span></div>",
     '<div class="metric"><strong>',
     labCount,
     "</strong><span>candidate lab values</span></div>",
     '</div><div class="safety-strip"><span class="safety-icon">âœ“</span><div><strong>Provenance:</strong> patient statements and document extraction are kept separate; none becomes an unsupported medical fact.</div></div></section>',
     '<section class="card"><p class="eyebrow">Chronology</p><h2>',
     t("timeline"),
     "</h2>",
     renderTimeline(encounter),
     "</section>",
     '<section class="card review-card"><p class="eyebrow">Final human control</p><h2>',
     t("review"),
     "</h2>",
     '<div class="field"><label for="review-status">',
     t("status"),
     '</label><select id="review-status">',
     options,
     "</select></div>",
     '<div class="field"><label for="review-note">',
     t("note"),
     '</label><textarea class="review-note" id="review-note" placeholder="Add clinician-verified context or follow-up planâ€¦">',
     escapeHtml(review.note || ""),
     "</textarea></div>",
     '<div class="button-row"><button class="button button-primary" type="button" data-action="save-review">',
     t("saveReview"),
     "</button></div>",
     "</section></aside></section></main>",
   ].join("");
  }

  function renderModal() {
    if (!state.fhir) {
      return "";
    }
    return [
      '<div class="code-modal" role="dialog" aria-modal="true" aria-labelledby="fhir-title">',
      '<section class="code-dialog"><div class="dashboard-head"><div><h2 id="fhir-title">', t("fhirTitle"), "</h2><p>", t("fhirDescription"), "</p></div>",
      '<button class="button button-secondary" type="button" data-action="close-modal">', t("close"), "</button></div>",
      "<pre>", escapeHtml(JSON.stringify(state.fhir, null, 2)), "</pre></section></div>"
    ].join("");
  }

  function bindEvents() {
    app.querySelectorAll("[data-language]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.language = button.getAttribute("data-language");
        render();
      });
    });
    app.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        var action = button.getAttribute("data-action");
        handleAction(action, event);
      });
    });
    var startForm = document.getElementById("start-form");
    if (startForm) {
      startForm.addEventListener("submit", startIntake);
    }
    var questionForm = document.getElementById("question-form");
    if (questionForm) {
      questionForm.addEventListener("submit", submitAnswer);
    }
    var documentForm = document.getElementById("document-form");
    if (documentForm) {
      documentForm.addEventListener("submit", addDocument);
    }
  }

  function render() {
    var body;
    if (state.view === "dashboard") {
      body = renderDashboard();
    } else if (state.view === "kiosk") {
      body = renderIntake();
    } else {
      body = renderWelcome();
    }
    app.innerHTML = renderNav() + body + renderModal();
    document.documentElement.classList.toggle("high-contrast", state.highContrast);
    bindEvents();
  }

  function scrollToStart() {
    var node = document.getElementById("start-intake");
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      var first = document.getElementById("patient-name");
      if (first) {
        window.setTimeout(function () { first.focus(); }, 380);
      }
    }
  }

  async function startIntake(event) {
    event.preventDefault();
    var name = document.getElementById("patient-name").value.trim();
    var age = document.getElementById("patient-age").value.trim();
    var gender = document.getElementById("patient-gender").value;
    var consent = document.getElementById("consent").checked;
    if (!name || !age || !gender || !consent) {
      showToast("Please complete every field and acknowledge consent.", true);
      return;
    }
    try {
      state.encounter = await api("/api/encounters", {
        method: "POST",
        body: JSON.stringify({
          patient: {
            name: name,
            age: age,
            gender: gender,
            language: state.language,
            consent_acknowledged: consent
          }
        })
      });
      state.view = "kiosk";
      render();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function readAnswer(kind) {
    if (kind === "text") {
      return document.getElementById("answer-text").value.trim();
    }
    if (kind === "multi_choice") {
      return Array.prototype.slice.call(document.querySelectorAll('input[name="answer"]:checked')).map(function (input) {
        return input.value;
      });
    }
    var checked = document.querySelector('input[name="answer"]:checked');
    return checked ? checked.value : "";
  }

  async function submitAnswer(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var value = readAnswer(form.getAttribute("data-question-kind"));
    if (value === "" || (Array.isArray(value) && !value.length)) {
      showToast(state.language === "hi" ? "à¤•à¥ƒà¤ªà¤¯à¤¾ à¤‰à¤¤à¥à¤¤à¤° à¤šà¥à¤¨à¥‡à¤‚ à¤¯à¤¾ à¤²à¤¿à¤–à¥‡à¤‚à¥¤" : "Please select or enter an answer.", true);
      return;
    }
    try {
      state.encounter = await api("/api/encounters/" + encodeURIComponent(state.encounter.id) + "/answers", {
        method: "POST",
        body: JSON.stringify({ question_id: form.getAttribute("data-question-id"), value: value })
      });
      render();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function skipQuestion() {
    var form = document.getElementById("question-form");
    if (!form) {
      return;
    }
    try {
      state.encounter = await api("/api/encounters/" + encodeURIComponent(state.encounter.id) + "/answers", {
        method: "POST",
        body: JSON.stringify({ question_id: form.getAttribute("data-question-id"), value: "Not stated" })
      });
      render();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function addDocument(event) {
    event.preventDefault();
    var sourceText = document.getElementById("document-text").value.trim();
    if (!sourceText) {
      showToast(state.language === "hi" ? "à¤•à¥ƒà¤ªà¤¯à¤¾ OCR à¤Ÿà¥‡à¤•à¥à¤¸à¥à¤Ÿ à¤ªà¥‡à¤¸à¥à¤Ÿ à¤•à¤°à¥‡à¤‚à¥¤" : "Please paste OCR or extracted document text.", true);
      return;
    }
    try {
      await api("/api/encounters/" + encodeURIComponent(state.encounter.id) + "/documents", {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("document-name").value.trim(),
          document_type: document.getElementById("document-type").value,
          source_text: sourceText
        })
      });
      state.encounter = await api("/api/encounters/" + encodeURIComponent(state.encounter.id));
      render();
      showToast(state.language === "hi" ? "à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤•à¥‹ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤œà¥‹à¤¡à¤¼à¤¾ à¤—à¤¯à¤¾à¥¤" : "Document added for clinician verification.");
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function completeIntake() {
    try {
      state.encounter = await api("/api/encounters/" + encodeURIComponent(state.encounter.id) + "/complete", {
        method: "POST",
        body: JSON.stringify({})
      });
      state.view = "dashboard";
      render();
      showToast("Intake summary is ready for clinician review.");
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function loadDemo() {
    try {
      state.encounter = await api("/api/demo", { method: "POST", body: JSON.stringify({}) });
      state.language = state.encounter.patient.language || state.language;
      state.view = "dashboard";
      render();
      showToast("Judge-ready abdominal-pain scenario loaded.");
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function saveReview() {
    try {
      state.encounter = await api("/api/encounters/" + encodeURIComponent(state.encounter.id) + "/review", {
        method: "PATCH",
        body: JSON.stringify({
          status: document.getElementById("review-status").value,
          note: document.getElementById("review-note").value
        })
      });
      render();
      showToast("Clinician review decision saved.");
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function sampleDocument() {
    var textarea = document.getElementById("document-text");
    textarea.value = [
      "Date: 12 Aug 2026",
      "Metformin 500 mg BID",
      "Amlodipine 5 mg OD",
      "",
      "HbA1c: 8.2 % (high)",
      "Glucose: 182 mg/dL (high)",
      "Creatinine: 0.9 mg/dL (normal)"
    ].join("\n");
    textarea.focus();
  }

  function speakQuestion() {
    var question = state.encounter && state.encounter.next_question;
    if (!question || !("speechSynthesis" in window)) {
      showToast("Audio guidance is not available in this browser.", true);
      return;
    }
    window.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(question.prompt + ". " + question.helper);
    utterance.lang = state.language === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
  }

  function voiceAnswer(button) {
    var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast("Voice input is not supported in this browser. You can type or tap an answer.", true);
      return;
    }
    var recognition = new Recognition();
    recognition.lang = state.language === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    button.disabled = true;
    button.textContent = "ðŸŽ™ " + t("listening");
    recognition.onresult = function (event) {
      var textarea = document.getElementById("answer-text");
      if (textarea) {
        textarea.value = event.results[0][0].transcript;
        textarea.focus();
      }
    };
    recognition.onerror = function () {
      showToast("Voice recognition could not capture an answer. Please type it instead.", true);
    };
    recognition.onend = function () {
      button.disabled = false;
      button.textContent = "ðŸŽ™ " + t("voice");
    };
    recognition.start();
  }

  async function showFhir() {
    try {
      state.fhir = await api("/api/encounters/" + encodeURIComponent(state.encounter.id) + "/fhir");
      render();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function handleAction(action, event) {
    if (action === "home") {
      state.view = "welcome";
      state.fhir = null;
      render();
    } else if (action === "focus-start") {
      scrollToStart();
    } else if (action === "show-kiosk") {
      state.view = state.encounter ? "kiosk" : "welcome";
      state.fhir = null;
      render();
    } else if (action === "show-dashboard") {
      state.view = "dashboard";
      state.fhir = null;
      render();
    } else if (action === "new-intake") {
      state.encounter = null;
      state.view = "welcome";
      state.fhir = null;
      render();
    } else if (action === "contrast") {
      state.highContrast = !state.highContrast;
      document.documentElement.classList.toggle("high-contrast", state.highContrast);
    } else if (action === "load-demo") {
      loadDemo();
    } else if (action === "skip-question") {
      skipQuestion();
    } else if (action === "sample-document") {
      sampleDocument();
    } else if (action === "complete-intake") {
      completeIntake();
    } else if (action === "save-review") {
      saveReview();
    } else if (action === "show-fhir") {
      showFhir();
    } else if (action === "close-modal") {
      state.fhir = null;
      render();
    } else if (action === "speak-question") {
      speakQuestion();
    } else if (action === "voice-answer") {
      voiceAnswer(event.currentTarget);
    }
  }

  render();
}());

