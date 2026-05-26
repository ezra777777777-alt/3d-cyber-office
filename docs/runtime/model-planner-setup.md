# Model Planner Setup

## What This Enables

The local runtime can use a real model to turn a Commander goal into structured Research / Build / Review tasks.

## Safe Boundary

- Keys stay in the local runtime process.
- The browser never asks for keys.
- Migration export never includes keys.
- If no provider is configured, the runtime falls back to deterministic mock planning.

## Mock Mode

```powershell
$env:MODEL_PROVIDER="mock"
npm run runtime
```

## Anthropic Mode

Check current Anthropic API documentation before implementation changes. Set:

```powershell
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your-local-key"
$env:MODEL_NAME="your-configured-model"
npm run runtime
```

## OpenAI Mode

Check current OpenAI API documentation before implementation changes. Set:

```powershell
$env:MODEL_PROVIDER="openai"
$env:OPENAI_API_KEY="your-local-key"
$env:MODEL_NAME="your-configured-model"
npm run runtime
```

## Verify

Open:

```text
http://127.0.0.1:8765/health
```

The response should show planner metadata without any secret value.
