import { Nav } from '@/components/Nav'
import { HomeContent } from '@/components/sections/HomeContent'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px', minHeight: '100vh' }}>
      <Nav />
      <div style={{ paddingTop: 'var(--s7)', position: 'relative', overflow: 'hidden' }}>
        <HomeContent />
      </div>
      <Footer />
    </main>
  )
}
