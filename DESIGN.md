# Design

## Theme
Dark, data-dense, crafted tool — anchored to the **Linear** recipe (warm near-black, hairline borders, restraint as confidence), adapted to stay approachable (no dev-tool monospace/keyboard signals; audience is bettors). The Vertix green is the single interactive accent (<5% of pixels); green/red are semantic P&L colors. Neutrals carry the structure.

## Color

Warm-dark (Linear-anchored). Single theme:

| Role | Value | Use |
|---|---|---|
| `--bg` | `#08090A` | App background (warm near-black) |
| `--surface` | `#16171C` | Cards, panels |
| `--surface-2` | `#1E1F25` | Inputs, elevated rows |
| `--surface-3` | `#26272E` | Hover / raised |
| `--border` | `rgba(255,255,255,0.06)` | Hairline borders — separate every panel |
| `--border-strong` | `rgba(255,255,255,0.11)` | Input borders |
| `--ink` | `#F7F8F8` | Primary text |
| `--muted` | `#9CA3AF` | Secondary text/labels |
| `--faint` | `#6B7280` | Tertiary text |
| `--primary` | `#2FB988` | Brand green accent (buttons, active, focus) — used sparingly |
| `--primary-ink` | `#07120D` | Text on the green button |
| `--profit` | `#35D39A` | Beneficio (verde) |
| `--loss` | `#F4716F` | Pérdida (rojo) |
| `--warning` | `#F0B64A` | Pendiente/aviso (ámbar) |

Shadows barely-there (`0 1px 2px rgba(0,0,0,0.35)`), never glow. Radius 8/12/16 (never gummy). Profit green and loss red always accompany a sign (+/−) and/or icon so they're not color-only.

## Typography
One family: system UI stack (`-apple-system, "Segoe UI", Roboto, Inter, sans-serif`). No display/body pairing. Numbers use `font-variant-numeric: tabular-nums`. Fixed rem scale (product register), ratio ~1.2. Weights: 400 body, 500 labels, 600 headings/values, 700 KPIs.

## Layout
App shell: fixed left sidebar (nav) + content area on desktop. On ≤860px the sidebar becomes a fixed bottom tab bar and content goes full width. Content max-width ~1200px. Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48. Radii: 8 (controls), 12 (cards), 999 (pills).

## Components
Buttons (primary / ghost / danger), inputs, selects, KPI stat cards, data tables (sticky header, right-aligned numbers), status badges (pending/won/lost/void), surebet badge, month calendar grid with per-day P&L cells, segmented toggles. Every interactive element has hover/focus/active/disabled. Focus = 2px primary ring.

## Motion
150–250ms ease-out on hover/state changes only. No page-load choreography. Calendar day & row hover, button press, badge transitions. Full `prefers-reduced-motion: reduce` fallback (instant).
