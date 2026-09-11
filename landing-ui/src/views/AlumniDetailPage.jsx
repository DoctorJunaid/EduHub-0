import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  GraduationCap, 
  Building2, 
  MapPin, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  Share2
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import FooterHuge from '@/components/landing/FooterHuge';
import { getAlumniData, top_alumni } from '@/data/mockData';

export default function AlumniDetailPage({ onGetStarted, isDark, setIsDark }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Scroll to top on load or ID change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const alumnus = useMemo(() => {
    return getAlumniData(id);
  }, [id]);

  const institute = alumnus?.institute;

  // Find next alumnus in the list for continuous exploration
  const nextAlumnus = useMemo(() => {
    if (!alumnus) return top_alumni[0];
    const currentIndex = top_alumni.findIndex(a => a.id === alumnus.id);
    const nextIndex = (currentIndex + 1) % top_alumni.length;
    return top_alumni[nextIndex];
  }, [alumnus]);

  if (!alumnus) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-between">
        <Navbar onGetStarted={onGetStarted} isDark={isDark} setIsDark={setIsDark} />
        <div className="pt-40 pb-20 text-center px-6">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-4">Record Not Found.</h1>
          <p className="text-xl text-slate-500 mb-8">The requested alumni monograph could not be resolved.</p>
          <button
            onClick={() => navigate('/alumni')}
            className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-sm"
          >
            Return to Alumni Directory
          </button>
        </div>
        <FooterHuge />
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Alumnus monograph link copied to clipboard!');
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-slate-900 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Floating Dynamic Navbar */}
      <Navbar onGetStarted={onGetStarted} isDark={isDark} setIsDark={setIsDark} />

      <main className="flex-1 pt-28 md:pt-36 pb-32">
        {/* ============================================================ */}
        {/* TOP EDITORIAL BREADCRUMB */}
        {/* ============================================================ */}
        <div className="max-w-7xl mx-auto px-6 mb-10">
          <div className="flex items-center justify-between py-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/alumni')}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>All Fellows.</span>
            </button>

            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
                FELLOW MONOGRAPH // {alumnus.verifiedId}
              </span>
              <button
                type="button"
                onClick={handleShare}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                title="Share Monograph"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: HUGE EDITORIAL MONOGRAPH HERO */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Meta tags bar with clean pills like #01 National Rank */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                {alumnus.category}
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-widest border border-slate-200">
                {alumnus.year}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                <ShieldCheck size={14} className="text-slate-300" />
                <span>HEC Attested Ledger</span>
              </span>
            </div>

            {/* Massive Display Name */}
            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter text-slate-900 leading-[0.82] mb-6">
              {alumnus.name.split(' ')[0]}{' '}
              <span style={{ color: '#ec4899' }}>
                {alumnus.name.split(' ').slice(1).join(' ')}.
              </span>
            </h1>

            {/* Current Station */}
            <p className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-500 leading-tight mb-14 max-w-5xl">
              {alumnus.role} at <span className="text-slate-900">{alumnus.company}</span>.
              {alumnus.location && <span className="block text-slate-400 text-xl sm:text-3xl mt-1">Based in {alumnus.location}.</span>}
            </p>
          </motion.div>

          {/* Visual Presentation Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-12">
            {/* Portrait in Full HD Color in Clean Brutalist Frame */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xl group"
              >
                <div className="aspect-[4/5] w-full overflow-hidden">
                  <img
                    src={alumnus.picture}
                    alt={alumnus.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                </div>
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-between">
                  <span className="text-xs font-mono font-bold tracking-wider">
                    VERIFIED LEDGER: {alumnus.verifiedId}
                  </span>
                  <CheckCircle2 size={18} className="text-white" />
                </div>
              </motion.div>
            </div>

            {/* Impact Quote & Key Metrics */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full pt-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-4">
                  EXECUTIVE IMPACT
                </span>
                <p className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.05] mb-12">
                  "{alumnus.successStory}"
                </p>
              </motion.div>

              {/* Big Metric Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-200">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                    Graduation
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {alumnus.year.replace('Class of ', '')}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                    Grade Average
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {alumnus.cgpa ? alumnus.cgpa.split('/')[0].trim() : '3.9+'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                    National Tier
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {institute?.nationalRank?.split(' ')[0] || '#01'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: THE ALMA MATER SHOWCASE ("WHERE HE STUDIED") */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6 mb-28">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[3rem] bg-[#0a0a0a] text-white p-8 sm:p-14 md:p-20 shadow-2xl relative overflow-hidden"
          >
            {/* Campus Panoramic Image Banner in Background */}
            {institute?.image && (
              <div className="absolute inset-0 z-0 opacity-20 overflow-hidden">
                <img
                  src={institute.image}
                  alt={institute.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
              </div>
            )}

            {/* Section Eyebrow with #01 National Rank style pill */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-8 mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                ORIGINS & ACADEMIC PEDIGREE // 01
              </span>
              <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold tracking-tight shadow-md">
                {institute?.nationalRank || '#01 National Rank'}
              </span>
            </div>

            {/* Section Headline */}
            <h2 className="relative z-10 text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] mb-12">
              Where {alumnus.name.split(' ')[0]} Studied.
            </h2>

            {/* Massive University Banner */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-16 pb-16 border-b border-white/10">
              <div className="lg:col-span-8">
                <div className="flex items-center gap-4 mb-5">
                  {institute?.logo ? (
                    <div className="w-16 h-16 p-2.5 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-xl border border-white/20">
                      <img 
                        src={institute.logo} 
                        alt={institute.name} 
                        className="w-11 h-11 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Building2 size={32} className="text-white" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-widest block">
                      {institute?.board || 'HEC Chartered Tier W4'}
                    </span>
                    <span className="text-sm font-mono text-slate-400">
                      {institute?.type || 'Flagship Research University'}
                    </span>
                  </div>
                </div>

                <h3 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter text-white leading-[0.82] mb-4">
                  <span style={{ color: '#3b82f6' }}>
                    {institute?.shortName}.
                  </span>
                </h3>
                <p className="text-xl sm:text-2xl text-slate-300 font-bold max-w-2xl leading-snug">
                  {institute?.name}
                </p>
              </div>

              {/* 1-Click CTA to Explore University */}
              <div className="lg:col-span-4 flex lg:justify-end">
                {institute && (
                  <button
                    type="button"
                    onClick={() => navigate(`/institute/${alumnus.instituteId}`)}
                    className="px-8 py-5 rounded-full bg-white text-slate-900 font-black text-sm hover:bg-slate-100 shadow-2xl transition-all active:scale-95 inline-flex items-center gap-2"
                  >
                    <span>Explore {institute.shortName} Campus & Fees</span>
                    <ArrowUpRight size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Credential Specification Folio */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Degree */}
              <div className="border-t border-white/10 pt-6">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                  CONFERRED DEGREE
                </span>
                <div className="flex items-start gap-3">
                  <GraduationCap size={24} className="text-white flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {alumnus.degree}
                    </h4>
                    <p className="text-sm text-slate-400 font-bold mt-1">
                      {alumnus.year}
                    </p>
                  </div>
                </div>
              </div>

              {/* Department */}
              <div className="border-t border-white/10 pt-6">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                  FACULTY & SCHOOL
                </span>
                <div className="flex items-start gap-3">
                  <Building2 size={24} className="text-white flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xl sm:text-2xl font-black text-white leading-snug">
                      {alumnus.department}
                    </h4>
                    <p className="text-sm text-slate-400 font-medium mt-1">
                      Academic Department
                    </p>
                  </div>
                </div>
              </div>

              {/* Campus */}
              <div className="border-t border-white/10 pt-6">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                  GROUNDS & LOCATION
                </span>
                <div className="flex items-start gap-3">
                  <MapPin size={24} className="text-white flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xl sm:text-2xl font-black text-white leading-snug">
                      {alumnus.campus}
                    </h4>
                    <p className="text-sm text-slate-400 font-medium mt-1">
                      Main Campus Grounds
                    </p>
                  </div>
                </div>
              </div>

              {/* Honors & Standing */}
              <div className="border-t border-white/10 pt-6">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                  ACADEMIC DISTINCTION
                </span>
                <div className="flex items-start gap-3">
                  <Award size={24} className="text-white flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-2xl font-black text-white leading-snug">
                      {alumnus.cgpa ? `CGPA ${alumnus.cgpa}` : 'Distinction'}
                    </h4>
                    <p className="text-sm text-slate-300 font-bold mt-1">
                      {alumnus.honors || 'Dean’s Honor List'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thesis Title */}
              {alumnus.thesis && (
                <div className="border-t border-white/10 pt-6 md:col-span-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                    SENIOR CAPSTONE PROJECT / THESIS
                  </span>
                  <div className="flex items-start gap-3">
                    <BookOpen size={24} className="text-white flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-xl sm:text-2xl font-bold text-white italic leading-snug">
                        "{alumnus.thesis}"
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-2">
                        Presented to the department board of examiners at {institute?.shortName}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: THE PERSPECTIVE (DIRECT STUDENT ADVICE) */}
        {/* ============================================================ */}
        {alumnus.advice && (
          <section className="max-w-7xl mx-auto px-6 mb-28">
            <div className="border-t-2 border-slate-900 pt-12">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-6">
                PERSPECTIVE // ADVICE TO SCHOLARS
              </span>
              <blockquote className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-slate-900 leading-[1.0] max-w-5xl mb-8">
                "{alumnus.advice}"
              </blockquote>
              <p className="text-base font-black text-slate-500 uppercase tracking-wider">
                — {alumnus.name}, {alumnus.role} @ {alumnus.company}
              </p>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 4: CAREER TRAJECTORY */}
        {/* ============================================================ */}
        {alumnus.careerJourney && alumnus.careerJourney.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mb-28">
            <div className="mb-14">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-3">
                CHRONOLOGY // 02
              </span>
              <h2 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85]">
                Career{' '}
                <span style={{ color: '#8b5cf6' }}>
                  Trajectory.
                </span>
              </h2>
            </div>

            <div className="space-y-6">
              {alumnus.careerJourney.map((step, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 hover:border-slate-900 transition-colors flex flex-col md:flex-row md:items-baseline justify-between gap-6 shadow-sm hover:shadow-md"
                >
                  <div className="md:w-48 flex-shrink-0">
                    <span className="text-xs font-mono font-black uppercase tracking-widest text-slate-400">
                      {step.year}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">
                      {step.role} <span className="text-slate-400 font-bold">@ {step.org}</span>
                    </h3>
                    {step.desc && (
                      <p className="text-base sm:text-lg text-slate-600 font-medium max-w-3xl leading-relaxed">
                        {step.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 5: NEXT FELLOW (CONTINUOUS SEAMLESS EXPLORATION) */}
        {/* ============================================================ */}
        {nextAlumnus && (
          <section className="max-w-7xl mx-auto px-6">
            <div 
              onClick={() => navigate(`/alumni/${nextAlumnus.id}`)} 
              className="cursor-pointer group py-16 border-t-2 border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-8"
            >
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-2">
                  NEXT MONOGRAPH //
                </span>
                <h3 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-slate-900 group-hover:underline leading-[0.9]">
                  {nextAlumnus.name}.
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-slate-500 mt-2">
                  {nextAlumnus.role} @ {nextAlumnus.company}
                </p>
              </div>

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 shadow-lg">
                <ArrowUpRight size={28} />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Massive Typography Footer */}
      <FooterHuge />
    </div>
  );
}
