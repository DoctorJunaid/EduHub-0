import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  Star,
  MapPin,
  VideoCamera,
  ChatCircle,
  Cloud,
  FileText,
  Calendar,
  CaretRight,
  CaretDown,
  CaretUp,
  Buildings,
  ArrowRight
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { top_alumni, institutes, events } from '@/data/mockData'
import Navbar from '@/components/layout/Navbar'
import HeroFanDeck from '@/components/HeroFanDeck/HeroFanDeck'
import WebGLBackground from '@/components/WebGLBackground'
import BentoCard from '@/components/shared/BentoCard'
import GetStartedModal from '@/components/GetStartedModal'
import DeviceShowcase from '@/components/showcase/DeviceShowcase'
import AIChatDemo from '@/components/AIChatDemo/AIChatDemo'
import { getManagementLoginUrl, getManagementDashboardUrl } from '@/config/urls'

export default function LandingPage({ onGetStarted, isDark, setIsDark }) {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [showAllInstitutes, setShowAllInstitutes] = useState(false)

  // Duplicate alumni for seamless infinite scrolling marquee
  const marqueeAlumni = [...top_alumni, ...top_alumni]

  // Top Ranked Institutions structured spotlight matching editorial layout
  const featuredInst = institutes.find(i => i.shortName === 'NUST') || institutes[0]
  const top4GridInsts = institutes.filter(i => i.id !== featuredInst?.id && ['LUMS', 'GIKI', 'FAST', 'IBA'].includes(i.shortName)).slice(0, 4)
  const allRemainingInsts = institutes.filter(i => i.id !== featuredInst?.id)
  const displayedGridInsts = showAllInstitutes ? allRemainingInsts : top4GridInsts

  const handleOpenGetStarted = () => {
    if (onGetStarted) {
      onGetStarted()
    } else {
      setModalOpen(true)
    }
  }

  return (
    <div className="relative w-full overflow-x-hidden min-h-screen bg-transparent text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* 3D WebGL Particle Background */}
      <WebGLBackground isDark={isDark} />

      {/* Floating Dynamic Navbar (Hides on scroll down, reveals on scroll up) */}
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        onGetStarted={handleOpenGetStarted}
      />

      <div className="relative z-10 pt-6">
        {/* ─── Hero Section: Animated Fan Deck ─── */}
        <HeroFanDeck onGetStarted={handleOpenGetStarted} navigate={navigate} />

        {/* ─── Top Alumni List (Success Stories) ─── */}
        <section id="alumni" className="py-24 bg-transparent">
          <motion.div
            className="text-center max-w-2xl mx-auto px-6 mb-14"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-2">
              Verified Alumni Intelligence
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Where our graduates work.
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mt-3 max-w-xl mx-auto">
              Institutions advertise placement rates — EduHub verifies them. Real alumni, real employers, real career trajectories.
            </p>
          </motion.div>

          <div className="marquee-container">
            <div className="marquee-track">
              {marqueeAlumni.map((alumni, idx) => {
                const instName = institutes.find(i => i.id === alumni.instituteId)?.name || 'EduHub Institute'
                return (
                  <div key={`${alumni.id}-${idx}`} className="xcard-alumni group">
                    <div className="xcard-shimmer" />
                    <div className="xcard-alumni-bg-wrap">
                      <img src={alumni.picture} alt={alumni.name} className="xcard-alumni-bg-img" loading="lazy" />
                      <div className="xcard-alumni-overlay" />
                    </div>
                    <div className="xcard-alumni-content">
                      <div className="xcard-alumni-quote-mark">“</div>
                      <p className="xcard-alumni-quote">{alumni.successStory}</p>
                      <div className="xcard-alumni-author">
                        <h3 className="xcard-alumni-name">{alumni.name}</h3>
                        <p
                          className="xcard-alumni-inst"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/institute/' + alumni.instituteId)
                          }}
                        >
                          {instName}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── Top Ranking Institutes: Awwwards-Caliber 100vh Editorial Showcase ─── */}
        <section id="institutes" className="min-h-[calc(100vh-5rem)] flex flex-col justify-center py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-transparent border-t border-slate-200/60 dark:border-slate-800/60">
          <motion.div
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div>
              <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase">
                Institutional Intelligence Engine — HEC · QS · PEC · 2026
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1 font-display">
                Verified institutions. Transparent data.
              </h2>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs font-medium">
                Accreditation tiers, real semester fees, verified placement rates, and alumni career data — all in one index.
              </p>
              <button
                onClick={() => setShowAllInstitutes(prev => !prev)}
                className="px-4 py-2 rounded-xl bg-white/95 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Buildings size={15} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                <span>{showAllInstitutes ? 'Show Top 5 Only' : 'View All 7 Campuses'}</span>
                {showAllInstitutes ? <CaretUp size={13} weight="bold" /> : <CaretDown size={13} weight="bold" />}
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Featured Hero University Card (Rank #1: NUST) */}
            {featuredInst && (
              <div
                className="lg:col-span-5 rounded-3xl overflow-hidden relative border border-slate-200/70 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.18)] hover:-translate-y-1 flex flex-col justify-between group cursor-pointer"
                onClick={() => navigate('/institute/' + featuredInst.id)}
              >
                {/* Subtle crystal top sheen */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-emerald-500/[0.02] dark:from-white/[0.04] dark:via-transparent dark:to-emerald-500/[0.03] pointer-events-none z-10" />

                {/* Hero Image Banner with Rank #01 Badge */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden shrink-0">
                  <img
                    src={featuredInst.image}
                    alt={featuredInst.shortName}
                    onError={(e) => { e.currentTarget.src = '/universities/nust.jpg' }}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                  {/* Clean Monospace Rank Pill */}
                  <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-md bg-slate-950/70 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-black tracking-wider flex items-center gap-1.5 shadow-lg z-20">
                    <span className="text-emerald-400">#01</span>
                    <span className="text-[10px] text-white/80 uppercase tracking-widest">National Rank</span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-6 flex flex-col justify-between flex-1 space-y-4 relative z-20">
                  {/* Real Logo & Big Typography */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700/70 p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={featuredInst.logo}
                        alt={featuredInst.shortName}
                        onError={(e) => { e.currentTarget.src = '/brand/eduhub-logo.png' }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-none">
                        {featuredInst.shortName}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate mt-1">
                        {featuredInst.fullName}
                      </p>
                    </div>
                  </div>

                  {/* Institutional Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] block uppercase tracking-wider font-semibold">Global Rank</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">QS #334</span>
                    </div>
                    <div className="border-x border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] block uppercase tracking-wider font-semibold">Placement</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">98.4%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] block uppercase tracking-wider font-semibold">Programs</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">160+ Deg.</span>
                    </div>
                  </div>

                  {/* High-Impact Metadata Pod */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] block uppercase tracking-wider font-semibold">Campus</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate block">{featuredInst.address}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] block uppercase tracking-wider font-semibold">Primary Domain</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs truncate block">{featuredInst.sector}</span>
                    </div>
                  </div>

                  {/* Bottom Baseline Action Bar */}
                  <div className="flex items-center justify-between pt-2 mt-auto">
                    <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                      <Star size={16} weight="fill" />
                      <span className="text-slate-900 dark:text-white font-black text-base">{featuredInst.rating}</span>
                      <span className="text-slate-400 font-normal text-xs">({featuredInst.reviewsCount})</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1.5 transition-transform">
                      Explore Institution <ArrowRight size={14} weight="bold" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid with Real Logos, Crisp Photos, and Layered Tactile Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {displayedGridInsts.map((inst) => (
                <div
                  key={inst.id}
                  className="rounded-3xl overflow-hidden relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/70 dark:border-slate-800 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.7)] hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.18)] hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                  onClick={() => navigate('/institute/' + inst.id)}
                >
                  {/* Subtle crystal top sheen */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-emerald-500/[0.02] dark:from-white/[0.04] dark:via-transparent dark:to-emerald-500/[0.03] pointer-events-none z-10" />

                  {/* Campus Image Banner with Frosted Rank Badge */}
                  <div className="relative h-28 sm:h-32 w-full overflow-hidden shrink-0">
                    <img
                      src={inst.image}
                      alt={inst.shortName}
                      onError={(e) => { e.currentTarget.src = '/universities/nust.jpg' }}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                    {/* Monospace Editorial Rank Badge */}
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-black tracking-wider shadow-md backdrop-blur-md bg-slate-950/70 text-white border border-white/20 flex items-center gap-1 z-20">
                      <span className="text-emerald-400">#</span>{inst.rank < 10 ? '0' + inst.rank : inst.rank}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3 relative z-20">
                    {/* Header with Real Official Logo and Bold Typography */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700/70 p-1.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={inst.logo}
                          alt={inst.shortName}
                          onError={(e) => { e.currentTarget.src = '/brand/eduhub-logo.png' }}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xl font-black font-display text-slate-900 dark:text-white truncate leading-tight">
                          {inst.shortName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          {inst.fullName}
                        </p>
                      </div>
                    </div>

                    {/* Layered Location & Sector Pod */}
                    <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{inst.address}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[140px] text-right">{inst.sector}</span>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-1 mt-auto">
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star size={14} weight="fill" />
                        <span className="text-slate-900 dark:text-white font-extrabold text-sm">{inst.rating}</span>
                        <span className="text-slate-400 font-normal text-[11px]">({inst.reviewsCount})</span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                        View Profile <ArrowRight size={13} weight="bold" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Expand Toggle Bar */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowAllInstitutes(prev => !prev)}
              className="px-6 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2.5 group cursor-pointer"
            >
              <Buildings size={17} weight="bold" className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>
                {showAllInstitutes 
                  ? 'Collapse to Top 5 Institutions' 
                  : 'View All 7 Verified Campuses (Includes AKU & NCA)'}
              </span>
              {showAllInstitutes ? <CaretUp size={15} weight="bold" /> : <CaretDown size={15} weight="bold" />}
            </button>
          </div>
        </section>

        {/* ─── Upcoming Events (Interactive Layout) ─── */}
        <section className="py-28 px-6 bg-transparent border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-2">
                  Campus Calendar // 2026
                </p>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Upcoming <br />
                  <span className="text-gradient-emerald">Events & Hackathons</span>
                </h2>
              </div>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-md">
                Exclusive national seminars, tech symposiums, and research conferences across member campuses.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {events.map((ev) => {
                const inst = institutes.find(i => i.id === ev.instituteId)
                const dateParts = ev.date.split(' ')
                const month = dateParts[0]
                const day = dateParts[1]?.replace(',', '')

                return (
                  <div
                    key={ev.id}
                    className="scroll-reveal flex items-center justify-between py-8 px-2 transition-all duration-300 hover:pl-6 cursor-pointer group flex-wrap gap-4"
                    onClick={() => navigate('/institute/' + ev.instituteId)}
                  >
                    <div className="flex items-center gap-6 md:gap-12 flex-wrap">
                      <div className="w-20">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                          {month}
                        </span>
                        <span className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-none">
                          {day}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          {ev.title}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm md:text-base mt-2">
                          <MapPin size={18} />
                          <span>{inst?.name || 'EduHub Campus'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white transition-all duration-200 shadow-sm">
                      <CaretRight size={22} weight="bold" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── Cross-Platform OS: PC & Mobile Device Showcase ("What You Get") ─── */}
        <DeviceShowcase onGetStarted={handleOpenGetStarted} navigate={navigate} />

        {/* ─── Platform Capabilities: Bento Grid ─── */}
        <section id="roles" className="py-24 px-6 max-w-7xl mx-auto">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-2">
              Five Governance Tiers
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
              Every role. One platform.
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              EduHub is role-scoped by design — strict least-privilege access from Super Administrator down to enrolled students and their guardians.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BentoCard className="scroll-reveal">
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                  alt="Students"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
                  Students &amp; Guardians
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Read-only access to courses, attendance records, grades, daily diaries, and fee vouchers. Guardians are notified in real time via the parent broadcast channel.
                </p>
              </div>
            </BentoCard>

            <BentoCard className="scroll-reveal">
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80"
                  alt="Faculty"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
                  Faculty &amp; Instructors
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Scoped read/write access to assigned class rosters, gradebooks, assignment submission grading, and daily academic diaries — timetable collision detection included.
                </p>
              </div>
            </BentoCard>

            <BentoCard className="scroll-reveal">
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80"
                  alt="Executives"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
                  Institute Admins &amp; Campus Managers
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Institute Admins manage all branches with aggregate enrollment and fee metrics. Campus Managers control local timetables, rosters, exam invigilation, and admissions — scoped to their branch only.
                </p>
              </div>
            </BentoCard>

            <BentoCard isLarge className="scroll-reveal p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                <div className="max-w-md space-y-3">
                  <h3 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
                    Multi-tenant isolation by design.
                  </h3>
                  <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Every query executes under parameter-enforced <code className="text-xs font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">institute_id</code> and <code className="text-xs font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">campus_id</code> constraints. Grades, fees, and staff records are cryptographically tenant-isolated — no cross-tenant data access is architecturally possible.
                  </p>
                </div>

                {/* Minimalist, Elegant Dashboard Mock UI */}
                <div className="w-full md:w-80 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      EH
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2.5 w-3/4 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <div className="h-2 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                      <span>Enrollment Index</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">100% Synced</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="w-full h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>Live Cloud Engine</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard className="scroll-reveal">
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80"
                  alt="Events"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
                  Super Administrator
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  System-level infrastructure governance: tenant provisioning, global directory verification, audit trail review, and cross-institutional analytics — accessible only to EduHub platform operators.
                </p>
              </div>
            </BentoCard>
          </div>
        </section>

        {/* ─── Integrations (Smooth Floating Interactive Ecosystem) ─── */}
        <section className="py-24 sm:py-28 px-6 text-center relative overflow-hidden bg-transparent border-t border-slate-200/60 dark:border-slate-800/60">
          {/* Ambient Radial Soft Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[220px] bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto mb-16"
          >
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-3">
              Decoupled API Architecture
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
              Connect without surrendering <br className="hidden sm:inline" />
              <span className="text-gradient-emerald">
                your data.
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-4 leading-relaxed max-w-xl mx-auto font-normal">
              Route validated admission applications into your existing ERP via HMAC-signed webhooks. Keep your student database, financial ledgers, and faculty records behind your own firewall.
            </p>
          </motion.div>

          {/* Liquid-Smooth Floating Interactive Icons */}
          <div className="relative flex justify-center items-center gap-5 sm:gap-8 md:gap-10 min-h-[180px] max-w-4xl mx-auto flex-wrap">
            {/* Ambient Connecting Accent Line */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none hidden sm:block" />

            {/* Tool 1: Video Lectures */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center"
              animate={{
                y: [0, -18, 2, -15, 0],
                x: [0, 4, -3, 2, 0],
                rotate: [0, -3, 2, -2, 0]
              }}
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ 
                scale: 1.15, 
                y: -10,
                transition: { type: "spring", stiffness: 400, damping: 18 } 
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute -inset-2 rounded-3xl bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-red-500/50 group-hover:shadow-[0_20px_40px_-8px_rgba(239,68,68,0.3)]">
                <VideoCamera size={34} className="text-red-500 transition-transform duration-300 group-hover:scale-110" weight="duotone" />
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap -translate-y-1 group-hover:translate-y-0">
                Live Video
              </span>
            </motion.div>

            {/* Tool 2: Campus Chat */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center"
              animate={{
                y: [-12, 10, -14, 8, -12],
                x: [0, -5, 3, -2, 0],
                rotate: [2, -2, 3, -1, 2]
              }}
              transition={{
                duration: 7.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
              whileHover={{ 
                scale: 1.15, 
                y: -10,
                transition: { type: "spring", stiffness: 400, damping: 18 } 
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute -inset-2 rounded-3xl bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-[0_20px_40px_-8px_rgba(147,51,234,0.3)]">
                <ChatCircle size={40} className="text-purple-600 transition-transform duration-300 group-hover:scale-110" weight="duotone" />
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap -translate-y-1 group-hover:translate-y-0">
                Campus Chat
              </span>
            </motion.div>

            {/* Tool 3: Cloud Engine (Central Hero) */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center z-10"
              animate={{
                y: [8, -20, 6, -18, 8],
                x: [0, 4, -4, 2, 0],
                rotate: [-1, 2, -2, 1, -1]
              }}
              transition={{
                duration: 5.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.1
              }}
              whileHover={{ 
                scale: 1.15, 
                y: -10,
                transition: { type: "spring", stiffness: 400, damping: 18 } 
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute -inset-3 rounded-3xl bg-blue-500/25 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800/90 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_44px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-blue-500/60 group-hover:shadow-[0_24px_50px_-10px_rgba(59,130,246,0.45)]">
                <Cloud size={52} className="text-blue-500 transition-transform duration-300 group-hover:scale-110" weight="duotone" />
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap -translate-y-1 group-hover:translate-y-0">
                Cloud Sync
              </span>
            </motion.div>

            {/* Tool 4: Course Records */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center"
              animate={{
                y: [-10, 12, -8, 14, -10],
                x: [0, -3, 4, -2, 0],
                rotate: [-2, 3, -1, 2, -2]
              }}
              transition={{
                duration: 7.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              whileHover={{ 
                scale: 1.15, 
                y: -10,
                transition: { type: "spring", stiffness: 400, damping: 18 } 
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute -inset-2 rounded-3xl bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-indigo-500/50 group-hover:shadow-[0_20px_40px_-8px_rgba(79,70,229,0.3)]">
                <FileText size={40} className="text-indigo-600 transition-transform duration-300 group-hover:scale-110" weight="duotone" />
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap -translate-y-1 group-hover:translate-y-0">
                Course Files
              </span>
            </motion.div>

            {/* Tool 5: Academic Calendar */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center"
              animate={{
                y: [4, -16, 0, -14, 4],
                x: [0, 4, -2, 3, 0],
                rotate: [3, -1, 2, -3, 3]
              }}
              transition={{
                duration: 6.7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              whileHover={{ 
                scale: 1.15, 
                y: -10,
                transition: { type: "spring", stiffness: 400, damping: 18 } 
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute -inset-2 rounded-3xl bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-emerald-500/50 group-hover:shadow-[0_20px_40px_-8px_rgba(16,185,129,0.3)]">
                <Calendar size={34} className="text-emerald-600 transition-transform duration-300 group-hover:scale-110" weight="duotone" />
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap -translate-y-1 group-hover:translate-y-0">
                Schedules
              </span>
            </motion.div>
          </div>
        </section>

        {/* ─── AI-Powered Campus Intelligence ─── */}
        <section className="border-t border-slate-200/60 dark:border-slate-800/60 bg-transparent">
          <AIChatDemo />
        </section>

        {/* ─── Closing CTA ─── */}
        <section className="py-28 px-6 bg-transparent border-t border-slate-200/60 dark:border-slate-800/60">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-4">
              Get Started Today
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display mb-5">
              Ready to modernize{' '}
              <span className="text-gradient-emerald">your institution?</span>
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto mb-10">
              Join Pakistan's fastest-growing educational technology network. Register your campus and give students, faculty, and administrators the platform they deserve.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleOpenGetStarted}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5"
              >
                Register Campus
              </button>
              <button
                onClick={() => navigate('/institute')}
                className="px-8 py-3.5 bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold rounded-xl transition-all duration-200 text-sm hover:-translate-y-0.5"
              >
                Explore Institutions
              </button>
            </div>
          </motion.div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="pt-20 bg-emerald-700 dark:bg-[#060608] text-white relative overflow-hidden border-t border-emerald-800 dark:border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-12 relative z-10 pb-16">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl p-1.5 flex items-center justify-center border border-white/20 shadow-sm">
                  <img src="/brand/eduhub-logo.png" alt="EduHub Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-display font-black text-2xl tracking-tight">EduHub</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                A hybrid educational technology ecosystem resolving information asymmetry for students and operational fragmentation for institutions — from coaching academies to chartered universities.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16 text-sm">
              <div>
                <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Product</h4>
                <ul className="space-y-3 text-white/80">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#institutes" className="hover:text-white transition-colors">Institutes</a></li>
                  <li><a href="#alumni" className="hover:text-white transition-colors">Alumni Network</a></li>
                  <li><span onClick={handleOpenGetStarted} className="hover:text-white cursor-pointer transition-colors">Register Campus</span></li>
                  <li><a href={getManagementLoginUrl()} className="text-emerald-300 font-semibold hover:text-white transition-colors flex items-center gap-1">Management Portal ↗</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Resources</h4>
                <ul className="space-y-3 text-white/80">
                  <li><a href={getManagementDashboardUrl()} className="hover:text-white transition-colors">Campus Dashboard</a></li>
                  <li><a href={getManagementLoginUrl()} className="hover:text-white transition-colors">Staff & Student Login</a></li>
                  <li><span className="hover:text-white cursor-pointer transition-colors">Documentation</span></li>
                  <li><span className="hover:text-white cursor-pointer transition-colors">API Reference</span></li>
                  <li><span className="hover:text-white cursor-pointer transition-colors">Support Portal</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Community</h4>
                <ul className="space-y-3 text-white/80">
                  <li><span className="hover:text-white cursor-pointer transition-colors">Student Hub</span></li>
                  <li><span className="hover:text-white cursor-pointer transition-colors">Teachers Guild</span></li>
                  <li><span className="hover:text-white cursor-pointer transition-colors">Hackathons</span></li>
                  <li><span className="hover:text-white cursor-pointer transition-colors">Careers</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Massive Text Background Brand Watermark */}
          <div className="text-center relative overflow-hidden h-[18vw] pointer-events-none select-none">
            <h1 className="text-[24vw] font-black leading-none bg-gradient-to-b from-white/20 to-transparent bg-clip-text text-transparent absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
              EduHub
            </h1>
          </div>
        </footer>

        {/* Get Started Modal */}
        <GetStartedModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </div>
  )
}
