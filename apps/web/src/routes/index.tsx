import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { MainLayout } from '@/components/layout/main-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { PublicLayout } from '@/components/layout/public-layout'

// Pages
import { AboutPage } from '@/routes/public/about'
import { PrivacyPage } from '@/routes/public/privacy'
import { TermsPage } from '@/routes/public/terms'
import { LoginPage } from '@/routes/auth/login'
import { VerifyPage } from '@/routes/auth/verify'
import { OnboardingTypePage } from '@/routes/onboarding/type'
import { OnboardingProfilePage } from '@/routes/onboarding/profile'
import { OnboardingSpecialtiesPage } from '@/routes/onboarding/specialties'
import { FeedPage } from '@/routes/app/feed/page'
import { ExplorePage } from '@/routes/app/explore/page'
import { ProfilePage } from '@/routes/app/profile/page'
import { PostDetailPage } from '@/routes/app/posts/page'
import { GroupsPage } from '@/routes/app/groups/page'
import { MessagesPage } from '@/routes/app/messages/page'
import { MessagesConversationPage } from '@/routes/app/messages/conversation'
import { NotificationsPage } from '@/routes/app/notifications/page'
import { SavedPage } from '@/routes/app/saved/page'
import { SettingsIndexPage } from '@/routes/app/settings/index'
import { SettingsProfilePage } from '@/routes/app/settings/profile'
import { SettingsNotificationsPage } from '@/routes/app/settings/notifications'
import { GroupDetailPage } from '@/routes/app/g/page'
import { GroupMembersPage } from '@/routes/app/g/members'
import { GroupSettingsPage } from '@/routes/app/g/settings'
import { GroupModerationPage } from '@/routes/app/groups/moderation'
import { CreateGroupPage } from '@/routes/app/groups/new'
import { ComingSoonPage, HelpPage } from '@/routes/app/coming-soon'

// Root route
const rootRoute = createRootRoute({
  component: Outlet,
})

// Public layout routes
const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_public',
  component: PublicLayout,
})

const publicHomeRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/feed' })
  },
})

const corporateLayoutRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/corporate',
  component: Outlet,
})

const aboutRoute = createRoute({
  getParentRoute: () => corporateLayoutRoute,
  path: '/about',
  component: AboutPage,
})

const privacyRoute = createRoute({
  getParentRoute: () => corporateLayoutRoute,
  path: '/privacy',
  component: PrivacyPage,
})

const termsRoute = createRoute({
  getParentRoute: () => corporateLayoutRoute,
  path: '/terms',
  component: TermsPage,
})

// Auth layout routes
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_auth',
  component: AuthLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/auth/login',
  component: LoginPage,
})

const verifyRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/auth/verify',
  component: VerifyPage,
})

// Onboarding routes (also auth layout)
const onboardingTypeRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/onboarding/type',
  component: OnboardingTypePage,
})

const onboardingProfileRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/onboarding/profile',
  component: OnboardingProfilePage,
})

const onboardingSpecialtiesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/onboarding/specialties',
  component: OnboardingSpecialtiesPage,
})

// App layout routes
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  component: MainLayout,
})

const feedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/feed',
  component: FeedPage,
})

const exploreRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/explore',
  component: ExplorePage,
})

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username',
  component: ProfilePage,
})

const postDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/posts/$postId',
  component: PostDetailPage,
})

const groupsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/groups',
  component: GroupsPage,
})

const groupDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/g/$slug',
  component: GroupDetailPage,
})

const groupMembersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/g/$slug/members',
  component: GroupMembersPage,
})

const groupSettingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/g/$slug/settings',
  component: GroupSettingsPage,
})

const groupModerationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/groups/moderation',
  component: GroupModerationPage,
})

const createGroupRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/groups/new',
  component: CreateGroupPage,
})

const messagesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/messages',
  component: MessagesPage,
})

const messagesConversationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/messages/$conversationId',
  component: MessagesConversationPage,
})

const notificationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/notifications',
  component: NotificationsPage,
})

const savedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/saved',
  component: SavedPage,
})

const settingsLayoutRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: SettingsIndexPage,
})

const settingsProfileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/profile',
  component: SettingsProfilePage,
})

const settingsNotificationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/notifications',
  component: SettingsNotificationsPage,
})

// Help route (placeholder)
const helpRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/help',
  component: HelpPage,
})

const coursesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/courses',
  component: () => <ComingSoonPage titleKey="nav.courses" />,
})

const articlesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/articles',
  component: () => <ComingSoonPage titleKey="nav.articles" />,
})

const journalsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/journals',
  component: () => <ComingSoonPage titleKey="nav.journals" />,
})

const consultationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/consultations',
  component: () => <ComingSoonPage titleKey="nav.consultations" />,
})

const eventsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/events',
  component: () => <ComingSoonPage titleKey="nav.events" />,
})

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([
    publicHomeRoute,
    corporateLayoutRoute.addChildren([aboutRoute, privacyRoute, termsRoute]),
  ]),
  authLayoutRoute.addChildren([
    loginRoute,
    verifyRoute,
    onboardingTypeRoute,
    onboardingProfileRoute,
    onboardingSpecialtiesRoute,
  ]),
  appLayoutRoute.addChildren([
    feedRoute,
    exploreRoute,
    profileRoute,
    postDetailRoute,
    groupsRoute,
    groupDetailRoute,
    groupMembersRoute,
    groupSettingsRoute,
    groupModerationRoute,
    createGroupRoute,
    coursesRoute,
    articlesRoute,
    journalsRoute,
    consultationsRoute,
    eventsRoute,
    messagesRoute,
    messagesConversationRoute,
    notificationsRoute,
    savedRoute,
    settingsLayoutRoute,
    settingsProfileRoute,
    settingsNotificationsRoute,
    helpRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
