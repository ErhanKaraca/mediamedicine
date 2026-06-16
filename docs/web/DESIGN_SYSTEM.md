# Design System

> Reference guide. Not a redesign — codifies existing tokens and conventions so new pages stay consistent.

---

## 1. Color System

All colors in **OKLCH** — high perceptual uniformity. Defined as CSS custom properties in `:root` / `.dark` and mapped to Tailwind via `@theme inline {}`.

### Core Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `oklch(0.9774 0.0042 236.50)` | `oklch(0.1288 0.0406 264.70)` | Page background |
| `--foreground` | `oklch(0.2077 0.0398 265.75)` | `oklch(0.9842 0.0034 247.86)` | Primary text |
| `--card` | `oklch(1.0 0 0)` | `oklch(0.2077 0.0398 265.75)` | Card/dialog surface |
| `--primary` | `oklch(0.7528 0.1323 231.08)` | same | Accent (blue-cyan ~#4FC3F7) |
| `--secondary` | `oklch(0.3717 0.0392 257.29)` | `oklch(0.2795 0.0368 260.03)` | Secondary surfaces |
| `--muted` | `oklch(0.9683 0.0069 247.90)` | `oklch(0.2795 0.0368 260.03)` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.5544 0.0407 257.42)` | `oklch(0.7107 0.0351 256.79)` | Secondary text |
| `--destructive` | `oklch(0.6368 0.2078 25.33)` | `oklch(0.4437 0.1613 26.90)` | Errors, destructive actions |
| `--border` | `oklch(0.9288 0.0126 255.51)` | `oklch(0.2795 0.0368 260.03)` | Borders, dividers |
| `--ring` | `oklch(0.7528 0.1323 231.08)` | same | Focus rings |

### Primary Hue

`231°` — a cool blue-cyan. Never changes between themes. All accents derive from this hue:

- `primary` at full chroma (0.1323)
- `primary/10`, `primary/20`, etc. via opacity for badges, pills, backgrounds
- `ring` matches primary for unified focus indicators
- Chart colors maintain blue as dominant (chart-1, chart-2) with green (chart-3: `149.58°`) and warm accents (chart-4/5) as contrast

**Rule:** Primary is the single source of accent. Do not add a second accent color. No warm accents as UI color (only in charts).

### Surface hierarchy

```
background (page) → card (elevated) → popover (modal/dropdown) → sidebar
```

Dark mode inverts the hierarchy: card/popover/sidebar are lighter than the dark background.

---

## 2. Typography

### Font Stack

| Role | Font | Source |
|------|------|--------|
| Sans (body) | **Inter Variable** | `@fontsource-variable/inter` |
| Serif (display) | **Georgia** (system fallback) | Stack: `Georgia, serif` |
| Mono (code) | **JetBrains Mono** | `@fontsource/jetbrains-mono` |

### Tracking

`--tracking-normal: -0.01em` applied globally on `body`. Negative tracking gives text a tighter, more editorial feel at 16px.

Available via Tailwind (from old mock, extend if needed):
```
tracking-tighter  → -0.06em
tracking-tight    → -0.035em
tracking-normal   → -0.01em   (default)
tracking-wide     → +0.015em
tracking-wider    → +0.04em
tracking-widest   → +0.09em
```

### Sizing Scale

| Tailwind | px | rem | Used for |
|----------|----|-----|----------|
| `text-xs` | 12 | 0.75 | Badges, timestamps, metadata |
| `text-sm` | 14 | 0.875 | Descriptions, secondary text |
| `text-base` | 16 | 1 | Body text (default) |
| `text-lg` | 18 | 1.125 | H3, card titles |
| `text-xl` | 20 | 1.25 | H2, page section titles |
| `text-2xl` | 24 | 1.5 | H1, page titles |
| `text-3xl` | 30 | 1.875 | Hero/display |

### Font Weight Usage

| Weight | CSS | Usage |
|--------|-----|-------|
| 400 (normal) | `font-normal` | Body, descriptions |
| 500 (medium) | `font-medium` | Labels, button text |
| 600 (semibold) | `font-semibold` | Card titles, headings |
| 700 (bold) | `font-bold` | Page titles, display text |

---

## 3. Spacing & Layout

### Base Unit

`--spacing: 0.25rem` (4px) — standard Tailwind scale.

### Layout Constants

| Element | Value | Notes |
|---------|-------|-------|
| Max content width | `max-w-[1400px]` | Global container |
| Header height | `h-18` (72px) | Fixed, `pt-14` offset in content |
| Sidebar width | `w-15` (60px) icon column | Sticky, vertical icon nav |
| Content padding (desktop) | `px-8` | Header |
| Content padding (inner) | `px-4` | Sidebar container |
| Content gap (sidebar to main) | `gap-6` | Horizontal spacing |

### Page Layout Template

```
<MainLayout>                          ← Shared via TanStack Router layout route
  <AppHeader />                       ← fixed, z-50, 72px
  <div class="flex-1 pt-14">
    <div class="mx-auto max-w-[1400px] px-4">   ← GLOBAL CONTAINER
      <div class="flex gap-6">
        <AppSidebar />                ← sticky, top-14, w-15
        <main class="flex-1 min-w-0 py-6">
          <Outlet />                  ← PAGE CONTENT (choose one pattern below)
        </main>
      </div>
    </div>
  </div>
  <AppFooter />
