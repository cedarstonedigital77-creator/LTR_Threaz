import { useState, useEffect } from 'react'
import GrainOverlay from './components/GrainOverlay'
import CustomCursor from './components/CustomCursor'
import ScrollProgress from './components/ScrollProgress'
import Preloader from './components/Preloader'
import Hero from './components/Hero'
import MarqueeSection from './components/MarqueeSection'
import Collection from './components/Collection'
import About from './components/About'
import Filmstrip from './components/Filmstrip'
import Manifesto from './components/Manifesto'
import Footer from './components/Footer'

export default function App() {
  const [preloaderDone, setPreloaderDone] = useState(false)

  useEffect(() => {
    document.body.classList.add('preloader-active')
    return () => document.body.classList.remove('preloader-active')
  }, [])

  const handlePreloaderComplete = () => {
    setPreloaderDone(true)
    document.body.classList.remove('preloader-active')
  }

  return (
    <>
      <GrainOverlay />
      <CustomCursor />
      <ScrollProgress />
      {!preloaderDone && <Preloader onComplete={handlePreloaderComplete} />}

      <main
        aria-hidden={!preloaderDone}
        style={{
          opacity: preloaderDone ? 1 : 0,
          transition: 'opacity 400ms ease',
          overflowX: 'hidden',   /* prevents marquee rotation bleed on mobile */
        }}
      >
        <Hero />

        <div style={{ position: 'relative', zIndex: 1, background: '#0A0A0A', overflowX: 'hidden' }}>
          <div style={{ padding: '32px 0' }}>
            <MarqueeSection />
          </div>

          <Collection />
          <About />
          <Filmstrip />
          <Manifesto />
          <Footer />
        </div>
      </main>
    </>
  )
}
