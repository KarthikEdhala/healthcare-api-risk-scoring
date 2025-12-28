const BASE_URL = "https://assessment.ksensetech.com/api";
const API_KEY = "ak_4e89dc15d22b8b75071e92b46476efd91b44c77180f7e8b8";

type Patient = {
  patient_id: string;
  age?: unknown;
  temperature?: unknown;
  blood_pressure?: unknown;
};

type ApiResponse = {
  data: Patient[];
  pagination: {
    page: number;
    hasNext: boolean;
  };
};

const headers: HeadersInit = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isValidApiResponse = (payload: any): payload is ApiResponse =>
  payload &&
  Array.isArray(payload.data) &&
  payload.pagination &&
  typeof payload.pagination.hasNext === "boolean";

async function fetchPatientsPage(
  page: number,
  limit = 5
): Promise<ApiResponse | null> {
  const url = `${BASE_URL}/patients?page=${page}&limit=${limit}`;
  const MAX_RETRIES = 8;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers });

      if (res.status === 429 || [500, 502, 503, 504].includes(res.status)) {
        await sleep(600 + attempt * 250);
        continue;
      }

      if (!res.ok) {
        await sleep(400);
        continue;
      }

      const json = await res.json();
      if (!isValidApiResponse(json)) {
        await sleep(400);
        continue;
      }

      return json;
    } catch {
      await sleep(500 + attempt * 200);
    }
  }

  return null;
}

function scorePatient(patient: Patient): {
  id: string;
  totalScore: number;
  isFever: boolean;
  hasDataIssue: boolean;
} {
  const id = patient.patient_id;

  let totalScore = 0;
  let hasDataIssue = false;
  let isFever = false;

  // Age
  if (patient.age !== undefined) {
    if (typeof patient.age === "number" && Number.isFinite(patient.age)) {
      totalScore += patient.age > 65 ? 2 : 1;
    } else {
      hasDataIssue = true;
    }
  }

  // Temperature
  if (patient.temperature !== undefined) {
    if (
      typeof patient.temperature === "number" &&
      Number.isFinite(patient.temperature)
    ) {
      if (patient.temperature >= 101) {
        totalScore += 2;
      } else if (patient.temperature >= 99.6) {
        totalScore += 1;
      }

      if (patient.temperature >= 100.4) {
        isFever = true;
      }
    } else {
      hasDataIssue = true;
    }
  }

  // Blood Pressure
  if (patient.blood_pressure !== undefined) {
    if (typeof patient.blood_pressure === "string") {
      const parts = patient.blood_pressure.split("/");

      if (parts.length === 2) {
        const systolic = parts[0] ? Number(parts[0].trim()) : NaN;
        const diastolic = parts[1] ? Number(parts[1].trim()) : NaN;

        if (Number.isFinite(systolic) && Number.isFinite(diastolic)) {
          if (systolic >= 140 || diastolic >= 90) {
            totalScore += 4;
          } else if (
            (systolic >= 130 && systolic <= 139) ||
            (diastolic >= 80 && diastolic <= 89)
          ) {
            totalScore += 3;
          } else if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
            totalScore += 2;
          }
        } else {
          hasDataIssue = true;
        }
      } else {
        hasDataIssue = true;
      }
    } else {
      hasDataIssue = true;
    }
  }

  return { id, totalScore, isFever, hasDataIssue };
}

async function runAssessment() {
  const highRiskPatients = new Set<string>();
  const feverPatients = new Set<string>();
  const dataQualityIssues = new Set<string>();

  let page = 1;

  console.log("Starting assessment...\n");

  while (true) {
    let response: ApiResponse | null = null;

    while (!response) {
      response = await fetchPatientsPage(page);
      if (!response) {
        console.warn(`Page ${page} failed, retrying...`);
        await sleep(2500);
      }
    }

    for (const patient of response.data) {
      if (!patient?.patient_id) continue;

      const result = scorePatient(patient);

      if (result.isFever) feverPatients.add(result.id);
      if (result.hasDataIssue) dataQualityIssues.add(result.id);
      if (result.totalScore >= 5) highRiskPatients.add(result.id);
    }

    if (!response.pagination.hasNext) break;

    page++;
    await sleep(300);
  }

  const payload = {
    high_risk_patients: Array.from(highRiskPatients).sort(),
    fever_patients: Array.from(feverPatients).sort(),
    data_quality_issues: Array.from(dataQualityIssues).sort(),
  };

  console.log("\nSubmitting assessment...\n");

  const submit = await fetch(`${BASE_URL}/submit-assessment`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const result = await submit.json();

  console.log("Submission complete");
  console.log(`Score: ${result.results.percentage}%`);
  console.log(`Status: ${result.results.status}`);
}

runAssessment().catch((err) => {
  console.error("Assessment failed");
  console.error(err);
  process.exit(1);
});
