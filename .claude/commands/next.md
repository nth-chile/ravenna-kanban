You are helping me decide what to work on next in ravenna-kanban. Do NOT start fixing anything — this command ends with a recommendation.

Optional focus hint from me: $ARGUMENTS

## Step 1: Gather Open Work

1. `gh issue list --state open --limit 50` — all open issues
2. For any issue that looks relevant, read the body and comments (`gh issue view <n>`)
3. Check for labels, milestones, or `assignee` that signal priority

## Step 2: Group & Assess

Cluster issues into logical groups (e.g. "auth bugs", "drag-drop polish", "API validation gaps"). For each group note:

- Rough size (one-liner vs. multi-file)
- Whether issues in the group share code paths (batching them saves context switching)
- Any blockers or dependencies between issues
- Risk: touches shared infra vs. isolated

## Step 3: Recommend

Give me a short ranked recommendation:

1. **Top pick** — which group/issue you'd do first and why (1–2 sentences)
2. **Runner-up** — next best, and what would tip the decision toward it
3. **Defer** — anything not worth doing now, briefly why

If two groups look equally good, or the call depends on priorities you can't infer (e.g. demo vs. correctness, polish vs. new feature), **say so and ask me to pick** rather than guessing.

Keep the whole output tight — I want to scan it, not read an essay.

## Guidelines

- Don't open PRs, branches, or start work
- Prefer root-cause fixes over symptom patches when grouping
- Surface anything surprising (stale issues, duplicates, closed-but-unresolved)
