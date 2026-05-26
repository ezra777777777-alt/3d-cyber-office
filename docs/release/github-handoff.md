# GitHub Handoff Checklist

## Before Staging

```powershell
git branch --show-current
git status --short
npm.cmd run runtime:test
npm.cmd run test
npm.cmd run build
```

Do not stage:

- `.env`
- `.env.*`
- `.local-runtime`
- `node_modules`
- `dist`
- `.release`
- screenshots unless the QA doc explicitly references them and they are intended artifacts

## Stage

Prefer explicit paths:

```powershell
git add package.json vite.config.ts scripts docs src public .gitignore
```

Then inspect:

```powershell
git diff --cached --stat
git diff --cached --name-only
```

## Commit

```powershell
git commit -m "chore: prepare local release candidate"
```

## Push

```powershell
git push
```

If upstream is missing:

```powershell
git push -u origin HEAD
```

## If Push Fails

If `git push` fails because credentials are invalid:

1. Confirm the local commit exists:

```powershell
git log -1 --oneline
```

2. Confirm remote:

```powershell
git remote -v
```

3. Refresh credentials using the tool you normally use for this repo:

```powershell
gh auth status
gh auth login
```

or update Windows Git Credential Manager credentials.

4. Retry:

```powershell
git push -u origin HEAD
```

If connector-based push times out, keep the local commit and report the branch plus commit SHA. Do not mark release complete until the branch is visible on GitHub.

## Report

Report:

- branch,
- commit SHA,
- PR URL or pushed branch URL,
- verification commands,
- known warnings,
- whether the release package was generated.
