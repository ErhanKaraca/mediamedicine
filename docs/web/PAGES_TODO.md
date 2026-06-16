# Pages TODO

Current web app (`apps/web`): **22 route paths** (14 real pages + 8 placeholders).
Reference (`mediamedicine-mock/mm` — Next.js 15 App Router): **~105 URL paths** with full implementations.

All pages below exist in the reference but are missing from the current app. Priority based on core social features first, then LMS/telemedicine/ecommerce.

## Legend

| Symbol | Meaning |
|--------|---------|
| ★ | Core social — needed for MVP |
| ◆ | Content/LMS — medical education |
| ● | Commerce — payments/checkout |
| ▲ | Settings/Admin |

---

## 1. Core Social Features (★)

| Path | Priority | Reference Location | What It Does |
|------|----------|-------------------|--------------|
| `/search` | ★★★ | `(main)/search/page.tsx` | Full-text search with filters, content type tabs, recent searches |
| `/posts/new` | ★★★ | `(main)/posts/new/page.tsx` | Dedicated post creation page (composer is modal-only currently) |
| `/g/[slug]` (currently coming-soon) | ★★★ | `(main)/groups/[slug]` | Group detail page — posts, members, info — empty placeholder in mock too |
| `/groups/moderation` | ★★ | `(main)/groups/moderation/page.tsx` | Moderation queue for group admins |
| `/accounts` | ★★ | `(main)/accounts/page.tsx` | Account/profile switcher dashboard — list all owned pages/profiles |
| `/accounts/new` | ★★ | `(main)/accounts/new/page.tsx` | Create new profile/page wizard |
| `/accounts/new/company` | ★★ | `(main)/accounts/new/company/page.tsx` | Company account creation |
| `/accounts/new/group` | ★★ | `(main)/accounts/new/group/page.tsx` | Group account creation |
| `/accounts/admin` | ★★ | `(main)/accounts/admin/page.tsx` | Admin panel for platform staff |
| `/accounts/applications/[applicationId]` | ★★ | `(main)/accounts/applications/[applicationId]/page.tsx` | Professional upgrade application review |
| `/mm/[slug]` | ★★★ | `(main)/mm/[slug]/page.tsx` | Page/public-figure profile (not user profile — `/u/[username]` already exists) |
| `/mm/[slug]/members` | ★★ | `(main)/mm/[slug]/members/page.tsx` | Page members list |
| `/mm/[slug]/settings` | ★★ | `(main)/mm/[slug]/settings/page.tsx` | Page settings |
| `/auth/error` | ★★ | `auth/error/page.tsx` | OAuth error screen |

---

## 2. Articles (◆)

| Path | Reference Location | What It Does |
|------|-------------------|--------------|
| `/articles` | `(main)/articles/page.tsx` | Article listing/browse with categories |
| `/articles/[slug]` | `(main)/articles/[slug]/page.tsx` | Full article detail with rich content |
| `/articles/compose` | `(main)/articles/compose/page.tsx` | Article creation/edit with rich editor |
| `/articles/my-articles` | `(main)/articles/my-articles/page.tsx` | User's authored articles |

---

## 3. Courses / LMS (◆)

