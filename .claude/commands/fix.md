You are fixing a user-reported problem in ravenna-kanban.

The user's problem description: $ARGUMENTS

## Step 1: Create GitHub Issue

1. Search for duplicates: `gh issue list --state open --search "<keyword>"`
2. If no duplicate exists, create one: `gh issue create --title "..." --body "..."`
   - Title: short, describes the observed bug
   - Body: reported behavior, expected behavior, any reproduction steps you can infer
3. Note the issue number

## Step 2: Analyze

1. Find the relevant code across `apps/web`, `apps/api`, and `packages/shared` as needed
2. Determine root cause — read surrounding code before deciding
3. If the reported behavior is actually correct, say so, comment on the GitHub issue explaining why, and stop. Don't force a fix.

## Step 3: Fix

1. Make the minimal correct change
2. Keep the fix scoped — no unrelated refactors or cleanups
3. Run the project's checks (typecheck, lint, tests — whatever applies to the touched package)

## Step 4: Hand Off for Verification

Tell me:

- Issue number and link
- Files changed
- Exactly how to test the fix locally (commands to run, what to do in the UI, expected result)

Then stop and wait. **Do NOT comment on the issue, commit, or push** until I confirm the fix works.

## Step 5: Comment on Issue (after I confirm)

Once I've verified, comment on the GitHub issue with:

- What was fixed and why (1–3 sentences)
- Concrete verification steps: what to click/type in the app, and what to look for

`gh issue comment <number> --body "..."`

I review every commit on this project — still do not commit or push unless I ask.

## Guidelines

- Minimal, clean fixes — no scope creep
- Push back when the current behavior is actually correct
- Prefer fixing the root cause over patching symptoms
