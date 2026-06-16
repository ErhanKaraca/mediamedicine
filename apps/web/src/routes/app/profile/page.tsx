import { useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { ProfileHeader } from '@/components/profile/profile-header'
import { PostFeed } from '@/components/feed/post-feed'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Building2, GraduationCap, Info, Calendar, Heart, ImageIcon } from 'lucide-react'
import { mockCurrentUser, mockProfiles, mockPosts } from '@/lib/mock-data'

export function ProfilePage() {
  const { username } = useParams({ from: '/_app/u/$username' })
  const { t } = useTranslation()
  const profile =
    username === mockCurrentUser.slug
      ? mockCurrentUser
      : mockProfiles.find((p) => p.slug === username) ?? mockCurrentUser

  const isCurrentUser = profile.id === mockCurrentUser.id
  const userPosts = mockPosts.filter((p) => p.author.id === profile.id)
  const hasMedia = userPosts.some((p) => (p.media?.length ?? 0) > 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-6">
      <ProfileHeader profile={profile} isCurrentUser={isCurrentUser} />

      <Tabs defaultValue="posts">
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1">{t('profile.posts')}</TabsTrigger>
          <TabsTrigger value="media" className="flex-1">{t('profile.media')}</TabsTrigger>
          <TabsTrigger value="liked" className="flex-1">{t('profile.liked')}</TabsTrigger>
          <TabsTrigger value="about" className="flex-1">{t('profile.about')}</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          {userPosts.length > 0 ? (
            <PostFeed showComposer={false} posts={userPosts} />
          ) : (
            <EmptyState
              icon={Info}
              title={t('profile.noPostsYet')}
              description={t('profile.noPostsDesc')}
            />
          )}
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          {hasMedia ? (
            <PostFeed showComposer={false} posts={userPosts} />
          ) : (
            <EmptyState
              icon={ImageIcon}
              title="Media"
              description="No media content shared yet."
            />
          )}
        </TabsContent>

        <TabsContent value="liked" className="mt-4">
          <PostFeed showComposer={false} posts={mockPosts.slice(0, 3)} />
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card>
            <CardContent className="p-4 flex flex-col gap-4">
              {profile.bio && (
                <div className="flex items-start gap-3">
                  <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium">{t('profile.about')}</span>
                    <p className="text-sm leading-relaxed">{profile.bio}</p>
                  </div>
                </div>
              )}
              {profile.specialty && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium">{t('profile.specialty')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{profile.specialty}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 font-normal">
                        {t('profile.professional')}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              {profile.institution && (
                <div className="flex items-center gap-3">
                  <Building2 className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium">{t('profile.institution')}</span>
                    <p className="text-sm font-medium">{profile.institution}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground font-medium">{t('profile.joinedDate')}</span>
                  <p className="text-sm font-medium">January 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
