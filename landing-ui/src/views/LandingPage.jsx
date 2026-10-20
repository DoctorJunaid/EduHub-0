import React, { useState, useEffect } from 'react'
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
import { top_alumni, events } from '@/data/mockData'
import Navbar from '@/components/layout/Navbar'
import HeroFanDeck from '@/components/HeroFanDeck/HeroFanDeck'
import WebGLBackground from '@/components/WebGLBackground'
import BentoCard from '@/components/shared/BentoCard'
import GetStartedModal from '@/components/GetStartedModal'
import DeviceShowcase from '@/components/showcase/DeviceShowcase'
import AIChatDemo from '@/components/AIChatDemo/AIChatDemo'
import { getManagementLoginUrl, getManagementDashboardUrl, getBackendApiUrl } from '@/config/urls'

export default function LandingPage({ onGetStarted, isDark, setIsDark }) {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [showAllInstitutes, setShowAllInstitutes] = useState(false)
  const [institutes, setInstitutes] = useState([])
  const [loadingInstitutes, setLoadingInstitutes] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchInstitutes = async () => {
      try {
        const apiUrl = getBackendApiUrl()
        const res = await fetch(`${apiUrl}/inquiries/public-institutes`)
        const json = await res.json()
        if (isMounted && json.success && Array.isArray(json.data)) {
          setInstitutes(json.data)
        }
      } catch (err) {
        console.warn('Failed to fetch live institutes directory:', err.message)
      } finally {
        if (isMounted) setLoadingInstitutes(false)
      }
    }
    fetchInstitutes()
    return () => { isMounted = false }
  }, [])

  // Duplicate alumni for seamless infinite scrolling marquee
  const marqueeAlumni = [...top_alumni, ...top_alumni]

  // Top Ranked Real Institutions spotlight from live database
  const featuredInst = institutes[0] || null
  const otherInsts = institutes.slice(1)
  const displayedGridInsts = showAllInstitutes ? otherInsts : otherInsts.slice(0, 4)

  const handleOpenGetStarted = () => {
    if (onGetStarted) {
      onGetStarted()
    } else {
      setModalOpen(true)
    }
  }

  return (
    <div className="landing-page relative w-full max-w-full overflow-x-hidden min-h-screen bg-transparent text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* 3D WebGL Particle Background */}
      <WebGLBackground isDark={isDark} />

      {/* Floating Dynamic Navbar (Hides on scroll down, reveals on scroll up) */}
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        onGetStarted={handleOpenGetStarted}
      />

      <div className="relative z-10 pt-4 sm:pt-6">
        {/* ─── Hero Section: Animated Fan Deck ─── */}
        <HeroFanDeck onGetStarted={handleOpenGetStarted} navigate={navigate} />

        {/* ─── Top Alumni List (Success Stories) ─── */}
        <section id="alumni" className="py-12 sm:py-20 lg:py-24 bg-transparent overflow-hidden">
          <motion.div
            className="text-center max-w-2xl mx-auto px-4 sm:px-6 mb-8 sm:mb-14"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-2">
              Verified Alumni Intelligence
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Where our graduates work.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mt-2 sm:mt-3 max-w-xl mx-auto leading-relaxed">
              Institutions advertise placement rates — EduHub verifies them. Real alumni, real employers, real career trajectories.
            </p>
          </motion.div>

          <div className="marquee-container max-w-full overflow-hidden">
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

        {/* ─── Top Ranking Institutes: Editorial Showcase ─── */}
        <section id="institutes" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full bg-transparent border-t border-slate-200/60 dark:border-slate-800/60">
          <motion.div
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8"
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
              {institutes.length > 5 && (
                <button
                  onClick={() => setShowAllInstitutes(prev => !prev)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer w-full sm:w-auto"
                >
                  <Buildings size={16} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                  <span>{showAllInstitutes ? 'Show Top 5 Only' : `View All ${institutes.length} Institutions`}</span>
                  {showAllInstitutes ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                </button>
              )}
            </div>
          </motion.div>

          {loadingInstitutes ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-slate-500">Loading registered institutions...</p>
            </div>
          ) : institutes.length === 0 ? (
            <div className="rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
                <Buildings size={32} weight="duotone" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Institutions Registered Yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                EduHub is running on live, real database records. Submit an inquiry or register your educational institution to be showcased here.
              </p>
              <button
                onClick={handleOpenGetStarted}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Buildings size={16} weight="bold" />
                <span>Register Your Institution</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Featured University Card: 1 col on mobile (<768px), 1 col on tablet, 5 cols of 12 on desktop */}
              {featuredInst && (
                <div
                  className="lg:col-span-5 rounded-2xl sm:rounded-3xl overflow-hidden relative border border-slate-200/70 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.18)] hover:-translate-y-1 flex flex-col justify-between group cursor-pointer"
                  onClick={() => navigate('/institute/' + (featuredInst.id || featuredInst._id))}
                >
                  {/* Crystal top sheen */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-emerald-500/[0.02] dark:from-white/[0.04] dark:via-transparent dark:to-emerald-500/[0.03] pointer-events-none z-10" />

                  {/* Hero Image Banner with Rank #01 Badge */}
                  <div className="relative h-44 sm:h-52 md:h-56 w-full overflow-hidden shrink-0">
                    <img
                      src={featuredInst.image || '/universities/nust.jpg'}
                      alt={featuredInst.shortName || featuredInst.name}
                      onError={(e) => { e.currentTarget.src = '/universities/nust.jpg' }}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                    {/* Monospace Rank Pill */}
                    <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 px-2.5 sm:px-3 py-1 rounded-lg bg-slate-950/75 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-black tracking-wider flex items-center gap-1.5 shadow-lg z-20">
                      <span className="text-emerald-400">#01</span>
                      <span className="text-[10px] text-white/80 uppercase tracking-widest">Verified</span>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-4 sm:p-6 flex flex-col justify-between flex-1 space-y-4 relative z-20">
                    {/* Real Logo & Big Typography */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700/70 p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={featuredInst.logo || '/brand/eduhub-logo.png'}
                          alt={featuredInst.shortName || featuredInst.name}
                          onError={(e) => { e.currentTarget.src = '/brand/eduhub-logo.png' }}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                          {featuredInst.shortName || featuredInst.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 sm:mt-1">
                          {featuredInst.fullName || featuredInst.name}
                        </p>
                      </div>
                    </div>

                    {/* Institutional Key Metrics Grid (Fluid 3 Columns) */}
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center">
                      <div className="min-w-0">
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px] sm:text-[10px] block uppercase tracking-wider font-semibold truncate">Affiliation</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate block">{featuredInst.board || 'HEC Accredited'}</span>
                      </div>
                      <div className="border-x border-slate-200/60 dark:border-slate-700/60 min-w-0 px-1">
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px] sm:text-[10px] block uppercase tracking-wider font-semibold truncate">Campuses</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm truncate block">{featuredInst.campusCount || 1} Campus{featuredInst.campusCount === 1 ? '' : 'es'}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px] sm:text-[10px] block uppercase tracking-wider font-semibold truncate">Students</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate block">{featuredInst.studentCount || 0} Scholars</span>
                      </div>
                    </div>

                    {/* Metadata Pod */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px] sm:text-[10px] block uppercase tracking-wider font-semibold">City</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate block">{featuredInst.city || 'Islamabad'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px] sm:text-[10px] block uppercase tracking-wider font-semibold">Classification</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs truncate block">{featuredInst.type}</span>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-2 mt-auto">
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                        <Star size={16} weight="fill" />
                        <span className="text-slate-900 dark:text-white font-black text-sm sm:text-base">{featuredInst.rating || 4.9}</span>
                        <span className="text-slate-400 font-normal text-xs">({featuredInst.reviewsCount || 'Verified'})</span>
                      </div>
                      <span className="min-h-[44px] inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1.5 transition-transform">
                        Explore Institution <ArrowRight size={14} weight="bold" />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid: 1 col on mobile (<768px), 2 cols on tablet & desktop */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {displayedGridInsts.map((inst, idx) => (
                  <div
                    key={inst.id || inst._id}
                    className="rounded-2xl sm:rounded-3xl overflow-hidden relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/70 dark:border-slate-800 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.7)] hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.18)] hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                    onClick={() => navigate('/institute/' + (inst.id || inst._id))}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-emerald-500/[0.02] dark:from-white/[0.04] dark:via-transparent dark:to-emerald-500/[0.03] pointer-events-none z-10" />

                    {/* Campus Image Banner */}
                    <div className="relative h-28 sm:h-32 w-full overflow-hidden shrink-0">
                      <img
                        src={inst.image || '/universities/nust.jpg'}
                        alt={inst.shortName || inst.name}
                        onError={(e) => { e.currentTarget.src = '/universities/nust.jpg' }}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                      {/* Monospace Editorial Rank Badge */}
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-black tracking-wider shadow-md backdrop-blur-md bg-slate-950/75 text-white border border-white/20 flex items-center gap-1 z-20">
                        <span className="text-emerald-400">#</span>{(idx + 2) < 10 ? '0' + (idx + 2) : (idx + 2)}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3 relative z-20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700/70 p-1.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={inst.logo || '/brand/eduhub-logo.png'}
                            alt={inst.shortName || inst.name}
                            onError={(e) => { e.currentTarget.src = '/brand/eduhub-logo.png' }}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-white truncate leading-tight">
                            {inst.shortName || inst.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                            {inst.fullName || inst.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{inst.city || 'Pakistan'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[130px] text-right">{inst.type} • {inst.campusCount || 1} Campus{inst.campusCount === 1 ? '' : 'es'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 mt-auto">
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                          <Star size={14} weight="fill" />
                          <span className="text-slate-900 dark:text-white font-extrabold text-sm">{inst.rating || 4.9}</span>
                          <span className="text-slate-400 font-normal text-[11px]">({inst.reviewsCount || 'Verified'})</span>
                        </div>
                        <span className="min-h-[44px] inline-flex items-center gap-1 font-bold text-xs text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                          View Profile <ArrowRight size={13} weight="bold" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Expand Toggle Bar */}
          {institutes.length > 5 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowAllInstitutes(prev => !prev)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <Buildings size={17} weight="bold" className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>
                  {showAllInstitutes 
                    ? 'Collapse to Top 5 Institutions' 
                    : `View All ${institutes.length} Registered Institutions`}
                </span>
                {showAllInstitutes ? <CaretUp size={15} weight="bold" /> : <CaretDown size={15} weight="bold" />}
              </button>
            </div>
          )}
        </section>

        {/* ─── Upcoming Events (Interactive Layout) ─── */}
        <section id="events" className="py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-transparent border-b border-slate-200/60 dark:border-slate-800/60 max-w-5xl mx-auto w-full">
          <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-10 sm:mb-16">
              <div>
                <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-2">
                  Campus Calendar // 2026
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Upcoming <br />
                  <span className="text-gradient-emerald">Events & Hackathons</span>
                </h2>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-md">
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
                    className="scroll-reveal flex items-center justify-between py-6 sm:py-8 px-2 sm:px-4 transition-all duration-300 hover:pl-4 sm:hover:pl-6 cursor-pointer group gap-4 min-h-[72px]"
                    onClick={() => navigate('/institute/' + ev.instituteId)}
                  >
                    <div className="flex items-center gap-4 sm:gap-8 md:gap-12 min-w-0 flex-1">
                      <div className="w-14 sm:w-20 shrink-0">
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-0.5 sm:mb-1">
                          {month}
                        </span>
                        <span className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-none">
                          {day}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors truncate">
                          {ev.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                          <MapPin size={16} className="shrink-0" />
                          <span className="truncate">{inst?.name || 'EduHub Campus'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white transition-all duration-200 shadow-sm shrink-0">
                      <CaretRight size={20} weight="bold" />
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
        {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
        <section id="roles" className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-2">
              Five Governance Tiers
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
              Every role. One platform.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mt-2 sm:mt-3 leading-relaxed">
              EduHub is role-scoped by design — strict least-privilege access from Super Administrator down to enrolled students and their guardians.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <BentoCard className="scroll-reveal">
              <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                  alt="Students"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-5 sm:p-7">
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
                  Students &amp; Guardians
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Read-only access to courses, attendance records, grades, daily diaries, and fee vouchers. Guardians are notified in real time via the parent broadcast channel.
                </p>
              </div>
            </BentoCard>

            <BentoCard className="scroll-reveal">
              <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80"
                  alt="Faculty"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-5 sm:p-7">
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
                  Faculty &amp; Instructors
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Scoped read/write access to assigned class rosters, gradebooks, assignment submission grading, and daily academic diaries — timetable collision detection included.
                </p>
              </div>
            </BentoCard>

            <BentoCard className="scroll-reveal">
              <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80"
                  alt="Executives"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-5 sm:p-7">
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
                  Institute Admins &amp; Campus Managers
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Institute Admins manage all branches with aggregate enrollment and fee metrics. Campus Managers control local timetables, rosters, exam invigilation, and admissions.
                </p>
              </div>
            </BentoCard>

            {/* Large Card: 1 col on mobile, 2 cols on tablet & desktop */}
            <BentoCard isLarge className="scroll-reveal p-6 sm:p-8 md:p-10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 h-full">
                <div className="max-w-md space-y-3">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
                    Multi-tenant isolation by design.
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Every query executes under parameter-enforced <code className="text-xs font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">institute_id</code> and <code className="text-xs font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">campus_id</code> constraints. Grades, fees, and staff records are cryptographically tenant-isolated.
                  </p>
                </div>

                {/* Dashboard Mock UI */}
                <div className="w-full lg:w-80 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 space-y-4 shadow-sm">
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
              <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80"
                  alt="Events"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-5 sm:p-7">
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
                  Super Administrator
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  System-level infrastructure governance: tenant provisioning, global directory verification, audit trail review, and cross-institutional analytics.
                </p>
              </div>
            </BentoCard>
          </div>
        </section>

        {/* ─── Integrations (Smooth Floating Interactive Ecosystem) ─── */}
        <section className="py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden bg-transparent border-t border-slate-200/60 dark:border-slate-800/60 max-w-7xl mx-auto w-full">
          {/* Ambient Radial Soft Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[650px] h-[180px] sm:h-[220px] bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto mb-10 sm:mb-16"
          >
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-2 sm:mb-3">
              Decoupled API Architecture
            </p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
              Connect without surrendering <br className="hidden sm:inline" />
              <span className="text-gradient-emerald">
                your data.
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 mt-3 sm:mt-4 leading-relaxed max-w-xl mx-auto font-normal">
              Route validated admission applications into your existing ERP via HMAC-signed webhooks. Keep your student database, financial ledgers, and faculty records behind your own firewall.
            </p>
          </motion.div>

          {/* Liquid-Smooth Floating Interactive Icons */}
          <div className="relative flex justify-center items-center gap-3 sm:gap-6 md:gap-10 min-h-[140px] sm:min-h-[180px] max-w-4xl mx-auto flex-wrap">
            {/* Ambient Connecting Accent Line */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none hidden sm:block" />

            {/* Tool 1: Video Lectures */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center"
              animate={{
                y: [0, -14, 2, -12, 0],
                x: [0, 3, -2, 2, 0],
                rotate: [0, -3, 2, -2, 0]
              }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.15, y: -8, transition: { type: "spring", stiffness: 400, damping: 18 } }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-red-500/50">
                <VideoCamera className="text-red-500 transition-transform duration-300 group-hover:scale-110 w-6 h-6 sm:w-8 sm:h-8" weight="duotone" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap">
                Live Video
              </span>
            </motion.div>

            {/* Tool 2: Campus Chat */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center"
              animate={{
                y: [-10, 8, -12, 6, -10],
                x: [0, -4, 2, -2, 0],
                rotate: [2, -2, 3, -1, 2]
              }}
              transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              whileHover={{ scale: 1.15, y: -8, transition: { type: "spring", stiffness: 400, damping: 18 } }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-purple-500/50">
                <ChatCircle className="text-purple-600 transition-transform duration-300 group-hover:scale-110 w-7 h-7 sm:w-10 sm:h-10" weight="duotone" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap">
                Campus Chat
              </span>
            </motion.div>

            {/* Tool 3: Cloud Engine (Central Hero) */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center z-10"
              animate={{
                y: [6, -16, 5, -14, 6],
                x: [0, 3, -3, 2, 0],
                rotate: [-1, 2, -2, 1, -1]
              }}
              transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
              whileHover={{ scale: 1.15, y: -8, transition: { type: "spring", stiffness: 400, damping: 18 } }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800/90 shadow-xl backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-blue-500/60">
                <Cloud className="text-blue-500 transition-transform duration-300 group-hover:scale-110 w-9 h-9 sm:w-13 sm:h-13" weight="duotone" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap">
                Cloud Sync
              </span>
            </motion.div>

            {/* Tool 4: Course Records */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center"
              animate={{
                y: [-8, 10, -6, 11, -8],
                x: [0, -2, 3, -2, 0],
                rotate: [-2, 3, -1, 2, -2]
              }}
              transition={{ duration: 7.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              whileHover={{ scale: 1.15, y: -8, transition: { type: "spring", stiffness: 400, damping: 18 } }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-indigo-500/50">
                <FileText className="text-indigo-600 transition-transform duration-300 group-hover:scale-110 w-7 h-7 sm:w-10 sm:h-10" weight="duotone" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap">
                Course Files
              </span>
            </motion.div>

            {/* Tool 5: Academic Calendar */}
            <motion.div
              className="scroll-reveal relative group cursor-pointer flex flex-col items-center"
              animate={{
                y: [3, -13, 0, -11, 3],
                x: [0, 3, -2, 2, 0],
                rotate: [3, -1, 2, -3, 3]
              }}
              transition={{ duration: 6.7, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              whileHover={{ scale: 1.15, y: -8, transition: { type: "spring", stiffness: 400, damping: 18 } }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-xl flex items-center justify-center transition-all duration-300 group-hover:border-emerald-500/50">
                <Calendar className="text-emerald-600 transition-transform duration-300 group-hover:scale-110 w-6 h-6 sm:w-8 sm:h-8" weight="duotone" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 tracking-wider uppercase select-none pointer-events-none whitespace-nowrap">
                Schedules
              </span>
            </motion.div>
          </div>
        </section>

        {/* ─── AI-Powered Campus Intelligence ─── */}
        <section className="border-t border-slate-200/60 dark:border-slate-800/60 bg-transparent w-full">
          <AIChatDemo />
        </section>

        {/* ─── Closing CTA ─── */}
        <section className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-slate-200/60 dark:border-slate-800/60 max-w-7xl mx-auto w-full">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-3 sm:mb-4">
              Get Started Today
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display mb-3 sm:mb-5">
              Ready to modernize{' '}
              <span className="text-gradient-emerald">your institution?</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto mb-8 sm:mb-10">
              Join Pakistan's fastest-growing educational technology network. Register your campus and give students, faculty, and administrators the platform they deserve.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
              <button
                onClick={handleOpenGetStarted}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Register Campus</span>
                <ArrowRight size={16} weight="bold" />
              </button>
              <button
                onClick={() => navigate('/institute')}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold rounded-xl transition-all duration-200 text-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Directory</span>
              </button>
            </div>
          </motion.div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="pt-14 sm:pt-20 bg-emerald-700 dark:bg-[#060608] text-white relative overflow-hidden border-t border-emerald-800 dark:border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row justify-between gap-8 sm:gap-12 relative z-10 pb-12 sm:pb-16">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl p-1.5 flex items-center justify-center border border-white/20 shadow-sm">
                  <img src="/brand/eduhub-logo.png" alt="EduHub Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-display font-black text-2xl tracking-tight">EduHub</span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                A hybrid educational technology ecosystem resolving information asymmetry for students and operational fragmentation for institutions — from coaching academies to chartered universities.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-16 text-xs sm:text-sm">
              <div>
                <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-xs">Product</h4>
                <ul className="space-y-2.5 sm:space-y-3 text-white/80">
                  <li><a href="#features" className="py-1 inline-block hover:text-white transition-colors">Features</a></li>
                  <li><a href="#institutes" className="py-1 inline-block hover:text-white transition-colors">Institutes</a></li>
                  <li><a href="#alumni" className="py-1 inline-block hover:text-white transition-colors">Alumni Network</a></li>
                  <li><span onClick={handleOpenGetStarted} className="py-1 inline-block hover:text-white cursor-pointer transition-colors">Register Campus</span></li>
                  <li><a href={getManagementLoginUrl()} className="py-1 text-emerald-300 font-semibold hover:text-white transition-colors flex items-center gap-1">Management Portal ↗</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-xs">Resources</h4>
                <ul className="space-y-2.5 sm:space-y-3 text-white/80">
                  <li><a href={getManagementDashboardUrl()} className="py-1 inline-block hover:text-white transition-colors">Campus Dashboard</a></li>
                  <li><a href={getManagementLoginUrl()} className="py-1 inline-block hover:text-white transition-colors">Staff & Student Login</a></li>
                  <li><span className="py-1 inline-block hover:text-white cursor-pointer transition-colors">Documentation</span></li>
                  <li><span className="py-1 inline-block hover:text-white cursor-pointer transition-colors">API Reference</span></li>
                  <li><span className="py-1 inline-block hover:text-white cursor-pointer transition-colors">Support Portal</span></li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <h4 className="font-bold text-white mb-3 sm:mb-4 uppercase tracking-wider text-xs">Community</h4>
                <ul className="space-y-2.5 sm:space-y-3 text-white/80">
                  <li><span className="py-1 inline-block hover:text-white cursor-pointer transition-colors">Student Hub</span></li>
                  <li><span className="py-1 inline-block hover:text-white cursor-pointer transition-colors">Teachers Guild</span></li>
                  <li><span className="py-1 inline-block hover:text-white cursor-pointer transition-colors">Hackathons</span></li>
                  <li><span className="py-1 inline-block hover:text-white cursor-pointer transition-colors">Careers</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Background Brand Watermark without overflow */}
          <div className="text-center relative overflow-hidden h-[14vw] sm:h-[18vw] pointer-events-none select-none max-w-full">
            <h1 className="text-[18vw] sm:text-[24vw] font-black leading-none bg-gradient-to-b from-white/20 to-transparent bg-clip-text text-transparent absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
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
