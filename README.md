# Healthcare API Risk Scoring System

This project shows how I handle real-world API problems: unreliable data, pagination, rate limits, and intermittent failures. It fetches patient records from a simulated healthcare API, cleans and normalizes inconsistent data, computes clinical risk scores, and sends alert lists back to the API for evaluation.

The goal is to show robust engineering: defensive parsing, retry logic, and deterministic scoring against imperfect external APIs.

## What this project does

- Reads patient records from a paginated healthcare API.
- Normalizes messy or inconsistent patient data safely.
- Calculates a total risk score for each patient using:
  - Blood pressure
  - Body temperature
  - Age
- Produces and submits three alert lists:
  - High-Risk Patients: Total risk score ≥ 4
  - Fever Patients: Temperature ≥ 99.6°F
  - Data Quality Issues: missing, malformed, or invalid data

## How the API behaves (why this matters)

The simulated API mimics real production issues:

- Random 500 and 503 errors
- Rate limiting (429 responses)
- Paginated responses
- Missing or malformed fields

This forces the client to use retries, backoff, and safe parsing so the pipeline keeps running and produces reliable results.

## Risk Scoring Logic

Total Risk Score = Blood Pressure + Temperature + Age

Blood Pressure (use the higher risk if systolic and diastolic disagree)
- Normal: <120 AND <80 → 1
- Elevated: 120–129 AND <80 → 2
- Stage 1: 130–139 OR 80–89 → 3
- Stage 2: ≥140 OR ≥90 → 4
- Invalid / Missing → 0

Temperature
- ≤ 99.5°F → 0
- 99.6–100.9°F → 1
- ≥ 101°F → 2
- Invalid / Missing → 0

Age
- < 40 → 1
- 40–65 → 1
- > 65 → 2
- Invalid / Missing → 0

## Data Quality Handling

A patient is flagged for Data Quality Issues if any of the following are true:
- Blood pressure is missing, malformed, or non-numeric
- Temperature is missing or non-numeric
- Age is missing or not a valid number

These cases are handled without breaking the pipeline.

## Authentication

All API requests require an API key in the header:
x-api-key: YOUR_API_KEY

## Submission Output

The final submission sent back to the assessment API looks like:

{
  "high_risk_patients": ["DEMO002", "DEMO031"],
  "fever_patients": ["DEMO005", "DEMO021"],
  "data_quality_issues": ["DEMO004", "DEMO007"]
}

Each submission receives immediate scoring feedback from the API.

## Tech & Concepts Used

- TypeScript / JavaScript
- REST API integration
- Pagination handling
- Retry logic with backoff
- Defensive data parsing
- Deterministic risk scoring
- Robust engineering for unreliable APIs

## Key Takeaway

This project demonstrates how to build reliable data processing against real healthcare or enterprise APIs where data is often imperfect. The emphasis is on correctness, resilience, and clarity rather than shortcuts.
