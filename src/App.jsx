import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Services from './components/Services.jsx'
import MapSection from './components/MapSection.jsx'
import Technicians from './components/Technicians.jsx'
import AppSection from './components/AppSection.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <>
      <div className="blueprint-bg" />
      <div className="grain" />
      <Navbar />
      <main>
        <Hero />
        <Services />
        <MapSection />
        <Technicians />
        <AppSection />
        <Contact />
        <Footer />
      </main>
    </>
  )
}
