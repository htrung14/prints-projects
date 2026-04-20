# Frontend Design Workflow — User Preference

## Rule: Always sweep both desktop AND mobile

Whenever working on website design or any frontend/UI work, always verify
the layout at **both desktop and mobile viewports** before declaring a task
complete. Never assume a layout that works on one viewport works on the
other — the user expects parity in polish across breakpoints.

### Concrete workflow

After any frontend change, take screenshots at:

- Desktop: 1280×800 (or wider) — `preview_resize` preset `desktop`
- Mobile: 375×812 — `preview_resize` preset `mobile`

Check both for:

- Alignment and spacing
- Text wrapping / overflow
- Nav behavior (hide/show logic differs between breakpoints)
- Sticky bars / fixed elements
- Hero composition and CTA placement
- Footer line layout
- Cross-sell / carousel cells

### Why

The user explicitly instructed to **add this to memory**: during the
At-Tamassok photography prints project, multiple rounds of feedback
centered on mobile layouts (image alignment, nav reveal, sticky bar
hide-at-bottom) that would have been caught earlier with a dual-viewport
sweep after each change.

### Tags

- frontend
- design
- workflow
- testing
- user-preference
- responsive-design
