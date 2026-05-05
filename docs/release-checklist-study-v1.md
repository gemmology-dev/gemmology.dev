# Release checklist — study system v1.0

Pre-flight steps for the release PR that merges `feature/study-v1` into `main`.
Work through every item top-to-bottom; do not open the PR until all boxes are checked.

## 1. Integration branch — all tracks merged and green

- [ ] T1 Foundation PR merged into `feature/study-v1`
- [ ] T2 Algorithms PR merged into `feature/study-v1`
- [ ] T3 UI components PR merged into `feature/study-v1`
- [ ] T4 Schema & tooling PR merged into `feature/study-v1`
- [ ] T5a Editorial copy PR merged into `feature/study-v1`
- [ ] T5b Citations annotation PR merged into `feature/study-v1`
- [ ] T6 Docs & diagrams PR merged into `feature/study-v1`
- [ ] T8 Forge metadata PR merged into `feature/study-v1`
- [ ] `npm run build` exits 0 on the integration branch (910+ pages expected)
- [ ] `npm test` all pass on the integration branch
- [ ] `npm run validate:questions` passes (every YAML conforms to schema)
- [ ] `npm run questions:coverage` shows >= 10 vetted items per active category

## 2. V1-PLAN §12 acceptance criteria

### Functional
- [ ] Per-question response history persists across reloads
- [ ] Practice mode shows correct rationale + per-distractor rationales after answering
- [ ] Confidence tap appears between option-select and submit (when `requireConfidence=true`)
- [ ] SM-2 scheduler updates each item; due items get prioritised in next session
- [ ] At least 50 curated questions exist, >= 10 in each of: fundamentals, equipment, species
- [ ] Auto-generated questions still work for un-curated topics, visibly flagged
- [ ] `/study/review` shortcut shows due items only
- [ ] `/learn/<slug>` pages render a 3-question pretest widget above content
- [ ] `progress-tracker.ts` writes `gemmology-study-progress` on every session end
- [ ] Export/import round-trip preserves all four storage keys

### Non-functional
- [ ] Build green; CI passes; `validate:questions` passes on every PR touching `src/content/questions/`
- [ ] Unit-test coverage >= 80% on `scheduler`, `selector`, `interleaver`, `store/local`
- [ ] Lighthouse on `/quiz`: Perf >= 85, A11y >= 95, Best-practices >= 90, SEO >= 95
- [ ] Lighthouse on `/learn/fundamentals/crystal-systems`: same thresholds
- [ ] No console errors or warnings in normal flows
- [ ] All new strings have screen-reader labels; keyboard-only session completion works end-to-end

### Documentation
- [ ] `CLAUDE.md` updated with new modules and routes (T6 task)
- [ ] `docs/study-system.md` written
- [ ] `docs/authoring-questions.md` written
- [ ] Changelog entry visible at `/learn/study-system-changelog` (or equivalent)

## 3. Bundle-size gate

- [ ] Measure gz bundle delta for the `/quiz` route against current `main`:
  ```bash
  # On main
  npm run build && du -sh dist/_astro/*.js | sort -h > /tmp/bundle-main.txt
  # On feature/study-v1
  npm run build && du -sh dist/_astro/*.js | sort -h > /tmp/bundle-v1.txt
  diff /tmp/bundle-main.txt /tmp/bundle-v1.txt
  ```
- [ ] Confirmed total gz delta <= +25 KB across the quiz route

## 4. T7 audit sign-off

- [ ] T7a (conversion) findings reviewed; any blocking issues resolved
- [ ] T7b (security) findings reviewed; any blocking issues resolved
- [ ] T7c (SEO/technical) findings reviewed; any blocking issues resolved

## 5. Open the release PR

```bash
gh pr create \
  --base main \
  --head feature/study-v1 \
  --title "feat(study): v1.0 launch" \
  --body "$(cat docs/release-checklist-study-v1.md)"
```

- [ ] PR description links this checklist
- [ ] PR is set to squash merge
- [ ] At least one manual review by the maintainer (@Bissbert)
- [ ] All CI checks green on the PR

## 6. Post-merge: tag and deploy

After the squash merge completes on `main`:

```bash
git fetch origin
git checkout main
git pull origin main
git tag v1.0.0-study
git push origin v1.0.0-study
```

- [ ] Tag `v1.0.0-study` pushed to origin

## 7. IndexNow — new `/study/*` routes

The existing `indexnow.yml` workflow fires automatically after a successful
`main` deploy. It diffs the sitemap against the previous commit and submits
changed URLs to Bing, Yandex, and Naver.

For the v1 launch the diff will pick up all new `/study/*` and any modified
`/learn/*` pages. No manual action is required unless the workflow run fails.

- [ ] Verify the `IndexNow ping` workflow run completed successfully after deploy
- [ ] Spot-check two or three `/study/*` URLs are included in the submission log

## 8. Cloudflare — live verification

- [ ] `https://gemmology.dev/quiz` loads without console errors
- [ ] `https://gemmology.dev/study/review` loads and shows due items (or empty state)
- [ ] A `/learn/<slug>` page shows the pretest widget above the article body
- [ ] Cloudflare cache purge completed (triggered automatically by `deploy.yml`)

## 9. Clean up

- [ ] Worktrees removed:
  ```bash
  git worktree remove .trees/study-foundation
  git worktree remove .trees/study-algorithms
  git worktree remove .trees/study-ui
  git worktree remove .trees/study-schema
  git worktree remove .trees/study-content
  git worktree remove .trees/study-docs
  git worktree prune
  ```
- [ ] `feature/study-v1` branch deleted from origin (GitHub will offer this after merge)
