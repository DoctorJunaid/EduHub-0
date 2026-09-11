import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowUpRight, Search, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import FooterHuge from '@/components/landing/FooterHuge';
import { top_alumni, institutes } from '@/data/mockData';

// -------------------------------------------------------------
// Interactive Spring Parallax Card (Natural Color, Clean Pills)
// -------------------------------------------------------------
function AlumniParallaxCard({ alumnus, index, isHovered, onHover, onLeave, onClick, instituteName, instituteLogo }) {
  const cardRef = useRef(null);

  // Mouse position values for 3D spring tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Signature Huge smooth spring configuration
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // Transforms for image and content
  const imgX = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);
  const imgY = useTransform(smoothY, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    onLeave();
  };

  const opacity = isHovered === null ? 1 : isHovered === index ? 1 : 0.35;
  const scale = isHovered === index ? 1.02 : 1;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ opacity, scale }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200/80 hover:border-slate-300 min-h-[460px] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all"
    >
      {/* Background Subtle Hover Tint */}
      <motion.div 
        className="absolute inset-0 bg-slate-50/70 opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{ opacity: isHovered === index ? 1 : 0 }}
      />

      {/* Top Part: Image, Year & Identity */}
      <div className="relative z-20 pointer-events-none">
        <div className="flex justify-between items-start mb-6">
          {/* Natural Full Color Portrait */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md bg-slate-100 border border-slate-100 flex-shrink-0">
            <motion.img 
              src={alumnus.picture} 
              alt={alumnus.name}
              style={{ x: imgX, y: imgY, scale: 1.1 }}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {/* Clean Pill Styled like #01 National Rank */}
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
              {alumnus.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {alumnus.year}
            </span>
          </div>
        </div>

        <motion.h3 
          style={{ x: useTransform(smoothX, [-0.5, 0.5], [-5, 5]) }}
          className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 leading-[1.0] mb-2"
        >
          {alumnus.name}
        </motion.h3>

        <motion.div 
          style={{ x: useTransform(smoothX, [-0.5, 0.5], [-3, 3]) }}
          className="flex flex-col gap-0.5 mb-5"
        >
          <p className="text-base sm:text-lg font-bold text-slate-700 tracking-tight">
            {alumnus.role}
          </p>
          <p className="text-sm font-semibold text-slate-500">
            @ {alumnus.company}
          </p>
        </motion.div>

        {/* Alma Mater Highlight */}
        {alumnus.degree && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200/80 max-w-full shadow-sm">
            {instituteLogo ? (
              <img src={instituteLogo} alt={instituteName} className="w-4 h-4 object-contain rounded-sm" />
            ) : (
              <GraduationCap size={15} className="text-slate-700 flex-shrink-0" />
            )}
            <span className="truncate">
              {instituteName} • {alumnus.degree}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Part: Quote & View Case Study Link */}
      <motion.div 
        style={{ y: useTransform(smoothY, [-0.5, 0.5], [-5, 5]) }}
        className="relative z-20 mt-6 pt-5 border-t border-slate-200/80 pointer-events-none"
      >
        <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-2 mb-4">
          "{alumnus.successStory}"
        </p>
        <div className="flex items-center justify-between text-xs font-black text-slate-900">
          <span className="text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-wider">
            Explore Monograph
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-900 group-hover:translate-x-1 transition-transform">
            <span>View</span>
            <ArrowUpRight size={15} />
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// -------------------------------------------------------------
// Infinite Background Marquee (Matching Huge Landing Page)
// -------------------------------------------------------------
function MarqueeBanner() {
  return (
    <div className="relative w-full overflow-hidden flex whitespace-nowrap mb-6 select-none pointer-events-none">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        className="flex"
      >
        <h2 className="text-[9rem] md:text-[14rem] font-black tracking-tighter text-slate-200/60 leading-[0.8] px-8">
          ALUMNI • DIRECTORY • ALUMNI • DIRECTORY •
        </h2>
        <h2 className="text-[9rem] md:text-[14rem] font-black tracking-tighter text-slate-200/60 leading-[0.8] px-8">
          ALUMNI • DIRECTORY • ALUMNI • DIRECTORY •
        </h2>
      </motion.div>
    </div>
  );
}

const SECTOR_TAGS = [
  'All',
  'Tech & AI',
  'Business & Finance',
  'Engineering & Aerospace',
  'Medicine & Healthcare',
  'Design & Creative'
];

const ALUMNI_WORDS = [
  { text: 'Alumni.', color: '#ec4899' }, // pink-500
  { text: 'Leaders.', color: '#8b5cf6' }, // violet-500
  { text: 'Founders.', color: '#3b82f6' }, // blue-500
  { text: 'Fellows.', color: '#10b981' }, // emerald-500
  { text: 'Pioneers.', color: '#f59e0b' }, // amber-500
];

export default function AlumniPage({ onGetStarted, isDark, setIsDark }) {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedInstituteId, setSelectedInstituteId] = useState('All');
  const [wordIndex, setWordIndex] = useState(0);

  // Dynamic text cycling matching landing page DynamicMission
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ALUMNI_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Map institute ID to lookup
  const instituteMap = useMemo(() => {
    const map = {};
    institutes.forEach(inst => {
      map[inst.id] = inst;
    });
    return map;
  }, []);

  // Filtered alumni list
  const filteredAlumni = useMemo(() => {
    return top_alumni.filter(alumnus => {
      if (selectedSector !== 'All') {
        if (selectedSector === 'Design & Creative') {
          if (alumnus.category !== 'Design & Creative' && alumnus.category !== 'Design & Architecture') {
            return false;
          }
        } else if (alumnus.category !== selectedSector) {
          return false;
        }
      }

      if (selectedInstituteId !== 'All' && alumnus.instituteId !== selectedInstituteId) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inst = instituteMap[alumnus.instituteId];
        const instName = (inst?.name || '').toLowerCase();
        const instShort = (inst?.shortName || '').toLowerCase();
        const nameMatch = alumnus.name.toLowerCase().includes(query);
        const roleMatch = (alumnus.role || '').toLowerCase().includes(query);
        const companyMatch = (alumnus.company || '').toLowerCase().includes(query);
        const degreeMatch = (alumnus.degree || '').toLowerCase().includes(query);
        const skillsMatch = (alumnus.skills || []).some(s => s.toLowerCase().includes(query));

        return (
          nameMatch ||
          roleMatch ||
          companyMatch ||
          degreeMatch ||
          skillsMatch ||
          instName.includes(query) ||
          instShort.includes(query)
        );
      }

      return true;
    });
  }, [searchQuery, selectedSector, selectedInstituteId, instituteMap]);

  return (
    <div className="relative w-full min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-slate-900 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Floating Dynamic Navbar */}
      <Navbar onGetStarted={onGetStarted} isDark={isDark} setIsDark={setIsDark} />

      <main className="flex-1 pt-28 md:pt-36 pb-32">
        {/* Background Marquee */}
        <MarqueeBanner />

        <div className="max-w-7xl mx-auto px-6 relative z-10 -mt-16 md:-mt-28">
          {/* ============================================================ */}
          {/* HUGE EDITORIAL HERO HEADLINE */}
          {/* ============================================================ */}
          <div className="mb-16 md:mb-24">
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight mb-6 shadow-sm">
              Global Alumni Index // 2026
            </div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-7xl md:text-9xl lg:text-[11rem] font-black tracking-tighter leading-[0.85] text-slate-900 mb-8"
            >
              Global<br />
              <span className="relative inline-block whitespace-nowrap">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute left-0 top-0"
                    style={{ color: ALUMNI_WORDS[wordIndex].color }}
                  >
                    {ALUMNI_WORDS[wordIndex].text}
                  </motion.span>
                </AnimatePresence>
                {/* Invisible placeholder to maintain width and prevent layout shift */}
                <span className="opacity-0 pointer-events-none select-none inline-block">
                  Pioneers.
                </span>
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl md:text-4xl text-slate-600 font-medium leading-snug tracking-tight max-w-4xl mb-12"
            >
              The 21 fellows shaping global artificial intelligence, structural aerospace, sovereign capital, and creative culture.
            </motion.p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap gap-8 text-sm font-mono text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-200">
              <div>
                <span className="font-black text-slate-900 text-lg">{top_alumni.length}</span> Fellows
              </div>
              <div>
                <span className="font-black text-slate-900 text-lg">{institutes.length}</span> Flagship Institutes
              </div>
              <div>
                <span className="font-black text-slate-900 text-lg">98.4%</span> Global Placement
              </div>
              <div>
                <span className="font-black text-slate-900 text-lg">40+</span> Host Nations
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MINIMALIST FILTER & SEARCH BAR WITH CLEAN PILLS */}
          {/* ============================================================ */}
          <div className="mb-14 space-y-6">
            {/* Search Input */}
            <div className="relative border-b-2 border-slate-900 pb-3">
              <Search 
                size={24} 
                className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fellows by name, company, institute, or discipline..."
                className="w-full pl-10 pr-10 bg-transparent text-xl md:text-3xl font-black tracking-tight text-slate-900 placeholder:text-slate-300 placeholder:font-bold outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Sector Tabs + Institute Filter with Clean Dark/Light Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap gap-2.5">
                {SECTOR_TAGS.map((tag) => {
                  const active = selectedSector === tag;

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedSector(tag)}
                      className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                        active
                          ? 'bg-slate-900 text-white shadow-xl'
                          : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      {tag}.
                    </button>
                  );
                })}
              </div>

              {/* University Select */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedInstituteId}
                  onChange={(e) => setSelectedInstituteId(e.target.value)}
                  className="px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-black uppercase tracking-wider cursor-pointer outline-none hover:border-slate-400 shadow-sm"
                >
                  <option value="All">All Institutes</option>
                  {institutes.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CARDS GRID (Spring Parallax physics + Clean Styling) */}
          {/* ============================================================ */}
          {filteredAlumni.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredAlumni.map((alumnus, idx) => {
                const inst = instituteMap[alumnus.instituteId];
                return (
                  <AlumniParallaxCard
                    key={alumnus.id}
                    alumnus={alumnus}
                    index={idx}
                    isHovered={hoveredCard}
                    onHover={setHoveredCard}
                    onLeave={() => setHoveredCard(null)}
                    onClick={() => navigate(`/alumni/${alumnus.id}`)}
                    instituteName={inst?.shortName || 'University'}
                    instituteLogo={inst?.logo}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center">
              <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                No Fellows{' '}
                <span style={{ color: '#ec4899' }}>
                  Found.
                </span>
              </h3>
              <p className="text-lg text-slate-500 mb-8">
                No alumni match "{searchQuery}" under the selected filter criteria.
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedSector('All'); setSelectedInstituteId('All'); }}
                className="px-8 py-4 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-wider"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Massive Typography Footer */}
      <FooterHuge />
    </div>
  );
}
