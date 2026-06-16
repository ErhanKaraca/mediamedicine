# User Experience

---

## 1. Product Vision

**One-liner:** The social platform for the medical world.

**What it does:** A professional social network where healthcare practitioners share evidence-based content, discuss clinical cases, publish articles, teach courses, host events, and collaborate — all within a verified, regulated environment.

**What it is not:** Generic social media. Not Facebook for doctors. An operating system for medical professional life — feed + learning + publishing + telemedicine + events, unified by a single identity.

---

## 2. Target Audiences

### Primary: Healthcare Professionals (Turkey-first, then global)

| Segment | Size (est.) | Need | Willing to pay for |
|---------|-------------|------|--------------------|
| Practicing physicians (specialist/GP) | ~180K TR | CME credits, peer discussion, journal access, case consults | Courses, event tickets, journal subscriptions |
| Residents & interns | ~80K TR | Mentorship, exam prep, case libraries | Courses (discounted), study groups |
| Dentists | ~40K TR | Specialty groups, referral network | Events, consultations |
| Pharmacists | ~50K TR | Drug interaction discussions, formulary updates | Sponsored content, courses |
| Nurses & midwives | ~250K TR | Clinical guidelines, protocols, community | Free tier with premium courses |
| Medical students | ~100K TR | Study materials, specialty exploration, mentorship | Courses, certification prep |
| Academicians / researchers | ~30K TR | Peer review, journal publishing, citation tracking | Journal hosting, article processing |

### Secondary: Institutions & Organizations

| Segment | Need | Platform role |
|---------|------|---------------|
| Hospitals & clinics | Corporate page, institutional communication, recruitment | Page profile, job postings |
| Medical associations | Member communication, event hosting, guideline publishing | Group + events + journals |
| Pharmaceutical companies | CME sponsorship, product education, compliant engagement | Sponsored events, exhibition halls |
| Medical faculties / universities | Course hosting, student management, certificate issuance | Course creation, LMS |

### Tertiary: Individual Users (Health-conscious public)

| Segment | Need | Restrictions |
|---------|------|--------------|
| Patients & caregivers | Follow experts, read health content, find specialists | Cannot post medically (read-only for professional content) |
| Health journalists / writers | Source expert commentary, research articles | Professional tier with special badge |
| Medical device / health tech | Network with clinicians, product demos | Page profile, limited posting |

---

## 3. User Types (Platform Taxonomy)

Derived from the database enum `account_kind` and the onboarding type selection screen:

| Type | Icon/Label | KYC Required? | Can Post? | Can Monetize? | Example |
|------|------------|---------------|-----------|---------------|---------|
| **User** (individual) | 👤 "Individual User" | No | Read-only for professional content; limited personal posting | No | Medical student browsing |
| **Professional** | ⚕️ "Healthcare Professional" | Yes (KYC) | Full posting with evidence citations | Yes — courses, consultations | Dr. Ayşe Yılmaz, cardiologist |
| **Page** | 🏢 "Institution / Clinic" | Yes (entity KYC) | Post as the institution | Yes — events, sponsored content | Acıbadem Hastanesi |

Internally, the system maps `professional` and `page` to `account_kind` values `professional` and `page`. The `user` kind is `user`. Platform staff (`platform_staff`) is orthogonal — any account kind can be staff.

### Profile Multiplicity

A single authenticated user can own or manage **multiple profiles**:

- 1 personal profile (required, created on signup)
- 0+ professional profiles (KYC required per profile)
- 0+ page profiles (entity KYC required per page)
- 0+ group memberships (not owned, but can switch context)

The **account switcher** (avatar dropdown in header) lets the user switch between profiles without re-authentication. The active profile determines what is posted, whose feed is shown, and what permissions apply.

---

## 4. Personas

### Persona A: Dr. Mehmet Demir — Practicing Specialist

| Attribute | Detail |
|-----------|--------|
| **Age** | 38 |
| **Role** | Cardiologist at a public hospital, Istanbul |
| **Tech comfort** | High (daily smartphone use, basic tablet for journals) |
| **Time budget** | 15 min reading, 5 min posting — during commute or break |
| **Goals** | Stay current with ESC guidelines, discuss complex cases with peers, earn CME credits |
| **Pain points** | Too many journals to follow, no central place for case discussion, CME is expensive/hard to find |
| **Platform use** | Feed browsing (daily), post case with evidence (weekly), comment on peers' posts (daily), attend paid webinar (monthly) |
| **KYC status** | Verified professional — uploaded medical license + specialty certificate |
| **Key i18n strings** | `"Share evidence-based content"`, `"Healthcare Professional"`, evidence dialog with DOI/PMID |