| Path | Reference Location | What It Does |
|------|-------------------|--------------|
| `/courses` | `(main)/courses/page.tsx` | Course catalog with categories/search |
| `/courses/[slug]` | `(main)/courses/[slug]/page.tsx` | Course landing page |
| `/courses/[slug]/lessons/[lessonId]` | `(main)/courses/[slug]/lessons/[lessonId]/page.tsx` | Lesson/lecture player with video |
| `/courses/[slug]/qa` | `(main)/courses/[slug]/qa/page.tsx` | Course Q&A forum |
| `/courses/[slug]/qa/[threadId]` | `(main)/courses/[slug]/qa/[...threadId]/page.tsx` | Q&A thread detail |
| `/courses/[slug]/reviews` | `(main)/courses/[slug]/reviews/page.tsx` | Course reviews/ratings |
| `/courses/[slug]/settings` | `(main)/courses/[slug]/settings/page.tsx` | Course settings dashboard |
| `/courses/[slug]/settings/analytics` | `(main)/courses/[slug]/settings/analytics/page.tsx` | Course analytics |
| `/courses/[slug]/settings/co-instructors` | `(main)/courses/[slug]/settings/co-instructors/page.tsx` | Co-instructor management |
| `/courses/[slug]/settings/reviews` | `(main)/courses/[slug]/settings/reviews/page.tsx` | Review management |
| `/courses/[slug]/settings/submissions` | `(main)/courses/[slug]/settings/submissions/page.tsx` | Assignment submissions |
| `/courses/[slug]/settings/subtitles` | `(main)/courses/[slug]/settings/subtitles/page.tsx` | Subtitle management |
| `/courses/categories/[slug]` | `(main)/courses/categories/[slug]/page.tsx` | Courses filtered by category |
| `/courses/manage` | `(main)/courses/manage/page.tsx` | Instructor's course management hub |
| `/courses/manage/analytics` | `(main)/courses/manage/analytics/page.tsx` | Cross-course analytics |
| `/courses/my-courses` | `(main)/courses/my-courses/page.tsx` | Student's enrolled courses |
| `/courses/my-courses/assignments` | `(main)/courses/my-courses/assignments/page.tsx` | Student's assignments |
| `/courses/my-courses/certificates` | `(main)/courses/my-courses/certificates/page.tsx` | Student's certificates |
| `/courses/[slug]/checkout/cancel` | (commerce) | Checkout cancellation |
| `/courses/[slug]/checkout/success` | (commerce) | Checkout success |

---

## 4. Consultations / Telemedicine (◆)

| Path | Reference Location | What It Does |
|------|-------------------|--------------|
| `/consultations` | `(main)/consultations/page.tsx` | Browse available consultants |
| `/consultations/[username]` | `(main)/consultations/[username]/page.tsx` | Consultant profile detail |
| `/consultations/manage` | `(main)/consultations/manage/page.tsx` | Manage consultations (provider) |
| `/consultations/session/[bookingId]` | `(main)/consultations/session/[bookingId]/page.tsx` | Live consultation session with Zoom |
| `/consultations/checkout/cancel` | (commerce) | Checkout cancellation |
| `/consultations/checkout/success` | (commerce) | Checkout success |

---

## 5. Events / Webinars (◆)

| Path | Reference Location | What It Does |
|------|-------------------|--------------|
| `/events` | `(main)/events/page.tsx` | Event calendar/browse |
| `/events/[slug]` | `(main)/events/[slug]/page.tsx` | Event landing/detail page |
| `/events/[slug]/lobby` | `(main)/events/[slug]/lobby/page.tsx` | Live event lobby |
| `/events/[slug]/manage` | `(main)/events/[slug]/manage/page.tsx` | Event management dashboard |
| `/events/[slug]/manage/panelists` | `(main)/events/[slug]/manage/panelists/page.tsx` | Panelist management |
| `/events/[slug]/manage/registrations` | `(main)/events/[slug]/manage/registrations/page.tsx` | Registration list |
| `/events/[slug]/manage/sessions` | `(main)/events/[slug]/manage/sessions/page.tsx` | Session scheduling |
| `/events/[slug]/manage/sponsors` | `(main)/events/[slug]/manage/sponsors/page.tsx` | Sponsor management |
| `/events/[slug]/manage/tickets` | `(main)/events/[slug]/manage/tickets/page.tsx` | Ticket types/pricing |
| `/events/[slug]/manage/promo-codes` | `(main)/events/[slug]/manage/promo-codes/page.tsx` | Promo code management |
| `/events/[slug]/manage/zoom` | `(main)/events/[slug]/manage/zoom/page.tsx` | Zoom integration settings |
| `/events/[slug]/exhibition` | `(main)/events/[slug]/exhibition/page.tsx` | Virtual exhibition hall |
| `/events/[slug]/exhibition/[sponsorSlug]` | `(main)/events/[slug]/exhibition/[sponsorSlug]/page.tsx` | Sponsor booth detail |
| `/events/[slug]/sponsor/[sponsorSlug]/inbox` | `(main)/events/[slug]/sponsor/[...sponsorSlug]/inbox/page.tsx` | Sponsor message inbox |
| `/events/new` | `(main)/events/new/page.tsx` | Create new event |
| `/events/my` | `(main)/events/my/page.tsx` | User's registered/created events |

