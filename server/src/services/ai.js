const DEMO_MESSAGE =
  'Demo mode: OPENAI_API_KEY is not configured, so LineGuard did not call a language model. There is no AI-generated troubleshooting answer. The items below are approved maintenance documents selected as context for a live request.';

export function assistantStatus(env = process.env) {
  const configured = isRealKey(env);
  return configured
    ? { mode: 'live', label: 'Live AI', model: modelName(env) }
    : { mode: 'demo', label: 'Demo mode', model: null };
}

export async function troubleshootIncident(env, incident, documents) {
  const context = documents.map((document) => ({
    id: document.id,
    document_code: document.document_code,
    title: document.title,
    equipment: document.equipment,
    category: document.category,
    doc_type: document.doc_type,
    body: document.body,
    match_reasons: document.match_reasons || [],
  }));

  if (!isRealKey(env)) {
    return {
      ok: true,
      body: {
        mode: 'demo',
        label: 'Demo mode',
        answer: null,
        message: DEMO_MESSAGE,
        documents: context,
      },
    };
  }

  try {
    const answer = await requestAnswer(env, incident, context);
    return {
      ok: true,
      body: {
        mode: 'live',
        label: 'Live AI',
        model: modelName(env),
        answer,
        message: null,
        documents: context,
      },
    };
  } catch (error) {
    console.error(`AI request failed: ${error.message}`);
    return {
      ok: false,
      status: 502,
      body: {
        mode: 'live',
        label: 'Live AI',
        answer: null,
        message:
          'The AI service could not complete this request. No troubleshooting answer was generated.',
        documents: context,
      },
    };
  }
}

function isRealKey(env) {
  const apiKey = (env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return false;
  if (/your[-_ ]?api[-_ ]?key/i.test(apiKey)) return false;
  if (/^(changeme|placeholder|sk-your)$/i.test(apiKey)) return false;
  return true;
}

function modelName(env) {
  return (env.OPENAI_MODEL || 'gpt-4o-mini').trim();
}

async function requestAnswer(env, incident, documents) {
  const baseUrl = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const documentText = documents.length
    ? documents
        .map(
          (document) =>
            `## ${document.document_code} ${document.title}\nType: ${document.doc_type}\n${document.body}`,
        )
        .join('\n\n')
    : 'No approved maintenance document matched this incident.';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName(env),
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a maintenance assistant for Northline Fabrication, a fictional plant. Use only the approved maintenance documents in the user message. If those documents do not cover the symptom, say that clearly and do not invent torque values, part numbers, pressures, or steps. Write concise guidance a technician can scan.',
        },
        {
          role: 'user',
          content: `Incident
Line: ${incident.production_line}
Equipment: ${incident.equipment}
Category: ${incident.category}
Severity: ${incident.severity}
Description: ${incident.description}
Resolution notes already recorded: ${incident.resolution_notes || 'None'}

Approved documents:
${documentText}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  const payload = await response.json().catch(() => ({}));
  const answer = payload?.choices?.[0]?.message?.content;
  if (!response.ok || !answer || !String(answer).trim()) {
    throw new Error(`status ${response.status}`);
  }
  return String(answer).trim();
}
