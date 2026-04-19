# prints-press HANDOFF for Claude Code

> Written by the Cowork agent on 2026-04-15 at the end of a scaffolding
> session. You (Claude Code) are taking over to actually run the dev
> server, confirm with the user, commit, push, and deploy. Hai prefers
> terse, evidence-based, no em dashes, no double hyphens in prose, no AI
> filler language.

## TL;DR

A full `prints-press` Next.js scaffold is packaged at
`~/Projects/prints-projects/prints-press-scaffold.tar.gz` (same folder as
this handoff doc, on Hai's Mac). It is the sister site to the existing
shop `prints-projects`. It has not been extracted, installed, git init'd,
committed, or deployed. That is your job. Everything before that point is
done.

Your first action: ask Hai where to extract it (probably `~/Projects/`),
then run the steps in the "Execution plan" section below.

## The chain of handoffs

1. Hai wrote a full design plan in a prior Claude Code session. It lives
   at `/Users/haivotrung/.claude/plans/adaptive-hopping-snowglobe.md` on
   his Mac. Do not assume it is still there. Ask before relying on it.
2. Hai handed that plan to a Cowork agent (me). I scaffolded in a
   sandbox and delivered the tarball + this doc. I never touched
   `~/Projects/` on Hai's Mac. I never committed anything. I never ran
   gh or vercel.
3. Now Hai is handing you the ball. Read this whole doc before acting.
   If you want the original plan too, ask Hai to paste it.

## User context (critical)

- Hai Vo Trung. Senior Technical Services Support Engineer at Innovid.
  This is a personal side project for a photographer named Thalia Bassim.
- Tone: terse, direct, opinionated. Lead with the answer. Bullets fine.
- Style bans: no em dashes, no double hyphens in prose (CLI flags like
  `--webpack` are fine because they are syntax, not typography), no AI
  filler phrases.
- Always evidence based. Do not infer or assume. Attempt to recall
  (Claude Code has persistent memory). Ask clarifying questions when
  intent is unclear.
- Never commit, push, or open PRs without explicit user approval,
  including the commit message itself.
- Never include Co-Authored-By lines in commits.
- Never hardcode secrets. Use env vars.
- If a `docs-ai/` folder exists in a repo, treat it as source of truth.
  Read before changes, update after.
- Minimal edits only. Flag files over 250 lines or functions over 50.
  Do not auto refactor.
- MemPalace is Hai's long term memory system. The MCP is blocked by
  Innovid enterprise policy on the work laptop. If you want to write a
  drawer, stage at `~/.mempalace/stage/` and run `mempalace mine`. Do
  not use the MemPalace MCP.

## Git identity hazard (critical)

Hai's global git identity is `htrung@innovid.com` (work email). Vercel
is attached to `haivo14@icloud.com`. Committing with the work email
triggers Vercel's `TEAM_ACCESS_REQUIRED` seat block and the deploy fails
silently until you fix the identity.

**Before the first commit in `prints-press`, run:**

```sh
git config user.email "haivo14@icloud.com"
git config user.name "Hai Vo"
```

Repo local. Not global. Do not change his global config.

## Commit signing hazard

Hai's global git config has `commit.gpgsign=true` via 1Password SSH
signing (`op-ssh-sign`). If the 1Password agent is not running, commits
fail with "Could not connect to socket". Two resolutions:

1. Ask Hai to unlock 1Password. Preferred.
2. Ask permission to bypass for a single commit with
   `git -c commit.gpgsign=false commit ...`. Only with explicit approval.

Never bypass silently.

## What is in the tarball

The archive at `~/Projects/prints-projects/prints-press-scaffold.tar.gz`
contains:

```
prints-press/
  .env.example
  .gitignore                    (create-next-app default)
  .husky/pre-commit             pnpm lint-staged && pnpm typecheck
  .nvmrc                        20
  .prettierrc.json
  .prettierignore
  AGENTS.md                     (Next 16 warning + project rules)
  CLAUDE.md                     @AGENTS.md
  README.md                     project README, em dashes removed
  docs/
    system-design.md            full design doc, v0.1
  docs-ai/
    README.md                   pointer for future AI agents
  eslint.config.mjs             disables @next/next/no-img-element
  next.config.ts                (default from create-next-app)
  package.json                  build uses next build --webpack
  pnpm-lock.yaml                (from pnpm install in sandbox)
  pnpm-workspace.yaml           (emitted by create-next-app)
  postcss.config.mjs
  public/                       create-next-app defaults, safe to clean
  src/
    app/
      favicon.ico
      globals.css               full token system copied from shop
      layout.tsx                Geist font, Header + Footer
      page.tsx                  hero + 4 numbered sections + credit strip
    components/
      Footer.tsx                two column contact panel (Element A)
      Header.tsx                name + Return to shop
      Tbd.tsx                   dashed placeholder chip helper
  tsconfig.json                 strict: true
```

Node modules and the `.next` cache are NOT in the tarball. Hai will
`pnpm install` after extraction.

## Design decisions locked on 2026-04-15

| Topic         | Decision                                                                                                                                                                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose       | Press kit (bio, CV, press contact, link to shop). Not a blog, not a portfolio.                                                                                                                                                                                                      |
| Scope         | Single page, five sections, placeholder content.                                                                                                                                                                                                                                    |
| Repo          | `github.com/htrung14/prints-press`, private, not yet created.                                                                                                                                                                                                                       |
| Deploy        | `prints-press.vercel.app` (short alias). Vercel project not yet created.                                                                                                                                                                                                            |
| Stack         | Next.js 16.2.3 App Router, React 19.2.4, TypeScript strict, Tailwind v4, Geist via `next/font/google`, pnpm.                                                                                                                                                                        |
| Build command | `next build --webpack`. Not Turbopack. See "Session lessons" below.                                                                                                                                                                                                                 |
| Body font     | Geist only. No serif variant for v1. (User answered "Keep Geist" when asked.)                                                                                                                                                                                                       |
| Tokens        | Same as shop: `--bg`, `--bg-soft`, `--ink`, `--ink-strong`, `--ink-line`, `--ink-faint`. Declared in `:root` and exposed via `@theme inline` so Tailwind utilities like `bg-ink-strong` work.                                                                                       |
| Header        | Two groups: artist name + "· Press" left, "Return to shop ↗" right. Thin bottom rule. No cart, no essay link, no Arabic mark.                                                                                                                                                       |
| Footer        | Two column contact panel on md+, stacked on mobile. Left: identity + studio address. Right: General / Press / Sales email rows + Instagram + Shop link. Bottom rail: copyright + newsletter mailto. Inspired by editorial/publisher footers (Loose Joints et al.). Monochrome only. |
| Credit strip  | Sits above the footer. Tiny type, middle-dot separators, includes Tbd chip for web dev credit.                                                                                                                                                                                      |
| TBD handling  | `<Tbd label="..." />` helper renders a dashed-border chip with "TBD: {label}". Visible on the rendered page so placeholders are obvious.                                                                                                                                            |

## What I deviated from the original plan

1. Kept the `AGENTS.md` and `CLAUDE.md` that create-next-app 16 emits
   (they carry a useful "Next.js 16 has breaking changes, read
   node_modules/next/dist/docs" warning) and appended project rules to
   AGENTS.md rather than replacing it.
2. No `.github/workflows/ci.yml` created. The plan listed it as
   optional.
3. No `LICENSE` file. Private repo.
4. Dev script is `next dev`, not `next dev --webpack`. Next 16 uses
   Turbopack for dev by default. That is fine for local dev. The
   webpack rule only applies to production builds.

## Session lessons (things that broke and how they got fixed)

1. **pnpm not preinstalled in the Cowork sandbox.** Installed via
   `npm install -g pnpm --prefix /sessions/.../.npm-global`. Not
   relevant to your environment (Hai's Mac has pnpm already).

2. **Google Fonts unreachable from the Cowork sandbox.** The `pnpm
build` step failed because `next/font/google` cannot fetch Geist from
   `fonts.googleapis.com` inside the sandbox. On Hai's Mac this works.
   So the sandbox build result was an environment artifact, not a code
   bug. Typecheck and lint both pass. Dev server compiled and returned
   200 when I curl'd it inside the sandbox.

3. **Em dashes snuck into three files.** Fixed after regeneration:
   - `src/app/layout.tsx` metadata title (was "Thalia Bassim — Press",
     now "Thalia Bassim · Press")
   - `docs/system-design.md` H1 heading
   - `README.md` had seven em dashes in script descriptions, replaced
     with colons

   If you find more anywhere, fix them. Hai will notice.

4. **Tailwind v4 arbitrary value bug (from the shop's history).** Do
   NOT write `bg-[var(--ink-strong)]` or `text-[var(--ink-line)]`
   inline. Tailwind v4's content scanner drops them. Always use the
   theme tokens: `bg-ink-strong`, `text-ink-faint`, `border-ink-line`,
   `divide-ink-line`. These are declared in `@theme inline` in
   `globals.css`.

5. **Anchor based filled buttons render dark on dark (from the shop).**
   If you add an `<a>` with `bg-ink-strong text-bg`, it will render
   black text on black background due to a Tailwind + Next Link cascade
   quirk. Workaround: inline style the filled anchor:
   `style={{ backgroundColor: "var(--ink-strong)", color: "var(--bg)" }}`.
   A plain `<button>` with the same utility classes is fine.

6. **Vercel CLI uses device code login.** First run of `vercel login`
   pops a browser with a device code. Surface it to Hai and wait.

7. **Vercel Deployment Protection gates the long auto URL.** The long
   form `prints-press-xxxx-htrungs-projects.vercel.app` returns 401 to
   anyone not SSO'd. The short alias `prints-press.vercel.app` is
   public. Always hand Hai the short URL.

## Execution plan (what to run on Hai's Mac)

Ask Hai before each milestone (extract, install, dev, commit, push,
deploy). He wants to watch this happen.

```sh
# 1. Extract beside the shop
cd ~/Projects
tar -xzf prints-projects/prints-press-scaffold.tar.gz
cd prints-press

# 2. Install (pnpm-lock.yaml is already in the tarball)
nvm use 20
pnpm install

# 3. Smoke test
pnpm lint
pnpm typecheck
pnpm build            # production build, confirms no Turbopack issue
pnpm dev              # open http://localhost:3000 in a browser

# 4. Git init with LOCAL identity (critical, see "Git identity hazard")
git init -b main
git config user.email "haivo14@icloud.com"
git config user.name "Hai Vo"

# 5. Husky hook registration. Pnpm install already ran husky because
#    package.json has "prepare": "husky". Verify:
ls -la .husky/pre-commit     # should be +x, points at pnpm lint-staged + typecheck
cat .git/config | grep hooksPath    # should show .husky/_

# 6. Optional: delete the create-next-app default public/ SVGs if you
#    don't want them in git history. Hai may want to keep them.
rm public/next.svg public/vercel.svg public/globe.svg public/file.svg public/window.svg

# 7. First commit. ASK HAI BEFORE RUNNING. Show him the diff first.
git add -A
git status            # confirm with Hai
git commit -m "chore: initial scaffold for prints-press sister site"

# If 1Password agent is not running and Hai approves the bypass:
#   git -c commit.gpgsign=false commit -m "..."

# 8. Create the GitHub repo. ASK HAI.
gh auth status        # confirm gh is authenticated
gh repo create prints-press \
  --private \
  --source=. \
  --push \
  --description "Press kit for Thalia Bassim. Sister site to prints-projects."

# 9. Link Vercel and deploy. ASK HAI.
vercel link --yes --project prints-press
vercel deploy --yes
# Note the preview URL. Then the short alias auto-resolves to
# prints-press.vercel.app after deployment finalizes.

# 10. Verify. Hand Hai the SHORT URL, not the long one.
curl -I https://prints-press.vercel.app
```

## Verification checklist before you declare done

1. `pnpm dev` serves 200 at http://localhost:3000
2. `pnpm lint`, `pnpm typecheck`, `pnpm build` all exit 0
3. Header renders name on the left, Return to shop on the right, with a
   thin bottom rule. Click the shop link: opens in a new tab.
4. Hero shows "Thalia Bassim" with italic "Bassim" in display type.
5. Four numbered sections (01 BIO, 02 CV, 03 PRESS, 04 CONTACT) render
   with the left rail on md+, collapsed on mobile.
6. Every Tbd chip renders with a dashed border and a `TBD:` prefix.
7. Footer: two columns on md+, stacked on mobile. Labels on the left
   in small caps, values on the right aligned. Bottom rail has
   copyright + newsletter link.
8. Mobile smoke test at 375px: no horizontal scroll, Footer stacks
   correctly, Header doesn't overflow.
9. Reduce motion in DevTools: no stray animations (this scaffold has
   none, but it's worth confirming).
10. After deploy: `prints-press.vercel.app` returns 200, no SSO gate,
    page renders the same as local.

## Outstanding TBDs (Hai needs to supply)

All of these already render as dashed `Tbd` chips on the page so they
are visible on review:

- Hero tagline
- Three bio paragraphs (150-250 words each for paragraphs 1 and 2,
  100-200 for paragraph 3)
- Ten CV row descriptions
- Press email (appears twice)
- General and Sales emails
- Instagram handle
- Studio address (if he wants to publish beyond "Brooklyn, NY · by
  appointment")
- Web developer credit name (in the credit strip)
- Newsletter signup target (currently a mailto placeholder)

## Queued follow up

Hai is using usepastel.com to gather feedback on the shop
(`prints-projects`, already live). He will share a Pastel CSV export.
Fold those into the shop as a separate pass after the press site is
live. Do not touch Pastel comments until Hai drops the file.

## Sibling repo cheat sheet

If you need to reference the shop:

- Local: `~/Projects/prints-projects`
- GitHub: `github.com/htrung14/prints-projects` (private)
- Vercel: `htrungs-projects/prints-projects`
- Live: `https://prints-projects.vercel.app`
- Design doc: `docs/system-design.md` (v0.1, 2026-04-13)
- Shared tokens and utility classes live in `src/app/globals.css`. The
  press site mirrors them exactly.

When updating shared design tokens, update both sites.

## Who to ask and how

Hai prefers you ask one focused question at a time, with evidence for
why you are asking. Do not stack speculative questions. Do not invent
options. If you do not know something, say so plainly and ask.