### Persona B: Elif Kaya — Medical Student (Year 5)

| Attribute | Detail |
|-----------|--------|
| **Age** | 23 |
| **Role** | Medical student at Hacettepe University, Ankara |
| **Tech comfort** | Very high (native digital, active on multiple platforms) |
| **Time budget** | Flexible — studies in bursts, checks feed during breaks |
| **Goals** | Explore specialties, find mentors, study resources, prepare for exams |
| **Pain points** | Unclear which specialty fits, no structured mentorship, exam materials scattered |
| **Platform use** | Browse feed (daily), follow specialists (weekly), enroll in study courses (monthly), join specialty groups |
| **KYC status** | Individual user (no KYC) — read-only for professional content |
| **Conversion path** | Free user → follows professionals → gets value → pays for exam prep course → eventually upgrades to professional after graduation |
| **Key i18n strings** | `"Individual User"`, `"Explore"`, `"Specialties"`, onboarding specialty selection |

### Persona C: Prof. Dr. Ali Varlık — Academician / Department Head

| Attribute | Detail |
|-----------|--------|
| **Age** | 55 |
| **Role** | Professor of Neurology, editor at a national journal |
| **Tech comfort** | Moderate (uses email, browses journals on desktop) |
| **Time budget** | Blocks of 30-60 min for deep work |
| **Goals** | Publish journal issues, manage peer review, host academic events, share research |
| **Pain points** | Journal management is manual email hell, no integrated peer review system |
| **Platform use** | Manage journal dashboard (weekly), review submissions (bi-weekly), host events (quarterly), post research (monthly) |
| **KYC status** | Verified professional |
| **Key features** | Journals module, event creation, course creation, article composer |

### Persona D: Zeynep Şahin — Hospital Communications Director

| Attribute | Detail |
|-----------|--------|
| **Age** | 34 |
| **Role** | Marketing & communications at a private hospital chain |
| **Tech comfort** | High (manages multiple social accounts, CMS) |
| **Goals** | Increase hospital visibility, recruit physicians, promote health campaigns |
| **Pain points** | No medical-specific social platform, generic ads have low ROI |
| **Platform use** | Manage page profile (daily), create event for health campaign (monthly), sponsored content (quarterly) |
| **Account type** | Page profile (corporate) + employee accounts with posting roles |
| **Key features** | Page creation + membership management, event sponsorship, article publishing |

### Persona E: Dr. Can Öztürk — Early-Career GP / Rural

| Attribute | Detail |
|-----------|--------|
| **Age** | 29 |
| **Role** | General practitioner at a small town clinic |
| **Tech comfort** | Medium (smartphone, basic apps) |
| **Time budget** | Limited — squeezed between patient appointments |
| **Goals** | Quick access to guidelines, tele-consult with specialists, affordable CME |
| **Pain points** | Isolation from academic centers, expensive travel for conferences, hard to get specialist opinion |
| **Platform use** | Read feed (daily), post cases for consult (weekly), book tele-consultation (monthly) |
| **KYC status** | Verified professional |
| **Key features** | Consultations module, ICD-11 browser, evidence-cited posts, mobile-first |

---

## 5. User Journey Map

### New User: Registration → First Value

```
STAGE 1: DISCOVERY                           STAGE 2: SIGNUP                          STAGE 3: ONBOARDING
┌──────────────────────┐                    ┌──────────────────────┐                  ┌──────────────────────┐
│                      │                    │                      │                  │                      │
│  Sees platform via   │                    │  Enters email         │                  │  Step 1: Account     │
│  colleague referral, │ ─── landing ───▶   │  OTP sent to inbox    │ ─── verify ──▶  │  type selection       │
│  social media, or    │    page            │  6-digit code         │     email       │  (user/pro/page)      │
│  journal ad          │                    │                      │                  │                      │
│                      │                    │                      │                  │  Step 2: Profile      │
│  Tagline: "The       │                    │                      │                  │  setup (name,         │
│  platform for        │                    │                      │                  │  username, bio)       │
│  healthcare          │                    │                      │                  │                      │
│  professionals"      │                    │                      │                  │  Step 3: Specialty    │
│                      │                    │                      │                  │  selection (1-5)      │
└──────────────────────┘                    └──────────────────────┘                  └──────────────────────┘
                                                                                              │
                                                                                              ▼
                        ┌──────────────────────────────────────────────────────────────────────────┐
                        │                          FEED — FIRST SESSION                           │
                        │                                                                          │
                        │  Welcome tour highlights: search bar, composer, sidebar navigation         │
                        │  Feed shows: suggested professionals + popular posts in selected           │
                        │  specialties + trending topics + groups to join                           │
                        │                                                                          │
                        │  Suggested actions: follow 3+ people, join 1 group, or just scroll        │
                        │                                                                          │
                        │  ⚡ First value moment: sees a post relevant to their specialty             │
                        │     with cited evidence they can use in practice                          │
                        └──────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────────────────────────────────────────────────────────────┐
                        │                          RETENTION LOOP                                  │
                        │                                                                          │
                        │  DAILY: Scroll feed, like/comment (2-5 min)                               │
                        │  WEEKLY: Post clinical case or article (5-10 min)                         │
                        │  MONTHLY: Engage with course, consultation, event (30+ min)               │
                        │                                                                          │
                        │  Notifications drive return: likes, comments, follows, mentions, events   │
                        └──────────────────────────────────────────────────────────────────────────┘
```

