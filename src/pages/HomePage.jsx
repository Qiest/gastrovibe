// src/pages/HomePage.jsx
import { useEffect, useRef } from 'react'
import Hero from '../components/Hero'
import StatsBar from '../components/StatsBar'
import ExperienceBadges from '../components/ExperienceBadges'
import FeaturedSection from '../components/FeaturedSection'
import DiscoveryCarousel from '../components/DiscoveryCarousel'
import BlogSection from '../components/BlogSection'
import MapTeaser from '../components/MapTeaser'

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <ExperienceBadges />
      <FeaturedSection />
      <DiscoveryCarousel />
      <BlogSection />
      <MapTeaser />
    </>
  )
}
