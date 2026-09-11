import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowLeft, 
  Search, 
  SlidersHorizontal, 
  Scale, 
  X
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import FooterHuge from '@/components/landing/FooterHuge';
import { institutes } from '@/data/mockData';

const SECTORS = [
  'All Sectors',
  'Engineering & Technology',
  'Business & Management',
  'Computer Science & AI',
  'Health Sciences & Medicine',
  'Arts, Design & Architecture'
];

const RANKING_WORDS = [
  { text: 'Rankings.', color: '#3b82f6' }, // blue-500
  { text: 'Standards.', color: '#8b5cf6' }, // violet-500
  { text: 'Benchmarks.', color: '#ec4899' }, // pink-500
  { text: 'Campuses.', color: '#10b981' }, // emerald-500
  { text: 'Excellence.', color: '#f59e0b' }, // amber-500
];

export default function RankingsPage({ onGetStarted, isDark, setIsDark }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [sortBy, setSortBy] = useState('nationalRank'); // 'nationalRank', 'globalRank', 'placement', 'acceptance'
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  // Dynamic text cycling matching landing page DynamicMission
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % RANKING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Filter and sort institutes
  const filteredInstitutes = useMemo(() => {
    let list = [...institutes];

    // Sector Filter
    if (selectedSector !== 'All Sectors') {
      list = list.filter(inst => {
        if (selectedSector === 'Engineering & Technology') {
          return inst.sector.includes('Engineering') || inst.sector.includes('Technology');
        }
        if (selectedSector === 'Business & Management') {
          return inst.sector.includes('Business') || inst.sector.includes('Management') || inst.sector.includes('Finance');
        }
        if (selectedSector === 'Computer Science & AI') {
          return inst.sector.includes('Computer Science') || inst.sector.includes('Computing') || inst.sector.includes('AI');
        }
        if (selectedSector === 'Health Sciences & Medicine') {
          return inst.sector.includes('Health') || inst.sector.includes('Medicine');
        }
        if (selectedSector === 'Arts, Design & Architecture') {
          return inst.sector.includes('Arts') || inst.sector.includes('Design') || inst.sector.includes('Architecture');
        }
        return inst.sector === selectedSector;
      });
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(inst => 
        inst.name.toLowerCase().includes(q) ||
        inst.shortName.toLowerCase().includes(q) ||
        inst.address.toLowerCase().includes(q) ||
        inst.accreditation.toLowerCase().includes(q) ||
        inst.sector.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'nationalRank') {
        return a.rank - b.rank;
      }
      if (sortBy === 'placement') {
        const pA = parseFloat(a.placementRate) || 0;
        const pB = parseFloat(b.placementRate) || 0;
        return pB - pA;
      }
      if (sortBy === 'acceptance') {
        const accA = parseFloat(a.acceptanceRate) || 100;
        const accB = parseFloat(b.acceptanceRate) || 100;
        return accA - accB; // lower is more selective
      }
      if (sortBy === 'globalRank') {
        // Extract number from QS
        const getQsNum = (str) => {
          const match = str.match(/#(\d+)/);
          return match ? parseInt(match[1], 10) : 999;
        };
        return getQsNum(a.globalRank) - getQsNum(b.globalRank);
      }
      return a.rank - b.rank;
    });

    return list;
  }, [selectedSector, searchQuery, sortBy]);

  // Comparison toggle
  const toggleCompare = (id) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 institutes side-by-side.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const comparedInstitutes = useMemo(() => {
    return institutes.filter(i => selectedForCompare.includes(i.id));
  }, [selectedForCompare]);

  return (
    <div className="relative w-full min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-slate-900 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Floating Dynamic Navbar */}
      <Navbar onGetStarted={onGetStarted} isDark={isDark} setIsDark={setIsDark} />

      <main className="flex-1 pt-28 md:pt-36 pb-32">
        {/* ============================================================ */}
        {/* BREADCRUMB & METADATA */}
        {/* ============================================================ */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex items-center justify-between py-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>EduHub Network.</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                HEC 2026 OFFICIAL BENCHMARK
              </span>
              <span className="hidden sm:inline-block text-sm font-mono font-bold text-slate-600">
                AUDITED QS / W4 TIER
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MASSIVE HERO BANNER */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <span className="px-4 py-2 rounded-full bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-wider border border-slate-300">
                Annual National Ranking
              </span>
              <span className="px-4 py-2 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                #01 National Rank Standard
              </span>
            </div>

            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-black tracking-tighter text-slate-900 leading-[0.85] mb-8">
              National<br />
              <span className="relative inline-block whitespace-nowrap">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute left-0 top-0"
                    style={{ color: RANKING_WORDS[wordIndex].color }}
                  >
                    {RANKING_WORDS[wordIndex].text}
                  </motion.span>
                </AnimatePresence>
                {/* Invisible placeholder to maintain width and prevent layout shift */}
                <span className="opacity-0 pointer-events-none select-none inline-block">
                  Benchmarks.
                </span>
              </span>
            </h1>

            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-700 leading-tight max-w-4xl">
              The verified national benchmark evaluating higher-education research rigor, graduate employability, QS global standing, and faculty credentials.
            </p>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/* TOP 3 PODIUM SPOTLIGHT (BRUTALIST CARDS) */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                EXCELLENCE PODIUM // 01
              </span>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900">
                The{' '}
                <span style={{ color: '#8b5cf6' }}>
                  Top Three.
                </span>
              </h2>
            </div>
            <span className="text-sm font-mono font-bold text-slate-600 hidden sm:block">
              NATIONALLY AUDITED LEADERS
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Rank 1: Full-Width Leader Feature */}
            {institutes[0] && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="lg:col-span-12 rounded-[2.5rem] bg-[#0a0a0a] text-white p-8 sm:p-14 relative overflow-hidden group shadow-2xl"
              >
                <div className="absolute inset-0 z-0 opacity-25 overflow-hidden">
                  <img
                    src={institutes[0].image}
                    alt={institutes[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <span className="px-4 py-2 rounded-full bg-white text-slate-900 font-mono text-sm font-black tracking-tight shadow-md">
                        #01 National Rank
                      </span>
                      <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-sm font-bold">
                        {institutes[0].globalRank}
                      </span>
                      <span className="px-4 py-2 rounded-full bg-white/10 text-slate-200 text-xs font-bold uppercase tracking-wider">
                        {institutes[0].sector}
                      </span>
                    </div>

                    <h3 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white leading-[0.85] mb-4">
                      {institutes[0].shortName}.
                    </h3>
                    <p className="text-xl sm:text-2xl text-slate-200 font-bold max-w-2xl leading-snug mb-8">
                      {institutes[0].name} — {institutes[0].motto}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-white/10 max-w-3xl">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">Employability</span>
                        <span className="text-3xl font-black text-white">{institutes[0].placementRate}</span>
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">Selectivity</span>
                        <span className="text-3xl font-black text-white">{institutes[0].acceptanceRate}</span>
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">Enrollment</span>
                        <span className="text-3xl font-black text-white">{institutes[0].studentEnrollment.split(' ')[0]}</span>
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">Campus Area</span>
                        <span className="text-3xl font-black text-white">{institutes[0].campusArea.split(' ')[0]} {institutes[0].campusArea.split(' ')[1]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col gap-3 justify-end items-start lg:items-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/institute/${institutes[0].id}`)}
                      className="w-full sm:w-auto px-8 py-5 rounded-full bg-white text-slate-900 font-black text-sm hover:bg-slate-100 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>Explore {institutes[0].shortName} Monograph</span>
                      <ArrowUpRight size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCompare(institutes[0].id)}
                      className={`w-full sm:w-auto px-6 py-3 rounded-full text-xs font-mono font-bold tracking-tight border transition-all ${
                        selectedForCompare.includes(institutes[0].id)
                          ? 'bg-white text-slate-900 border-white'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {selectedForCompare.includes(institutes[0].id) ? '✓ In Comparison Ledger' : '+ Compare Metrics'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rank 2: LUMS */}
            {institutes[1] && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="lg:col-span-6 rounded-[2.5rem] bg-white border border-slate-200/90 p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                      #02 National Rank
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-700">
                      {institutes[1].globalRank}
                    </span>
                  </div>

                  <h3 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 leading-[0.9] mb-3">
                    {institutes[1].shortName}.
                  </h3>
                  <p className="text-lg text-slate-800 font-bold mb-6">
                    {institutes[1].name}
                  </p>

                  <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-200 mb-6">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">Employability</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">{institutes[1].placementRate}</span>
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">Selectivity</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">{institutes[1].acceptanceRate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/institute/${institutes[1].id}`)}
                    className="inline-flex items-center gap-2 font-black text-sm uppercase tracking-wider text-slate-900 hover:text-slate-600 transition-colors"
                  >
                    <span>Inspect Campus</span>
                    <ArrowUpRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(institutes[1].id)}
                    className="text-xs font-mono font-bold px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors"
                  >
                    {selectedForCompare.includes(institutes[1].id) ? '✓ Added' : '+ Compare'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Rank 3: GIKI */}
            {institutes[2] && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="lg:col-span-6 rounded-[2.5rem] bg-white border border-slate-200/90 p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                      #03 National Rank
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-700">
                      {institutes[2].globalRank}
                    </span>
                  </div>

                  <h3 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 leading-[0.9] mb-3">
                    {institutes[2].shortName}.
                  </h3>
                  <p className="text-lg text-slate-800 font-bold mb-6">
                    {institutes[2].name}
                  </p>

                  <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-200 mb-6">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">Employability</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">{institutes[2].placementRate}</span>
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">Selectivity</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">{institutes[2].acceptanceRate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/institute/${institutes[2].id}`)}
                    className="inline-flex items-center gap-2 font-black text-sm uppercase tracking-wider text-slate-900 hover:text-slate-600 transition-colors"
                  >
                    <span>Inspect Campus</span>
                    <ArrowUpRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(institutes[2].id)}
                    className="text-xs font-mono font-bold px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors"
                  >
                    {selectedForCompare.includes(institutes[2].id) ? '✓ Added' : '+ Compare'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* INTERACTIVE CONTROLS BAR: SEARCH, SECTOR & SORT */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6 mb-12">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            {/* Sector Tabs */}
            <div className="flex flex-wrap gap-2.5 mb-8">
              {SECTORS.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => setSelectedSector(sector)}
                  className={`px-6 py-3 rounded-full text-sm font-black uppercase tracking-wider transition-all active:scale-95 ${
                    selectedSector === sector
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>

            {/* Search & Sort Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Search Bar */}
              <div className="md:col-span-8 relative">
                <Search size={22} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by university title, abbreviation, city, or accreditation..."
                  className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-300 text-base font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>

              {/* Sort Selector */}
              <div className="md:col-span-4 flex items-center gap-2.5">
                <SlidersHorizontal size={18} className="text-slate-600 shrink-0" />
                <span className="text-sm font-mono font-bold uppercase tracking-wider text-slate-700 shrink-0">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-300 text-sm font-black uppercase tracking-wider text-slate-900 cursor-pointer outline-none focus:border-slate-900 transition-colors"
                >
                  <option value="nationalRank">National Rank (HEC)</option>
                  <option value="globalRank">Global Standing (QS)</option>
                  <option value="placement">Placement Rate (%)</option>
                  <option value="acceptance">Selectivity (Acceptance %)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* COMPREHENSIVE RANKINGS LEDGER (TABLE & EDITORIAL ROWS) */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="space-y-4">
            {filteredInstitutes.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                <h3 className="text-3xl font-black text-slate-900 mb-2">No Matching Institutes.</h3>
                <p className="text-slate-600 text-base font-medium">Try broadening your search term or switching the academic sector filter.</p>
              </div>
            ) : (
              filteredInstitutes.map((inst, index) => {
                const isCompared = selectedForCompare.includes(inst.id);

                return (
                  <motion.div
                    key={inst.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 hover:border-slate-900 transition-all shadow-sm hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
                  >
                    {/* Left: Rank Number + Logo + Title */}
                    <div className="flex items-center gap-5 lg:w-5/12">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-mono font-black text-2xl shrink-0 shadow-sm">
                        #{inst.rank}
                      </div>

                      <div className="w-16 h-16 rounded-2xl bg-slate-100 p-2.5 border border-slate-200 shrink-0 flex items-center justify-center">
                        <img
                          src={inst.logo}
                          alt={inst.shortName}
                          onError={(e) => { e.currentTarget.src = '/brand/eduhub-logo.png'; }}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-3.5 py-1 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                            {inst.nationalRank}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {inst.globalRank}
                          </span>
                        </div>
                        <h4 
                          onClick={() => navigate(`/institute/${inst.id}`)}
                          className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 cursor-pointer group-hover:text-slate-600 transition-colors"
                        >
                          {inst.shortName}
                        </h4>
                        <p className="text-sm sm:text-base text-slate-700 font-semibold line-clamp-1">
                          {inst.name}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Key Audited Metrics */}
                    <div className="grid grid-cols-3 gap-6 lg:w-4/12 border-y lg:border-y-0 lg:border-x border-slate-100 py-4 lg:py-0 lg:px-6">
                      <div>
                        <span className="text-xs font-mono text-slate-600 uppercase tracking-wider block font-bold mb-1">Placement</span>
                        <span className="text-2xl font-black text-slate-900">{inst.placementRate}</span>
                      </div>
                      <div>
                        <span className="text-xs font-mono text-slate-600 uppercase tracking-wider block font-bold mb-1">Acceptance</span>
                        <span className="text-2xl font-black text-slate-900">{inst.acceptanceRate}</span>
                      </div>
                      <div>
                        <span className="text-xs font-mono text-slate-600 uppercase tracking-wider block font-bold mb-1">Location</span>
                        <span className="text-base font-black text-slate-900 block truncate">{inst.address.split(',')[0]}</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 lg:w-3/12 justify-end">
                      <button
                        type="button"
                        onClick={() => toggleCompare(inst.id)}
                        className={`px-5 py-3 rounded-full text-xs font-mono font-bold tracking-tight transition-all border ${
                          isCompared 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isCompared ? '✓ Compare' : '+ Compare'}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/institute/${inst.id}`)}
                        className="p-3.5 rounded-full bg-slate-900 text-white hover:scale-105 transition-transform shrink-0 shadow-sm"
                        title={`View ${inst.shortName} Monograph`}
                      >
                        <ArrowUpRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* FLOATING COMPARISON BAR (WHEN INSTITUTES SELECTED) */}
        {/* ============================================================ */}
        <AnimatePresence>
          {selectedForCompare.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-6 right-6 z-40 max-w-3xl mx-auto"
            >
              <div className="p-4 sm:p-5 rounded-full bg-slate-900 text-white shadow-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 pl-3">
                  <Scale size={24} className="text-slate-300" />
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-300 block font-bold">
                      COMPARISON LEDGER ({selectedForCompare.length}/3)
                    </span>
                    <span className="text-base font-black text-white">
                      {comparedInstitutes.map(i => i.shortName).join(' vs ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCompareModalOpen(true)}
                    className="px-6 py-3 rounded-full bg-white text-slate-900 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    Open Comparison
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedForCompare([])}
                    className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"
                    title="Clear comparison"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* SIDE-BY-SIDE COMPARISON MODAL */}
        {/* ============================================================ */}
        <AnimatePresence>
          {isCompareModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 border border-slate-200 shadow-2xl relative"
              >
                <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-600 block mb-1">
                      DIRECT AUDITED COMPARISON
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                      Metric{' '}
                      <span style={{ color: '#ec4899' }}>
                        Side-by-Side.
                      </span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCompareModalOpen(false)}
                    className="p-3 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {comparedInstitutes.map((inst) => (
                    <div key={inst.id} className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                          {inst.nationalRank}
                        </span>
                        <span className="text-xs font-mono text-slate-600 font-bold">
                          {inst.globalRank}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-3xl sm:text-4xl font-black text-slate-900 leading-none mb-2">
                          {inst.shortName}
                        </h4>
                        <p className="text-sm text-slate-700 font-semibold">
                          {inst.name}
                        </p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider block mb-1">Placement Rate</span>
                          <span className="text-xl font-black text-slate-900">{inst.placementRate}</span>
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider block mb-1">Selectivity</span>
                          <span className="text-xl font-black text-slate-900">{inst.acceptanceRate}</span>
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider block mb-1">Enrollment</span>
                          <span className="text-xl font-black text-slate-900">{inst.studentEnrollment}</span>
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider block mb-1">Tuition Fee</span>
                          <span className="text-xl font-black text-slate-900">{inst.admissions?.feeRange || 'Chartered Tier'}</span>
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider block mb-1">Campus Grounds</span>
                          <span className="text-xl font-black text-slate-900">{inst.campusArea}</span>
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider block mb-1">Accreditation</span>
                          <span className="text-sm font-bold text-slate-800 block">{inst.accreditation}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCompareModalOpen(false);
                          navigate(`/institute/${inst.id}`);
                        }}
                        className="w-full py-4 rounded-full bg-slate-900 text-white font-black text-sm uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>Open Full Profile</span>
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Massive Typography Footer */}
      <FooterHuge />
    </div>
  );
}
