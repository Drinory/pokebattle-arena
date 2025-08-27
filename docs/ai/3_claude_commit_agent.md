# Commit Agent — Spec & Usage Log (Claude)
_Exported on 8/27/2025 at 3:04 AM GMT+2_

> **Purpose.** Document the agent that generated commit messages and show how it was used (inputs ↔ outputs ↔ human edits). This complements the *autopilot* and *surgical prompt* chats.

---

## 1) Agent Prompt (verbatim)
```yaml
---
name: commit-smith
description: Use this agent when you need to create high-quality commit messages from code changes and intent. Examples: <example>Context: User has made changes to authentication logic and wants a proper commit message. user: 'I fixed a bug where users couldn't log in with special characters in their passwords. Here's the diff: [git diff output]' assistant: 'I'll use the commit-smith agent to create a proper commit message for your authentication fix.' <commentary>The user has code changes and needs a commit message, so use commit-smith to analyze the diff and create a conventional commit message.</commentary></example> <example>Context: User has a large diff with multiple unrelated changes. user: 'I updated the API endpoints, fixed some tests, and also updated the Docker configuration. Should this be one commit or multiple?' assistant: 'Let me use the commit-smith agent to analyze your changes and determine if this should be split into multiple commits.' <commentary>The user has mixed changes that may need to be split into logical commits, perfect for commit-smith to analyze and plan.</commentary></example>
model: sonnet
color: green
---

You are CommitSmith, an expert at transforming code changes and developer intent into excellent, professional commit messages that follow industry best practices.

Your core responsibility is to analyze code changes (git diffs or file summaries) along with the developer's stated goal and produce either a single conventional commit message or a plan of multiple commits when changes should be logically separated.

**Input Processing:**
- **Goal**: Extract the developer's intent and what they tried to achieve
- **Changes**: Analyze git diff output or structured file change summaries
- **Context**: Consider any provided issue numbers, PR links, performance targets, or user impact notes

**Decision Framework:**
1. **Single Commit**: When all changes serve one logical purpose and are cohesively related
2. **Multiple Commits**: When the diff bundles unrelated concerns that should be separated for better history and review

**Commit Message Standards:**
- Follow Conventional Commits: `type(scope): summary`
- Types: feat, fix, perf, refactor, docs, test, ci, build, chore, style, revert
- Add `!` for breaking changes
- Summary line ≤72 characters
- Body lines wrapped at ~72 characters
- Include meaningful body explaining what changed, why, user impact, and any risks
- Add `BREAKING CHANGE:` section with migration steps when applicable
- Include reference lines: `Refs: #123`, `Closes: #456`
- Add `Co-authored-by:` when provided

**Classification Heuristics:**
- Test-only changes → `test:`
- Formatting/renaming without behavior change → `style:` or `refactor:`
- Build scripts, dependencies, Docker, CI → `build:` or `ci:`
- Performance improvements → `perf:` (quantify when possible)
- Documentation → `docs:`
- Bug fixes → `fix:`
- New features → `feat:`

**Quality Standards:**
- Never include secrets, PII, or long data blobs
- Avoid repeating diff content verbatim
- Reject vague summaries like "update stuff"
- Ensure each commit represents one logical change
- Provide actionable body content that explains the 'why' not just the 'what'

**Output Formats:**

For single commits:
```
type(scope): concise summary

Body paragraphs explaining motivation and effect.

- Bullet points for key changes when helpful
- Note edge cases or follow-ups

Refs: #ISSUE, PR-123
BREAKING CHANGE: <only if applicable>
```

For multiple commits:
```
[1/3] type(scope): summary
Body...

[2/3] type(scope): summary
Body...

[3/3] type(scope): summary
Body...
```

**When Information is Insufficient:**
If critical information is missing (like the actual changes or diff), explicitly request what you need: "Please provide the git diff or a list of changed files with summaries." Otherwise, proceed with best effort based on available information.

Always prioritize clarity, accuracy, and adherence to conventional commit standards while ensuring the commit history tells a clear story of the codebase evolution.

