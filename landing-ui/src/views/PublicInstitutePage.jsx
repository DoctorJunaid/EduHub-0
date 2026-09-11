import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  GraduationCap, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  Share2, 
  Download, 
  Calendar, 
  Coins, 
  X
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import FooterHuge from '@/components/landing/FooterHuge';
import GetStartedModal from '@/components/GetStartedModal';
import { getInstituteData, institutes } from '@/data/mockData';

export default function PublicInstitutePage({ isDark, setIsDark, onGetStarted }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Scroll to top on load or ID change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const inst = useMemo(() => {
    return getInstituteData(id) || getInstituteData('inst_1') || institutes[0];
  }, [id]);

  // Find next institute for continuous exploration
  const nextInstitute = useMemo(() => {
    if (!inst) return institutes[0];
    const currentIndex = institutes.findIndex(i => i.id === inst.id);
    const nextIndex = (currentIndex + 1) % institutes.length;
    return institutes[nextIndex];
  }, [inst]);

  // Interactive Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    program: '',
    qualification: 'FSc Pre-Engineering'
  });
  const [applySuccess, setApplySuccess] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  // Prospectus notification
  const [prospectusDownloaded, setProspectusDownloaded] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  const handleOpenPartnerModal = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      setPartnerModalOpen(true);
    }
  };

  const handleOpenApply = (prog = null) => {
    const progName = prog?.name || (inst.programs && inst.programs[0]?.name) || 'BS Computer Science';
    setApplyForm(prev => ({ ...prev, program: progName }));
    setApplySuccess(false);
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!applyForm.name || !applyForm.email || !applyForm.phone) return;
    const randomId = `EDU-2026-${inst.shortName}-${Math.floor(1000 + Math.random() * 9000)}`;
    setApplicationId(randomId);
    setApplySuccess(true);
  };

  const handleDownloadProspectus = () => {
    setProspectusDownloaded(true);
    setTimeout(() => setProspectusDownloaded(false), 4000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Institute monograph link copied to clipboard!');
    }
  };

  if (!inst) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-between">
        <Navbar onGetStarted={handleOpenPartnerModal} isDark={isDark} setIsDark={setIsDark} />
        <div className="pt-40 pb-20 text-center px-6">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-4">Record Not Found.</h1>
          <p className="text-xl text-slate-500 mb-8">The requested institutional monograph could not be resolved.</p>
          <button
            onClick={() => navigate('/institutes')}
            className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-sm"
          >
            Return to Institutions Directory
          </button>
        </div>
        <FooterHuge />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-slate-900 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Floating Dynamic Navbar */}
      <Navbar onGetStarted={handleOpenPartnerModal} isDark={isDark} setIsDark={setIsDark} />

      <main className="flex-1 pt-28 md:pt-36 pb-32">
        {/* ============================================================ */}
        {/* TOP EDITORIAL BREADCRUMB */}
        {/* ============================================================ */}
        <div className="max-w-7xl mx-auto px-6 mb-10">
          <div className="flex items-center justify-between py-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/institutes')}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>All Institutions.</span>
            </button>

            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
                INSTITUTE MONOGRAPH // {inst.id.toUpperCase()}
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
                {inst.nationalRank || '#01 National Rank'}
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-widest border border-slate-200">
                {inst.globalRank}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                <ShieldCheck size={14} className="text-slate-300" />
                <span>HEC W4 Accredited</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                EST. {inst.establishedYear}
              </span>
            </div>

            {/* Massive Display Name */}
            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter text-slate-900 leading-[0.82] mb-6">
              {inst.shortName}.
            </h1>

            {/* Official Title & Motto */}
            <p className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-500 leading-tight mb-14 max-w-5xl">
              {inst.fullName || inst.name}. <span className="text-slate-900">"{inst.motto}"</span>
              {inst.address && <span className="block text-slate-400 text-xl sm:text-3xl mt-2">{inst.address}</span>}
            </p>
          </motion.div>

          {/* Visual Presentation Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-12">
            {/* Campus Panoramic Portrait in Clean Brutalist Frame */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xl group"
              >
                <div className="aspect-[4/5] w-full overflow-hidden">
                  <img
                    src={inst.image}
                    alt={inst.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                </div>
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-between">
                  <span className="text-xs font-mono font-bold tracking-wider">
                    VERIFIED CAMPUS: {inst.id.toUpperCase()}
                  </span>
                  <CheckCircle2 size={18} className="text-white" />
                </div>
              </motion.div>
            </div>

            {/* Strategic Overview & Quick CTAs */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full pt-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-4">
                  INSTITUTIONAL SYNOPSIS
                </span>
                <p className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-snug mb-8">
                  {inst.description}
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 mb-12">
                  <button
                    type="button"
                    onClick={() => handleOpenApply()}
                    className="px-8 py-5 rounded-full bg-slate-900 text-white font-black text-sm hover:bg-slate-800 shadow-2xl transition-all active:scale-95 inline-flex items-center gap-2"
                  >
                    <GraduationCap size={18} />
                    <span>Apply for Admission Fall 2026</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadProspectus}
                    className="px-8 py-5 rounded-full bg-white text-slate-900 border border-slate-200 font-bold text-sm hover:bg-slate-50 shadow-sm transition-all inline-flex items-center gap-2"
                  >
                    <Download size={18} />
                    <span>Download Syllabus Guide</span>
                  </button>
                </div>
              </motion.div>

              {/* Big Metric Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-200">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                    Employability
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    {inst.placementRate}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                    Selectivity
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    {inst.acceptanceRate}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                    Scholars Enrolled
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    {inst.studentEnrollment.split(' ')[0]}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                    Faculty Body
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {inst.facultyCount.split(' ')[0]}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                    Campus Grounds
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {inst.campusArea.split(' ')[0]} {inst.campusArea.split(' ')[1]}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block mb-1">
                    Accreditation
                  </span>
                  <span className="text-base font-black text-slate-900 truncate block">
                    {inst.board} W4
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* PROSPECTUS DOWNLOAD TOAST */}
        {/* ============================================================ */}
        <AnimatePresence>
          {prospectusDownloaded && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-6 mb-12"
            >
              <div className="p-5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-white" />
                  <span className="text-sm font-bold">
                    Official {inst.shortName} Syllabus &amp; Prospectus 2026 downloaded.
                  </span>
                </div>
                <button 
                  onClick={() => setProspectusDownloaded(false)}
                  className="p-1 hover:bg-white/10 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* SECTION 2: ADMISSIONS & FINANCIAL AID LEDGER */}
        {/* ============================================================ */}
        {inst.admissions && (
          <section className="max-w-7xl mx-auto px-6 mb-28">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-[3rem] bg-[#0a0a0a] text-white p-8 sm:p-14 md:p-20 shadow-2xl relative overflow-hidden"
            >
              {/* Section Header */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-8 mb-12">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                  ADMISSIONS &amp; FINANCIAL ENDOWMENT // 01
                </span>
                <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold tracking-tight shadow-md">
                  {inst.admissions.cycle}
                </span>
              </div>

              <h2 className="relative z-10 text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] mb-14">
                Admissions{' '}
                <span style={{ color: '#8b5cf6' }}>
                  Protocol.
                </span>
              </h2>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <div className="border-t border-white/10 pt-6">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                    APPLICATION DEADLINE
                  </span>
                  <div className="flex items-center gap-3">
                    <Calendar size={22} className="text-white shrink-0" />
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {inst.admissions.deadline}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                    MANDATORY ENTRY TEST
                  </span>
                  <div className="flex items-center gap-3">
                    <BookOpen size={22} className="text-white shrink-0" />
                    <span className="text-lg sm:text-xl font-black text-white">
                      {inst.admissions.entryTest}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                    SEMESTER FEE TIER
                  </span>
                  <div className="flex items-center gap-3">
                    <Coins size={22} className="text-white shrink-0" />
                    <span className="text-base sm:text-lg font-black text-white">
                      {inst.admissions.feeRange}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                    ENDOWMENT &amp; AID
                  </span>
                  <div className="flex items-center gap-3">
                    <Award size={22} className="text-white shrink-0" />
                    <span className="text-sm sm:text-base font-bold text-slate-300">
                      {inst.admissions.financialAid}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-400">
                  Admissions processed via HEC-recognized centralized aptitude protocols.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenApply()}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors"
                >
                  Start Online Application
                </button>
              </div>
            </motion.div>
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 3: ACADEMIC FACULTIES & PROGRAMS */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-6 mb-28">
          <div className="mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-3">
              FACULTIES &amp; DEGREES // 02
            </span>
            <h2 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85]">
              Academic{' '}
              <span style={{ color: '#3b82f6' }}>
                Programs.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inst.programs && inst.programs.length > 0 ? (
              inst.programs.map((program) => (
                <div
                  key={program.id}
                  className="bg-white rounded-3xl p-8 border border-slate-200/80 hover:border-slate-900 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold tracking-tight">
                        {program.degree}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {program.duration}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                      {program.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 font-bold mb-4">
                      {program.department}
                    </p>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                      {program.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Tuition Fee</span>
                      <span className="text-sm font-black text-slate-900">{program.feePerSemester}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenApply(program)}
                      className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold transition-all"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              inst.departments.map((dept, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-8 border border-slate-200/80 hover:border-slate-900 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block mb-2">Faculty // 0{idx + 1}</span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{dept}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenApply()}
                    className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-900 inline-flex items-center gap-1 hover:translate-x-1 transition-transform"
                  >
                    <span>View Curriculum</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: RESEARCH CENTERS OF EXCELLENCE */}
        {/* ============================================================ */}
        {inst.researchCenters && inst.researchCenters.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mb-28">
            <div className="border-t-2 border-slate-900 pt-12">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-3">
                RESEARCH INSTITUTES // 03
              </span>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[0.9] mb-12">
                Centers of{' '}
                <span style={{ color: '#10b981' }}>
                  Excellence.
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {inst.researchCenters.map((center, idx) => (
                  <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-mono font-bold text-slate-400 block mb-2">LAB // 0{idx + 1}</span>
                    <h4 className="text-lg font-black text-slate-900 leading-snug">{center}</h4>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 5: DISTINGUISHED ALUMNI NETWORK */}
        {/* ============================================================ */}
        {inst.alumniList && inst.alumniList.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mb-28">
            <div className="mb-14 flex items-end justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-3">
                  FELLOWS NETWORK // 04
                </span>
                <h2 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85]">
                  Alumni of{' '}
                  <span style={{ color: '#ec4899' }}>
                    {inst.shortName}.
                  </span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/alumni')}
                className="hidden sm:inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 hover:text-slate-600 transition-colors"
              >
                <span>View Full Directory</span>
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {inst.alumniList.map((alumnus) => (
                <div
                  key={alumnus.id}
                  onClick={() => navigate(`/alumni/${alumnus.id}`)}
                  className="cursor-pointer bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/80 hover:border-slate-900 transition-all duration-300 shadow-sm hover:shadow-xl group flex flex-col justify-between"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={alumnus.picture}
                      alt={alumnus.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
                        {alumnus.category}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                        {alumnus.year}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1 group-hover:underline">
                      {alumnus.name}
                    </h3>
                    <p className="text-sm font-bold text-slate-500">
                      {alumnus.role} @ {alumnus.company}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 6: CAMPUS GROUNDS GALLERY */}
        {/* ============================================================ */}
        {inst.gallery && inst.gallery.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mb-28">
            <div className="mb-10">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-2">
                GROUNDS &amp; INFRASTRUCTURE // 05
              </span>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900">
                Campus{' '}
                <span style={{ color: '#f59e0b' }}>
                  Architecture.
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {inst.gallery.map((img, idx) => (
                <div key={idx} className="rounded-3xl overflow-hidden aspect-square bg-slate-100 shadow-sm">
                  <img
                    src={img}
                    alt={`${inst.shortName} Campus ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 7: NEXT INSTITUTION (CONTINUOUS EXPLORATION) */}
        {/* ============================================================ */}
        {nextInstitute && (
          <section className="max-w-7xl mx-auto px-6">
            <div 
              onClick={() => navigate(`/institute/${nextInstitute.id}`)} 
              className="cursor-pointer group py-16 border-t-2 border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-8"
            >
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-2">
                  NEXT MONOGRAPH //
                </span>
                <h3 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-slate-900 group-hover:underline leading-[0.9]">
                  <span style={{ color: '#8b5cf6' }}>
                    {nextInstitute.shortName}.
                  </span>
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-slate-500 mt-2">
                  {nextInstitute.name}
                </p>
              </div>

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 shadow-lg">
                <ArrowUpRight size={28} />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ============================================================ */}
      {/* INTERACTIVE ADMISSION APPLICATION MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] max-w-xl w-full p-8 sm:p-10 border border-slate-200 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>

              {applySuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900">Application Lodged.</h3>
                  <p className="text-sm text-slate-600 font-medium">
                    Your preliminary admissions docket for <strong>{applyForm.program}</strong> at <strong>{inst.shortName}</strong> has been registered.
                  </p>
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-800">
                    TRACKING DOSSIER: {applicationId}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="w-full py-4 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider mt-4"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      ADMISSIONS APPLICATION // FALL 2026
                    </span>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                      Apply to {inst.shortName}.
                    </h3>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Desired Degree Program
                    </label>
                    <input
                      type="text"
                      value={applyForm.program}
                      onChange={(e) => setApplyForm({ ...applyForm, program: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={applyForm.name}
                      onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                      required
                      placeholder="e.g. Muhammad Ali"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={applyForm.email}
                        onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                        required
                        placeholder="applicant@domain.com"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={applyForm.phone}
                        onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                        required
                        placeholder="+92 300 1234567"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all mt-4"
                  >
                    Submit Application Docket
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Partner Modal */}
      <GetStartedModal isOpen={partnerModalOpen} onClose={() => setPartnerModalOpen(false)} />

      {/* Massive Typography Footer */}
      <FooterHuge />
    </div>
  );
}
