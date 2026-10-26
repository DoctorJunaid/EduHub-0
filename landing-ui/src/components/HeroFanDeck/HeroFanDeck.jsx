import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowUpRight,
  Play, 
  ArrowsClockwise, 
  Sparkle, 
  Star, 
  X 
} from '@phosphor-icons/react';
import { getManagementLoginUrl } from '@/config/urls';
import HeroCard from './HeroCard';
import './heroFanDeck.css';

const HERO_CARDS = [
  {
    id: 'feature_discovery',
    title: 'Institutional Discovery',
    subtitle: 'Verified Intelligence Engine',
    category: 'Discover',
    accent: '#10b981',
    stat: '50+ Verified Institutions',
    image: '/hero/universities.jpg',
    instituteId: null,
    description: 'Students navigate institutional selection without information deficits. EduHub aggregates HEC accreditation tiers, PEC Washington Accord alignments, QS World positions, and real graduate placement rates — all in one verified index.'
  },
  {
    id: 'feature_ranking',
    title: 'Ranking & Leaderboards',
    subtitle: 'Transparent Benchmarks',
    category: 'Leaderboard',
    accent: '#3b82f6',
    stat: 'National Leaderboard',
    image: '/hero/ranking.jpg',
    instituteId: null,
    description: 'Explore dynamic university and college rankings benchmarked across faculty-to-student ratios, research publications, modern lab infrastructure, and accredited degree completions.'
  },
  {
    id: 'feature_database',
    title: 'Unified Records Ledger',
    subtitle: 'Tamper-Proof Profiles',
    category: 'Database',
    accent: '#f59e0b',
    stat: 'Centralized Registry',
    image: '/hero/records.jpg',
    instituteId: null,
    description: 'A shared institutional ledger tracking student transcripts, certified diplomas, and faculty credentials across national institutions with cryptographic validation.'
  },
  {
    id: 'hero_eduhub_platform',
    title: 'Live Network & Services',
    subtitle: 'Campus Operating System',
    category: 'Live Network',
    accent: '#10b981',
    stat: '100% Real-Time Cloud',
    isCrown: true,
    image: '/hero/campus_platform.jpg',
    instituteId: null,
    description: 'The core operating engine coordinating admissions, semester timetables, secure fee challan generation, online assignment submissions, and student-teacher collaborations.'
  },
  {
    id: 'feature_student_manage',
    title: 'Student Lifecycle',
    subtitle: 'Track & Empower',
    category: 'Administration',
    accent: '#6366f1',
    stat: 'Holistic Profiles',
    image: '/hero/students.jpg',
    instituteId: null,
    description: 'Monitor student performance, manage classes, and utilize practical web labs to ensure academic success.'
  },
  {
    id: 'feature_alumni',
    title: 'Alumni Network',
    subtitle: 'Community & Connections',
    category: 'Community',
    accent: '#8b5cf6',
    stat: 'Global Reach',
    image: '/hero/alumni.jpg',
    instituteId: null,
    description: 'Keep graduates engaged with exclusive networking events, career history tracking, and continuous learning.'
  },
  {
    id: 'feature_events',
    title: 'Upcoming Events',
    subtitle: 'Campus Activities',
    category: 'Events',
    accent: '#e11d48',
    stat: 'Stay Updated',
    image: '/hero/events.jpg',
    instituteId: null,
    description: 'Stay up to date with the latest seminars, conferences, and student activities across all campus branches.'
  }
];

const MOBILE_HERO_CARDS = [
  {
    id: 'feature_database',
    title: 'Unified Records Ledger',
    subtitle: 'TAMPER-PROOF PROFILES',
    category: 'DATABASE',
    accent: '#f59e0b',
    stat: 'Centralized Registry',
    image: '/hero/records.jpg',
    description: 'A shared institutional ledger tracking student transcripts, certified diplomas, and faculty credentials across national institutions with cryptographic validation.'
  },
  {
    id: 'feature_ranking',
    title: 'Build Tomorrow',
    subtitle: 'STUDENT SUCCESS',
    category: 'LEADERSHIP',
    accent: '#3b82f6',
    stat: 'Student Success',
    image: '/hero/ranking.jpg',
    description: 'Explore dynamic university and college rankings benchmarked across faculty-to-student ratios, research publications, modern lab infrastructure, and accredited degree completions.'
  },
  {
    id: 'feature_discovery',
    title: 'Explore & Grow',
    subtitle: 'CAMPUS LIFE',
    category: 'DISCOVER',
    accent: '#10b981',
    stat: 'Campus Life',
    image: '/hero/universities.jpg',
    description: 'Students navigate institutional selection without information deficits. EduHub aggregates HEC accreditation tiers, PEC Washington Accord alignments, and real graduate placement rates.'
  }
];

