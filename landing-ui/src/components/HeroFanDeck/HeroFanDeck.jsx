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
    title: 'Fee Transparency',
    subtitle: 'No Hidden Charges',
    category: 'Verified Data',
    accent: '#3b82f6',
    stat: 'Real Semester Fees',
    image: '/hero/ranking.jpg',
    instituteId: null,
    description: 'Published prospectuses routinely omit laboratory dues, exam surcharges, and security deposits. EduHub exposes the full per-semester cost breakdown — tuition, laboratory development fees, and available merit or need-based endowments.'
  },
  {
    id: 'feature_decoupled',
    title: 'Decoupled Integration',
    subtitle: 'Zero Data Surrender',
    category: 'API Architecture',
    accent: '#f59e0b',
    stat: 'HMAC-SHA256 Webhooks',
    image: '/hero/records.jpg',
    instituteId: null,
    description: 'Institutions keep their internal ERP — SAP, Oracle, local SQL — and receive validated student admission payloads via encrypted HMAC-SHA256 webhooks. EduHub holds zero read permissions on internal records. No migration required.'
  },
  {
    id: 'hero_eduhub_platform',
    title: 'EduHub IMS',
    subtitle: 'Multi-Tenant Cloud ERP',
    category: 'Core Platform',
    accent: '#10b981',
    stat: '120,000+ Active Students',
    isCrown: true,
    image: '/hero/campus_platform.jpg',
    instituteId: null,
    description: 'A full-stack, multi-tenant Institute Management System spanning five governance tiers: Super Admin, Institute Admin, Campus Branch Manager, Faculty, and Student. Attendance, GPA, fee vouchers, timetables, and diaries — unified.'
  },
  {
    id: 'feature_fee_lifecycle',
    title: 'Fee & Billing Engine',
    subtitle: 'KuickPay & 1Link Ready',
    category: 'Financial Operations',
    accent: '#6366f1',
    stat: 'Cryptographic Vouchers',
    image: '/hero/students.jpg',
    instituteId: null,
    description: 'Batch-generate semester and monthly fee vouchers with cryptographically unique invoice numbers compatible with KuickPay, 1Link, and local banking switches. Real-time collection dashboard: Total Expected vs. Paid vs. Overdue Arrears.'
  },
  {
    id: 'feature_alumni',
    title: 'Alumni Career Tracking',
    subtitle: 'Verified Placement Data',
    category: 'Public Intelligence',
    accent: '#8b5cf6',
    stat: 'Employer-Verified Profiles',
    image: '/hero/alumni.jpg',
    instituteId: null,
    description: 'Institutions advertise placement rates without verifiable data. EduHub catalogs verified alumni profiles: employer names, functional roles, corporate badges, and graduation year — providing transparent career outcome data for prospective students.'
  },
  {
    id: 'feature_diary',
    title: 'Digital Academic Diary',
    subtitle: 'Daily Classroom Log',
    category: 'Classroom Delivery',
    accent: '#e11d48',
    stat: 'Parent Broadcast Ready',
    image: '/hero/events.jpg',
    instituteId: null,
    description: 'Instructors log lecture topics, assign homework tasks, and attach external resources daily. Students receive an aggregated chronological feed. Parents stay informed in real time — eliminating paper diaries and informal messaging groups entirely.'
  }
];

export default function HeroFanDeck({ onGetStarted, navigate }) {
  const [isFanned, setIsFanned] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const hoverTimerRef = useRef(null);

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

  const handleCardHover = (index) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (index !== null) {
      setHoveredIndex(index);
    } else {
      hoverTimerRef.current = setTimeout(() => {
        setHoveredIndex(null);
      }, 75);
    }
  };

  // 3D Parallax tilt on mouse movement
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setMouseTilt({
      x: x * 5, // subtle rotateY
      y: -y * 3.5  // subtle rotateX
    });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredIndex(null);
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
    <section className="hero-fan-container" id="features">
      {/* Ambient Radial Illumination */}
      <div className="hero-ambient-glow" />

      {/* Category Announcement Badge */}
      <div className="hero-top-badge" onClick={handleReplay} title="Click to replay card unfurl animation">
        <span className="badge-pulse" />
        <span>CORE PLATFORM PILLARS · 7 INTEGRATED MODULES</span>
      </div>

      {/* Contextual Section Headline */}
      <motion.h2 
        className="hero-headline"
        initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="headline-light">Everything you need to</span> <br />
        <span className="headline-bold headline-highlight">run a world-class institution.</span>
      </motion.h2>

      {/* ─── The Grand Fan Deck Stage (0.6s – 1.6s bloom) ─── */}
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
            rotateX: mouseTilt.y
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >


          {/* ─── 7-Card Fan Arc Deck ─── */}
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
              onSelect={handleCardClick}
            />
          ))}
        </motion.div>
      </div>

      {/* Subtitle Description */}
      <motion.p 
        className="hero-subtitle"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        Explore the seven core pillars powering admissions, accredited programs, verified student records, dynamic rankings, and global alumni networks. Click any card to inspect its module.
      </motion.p>

      {/* Action Buttons */}
      <motion.div 
        className="hero-actions"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <button 
          className="hero-btn-primary"
          onClick={() => onGetStarted && onGetStarted()}
        >
          <span>Register Campus</span>
          <ArrowRight size={18} weight="bold" />
        </button>

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
                  style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={16} weight="bold" />
                </button>
                <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: selectedCard.accent, fontWeight: 700 }}>
                    {selectedCard.category}
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '4px 0 0' }}>
                    {selectedCard.title}
                  </h3>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
                  {selectedCard.description}
                </p>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-heading)', background: 'var(--border-light)', padding: '6px 12px', borderRadius: 8 }}>
                    <Sparkle size={14} color="var(--primary)" weight="fill" />
                    <span>{selectedCard.subtitle}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-heading)', background: 'var(--border-light)', padding: '6px 12px', borderRadius: 8 }}>
                    <Star size={14} color="#f59e0b" weight="fill" />
                    <span>{selectedCard.stat}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button 
                    className="hero-btn-primary" 
                    style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}
                    onClick={() => {
                      setSelectedCard(null);
                      if (selectedCard.instituteId && navigate) {
                        navigate(`/institute/${selectedCard.instituteId}`);
                      } else {
                        onGetStarted();
                      }
                    }}
                  >
                    <span>{selectedCard.instituteId ? 'View Institute' : 'Get Started'}</span>
                    <ArrowRight size={16} weight="bold" />
                  </button>

                  {selectedCard.id === 'hero_eduhub_platform' && (
                    <a
                      href={getManagementLoginUrl()}
                      className="hero-btn-secondary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      title="Open EduHub Management Portal"
                    >
                      <span>Sign In to Portal</span>
                      <ArrowUpRight size={16} weight="bold" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
