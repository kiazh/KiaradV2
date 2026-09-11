import { HomeContent } from '@/components/sections/HomeContent'
import { Footer } from '@/components/Footer'

// Regenerate the page on the same cadence as the Destiny player data so the
// pre-rendered HTML never carries a stale raid/clear count for long.
export const revalidate = 600

export default function Home() {
  return (
    <div className="page-with-sidebar">
      <main style={{ maxWidth: '640px', width: '100%', padding: '0 24px', minHeight: '100vh' }}>
        <div style={{ paddingTop: 'var(--s7)', position: 'relative', overflow: 'hidden' }}>
          <HomeContent />
        </div>
        <Footer />
      </main>
    </div>
  )
}
