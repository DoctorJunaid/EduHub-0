import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowLeft, 
  Search, 
  MapPin, 
  Building2
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import FooterHuge from '@/components/landing/FooterHuge';
import { institutes } from '@/data/mockData';

const CITIES = ['All Cities', 'Islamabad', 'Lahore', 'Karachi', 'Topi'];
const SECTORS = [
  'All Sectors',
  'Engineering & Technology',
  'Business & Management',
  'Computer Science & AI',
  'Health Sciences & Medicine',
  'Arts, Design & Architecture'
];

const INSTITUTE_WORDS = [
  { text: 'Institutions.', color: '#3b82f6' }, // blue-500
  { text: 'Universities.', color: '#8b5cf6' }, // violet-500
  { text: 'Campuses.', color: '#10b981' }, // emerald-500
  { text: 'Faculties.', color: '#ec4899' }, // pink-500
  { text: 'Academies.', color: '#f59e0b' }, // amber-500
];

export default function InstitutesPage({ onGetStarted, isDark, setIsDark }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedType, setSelectedType] = useState('All'); // 'All', 'Public', 'Private'
  const [wordIndex, setWordIndex] = useState(0);

  // Dynamic text cycling matching landing page DynamicMission
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % INSTITUTE_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Filter institutes
  const filteredInstitutes = useMemo(() => {
    return institutes.filter((inst) => {
      // City Filter
      if (selectedCity !== 'All Cities') {
        if (!inst.address.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }

      // Sector Filter
      if (selectedSector !== 'All Sectors') {
        if (selectedSector === 'Engineering & Technology') {
          if (!inst.sector.includes('Engineering') && !inst.sector.includes('Technology')) return false;
        } else if (selectedSector === 'Business & Management') {
          if (!inst.sector.includes('Business') && !inst.sector.includes('Management') && !inst.sector.includes('Finance')) return false;
        } else if (selectedSector === 'Computer Science & AI') {
          if (!inst.sector.includes('Computer Science') && !inst.sector.includes('Computing') && !inst.sector.includes('AI')) return false;
        } else if (selectedSector === 'Health Sciences & Medicine') {
          if (!inst.sector.includes('Health') && !inst.sector.includes('Medicine')) return false;
        } else if (selectedSector === 'Arts, Design & Architecture') {
          if (!inst.sector.includes('Arts') && !inst.sector.includes('Design') && !inst.sector.includes('Architecture')) return false;
        } else {
          if (inst.sector !== selectedSector) return false;
        }
      }

      // Type Filter
      if (selectedType !== 'All') {
        if (!inst.type.toLowerCase().includes(selectedType.toLowerCase())) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          inst.name.toLowerCase().includes(q) ||
          inst.shortName.toLowerCase().includes(q) ||
          inst.address.toLowerCase().includes(q) ||
          inst.motto.toLowerCase().includes(q) ||
          inst.accreditation.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [searchQuery, selectedCity, selectedSector, selectedType]);

  return (
    <div className="relative w-full min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-slate-900 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Floating Dynamic Navbar */}
      <Navbar onGetStarted={onGetStarted} isDark={isDark} setIsDark={setIsDark} />

      <main className="flex-1 pt-28 md:pt-36 pb-32">
        {/* ============================================================ */}
        {/* TOP EDITORIAL BREADCRUMB */}
        {/* ============================================================ */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex items-center justify-between py-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>EduHub Network.</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                CHARTERED CAMPUS REGISTRY
              </span>
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
                HEC W4 VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MASSIVE EDITORIAL HERO */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-widest border border-slate-200">
                Pakistan Campuses
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                #01 National Rank Standard
              </span>
            </div>

            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-black tracking-tighter text-slate-900 leading-[0.85] mb-8">
              Chartered<br />
              <span className="relative inline-block whitespace-nowrap">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute left-0 top-0"
                    style={{ color: INSTITUTE_WORDS[wordIndex].color }}
                  >
                    {INSTITUTE_WORDS[wordIndex].text}
                  </motion.span>
                </AnimatePresence>
                {/* Invisible placeholder to maintain width and prevent layout shift */}
                <span className="opacity-0 pointer-events-none select-none inline-block">
                  Universities.
                </span>
              </span>
            </h1>

            <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-500 leading-tight max-w-4xl">
              Directory of chartered research universities, polytechnic institutes, and medical colleges driving academic and scientific leadership across Pakistan.
            </p>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/* SEARCH & FILTERS PANEL */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6 mb-16">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            {/* Search Input */}
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by university name, short code (NUST, LUMS, GIKI), city, or degree..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>

            {/* City Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mr-2">
                City:
              </span>
              {CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all active:scale-95 ${
                    selectedCity === city
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Sector Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mr-2">
                Sector:
              </span>
              {SECTORS.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => setSelectedSector(sector)}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all active:scale-95 ${
                    selectedSector === sector
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mr-2">
                Charter Type:
              </span>
              {['All', 'Public', 'Private'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all active:scale-95 ${
                    selectedType === type
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type} {type !== 'All' ? 'Universities' : ''}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* INSTITUTES EDITORIAL GRID */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              SHOWING {filteredInstitutes.length} CHARTERED INSTITUTIONS
            </span>
          </div>

          {filteredInstitutes.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-200">
              <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-3xl font-black text-slate-900 mb-2">
                No Campuses{' '}
                <span style={{ color: '#ec4899' }}>
                  Found.
                </span>
              </h3>
              <p className="text-slate-500 font-medium">Try clearing your filters or changing search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredInstitutes.map((inst, index) => (
                <motion.div
                  key={inst.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/80 hover:border-slate-900 transition-all duration-300 shadow-sm hover:shadow-2xl flex flex-col justify-between group"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    <img
                      src={inst.image}
                      alt={inst.name}
                      onError={(e) => { e.currentTarget.src = '/universities/nust.jpg'; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                      <span className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-md">
                        {inst.nationalRank}
                      </span>
                      <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold">
                        {inst.globalRank}
                      </span>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
                          <img
                            src={inst.logo}
                            alt={inst.shortName}
                            onError={(e) => { e.currentTarget.src = '/brand/eduhub-logo.png'; }}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest block">
                            {inst.type}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-none">
                        {inst.shortName}.
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                        {inst.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mb-4 flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{inst.address}</span>
                      </p>
                      <p className="text-sm text-slate-600 font-medium line-clamp-2 leading-relaxed mb-6">
                        {inst.overview}
                      </p>

                      {/* Stat Tiles */}
                      <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-100 mb-6 text-center">
                        <div className="p-2.5 rounded-2xl bg-slate-50">
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Placement</span>
                          <span className="text-base font-black text-slate-900">{inst.placementRate}</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-slate-50">
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Acceptance</span>
                          <span className="text-base font-black text-slate-900">{inst.acceptanceRate}</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-slate-50">
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Faculty PhD</span>
                          <span className="text-base font-black text-slate-900">{inst.facultyCount.split(' ')[1] || '85%+'}</span>
                        </div>
                      </div>

                      {/* Admission Cycle Tag */}
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-6">
                        <span>Admissions:</span>
                        <span className="font-bold text-slate-900">{inst.admissions?.cycle || 'Open for 2026'}</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      type="button"
                      onClick={() => navigate(`/institute/${inst.id}`)}
                      className="w-full py-4 rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm group-hover:shadow-md"
                    >
                      <span>Explore Campus & Programs</span>
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Massive Typography Footer */}
      <FooterHuge />
    </div>
  );
}
