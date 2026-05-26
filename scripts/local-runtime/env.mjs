const PROVIDERS = new Set(['mock', 'anthropic', 'openai']);

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readRuntimeEnv(source = process.env) {
  const rawProvider = String(source.MODEL_PROVIDER || 'mock').toLowerCase();
  const provider = PROVIDERS.has(rawProvider) ? rawProvider : 'mock';
  const modelName = source.MODEL_NAME ? String(source.MODEL_NAME) : '';
  const timeoutMs = numberFromEnv(source.MODEL_TIMEOUT_MS, 45000);
  const maxOutputTokens = numberFromEnv(source.MODEL_MAX_OUTPUT_TOKENS, 1800);
  const temperature = Number.isFinite(Number(source.MODEL_TEMPERATURE)) ? Number(source.MODEL_TEMPERATURE) : 0.2;

  if (provider === 'anthropic') {
    const apiKey = source.ANTHROPIC_API_KEY ? String(source.ANTHROPIC_API_KEY) : null;
    return {
      provider,
      modelName,
      apiKey,
      timeoutMs,
      maxOutputTokens,
      temperature,
      configured: Boolean(apiKey),
      reason: apiKey ? 'configured' : 'ANTHROPIC_API_KEY is missing',
    };
  }

  if (provider === 'openai') {
    const apiKey = source.OPENAI_API_KEY ? String(source.OPENAI_API_KEY) : null;
    return {
      provider,
      modelName,
      apiKey,
      timeoutMs,
      maxOutputTokens,
      temperature,
      configured: Boolean(apiKey),
      reason: apiKey ? 'configured' : 'OPENAI_API_KEY is missing',
    };
  }

  return {
    provider: 'mock',
    modelName,
    apiKey: null,
    timeoutMs,
    maxOutputTokens,
    temperature,
    configured: true,
    reason: 'mock provider',
  };
}

export function redactEnvForHealth(env) {
  return {
    provider: env.provider,
    modelName: env.modelName || null,
    configured: env.configured,
    reason: env.reason,
  };
}