</MainLayout>
```

### Page Width Convention

Every page rendered inside `MainLayout`'s `<Outlet />` already sits within the `max-w-[1400px]` global container. Pages choose one of three content width patterns — never mix.

| Pattern | Outer wrapper | When to use | Pages |
|---------|--------------|-------------|-------|
| **Full-bleed** | no `max-w-*`, no `mx-auto` | Data-dense, feed-like, or immersive layouts. Content fills the entire `<main>` column. | `feed`, `explore` |
| **Narrow** | `max-w-2xl mx-auto px-4` | Reading-focused: post detail, settings, profile, notifications, saved. Best text-reader line length (~672px). | `post`, `profile`, `settings/*`, `saved`, `notifications`, `posts-new` |
| **Medium** | `max-w-3xl mx-auto px-4` | Grid layouts needing more horizontal space than narrow but not full width. | `groups`, `coming-soon`, corporate pages |

Rules:
- **`px-4`** always alongside `mx-auto` when using constrained widths.
- **Never** add a `max-w-*` on a page that uses full-bleed (it overrides the intent).
- **Never** nest `max-w-*` containers (MainLayout already provides the outer one).
- **Messages** is an exception: its internal grid (`grid-cols-[320px_1fr]`) manages its own width within a `max-w-4xl` shell.

### Vertical Rhythm

- Paragraph spacing: `space-y-4` (16px) between related elements
- Section spacing: `space-y-6` (24px) between groups
- Card padding: `p-6` (24px) inner padding
- Stack spacing in cards: `space-y-1.5` (6px) between title/description

---

## 4. Shadows

8-level system. Same spread (`8px Y, 20px blur`) in light mode; heavier in dark (`10px Y, 25px blur`).

| Token | Light opacity | Dark opacity | Usage |
|-------|--------------|--------------|-------|
| `shadow-2xs` | 0.03 | 0.20 | Most subtle depth |
| `shadow-xs` | 0.03 | 0.20 | — |
| `shadow-sm` | 0.05 + 0.05 | 0.40 + 0.40 | Standard cards |
| `shadow` | 0.05 + 0.05 | 0.40 + 0.40 | Card default (`Card` component) |
| `shadow-md` | 0.05 + 0.05 | 0.40 + 0.40 | Elevated elements |
| `shadow-lg` | 0.05 + 0.05 | 0.40 + 0.40 | Modals |
| `shadow-xl` | 0.05 + 0.05 | 0.40 + 0.40 | Dropdowns |
| `shadow-2xl` | 0.13 | 1.00 | Search dialog, highest layer |

**Note:** Light-mode shadows are subtle (`hsl(0 0% 0% / 0.03–0.13)`). Dark-mode shadows are heavy (`/ 0.20–1.00`) to create depth on dark backgrounds. The spread consists of two layers: a wide soft shadow + a tighter harder shadow for dimensionality.

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px (0.25rem) | Inputs, small badges |
| `radius-md` | 6px (0.375rem) | Default buttons |
| `radius-lg` | 8px (0.5rem) | Cards, dialogs — the base radius |
| `radius-xl` | 12px (0.75rem) | Search dialog, sheets |

Base `--radius: 0.5rem` (8px). Full circles (`rounded-full`) used for sidebar nav icons, avatar, action buttons in header.

---

## 6. Component System

### shadcn/ui (New York style)

28 primitives in `src/components/ui/` — all Radix-based wrappers from shadcn/ui New York:

```
accordion  avatar  badge  button  card  checkbox  dialog
dropdown-menu  form  input  input-otp  label  popover
progress  radio-group  scroll-area  select  separator
sheet  skeleton  sonner  switch  tabs  textarea  tooltip
```

### Component Conventions

- **Forward refs** with `React.forwardRef` for all primitives
- **`cn()`** utility (`clsx` + `tailwind-merge`) for all class composition
- **`asChild` pattern** from Radix Slot for polymorphic composition
- **Variants** via `class-variance-authority` (see `buttonVariants`, only Button uses CVA so far)
- **Display names** set via `.displayName`
- **`cursor-pointer`** on all interactive elements (`button`, `[role="button"]`, `a[href]`) — applied globally in `@layer base`

### Button Variants

| Variant | Style |
|---------|-------|
| `default` | `bg-primary text-primary-foreground shadow` |
| `destructive` | `bg-destructive text-destructive-foreground shadow-sm` |
| `outline` | `border border-input bg-background shadow-sm` |
| `secondary` | `bg-secondary text-secondary-foreground shadow-sm` |
| `ghost` | Transparent, hover accent |
| `link` | `text-primary underline-offset-4 hover:underline` |

Button sizes: `default` (h-9, px-4), `sm` (h-8, px-3, text-xs), `lg` (h-10, px-8), `icon` (h-9 w-9).

### Card Anatomy

```
<Card>                    ← border, rounded-xl, bg-card, shadow
  <CardHeader>            ← flex-col, space-y-1.5, p-6
    <CardTitle />         ← font-semibold, leading-none, tracking-tight
    <CardDescription />   ← text-sm, text-muted-foreground
  </CardHeader>
  <CardContent>           ← p-6, pt-0
    ...
  </CardContent>
  <CardFooter>            ← flex, items-center, p-6, pt-0
</Card>
```

### Dialog Anatomy

```
<Dialog>
  <DialogTrigger />
  <DialogContent>         ← fixed centered, sm:rounded-lg, p-6
    <DialogHeader />      ← text-center/sm:text-left
      <DialogTitle />
      <DialogDescription />
    <DialogHeader />
    ... body ...
    <DialogFooter />
    <DialogClose />       ← X button top-right
  </DialogContent>
</Dialog>
```

---

## 7. Composer Surface Presets

Post composer background colors. Applied via class:

```
.composer-surface-mist      ← cool blue gradient
.composer-surface-dawn      ← warm orange gradient
.composer-surface-lavender  ← purple gradient
.composer-surface-paper     ← neutral subtle gradient
```

Each preset has both light and dark variants. Dark variants are lower-chroma versions of the same hue.

In the old mock, these are component-scoped via `data-composer-preset` attribute with full CSS variable overrides for foreground, muted, primary, border, input, accent. The current app uses class-based approach. When porting, prefer the attribute approach for scoped variable isolation.

---

## 8. Responsive Breakpoints

Uses default Tailwind breakpoints:

| Breakpoint | Min width | Notes |
|------------|-----------|-------|
| `sm` | 640px | Tablet portrait |
| `md` | 768px | Tablet landscape |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Max content |

The layout collapses at `md` — sidebar becomes optional/overlay on smaller screens.

---

## 9. Dark Mode

Class-based dark mode via `next-themes` (new) or `ThemeProvider` (mock).

- HTML class `.dark` triggers all dark variable overrides
- Variant defined as `@custom-variant dark (&:is(.dark *))`
- Three-state toggle: light → dark → system
- Both themes are fully specified, no inherited values

---

## 10. Animation

### Dialog / Sheet

Radix data-state animations built into shadcn primitives:

```
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=open]:fade-in-0
data-[state=closed]:fade-out-0
data-[state=open]:zoom-in-95
data-[state=closed]:zoom-out-95
data-[state=open]:slide-in-from-left-1/2
data-[state=closed]:slide-out-to-left-1/2
```

### Skeleton

Tailwind-based `animate-pulse` for loading states.

### Toasts (sonner)

`sonner` with `richColors` + `closeButton`. Success icon: green (`oklch(0.55 0.15 145)`), error: `--destructive`, info: `--primary`.

---

## 11. Icons

**Lucide** via `lucide-react` — the only icon library. Import individual icons, never the whole library. Size convention:

| Context | Size |
|---------|------|
| Sidebar nav | `!size-6` (24px) |
| Header actions | `!size-[22px]` (22px) |
| Inline with text | `h-4 w-4` (16px) |
| Button icons | `h-4 w-4` with `gap-2` |
| Menu items | `mr-2 h-4 w-4` |

---

## 12. Form Patterns

- **react-hook-form** + **zod** for all forms
- `@hookform/resolvers/zod` for schema integration
- `Form` shadcn wrapper (uses Radix Label + FormField context)
- `InputOTP` for OTP entry (6-digit with `input-otp`)
- `react-day-picker` for date picking
- Standard submit: `handleSubmit(onSubmit)` with `toast.success()`

---

## 13. i18n

- **i18next** + **react-i18next** with localStorage detection
- Two locales: `en.json`, `tr.json` in `src/i18n/`
- All user-facing strings go through `useTranslation()` / `t('key')`
- Layout keys: `header.*`, `nav.*`, `search.*`, `settings.*`, `onboarding.*`, `feed.*`, etc.

---

## 14. Rich Text (Lexical)

- **`@lexical/react`** for composer integration
- **`@lexical/html`** for JSON ↔ HTML serialization
- **`@lexical/hashtag`** plugin for medical tag support
- **`MmRichEditor`** component wraps Lexical with toolbar (bold/italic/underline/lists)
- Post content stored as Lexical JSON state + plain text extract

### Composer flow

```
PostComposer
  tool: media upload (dropzone / button)
  tool: file attachments
  tool: evidence dialog (source type picker)
  tool: visibility picker
  tool: reply policy picker
  tool: background preset picker
  MmRichEditor (Lexical)
```

---

## 15. Zustand Store

Single store (`ui-store.ts`) persisted to localStorage:

```ts
interface UIStore {
  sidebarOpen: boolean
  activeProfileId: string | null
  composerOpen: boolean
}
```

---

## 16. Key Conventions

### Class Merging

Always use `cn()` from `@/lib/utils` — never raw `clsx` or template literals.

### Import Order

1. React / framework
2. Third-party libraries (alphabetical)
3. shadcn UI components (`@/components/ui/*`)
4. App components (`@/components/*`)
5. Hooks / stores / lib
6. Types
7. i18n (last)

### File Naming

- Components: `kebab-case.tsx`
- Pages (routes): `route-name.tsx` (file inside `src/routes/*/`)
- Hooks: `use-hook-name.ts`
- Stores: `store-name.ts`

### Type Naming

- Interfaces: `PascalCase` — `Profile`, `Post`, `Comment`
- No `I` prefix
- Enums modeled as TypeScript union types (`AccountKind`, `PostType`)

---

## 17. Differences: Current vs Old Mock

| Aspect | Current (`apps/web`) | Old Mock (`mediamedicine-mock/mm`) |
|--------|---------------------|------------------------------------|
| Router | TanStack Router | Next.js App Router (file-system) |
| shadcn style | New York | Default |
| Serif font | Georgia (system) | Lora (next/font) |
| Layout rendering | Client-side routes | Server components + async data |
| Sidebar | Static icon array | Dynamic from active profile |
| Composer surfaces | CSS classes | `data-composer-preset` attribute with scoped CSS vars |
| Tracking variants | `--tracking-normal` only | Full `tighter`–`widest` spectrum |
| Auth | Simulated (mock) | Real Supabase `getUser()` + redirect |
| Account switching | Dropdown menu only | `GlobalPresenceProvider` + full account selector |
| Top loader | None | `nextjs-toploader` |

When building new pages, match the **current app's** stack (TanStack Router, Vite, shadcn New York). The mock's additional design tokens (tracking variants, scoped composer variables) are safe to adopt — they don't conflict with existing tokens.

---

## 18. Design Decisions (Explicit)

- **No custom CSS** unless absolutely required. Tailwind utilities + `cn()` for everything.
- **No `any` TypeScript types** — prefer `unknown` with type guards.
- **No hard-coded colors** — always use CSS variable tokens (`bg-primary`, `text-muted-foreground`).
- **No static pixel values** for layout — use Tailwind's spacing scale.
- **Single accent color** — primary blue-cyan. No secondary accent hue.
- **Gradient blobs** on auth/onboarding pages only (`.dark` variants provided).
- **Scrollbar gutter** set to `stable` to prevent layout shift on dialog open.