### Account Upgrade (User → Professional)

```
Individual User (free)                                    Healthcare Professional (verified)
┌───────────────────┐                                    ┌────────────────────────────┐
│  Can browse feed   │  ── sees "Upgrade to Pro" ──▶    │  Can post with evidence    │
│  Read-only for     │      CTA on composer, profile,     │  Full visibility options   │
│  professional      │      settings                      │  Course/consultation       │
│  content           │                                    │  creation                  │
│  Cannot post       │  KYC flow:                         │  Journal submission        │
│                    │  1. Upload license                 │  ICD-11 browser            │
│                    │  2. Upload specialty cert           │  Verified badge            │
│                    │  3. Selfie verification             │                            │
│                    │  4. Admin review (1-3 days)         │                            │
└───────────────────┘                                    └────────────────────────────┘
```

---

## 6. Key User Flows

### Flow 1: Feed Browsing

```
Open app → Feed loads (paginated, cursor-based)
  ├─ Post card: author avatar + name, timestamp, content, media, actions bar
  │   Actions: Like, Comment, Repost, Save, Share, Report
  │   Evidence: badge indicator → tap → show citation sources
  │   Visibility badge: Public / Followers / Professionals only
  │
  ├─ Sidebar shows: trending topics, suggested people, featured groups
  │
  ├─ Header search: tap → modal with smart search ( @people, #hashtags, icd/codes )
  │
  └─ Infinite scroll → loading skeleton → more posts
```

### Flow 2: Post Creation

```
Tap composer (floating or inline)

1. Write content in Lexical rich text editor
   - Hashtags: #topic → autocomplete
   - Mentions: @user → autocomplete
   - Evidences: tap + button → dialog
     └─ Source type picker (publication/guideline/book/url/opinion...)
     └─ Identifier (DOI/PMID/ISBN/NCT...)
     └─ Title, year, optional link

2. Add media: image(s) or video → grid preview
3. Add file attachment: PDF/DOCX/XLSX → download link
4. Set background preset: Mist / Dawn / Lavender / Paper
5. Set visibility: Public / Followers / Professionals only / Group
6. Set reply policy: Everyone / Followers / Mentioned only
7. Tap "Post" → optimistically appears in feed

Post creation is also available as a dedicated page at /posts/new
for longer-form content (not just the composer modal).
```

### Flow 3: Account Switching

```
Header avatar dropdown opens:

┌──────────────────────────────────┐
│  Aktif profil:                   │
│  Dr. Mehmet Demir   ⚕️ Pro      │  ← current active profile
│  @drmehmet                       │
│  "Kişisel Profil"               │
├──────────────────────────────────┤
│                                  │
│  Cardiology Clinic   🏥 Page     │  ← other owned profiles
│  Page • Sahibi                   │
│                                  │
│  Kardiyoloji Derneği  👥 Group   │
│  Group • Yönetici                │
│                                  │
├──────────────────────────────────┤
│  ➕ Yeni sayfa/grup oluştur      │
│  ⚙️ Ayarlar                     │
└──────────────────────────────────┘

Tap any profile → POST /api/profiles/switch
  → verifies membership
  → updates active_profile_id cookie
  → clears all query caches
  → refreshes layout with new identity

The switch is instant (no page reload in SPA).
All subsequent API calls use the new active profile.
```

### Flow 4: KYC / Professional Upgrade

```
Settings → Account Type → "Upgrade to Professional"
  ┌─────────────────────────────────────┐
  │  1. Select case type                │
  │     Physician / Dentist / Pharmacist│
  │     Nurse / Other                   │
  │                                     │
  │  2. Upload documents                │
  │     [Medical License] 📎 PDF/PNG    │
  │     [Specialty Certificate] 📎      │
  │     [Identification] 📎             │
  │                                     │
  │  3. Review & submit                 │
  │     Consent to data processing      │
  │     "Submit for review"             │
  │                                     │
  │  4. Status: Under Review (1-3 days) │
  │     Notification on approval        │
  └─────────────────────────────────────┘

Post-submission:
  - Profile shows "Verification pending" badge
  - Staff reviews via moderation dashboard
  - On approval: account_kind → professional, verified flag set
  - Notification + email sent to user
```

