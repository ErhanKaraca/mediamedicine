import { useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type StoryItem = {
  id: string
  name: string
  imageUrl?: string
  avatarUrl?: string
  link?: string
}

const storyItems: StoryItem[] = [
  { id: 's1', name: 'Cem Yılmaz', imageUrl: 'https://images.unsplash.com/photo-1513384312027-9fa69a360337?auto=format&fit=crop&w=400&q=60', avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=120&q=60', link: '/u/cemyilmaz' },
  { id: 's2', name: 'Levent Balkan', imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=60', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=60', link: '/u/leventbalkan' },
  { id: 's3', name: 'Elif Kaya', imageUrl: 'https://images.unsplash.com/photo-1516900557549-41557d405adf?auto=format&fit=crop&w=400&q=60', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=60', link: '/u/elifkaya' },
  { id: 's4', name: 'Umut Sevin', imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=400&q=60', avatarUrl: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=120&q=60', link: '/u/umutsevin' },
  { id: 's5', name: 'Muzaffer T.', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=60', avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=120&q=60', link: '/u/muzaffert' },
  { id: 's6', name: 'Ayşe Yılmaz', imageUrl: 'https://images.unsplash.com/photo-1516900557549-41557d405adf?auto=format&fit=crop&w=400&q=60', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=60', link: '/u/ayseyilmaz' },
  { id: 's7', name: 'Can Öztürk', imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=400&q=60', avatarUrl: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=120&q=60', link: '/u/canozturk' },
  { id: 's8', name: 'Zeynep Şahin', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=60', avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=120&q=60', link: '/u/zeynepsahin' },
]

function StoryCard({ item }: { item: StoryItem }) {
  const navigate = useNavigate()
  const go = () => {
    if (item.link) navigate({ to: item.link as never })
  }
  return (
    <article
      onClick={go}
      className="group relative h-48 w-[132px] shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted cursor-pointer"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div className="size-full bg-gradient-to-br from-primary/25 via-primary/10 to-muted" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute left-2 top-2 rounded-full border-[3px] border-primary p-[2px] bg-background/70 backdrop-blur-sm">
        <Avatar className="size-9">
          {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.name} />}
          <AvatarFallback className="text-[10px] font-semibold">
            {item.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="absolute bottom-2 left-2 right-2">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-white drop-shadow-sm">
          {item.name}
        </p>
      </div>
    </article>
  )
}

export function StoryStrip() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  return (
    <div className="relative group/strip">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {storyItems.map((item) => (
          <div key={item.id} className="snap-start shrink-0">
            <StoryCard item={item} />
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('left')}
        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 hidden size-9 rounded-full border border-border bg-background/90 shadow-sm opacity-0 group-hover/strip:opacity-100 transition-opacity md:inline-flex hover:bg-background"
        aria-label="Previous"
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('right')}
        className="absolute right-1 top-1/2 -translate-y-1/2 z-10 hidden size-9 rounded-full border border-border bg-background/90 shadow-sm opacity-0 group-hover/strip:opacity-100 transition-opacity md:inline-flex hover:bg-background"
        aria-label="Next"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
