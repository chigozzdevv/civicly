import React from 'react';
import Header from '@/components/header';
import HeroSection from '@/components/hero-section';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative bg-white">
      <Header />
      <HeroSection />
    </main>
  );
}