---

## 6. Journals / Peer Review (◆)

| Path | Reference Location | What It Does |
|------|-------------------|--------------|
| `/journals` | `(main)/journals/page.tsx` | Journal catalog browse |
| `/journals/[slug]` | `(main)/journals/[slug]/page.tsx` | Journal landing page |
| `/journals/[slug]/dashboard` | `(main)/journals/[slug]/dashboard/page.tsx` | Editorial dashboard |
| `/journals/[slug]/dashboard/members` | `(main)/journals/[slug]/dashboard/members/page.tsx` | Editor/reviewer management |
| `/journals/[slug]/dashboard/volumes` | `(main)/journals/[slug]/dashboard/volumes/page.tsx` | Volume/issue management |
| `/journals/[slug]/submit` | `(main)/journals/[slug]/submit/page.tsx` | Manuscript submission |
| `/journals/[slug]/review/[id]` | `(main)/journals/[slug]/review/[id]/page.tsx` | Peer review interface |
| `/journals/create` | `(main)/journals/create/page.tsx` | Create new journal |

---

## 7. Settings & Account (▲)

| Path | Reference Location | What It Does |
|------|-------------------|--------------|
| `/settings/account` | `(main)/settings/account/page.tsx` | Account-level settings (email, password, delete account, privacy) |

---

## 8. Onboarding (★)

| Path | Reference Location | What It Does |
|------|-------------------|--------------|
| `/onboarding` | `onboarding/page.tsx` | Onboarding intro/welcome |
| `/onboarding/interests` | `onboarding/interests/page.tsx` | Interest/specialty selection (current app calls it `/onboarding/specialties`) |
| `/onboarding/follows` | `onboarding/follows/page.tsx` | Suggested people to follow |
| `/onboarding/kyc` | `onboarding/kyc/page.tsx` | KYC document upload (professional upgrade) |

---

## 9. Utility Pages

| Path | Reference Location | What It Does |
|------|-------------------|--------------|
| `/icd/[code]` | `(main)/icd/[code]/page.tsx` | ICD-11 code browser/reference |
| `/certificates/[number]` | `(main)/certificates/[number]/page.tsx` | Certificate verification/display |
| `/search` | `(main)/search/page.tsx` | Global search with FTS (high priority) |

---

## 10. Appendix: Routes Already Covered

These exist in the current app. No action needed:

- `/` → redirects to `/feed`
- `/feed`
- `/explore`
- `/auth/login`
- `/auth/verify`
- `/onboarding/type`
- `/onboarding/profile`
- `/onboarding/specialties`
- `/corporate/about`
- `/corporate/privacy`
- `/corporate/terms`
- `/u/$username` (user profile)
- `/posts/$postId` (post detail)
- `/groups` (group listing)
- `/messages`
- `/messages/$conversationId`
- `/notifications`
- `/saved`
- `/settings`
- `/settings/profile`
- `/settings/notifications`
- `/help` (currently coming-soon)

## Summary

| Area | Missing Pages | Notes |
|------|---------------|-------|
| **Core Social** | 12 | Search, post creation, page profiles, group moderation, accounts admin |
| **Articles** | 4 | Browse, detail, compose, my-articles |
| **Courses** | 19 | Full LMS — catalog, lessons, Q&A, instructor dashboard, certificates |
| **Consultations** | 6 | Booking, session with Zoom, management |
| **Events** | 17 | Full event management — creation, lobby, sponsors, tickets, exhibition |
| **Journals** | 8 | Submission, peer review, editorial workflow |
| **Settings** | 1 | Account-level settings |
| **Onboarding** | 3 | Welcome, interests (merged with specialties), follows, KYC |
| **Utility** | 3 | ICD-11 browser, certificate verification |

**Total missing: ~70+ pages** (depending on how many sub-routes are bundled)
**Total existing: 22 routes** (14 real + 8 placeholders)