### Flow 5: Messaging

```
Navigation: Messages icon in header → /messages

Inbox view (left panel):
  ┌────────────────────────────────────────┐
  │  Search conversations...               │
  │                                         │
  │  Dr. Ayşe Yılmaz    ● "Thanks for..."  │  ← unread indicator
  │  2m ago                                 │
  │                                         │
  │  Prof. Ali Varlık   "Makalenizi..."    │
  │  1h ago                                 │
  │  ...                                    │
  └────────────────────────────────────────┘

Conversation view (right panel):
  ┌────────────────────────────────────────┐
  │  Dr. Ayşe Yılmaz          ⓘ Details   │
  │  Online                                 │
  ├────────────────────────────────────────┤
  │  Dr. Mehmet: "ESC guidelines 2024'te    │
  │  yeni HF ilacı eklenmiş, gördün mü?"   │
  │                                         │
  │  Dr. Ayşe: "Evet, çok önemli bir        │
  │  değişiklik. Makaleni gördüm."          │
  │                                         │
  │  ┌─────────────────────────────────┐    │
  │  │ Type your message...    📎 📷 ▶ │    │
  │  └─────────────────────────────────┘    │
  └────────────────────────────────────────┘

Rules:
  - Only verified professionals can start conversations?
  - No, any authenticated user can message (based on `can_message()` RPC)
  - But read receipts only for mutual follows
  - File sharing via message-media bucket (25 MB, images + mp4)
```

### Flow 6: Group Interaction

```
Navigation: Sidebar → Groups → /groups

Discover view:
  ┌────────────────────────────────────────┐
  │  My Groups (3)         [Show all]      │
  │  ┌─────────────────────────────────┐   │
  │  │ Kardiyoloji Tartışma Grubu      │   │
  │  │  1.2k members · Public          │   │
  │  │  Son paylaşım: 2s önce          │   │
  │  └─────────────────────────────────┘   │
  │                                         │
  │  Discover                              │
  │  ┌──────┐ ┌──────┐ ┌──────┐           │
  │  │ Acil  │ │Radyo │ │Çocuk │           │
  │  │ Tıp   │ │loji  │ │Sağ.  │           │
  │  │ 3.4k  │ │ 890  │ │ 2.1k │           │
  │  └──────┘ └──────┘ └──────┘           │
  │  [🔍 Search groups]                    │
  └────────────────────────────────────────┘

Group detail (/groups/[slug]):
  - Group header: name, member count, join button, specialty tags
  - Feed tab: group posts only
  - Members tab: list with roles
  - About tab: description, rules, moderators

Join policies:
  - Open: one-click join
  - Request: application → moderator approves
  - Invite-only: existing members invite
```

---

## 7. Search Experience

Smart search accessible from header pill (click) or keyboard shortcut `/`.

```
Search modes (entered in a single input):

  @drmehmet         → search profiles/users
  mm/kardiyoloji    → search groups/pages     (mm = mediamedicine)
  #kalinbasli       → search hashtags
  icd/I21           → ICD-11 code lookup
  free text         → full-text search across posts, profiles, groups

Search results show in categories:
  ┌────────────────────────────────────────┐
  │  @ People                  [See all]   │
  │  ┌────────────────────────────────┐    │
  │  │ Dr. Mehmet Demir   Follow     │    │
  │  │ Cardiologist · 1.2k followers  │    │
  │  └────────────────────────────────┘    │
  │                                         │
  │  mm/ Groups               [See all]   │
  │  ┌────────────────────────────────┐    │
  │  │ Kardiyoloji Forum             │    │
  │  │ 3.4k members · Public         │    │
  │  └────────────────────────────────┘    │
  │                                         │
  │  Posts                    [See all]   │
  │  - "Yeni ESC guideline..."            │
  │  - "Hipertansiyonda beta bloker..."    │
  └────────────────────────────────────────┘
```

---

## 8. UX Principles

