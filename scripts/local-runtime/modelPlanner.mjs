import { createDeterministicPlan } from './deterministicPlanner.mjs';
import { normalizePlannerResponse, validatePlannerResponse } from './planSchema.mjs';

function buildPlannerPrompt(input) {
  return [
    'You are the Commander planner for a local AI office runtime.',
    'Return ONLY JSON. No markdown. No commentary.',
    'The JSON must contain missionId, missionTitle, missionSummary, and tasks.',
    'Tasks must include at least one researcher, one builder, and one reviewer.',
    'Allowed roles: researcher, builder, reviewer.',
    'Allowed risk values: low, medium, high, critical.',
    'Allowed expectedArtifactKinds: notes, patch, review, report.',
    '',
    `missionId: ${input.missionId}`,
    `goal: ${input.goal}`,
    `materialNote: ${input.materialNote || ''}`,
    `constraintsText: ${input.constraintsText || ''}`,
  ].join('\n');
}

function deterministicFallback(input, reason) {
  const plan = createDeterministicPlan(input);
  return {
    ...plan,
    planner: {
      provider: 'mock',
      mode: 'deterministic',
      fallbackReason: reason,
    },
  };
}

function parseJsonFromText(text) {
  const trimmed = String(text || '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('Model did not return JSON');
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function callAnthropic(input, env, fetcher) {
  const response = await fetcher('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.modelName || 'claude-sonnet',
      max_tokens: env.maxOutputTokens,
      temperature: env.temperature,
      messages: [{ role: 'user', content: buildPlannerPrompt(input) }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic planner failed: HTTP ${response.status}`);
  const json = await response.json();
  const text = Array.isArray(json.content)
    ? json.content.map((part) => part.text || '').join('\n')
    : '';
  return parseJsonFromText(text);
}

async function callOpenAI(input, env, fetcher) {
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.apiKey}`,
    },
    body: JSON.stringify({
      model: env.modelName || 'configured-model',
      temperature: env.temperature,
      input: buildPlannerPrompt(input),
    }),
  });

  if (!response.ok) throw new Error(`OpenAI planner failed: HTTP ${response.status}`);
  const json = await response.json();
  const text =
    typeof json.output_text === 'string'
      ? json.output_text
      : Array.isArray(json.output)
        ? JSON.stringify(json.output)
        : JSON.stringify(json);
  return parseJsonFromText(text);
}

export async function planMission(input) {
  const env = input.env;
  const fetcher = input.fetcher || fetch;

  if (!env || env.provider === 'mock') {
    return deterministicFallback(input, 'mock provider');
  }

  if (!env.configured) {
    return deterministicFallback(input, env.reason);
  }

  try {
    const raw =
      env.provider === 'anthropic'
        ? await callAnthropic(input, env, fetcher)
        : await callOpenAI(input, env, fetcher);

    const withMissionId = { ...raw, missionId: input.missionId };
    const validation = validatePlannerResponse(withMissionId);
    if (!validation.ok) {
      return deterministicFallback(input, validation.reason);
    }

    const normalized = normalizePlannerResponse(withMissionId);
    return {
      ...normalized,
      planner: {
        provider: env.provider,
        mode: 'model',
        modelName: env.modelName || null,
      },
    };
  } catch (error) {
    return deterministicFallback(
      input,
      error instanceof Error ? error.message : 'model planner failed',
    );
  }
}