export default function HeroFanDeck({ onGetStarted, navigate }) {
  const [isFanned, setIsFanned] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth
  );
  const stageRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  const isMobile = viewportWidth <= 768;
  const mobileOffset = viewportWidth < 360 ? 58 : viewportWidth < 410 ? 66 : 74;

  const managementLoginUrl = getManagementLoginUrl();

  // Trigger unfurl animation shortly after mount to replicate video entrance
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFanned(true);
    }, 450);
    const introTimer = setTimeout(() => {
      setIsIntroComplete(true);
    }, 2000);
    return () => {
      clearTimeout(timer);
      clearTimeout(introTimer);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  const handleCardHover = (index) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (index !== null) {
      setHoveredIndex(index);
    } else {
      hoverTimerRef.current = setTimeout(() => setHoveredIndex(null), 75);
    }
  };

  const handleMouseMove = (event) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouseTilt({ x: x * 5, y: -y * 3.5 });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredIndex(null);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - (touchStartYRef.current || 0);
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX < 0) {
        // Swiped left -> next card
        setActiveMobileIndex((prev) => (prev + 1) % 3);
      } else {
        // Swiped right -> prev card
        setActiveMobileIndex((prev) => (prev - 1 + 3) % 3);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Replay animation effect
  const handleReplay = () => {
    setIsFanned(false);
    setIsIntroComplete(false);
    setTimeout(() => {
      setIsFanned(true);
    }, 300);
    setTimeout(() => {
      setIsIntroComplete(true);
    }, 2000);
  };

  const handleCardClick = (card) => {
    if (card.instituteId && navigate) {
      navigate(`/institute/${card.instituteId}`);
    } else {
      setSelectedCard(card);
    }
  };

  return (
    <section className="hero-fan-container" id="top">
      {/* Ambient Radial Illumination */}
      <div className="hero-ambient-glow" />

      {/* Main Headline matching video phrasing & rhythm */}
      <motion.h1 
        className="hero-headline"
        initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <span className="headline-light">A place to empower your</span> <br />
        <span className="headline-bold text-gradient-emerald">academic future.</span>
      </motion.h1>

      {/* ─── Hero Deck Stage: 3D Stack on Mobile (<= 768px), Grand Fan Arc on Desktop ─── */}
      {isMobile ? (
        <>
          <div
            className="hero-mobile-deck-stage"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Soft Ambient Dots matching screenshot */}
            <div className="hero-mobile-ambient-dots" aria-hidden="true">
              <span className="ambient-dot dot-1" />
              <span className="ambient-dot dot-2" />
              <span className="ambient-dot dot-3" />
              <span className="ambient-dot dot-4" />
              <span className="ambient-dot dot-5" />
              <span className="ambient-dot dot-6" />
              <span className="ambient-dot dot-7" />
            </div>

            <div className="hero-mobile-deck-wrapper">
              {MOBILE_HERO_CARDS.map((card, cardIndex) => {
                let slot = 0;
                if (cardIndex === activeMobileIndex) {
                  slot = 0;
                } else if ((cardIndex - activeMobileIndex + 3) % 3 === 1) {
                  slot = 1;
                } else {
                  slot = -1;
                }

                const isCenter = slot === 0;
                const isLeft = slot === -1;
                const dynamicX = isCenter ? 0 : isLeft ? -mobileOffset : mobileOffset;
                const dynamicY = isCenter ? 0 : 15;
                const dynamicRotate = isCenter ? 0 : isLeft ? -7.5 : 7.5;
                const dynamicScale = isCenter ? 1 : 0.85;
                const dynamicZIndex = isCenter ? 30 : 12;
                const dynamicOpacity = isCenter ? 1 : 0.92;

                return (
                  <motion.div
                    key={card.id}
                    className={`hero-mobile-card-slot ${isCenter ? 'is-center' : isLeft ? 'is-left' : 'is-right'}`}
                    animate={{
                      x: dynamicX,
                      y: dynamicY,
                      rotate: dynamicRotate,
                      scale: dynamicScale,
                      opacity: dynamicOpacity,
                      zIndex: dynamicZIndex,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 280,
                      damping: 26,
                      mass: 0.85,
                    }}
                    onClick={() => {
                      if (isCenter) {
                        handleCardClick(card);
                      } else {
                        setActiveMobileIndex(cardIndex);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${card.title} - ${isCenter ? 'Active' : 'Select card'}`}
                  >
                    <div
                      className={`hero-mobile-card ${isCenter ? 'is-active-card' : ''}`}
                      style={{
                        '--card-accent': card.accent || '#10b981',
                      }}
                    >
                      {/* Artwork Image */}
                      <img
                        src={card.image}
                        alt={card.title}
                        className="hero-mobile-card-img"
                        loading="lazy"
                      />

                      {/* Dark Gradient Overlay */}
                      <div className="hero-mobile-card-overlay" />

                      {/* Top Sheen */}
                      <div className="hero-mobile-card-sheen" />

                      {/* Card Content Overlay */}
                      <div className="hero-mobile-card-content">
                        <div className="hero-mobile-card-top">
                          <span className="hero-mobile-card-tag">{card.category}</span>
                          {isCenter && (
                            <div className="hero-mobile-card-action-btn" title="View details">
                              <ArrowRight size={13} weight="bold" />
                            </div>
                          )}
                        </div>

                        <div className="hero-mobile-card-bottom">
                          {card.subtitle && (
                            <span className="hero-mobile-card-subtitle">{card.subtitle}</span>
                          )}
                          <h3 className="hero-mobile-card-title">{card.title}</h3>
                          <div className="hero-mobile-card-stat">
                            <span className="hero-stat-sparkle">✦</span>
                            <span>{card.stat}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ─── Modern Circled Pagination Dots Indicator (Responsive & Accessible) ─── */}
          <div className="hero-mobile-dots" role="tablist" aria-label="Hero cards pagination">
            {[0, 1, 2].map((dotIdx) => {
              const isActive = activeMobileIndex === dotIdx;
              const cardTitle = MOBILE_HERO_CARDS[dotIdx]?.title || `Card ${dotIdx + 1}`;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to slide ${dotIdx + 1}: ${cardTitle}`}
                  className={`hero-mobile-dot-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveMobileIndex(dotIdx)}
                >
                  <span className="hero-mobile-dot-circle" />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* ─── The Grand Fan Deck Stage for Desktop (> 768px) ─── */
        <div
          className="hero-deck-stage"
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            className="hero-deck-wrapper"
            animate={{
              rotateY: mouseTilt.x,
              rotateX: mouseTilt.y,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            {HERO_CARDS.map((card, index) => (
              <HeroCard
                key={card.id}
                card={card}
                index={index}
                totalCards={HERO_CARDS.length}
                isFanned={isFanned}
                isIntroComplete={isIntroComplete}
                hoveredIndex={hoveredIndex}
                onHover={handleCardHover}
                mobileLayout={false}
                onSelect={handleCardClick}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Subtitle Description */}
      <motion.p 
        className="hero-subtitle"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
      >
        Automate and unify your institution's operations—from student enrollment and interactive grading, to seamless fee management and deep analytics, all in one intelligent portal.
      </motion.p>

      {/* Dual Pill CTA Buttons matching video styling */}
      <motion.div 
        className="hero-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}
      >
        <button 
          className="hero-btn-primary"
          onClick={() => onGetStarted && onGetStarted()}
        >
          <span>Get Started</span>
          <ArrowRight size={18} weight="bold" />
        </button>

        <a
          href={managementLoginUrl}
          className="hero-btn-secondary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          title="Sign in to EduHub Management Portal"
        >
          <span>Sign In to Portal</span>
          <ArrowUpRight size={16} weight="bold" />
        </a>

        <button 
          className="hero-btn-secondary"
          onClick={() => {
            const el = document.getElementById('institutes');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Play size={18} weight="bold" />
          <span>Explore Campuses</span>
        </button>

        {/* Replay button to trigger the unfurl sensation */}
        <button 
          className="hero-btn-replay"
          onClick={handleReplay}
          title="Replay card unfurl animation"
        >
          <ArrowsClockwise size={18} weight="bold" />
        </button>
      </motion.div>

      {/* Quick Glance Modal for Center OS Card or Details */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div 
            className="hero-card-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCard(null)}
          >
            <motion.div 
              className="hero-card-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                <img 
                  src={selectedCard.image} 
                  alt={selectedCard.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)' }} />
                <button 
                  onClick={() => setSelectedCard(null)}
                  className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer absolute top-3 right-3 z-20 border border-white/20"
                  aria-label="Close card preview"
                >
                  <X size={18} weight="bold" />
                </button>
                <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: selectedCard.accent, fontWeight: 700 }}>
                    {selectedCard.category}
                  </span>
                  <h3 style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.4rem)', fontWeight: 800, color: '#fff', margin: '4px 0 0' }}>
                    {selectedCard.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 18px' }}>
                  {selectedCard.description}
                </p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-heading)', background: 'var(--border-light)', padding: '6px 12px', borderRadius: 10 }}>
                    <Sparkle size={14} color="var(--primary)" weight="fill" />
                    <span>{selectedCard.subtitle}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-heading)', background: 'var(--border-light)', padding: '6px 12px', borderRadius: 10 }}>
                    <Star size={14} color="#f59e0b" weight="fill" />
                    <span>{selectedCard.stat}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    className="hero-btn-primary w-full sm:flex-1 min-h-[44px] justify-center text-sm" 
                    onClick={() => {
                      const card = selectedCard;
                      setSelectedCard(null);
                      if (card.instituteId && navigate) {
                        navigate(`/institute/${card.instituteId}`);
                      } else {
                        onGetStarted();
                      }
                    }}
                  >
                    <span>{selectedCard.instituteId ? 'View Institute' : 'Get Started'}</span>
                    <ArrowRight size={16} weight="bold" />
                  </button>

                  <a
                    href={managementLoginUrl}
                    className="hero-btn-secondary w-full sm:flex-1 min-h-[44px] justify-center text-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    title="Open EduHub Management Portal"
                  >
                    <span>Sign In to Portal</span>
                    <ArrowUpRight size={16} weight="bold" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