| Principle | Application |
|-----------|-------------|
| **Evidence-first** | Post composer has a dedicated "Add source" button. Evidence badges on posts are prominent. The platform's differentiator is cited, verifiable medical content. |
| **Verified trust** | Professional profiles show a verification badge. KYC is required for posting. Unverified users are readers, not creators. This establishes authority. |
| **Frictionless feed** | Infinite scroll, optimized for quick scanning (15 min sessions). Content is the hero — no algorithmic manipulation in v1. |
| **Context-preserving** | Account switching is instant. Search understands medical context (ICD-11 codes, specialty-aware autocomplete). |
| **Turkish-first, English-ready** | UI defaults to Turkish. EN/TR toggle available everywhere. Medical content may be in either language. |
| **Progressive disclosure** | Onboarding asks only what's necessary. Advanced features (evidences, visibility, reply policy) are available in the composer but don't clutter the default view. |
| **Mobile-responsive** | Layout collapses from 3-column (sidebar + feed + details) to single-column on mobile. Touch targets ≥ 44px. |
| **Notifications as return driver** | Like, comment, follow, mention, and event reminders drive daily return. Notification preferences fine-grained per event type. |

---

## 9. Content Moderation & Safety

| Feature | UX |
|---------|-----|
| Report post | Post overflow menu → "Report" → reason selection → anonymous |
| Block user | Profile → overflow menu → "Block" → mutual block enforced |
| Mute | Not implemented in v1 (post-feed filter instead) |
| Moderation queue | Staff dashboard at `/accounts/admin` (pending reports, flagged content) |
| Automated moderation | Content pipeline runs for media processing; no automated text moderation in v1 |

### Visibility Spectrum

Posts can be targeted from fully public to fully private:

```
Public                     Followers           Professionals       Private
  │                          │                     │                  │
  ▼                          ▼                     ▼                  ▼
  Anyone sees    Only followers              Only verified        Only the
  (searchable)   in feed                     pros in feed         author
```

---

## 10. Accessibility & Internationalization

- **i18n**: All user-facing strings via i18next. Current locales: `en`, `tr`.
- **RTL**: Not currently supported (medical RTL languages like Arabic/Persian are future).
- **Keyboard**: Search activated by `/` key. Esc closes modals. Tab navigation through all interactive elements.
- **Screen readers**: shadcn/ui Radix primitives have built-in ARIA attributes. Custom components must follow the same pattern.
- **Color contrast**: OKLCH palette tested for WCAG AA compliance. Primary blue-cyan on white passes. Dark mode uses inverted hierarchy.
- **Font size**: Base `16px` with `-0.01em` tracking. No user font scaling override in v1.
- **Motion**: Users who prefer reduced motion get `animate-none` via `prefers-reduced-motion` (Radix respects this by default).

---

## 11. Onboarding Flow Detail

```
Landing page → /auth/login
  ├─ Email input → OTP sent → /auth/verify
  │   └─ 6-digit code → verified → /onboarding/type
  │
  ├─ Google OAuth (coming soon)
  └─ Apple OAuth (coming soon)

/onboarding/type
  ├─ User       → /onboarding/profile → /onboarding/specialties → /feed
  ├─ Professional → /onboarding/profile → /onboarding/specialties
  │               → [later: KYC prompt] → /feed
  └─ Page        → [requires professional account] → /feed

Post-registration capabilities (locked until email verified):
  ❌ Post creation
  ❌ Comment
  ❌ Message
  ❌ Create page/group
  ✅ Browse feed
  ✅ Profile editing
  ✅ Avatar upload
```

---

## 12. Empty States

Every list view has a designed empty state:

| View | Empty state |
|------|-------------|
| Feed | "Welcome! Follow people and join groups to see posts here." |
| Saved | "No saved posts. Tap the bookmark icon on any post to save it." |
| Notifications | "No notifications yet. Your activity will appear here." |
| Messages | "No conversations yet. Start by messaging your colleagues." |
| Groups | "You haven't joined any groups yet. Discover groups to find your community." |
| Profile posts | "No posts yet. When this user shares something, it'll appear here." |
| Comments | "No comments yet. Be the first to share your thoughts." |
| Search | No results → "Try a different search term or browse popular topics." |

---

## 13. Conversion Points

| From | To | Trigger | Barrier |
|------|----|---------|---------|
| Individual User | Professional | "Post" button click — sees KYC prompt | Must upload license + certificate |
| Free user | Paid course | Course detail page → "Enroll" button | Payment |
| Free user | Paid event | Event detail page → "Register" button | Payment |
| Professional | Course creator | Settings → "Create Course" | Entitlement check |
| Professional | Consultant | Settings → "Enable Consultations" | Profile completeness + Zoom setup |
| Organization | Sponsor | Event page → "Sponsor this event" | Payment + approval |

KYC is the primary conversion gate — it transforms a passive reader into an active contributor. The composer CTA for unverified users says "Verify your account to share with the medical community" rather than just "Post".
