import { useParams } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileHeader } from '@/components/profile/profile-header'
import { PostFeed } from '@/components/feed/post-feed'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, GraduationCap, MapPin } from 'lucide-react'
import { mockCurrentUser, mockProfiles, mockPosts } from '@/lib/mock-data'

export function ProfilePage() {
  const { username } = useParams({ from: '/_app/u/$username' })
  const profile =
    username === mockCurrentUser.slug
      ? mockCurrentUser
      : mockProfiles.find((p) => p.slug === username) ?? mockCurrentUser

  const isCurrentUser = profile.id === mockCurrentUser.id
  const userPosts = mockPosts.filter((p) => p.author.id === profile.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <ProfileHeader profile={profile} isCurrentUser={isCurrentUser} />

      <div className="mt-4">
        <Tabs defaultValue="posts">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">Gönderiler</TabsTrigger>
            <TabsTrigger value="media" className="flex-1">Medya</TabsTrigger>
            <TabsTrigger value="liked" className="flex-1">Beğenilenler</TabsTrigger>
            <TabsTrigger value="about" className="flex-1">Hakkında</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {userPosts.length > 0 ? (
              <PostFeed showComposer={false} posts={userPosts} />
            ) : (
              <EmptyState
                title="Henüz gönderi yok"
                description="Bu kullanıcı henüz bir şey paylaşmamış."
              />
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <EmptyState title="Medya bulunamadı" description="Paylaşılan medya içeriği yok." />
          </TabsContent>

          <TabsContent value="liked" className="mt-4">
            <PostFeed showComposer={false} posts={mockPosts.slice(0, 3)} />
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {profile.specialty && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Uzmanlık</p>
                      <p className="text-sm font-medium">{profile.specialty}</p>
                    </div>
                  </div>
                )}
                {profile.institution && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Kurum</p>
                      <p className="text-sm font-medium">{profile.institution}</p>
                    </div>
                  </div>
                )}
                {profile.bio && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Hakkında</p>
                      <p className="text-sm">{profile.bio}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
