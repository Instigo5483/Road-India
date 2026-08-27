// Shared AI-triage logic used by both the Vercel serverless endpoint
// (api/triage.js) and the local Vite dev-server middleware (vite.config.js)
// -- one implementation, two entry points, so `npm run dev` and a real
// Vercel deploy behave identically.
//
// Given a report's category/type/description, asks an OpenAI model to
// assess severity, suggest the responsible department, and write a
// one-line caseworker summary. Falls back to a deterministic rule-based
// mock when no OPENAI_API_KEY is configured, so the full citizen journey
// (including the AI-assisted step) still works end-to-end with zero setup
// -- same "gracefully degrade to mock" pattern the rest of this app uses
// for Firebase (see src/lib/firebase.js, src/lib/mockBackend.js).

const DEPARTMENT_BY_CATEGORY = {
  problem: 'Municipal Roads & Infrastructure',
  corruption: 'Public Works Department (PWD)',
  emergency: 'Emergency Response / Traffic Police',
}

function mockTriage({ category, description }) {
  const severity = category === 'emergency' ? 'critical' : pickMockSeverity(description)
  return {
    severity,
    department: DEPARTMENT_BY_CATEGORY[category] ?? 'General Grievance Cell',
    summary: (description || '').trim().slice(0, 160) || 'No description provided.',
    aiGenerated: false,
  }
}

// Zero setup shouldn't mean "always the same demo severity" -- a light
// keyword heuristic so the mock path still feels responsive to what was
// actually typed, without needing an API key.
function pickMockSeverity(description) {
  const text = (description || '').toLowerCase()
  if (/accident|injur|fire|collaps|danger|urgent/.test(text)) return 'high'
  if (/week|month|repeat|again|still/.test(text)) return 'medium'
  return 'low'
}

export async function runTriage({ category, types, description, photoUrls }, apiKey) {
  if (!apiKey) return mockTriage({ category, description })

  // gpt-4o-mini is multimodal -- when a photo is attached, let the model
  // actually look at it rather than triaging on the text description
  // alone. Only the first photo goes in: triage just needs a severity
  // signal, not exhaustive visual detail, and keeping it to one image
  // keeps the request small (photos are already client-compressed to
  // ~1280px by PhotoUpload.jsx, but base64 image tokens still add up).
  const firstPhoto = photoUrls?.[0]

  const userContent = [
    {
      type: 'text',
      text: `Category: ${category}\nIssue types: ${(types ?? []).join(', ') || 'unspecified'}\nDescription: ${description}`,
    },
  ]
  if (firstPhoto) {
    userContent.push({ type: 'image_url', image_url: { url: firstPhoto } })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content:
              'You triage civic road-issue reports for an Indian municipal grievance system. ' +
              'Given a category, issue type, and citizen description' +
              (firstPhoto ? ', and a photo the citizen attached' : '') +
              ', respond with strict JSON only: ' +
              '{"severity": "low" | "medium" | "high" | "critical", ' +
              '"department": string (a plausible Indian municipal department name for this issue), ' +
              '"summary": string (one formal sentence summarizing the issue for a caseworker)}.' +
              (firstPhoto
                ? ' If the photo shows the issue is more or less severe than the text alone suggests, let the photo take precedence.'
                : ''),
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      }),
    })

    if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`)

    const data = await response.json()
    const parsed = JSON.parse(data.choices[0].message.content)

    if (!parsed.severity || !parsed.department || !parsed.summary) {
      throw new Error('OpenAI response missing expected fields')
    }

    return { ...parsed, aiGenerated: true, photoAnalyzed: Boolean(firstPhoto) }
  } catch {
    // Any failure (missing/invalid key, network issue, rate limit, malformed
    // model output) falls back to the mock so a flaky API call never blocks
    // a citizen from filing a report.
    return mockTriage({ category, description })
  }
}
