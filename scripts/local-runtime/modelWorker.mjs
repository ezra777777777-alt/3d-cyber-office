import { normalizeWorkerOutput } from './workerOutputSchema.mjs';

function parseJsonFromText(text) {
  const trimmed = String(text || '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('Model did not return JSON');
  return JSON.parse(trimmed.slice(start, end + 1));
}

function defaultFallback(input) {
  return {
    summary: `${input.task?.title || 'Worker task'} completed with deterministic fallback.`,
    artifactKind: input.task?.expectedArtifactKinds?.[0] || 'notes',
    contextUsed: input.contextPack?.files?.map((file) => file.path) || [],
  };
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
      messages: [{ role: 'user', content: input.prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic worker failed: HTTP ${response.status}`);
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
      input: input.prompt,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI worker failed: HTTP ${response.status}`);
  const json = await response.json();
  const text =
    typeof json.output_text === 'string'
      ? json.output_text
      : Array.isArray(json.output)
        ? JSON.stringify(json.output)
        : JSON.stringify(json);
  return parseJsonFromText(text);
}

export function createModelWorkerDecision(options = {}) {
  const env = options.env;
  const fetcher = options.fetcher || fetch;
  const fallback = options.fallback || (async (input) => defaultFallback(input));

  return async function modelWorkerDecision(input) {
    async function normalizedFallback() {
      return normalizeWorkerOutput(await fallback(input), input.task);
    }

    if (!env || env.provider === 'mock' || !env.configured) {
      return normalizedFallback();
    }

    try {
      const raw =
        env.provider === 'anthropic'
          ? await callAnthropic(input, env, fetcher)
          : await callOpenAI(input, env, fetcher);
      return normalizeWorkerOutput(raw, input.task);
    } catch {
      return normalizedFallback();
    }
  };
}