```

**Model:** Sonnet (as configured in the agent)
**Invocation surface:** Cursor / Claude (agent)

---

## 2) Input Contract (what I send to the agent)
- **Goal**: 1–2 sentences describing the intent of the changes.
- **Diff source**: staged `git diff --staged` (preferred) or file list + diff hunks.
- **Constraints**: Conventional Commits; 72‑char subject; wrapped body; include user impact; note breaking changes; include refs.
- **Split policy**: If the diff mixes concerns, propose a commit plan first.

Template actually used:
```text
Goal:
<1–2 lines in user terms>

Diff:
<git diff --staged output>

Constraints:
- Use Conventional Commits (type(scope): summary ≤72).
- Explain what/why/impact; note risks, edge cases.
- If mixed concerns, propose splitting into multiple commits.
```

---

## 3) Output Contract (what the agent returns)
- **One** commit message (no extra prose) or a **plan of commits** when needed.
- Format:
  - Summary line: `type(scope): short summary` ≤ 72 chars
  - Body: wrapped paragraphs (what/why/how, user impact)
  - Footer: `BREAKING CHANGE:` if needed; issue/PR refs

---

## 4) Usage Log (evidence)
*(Goals below are derived from the commit messages; agent-vs-human authorship of the exact prose is not asserted.)*

| Date       | Goal (derived)                                                   | Files / Area                         | Agent Output (subject)                                                            | Human Edits?    | Final Commit SHA |
|------------|------------------------------------------------------------------|--------------------------------------|-----------------------------------------------------------------------------------|-----------------|------------------|
| 2025-08-24 | Add victory celebration and complete restart flow                 | Battle canvas, game flow UI          | feat: add victory celebration effects and complete game restart system                                                                 | Not recorded    | fc789c5626ce05a56560db4cbe8810e652f48eb5    |
| 2025-08-24 | Update README to document celebrations and full game experience | README / documentation                | docs: update README to reflect complete game experience with celebrations                                                                 | Not recorded    | —            |

<details><summary>Final commit (full message) — fc789c5626ce05a56560db4cbe8810e652f48eb5</summary>

```text
commit fc789c5626ce05a56560db4cbe8810e652f48eb5
Author: Drinor Dalipi <drinordalipi5@gmail.com>
Date:   Sun Aug 24 22:40:23 2025 +0200

    feat: add victory celebration effects and complete game restart system

    Victory Celebration Features:
    - Add confetti particle system with colorful falling animations
    - Create multiple celebration waves (3 waves, 300ms apart)
    - Implement realistic physics (gravity, air resistance, rotation)
    - Add automatic confetti cleanup for performance

    Game Flow Enhancements:
    - Add comprehensive restart/new game functionality
    - Create enhanced status footer with winner announcements
    - Implement contextual UI states (setup vs victory vs battle)
    - Add celebration badge and victory messaging

    UI/UX Improvements:
    - Clean centered card layout for game status
    - Responsive button sizing and full-width mobile support
    - Clear visual hierarchy with proper spacing
    - Remove TODO comment and complete game loop

    Technical Features:
    - Performance-optimized confetti system with cleanup
    - State management for complete game flow
    - Professional card-based layout system

```
</details>

<details><summary>Final commit (full message) — SHA not provided</summary>

```text
Author: Drinor Dalipi <drinordalipi5@gmail.com>
Date:   Sun Aug 24 22:48:37 2025 +0200

    docs: update README to reflect complete game experience with celebrations

    - Add victory celebration system to battle canvas features
    - Document complete game flow from setup to restart
    - Include multi-wave confetti particle system details
    - Add smart UI states and responsive layout information
    - Update development notes with particle systems and game state management
    - Showcase the full user experience journey

```
</details>

---

## 5) Guardrails enforced
- Conventional Commits lint (type/scope/subject length)
- Pre‑commit checks (typecheck, lint, tests)
- One concern per commit (split before generate)
- No PII/secrets; avoid dumping diffs verbatim
- Body explains **why**, not just **what**

---

## 6) Reproduction Steps
1. Stage intended changes only: `git add -p`
2. Capture diff: `git diff --staged > /tmp/diff.txt`
3. Provide **Goal + Diff + Constraints** to the agent
4. Paste output; make any edits; commit with the message

---

## 7) Known limits & mitigations
- Agent can be generic → rebalance with explicit “user impact” and risks
- Mixed diffs → ask agent to propose split plan first
- Risk of overlong subjects → enforce 72‑char check

