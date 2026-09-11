import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import GetStartedModal from '@/components/GetStartedModal';

// New Huge-style components
import HeroHuge from '@/components/landing/HeroHuge';
import DynamicMission from '@/components/landing/DynamicMission';
import ExplosionParallax from '@/components/landing/ExplosionParallax';
import AlumniShowcase from '@/components/landing/AlumniShowcase';
import HugeStackingCards from '@/components/landing/HugeStackingCards';
import SolutionsHoverGrid from '@/components/landing/SolutionsHoverGrid';
import FooterHuge from '@/components/landing/FooterHuge';

export default function LandingPage({ onGetStarted, isDark, setIsDark }) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <div className="relative w-full overflow-x-hidden min-h-screen bg-[#fafbfc] text-slate-900 transition-colors duration-500">
      {/* Floating Dynamic Navbar */}
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        onGetStarted={handleOpenGetStarted}
      />

      {/* Hero Section: 3D Abstract Object */}
      <div id="home">
        <HeroHuge onGetStarted={handleOpenGetStarted} />
      </div>

      {/* Morphing Text Mission Section */}
      <DynamicMission />

      {/* Alumni Showcase Section (3rd Section) */}
      <div id="alumni">
        <AlumniShowcase />
      </div>

      {/* Exploding Cards Parallax Section */}
      <ExplosionParallax />

      {/* Stacking Case Studies (Now Rankings) */}
      <div id="rankings">
        <HugeStackingCards />
      </div>

      {/* Grid with Hover Reveals */}
      <div id="solutions">
        <SolutionsHoverGrid />
      </div>

      {/* Massive Typography Footer */}
      <FooterHuge />

      {/* Get Started Modal */}
      <GetStartedModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
