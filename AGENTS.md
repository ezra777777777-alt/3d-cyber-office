# Project Agent Instructions

## Product Standard

Treat the user as an extremely demanding product reviewer. The goal is not merely to make features work, and not merely to make the UI look acceptable. The product must feel designed, trustworthy, useful, responsive, and worth exploring.

Use this standard for all implementation, review, and verification work:

- First impression must be compelling, polished, and clearly product-grade.
- The 3D Cyber Office should feel like a real AI workspace, not a generic dashboard, prototype, or card wall.
- UI quality is only one part of acceptance. Also evaluate workflow clarity, interaction feedback, system state, performance, reliability, safety, migration, and maintainability.
- Reference-video fidelity is a baseline, not the ceiling. Prefer a stronger productized experience when it improves clarity and delight without breaking the project direction.
- Any screen or flow that feels cheap, confusing, cluttered, sluggish, fragile, or merely decorative is not done.

## Skill Usage

When a task touches code development, frontend quality, UI/UX, product experience, testing, review, or release readiness, proactively use relevant available skills before and during the work. In particular, use skills equivalent to:

- `.codex-project-skills/product-experience-gate/SKILL.md` for the project's demanding product-experience acceptance gate.
- `.codex-project-skills/frontend-design/SKILL.md` for visual direction and distinctive product-grade interface quality.
- `.codex-project-skills/webapp-testing/SKILL.md` for browser verification and screenshot-based QA.
- `.codex-project-skills/systematic-debugging/SKILL.md` for bugs and unexpected behavior.
- `.codex-project-skills/test-driven-development/SKILL.md` for feature and bugfix work where tests can reasonably be added first.
- `.codex-project-skills/requesting-code-review/SKILL.md` before considering meaningful work complete.
- `.codex-project-skills/receiving-code-review/SKILL.md` when addressing review feedback.
- `.codex-project-skills/verification-before-completion/SKILL.md` before claiming the task is complete or passing.
- `.codex-project-skills/picky-code-review/SKILL.md` for strict bug, regression, maintainability, and product-risk review.
- `.codex-project-skills/web-quality-gate/SKILL.md` for performance, accessibility, browser, responsive, and visual QA checks.
- `.codex-project-skills/frontend-experience-audit/SKILL.md` for demanding UI/UX and product polish review.
- `.codex-project-skills/ux-psychology-gate/SKILL.md` for trust, cognitive load, motivation, and decision clarity.
- `frontend-design` or `frontend-skill` for visual direction and interface quality.
- `frontend-testing-debugging` or `webapp-testing` for browser verification and screenshot-based QA.
- `react-best-practices` for React component, state, rendering, and performance decisions.
- `systematic-debugging` for bugs and unexpected behavior.
- `test-driven-development` for feature and bugfix work where tests can reasonably be added first.
- `requesting-code-review` or a code review skill before considering meaningful work complete.
- `verification-before-completion` before claiming the task is complete or passing.

If a useful skill is installed but not automatically selected, explicitly load it. If a desired third-party skill is unavailable, apply the same checklist manually and mention the gap.

## Completion Bar

Before reporting success on product or UI-facing work:

- Run the relevant tests, type checks, and build commands.
- Verify the app in a browser when the change affects the rendered experience.
- Check desktop and mobile layouts for overlap, clipping, unreadable text, blank canvas, broken interactions, and confusing state.
- Review the result from the perspective of a picky first-time user and continue iterating if it does not feel polished.
