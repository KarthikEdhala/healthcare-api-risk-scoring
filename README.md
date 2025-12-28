🏥 Healthcare API Risk Scoring System

This project demonstrates how I approach real-world API integration challenges such as unreliable data, pagination, rate limits, and intermittent failures. The system consumes a simulated healthcare API, normalizes inconsistent patient data, calculates clinical risk scores, and submits alert lists back to the API for evaluation.

The focus of this project is not just getting the correct output, but showing robust engineering practices when working with imperfect external APIs.

🚀 What This Project Does

The application retrieves patient records from a paginated healthcare API and computes a total risk score for each patient based on:

Blood pressure readings

Body temperature

Age

Based on this analysis, it generates three alert lists:

High-Risk Patients: Total risk score ≥ 4

Fever Patients: Temperature ≥ 99.6°F

Data Quality Issues: Patients with missing, malformed, or invalid data

These results are then submitted back to the assessment API.

🧠 Why This Project Matters

The API intentionally behaves like a real production system:

Random 500 and 503 errors

Rate limiting (429 responses)

Paginated responses

Missing or malformed fields

This project shows how to:

Implement retry logic with backoff

Safely parse unreliable data

Avoid crashes caused by invalid inputs

Produce deterministic results from inconsistent sources

📊 Risk Scoring Logic
Blood Pressure Risk

If systolic and diastolic values fall into different categories, the higher risk is used.

Category	Condition	Score
Normal	<120 AND <80	1
Elevated	120–129 AND <80	2
Stage 1	130–139 OR 80–89	3
Stage 2	≥140 OR ≥90	4
Invalid / Missing	Any malformed or missing value	0
Temperature Risk
Temperature	Score
≤ 99.5°F	0
99.6–100.9°F	1
≥ 101°F	2
Invalid / Missing	0
Age Risk
Age	Score
< 40	1
40–65	1
> 65	2
Invalid / Missing	0

Total Risk Score = BP + Temperature + Age

🧪 Data Quality Handling

A patient is flagged under Data Quality Issues if any of the following are true:

Blood pressure is missing, malformed, or non-numeric

Temperature is missing or non-numeric

Age is missing or not a valid number

These cases are handled safely without breaking the pipeline.

🔐 Authentication

All API requests require an API key passed via headers:

x-api-key: YOUR_API_KEY

📤 Submission Output

The final submission includes:

{
  "high_risk_patients": ["DEMO002", "DEMO031"],
  "fever_patients": ["DEMO005", "DEMO021"],
  "data_quality_issues": ["DEMO004", "DEMO007"]
}


Each submission receives immediate scoring feedback from the API.

🛠 Tech & Concepts Used

TypeScript / JavaScript

REST API integration

Pagination handling

Retry logic for transient failures

Defensive data parsing

Deterministic risk scoring

Clean, readable, production-style code

✅ Key Takeaway

This project reflects how I would build reliable data processing logic against real healthcare or enterprise APIs where data is rarely perfect. The emphasis is on correctness, resilience, and clarity rather than shortcuts.
