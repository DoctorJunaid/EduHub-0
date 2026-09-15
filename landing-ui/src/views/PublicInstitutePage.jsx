import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Star, 
  MapPin, 
  ArrowLeft, 
  ArrowRight,
  GraduationCap,
  CheckCircle,
  Phone,
  Envelope,
  DownloadSimple,
  Buildings,
  ShieldCheck,
  X
} from '@phosphor-icons/react'
import { useParams, useNavigate } from 'react-router-dom'
import { institutes, getInstituteData } from '@/data/mockData'
import Navbar from '@/components/layout/Navbar'
import GetStartedModal from '@/components/GetStartedModal'

export default function PublicInstitutePage({ isDark, setIsDark, onGetStarted }) {
  const { id: instituteId } = useParams()
  const navigate = useNavigate()
  const [partnerModalOpen, setPartnerModalOpen] = useState(false)

  // Always resolve to a valid institute, defaulting to NUST if unmatched
  const inst = useMemo(() => {
    return getInstituteData(instituteId) || getInstituteData('inst_1') || institutes[0]
  }, [instituteId])

  // Interactive Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    program: '',
    qualification: 'FSc Pre-Engineering'
  })
  const [applySuccess, setApplySuccess] = useState(false)
  const [applicationId, setApplicationId] = useState('')

  // Prospectus notification
  const [prospectusDownloaded, setProspectusDownloaded] = useState(false)

  const handleOpenPartnerModal = () => {
    if (onGetStarted) {
      onGetStarted()
    } else {
      setPartnerModalOpen(true)
    }
  }

  const handleOpenApply = (prog = null) => {
    const progName = prog?.name || (inst.programs && inst.programs[0]?.name) || 'BS Computer Science'
    setSelectedProgram(prog)
    setApplyForm(prev => ({ ...prev, program: progName }))
    setApplySuccess(false)
    setIsApplyModalOpen(true)
  }

  const handleApplySubmit = (e) => {
    e.preventDefault()
    if (!applyForm.name || !applyForm.email || !applyForm.phone) return
    const randomId = `EDU-2026-${inst.shortName}-${Math.floor(1000 + Math.random() * 9000)}`
    setApplicationId(randomId)
    setApplySuccess(true)
  }

  const handleDownloadProspectus = () => {
    setProspectusDownloaded(true)
    setTimeout(() => setProspectusDownloaded(false), 4000)
  }

  const otherInstitutes = institutes.filter(i => i.id !== inst.id)

  return (
    <div className="relative w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">

      {/* Floating Dynamic Navbar */}
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        onGetStarted={handleOpenPartnerModal}
      />

      <div className="relative z-10 pt-24 pb-16">
        
        {/* ─── Top Breadcrumb Navigation ─── */}
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <button 
              onClick={() => navigate('/')} 
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={13} /> EduHub
            </button>
            <span>/</span>
            <button 
              onClick={() => navigate('/#institutes')} 
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Institutions
            </button>
            <span>/</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {inst.shortName}
            </span>
          </div>
        </div>

        {/* ─── SECTION 1: HERO & ESSENTIALS ─── */}
        <section className="max-w-7xl mx-auto px-6 mb-16">
          <div className="rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.7)]">
            
            {/* Campus Panoramic Image Banner */}
            <div className="relative h-72 sm:h-96 w-full overflow-hidden">
              <img 
                src={inst.image} 
                alt={inst.name} 
                onError={(e) => { e.currentTarget.src = '/universities/nust.jpg' }}
                className="w-full h-full object-cover object-center" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Minimal Clean Top Meta Bar */}
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold">
                    {inst.nationalRank || `#0${inst.rank} National Rank`}
                  </span>
                  <span className="px-3 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-medium hidden sm:inline-block">
                    {inst.globalRank || 'QS Ranked'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-white/20 text-white font-bold text-xs">
                  <Star size={14} weight="fill" className="text-amber-400" />
                  <span>{inst.rating}</span>
                  <span className="text-white/60 font-normal">({inst.reviewsCount})</span>
                </div>
              </div>

              {/* Hero Bottom Information */}
              <div className="absolute bottom-6 left-6 right-6 z-20 text-white flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0 border border-white/30 shadow-xl">
                    <img 
                      src={inst.logo} 
                      alt={inst.shortName} 
                      onError={(e) => { e.currentTarget.src = '/brand/eduhub-logo.png' }}
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white leading-tight">
                      {inst.fullName || inst.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-white/80 font-medium mt-1">
                      {inst.motto}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-white/70 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {inst.address}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone size={14} /> {inst.phone}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Envelope size={14} /> {inst.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary CTAs */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleOpenApply()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2"
                  >
                    <GraduationCap size={16} weight="bold" />
                    <span>Apply for Admission</span>
                  </button>
                  <button
                    onClick={handleDownloadProspectus}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/30 transition-all flex items-center gap-1.5"
                  >
                    <DownloadSimple size={15} />
                    <span>Prospectus</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Monochromatic Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70 dark:divide-slate-800 p-5 bg-slate-50/70 dark:bg-slate-900/60 text-center">
              <div className="py-2 px-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Global Standing</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{inst.globalRank || 'Ranked'}</span>
              </div>
              <div className="py-2 px-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Employability</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{inst.placementRate || '98%'}</span>
              </div>
              <div className="py-2 px-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Enrollment</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{inst.studentEnrollment || '15,000+'}</span>
              </div>
              <div className="py-2 px-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Faculty</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{inst.facultyCount || '800+'}</span>
              </div>
              <div className="py-2 px-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Acceptance</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{inst.acceptanceRate || '8%'}</span>
              </div>
              <div className="py-2 px-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">Campus Area</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{inst.campusArea || 'Main Campus'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Prospectus Download Toast ─── */}
        <AnimatePresence>
          {prospectusDownloaded && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-7xl mx-auto px-6 mb-8"
            >
              <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle size={18} weight="fill" className="text-emerald-400" />
                  <span>Official {inst.shortName} Prospectus &amp; Syllabus Guide 2026 downloaded.</span>
                </div>
                <button onClick={() => setProspectusDownloaded(false)}>
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── TOP SECTION: TOP ALUMNI OF THIS INSTITUTION ─── */}
        {inst.alumniList && inst.alumniList.length > 0 && (
          <section id="alumni" className="max-w-7xl mx-auto px-6 mb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                  Distinguished Graduates // {inst.shortName} Network
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                  Top Alumni of {inst.shortName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Where {inst.shortName} graduates are leading today across international engineering, science, and global enterprise.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
                <CheckCircle size={15} weight="fill" />
                <span>HEC &amp; Institutional Registry Verified</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {inst.alumniList.map((alumni) => (
                <div
                  key={alumni.id}
                  className="rounded-3xl overflow-hidden relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.7)] p-6 sm:p-7 flex flex-col justify-between space-y-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.15)] group"
                >
                  {/* Subtle decorative watermark quotation glyph */}
                  <span className="absolute -top-3 right-6 text-7xl font-serif text-slate-200/50 dark:text-slate-800/60 select-none pointer-events-none transition-transform group-hover:scale-110">
                    “
                  </span>

                  <div className="space-y-4 relative z-10">
                    {/* Header: Avatar, Verified Badge, and Company/Domain Tag */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative">
                        <img 
                          src={alumni.picture} 
                          alt={alumni.name} 
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' }}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-300 ring-2 ring-emerald-500/20 shrink-0" 
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white" title="Verified Alumnus">
                          <CheckCircle size={12} weight="fill" />
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        {alumni.company && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-bold tracking-tight">
                            <Buildings size={12} className="text-emerald-500" />
                            {alumni.company}
                          </span>
                        )}
                        {alumni.badge && (
                          <span className="block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {alumni.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name, Role & Location */}
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-display leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {alumni.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                        {alumni.role}
                      </p>
                      {alumni.location && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {alumni.location}
                        </p>
                      )}
                    </div>

                    {/* Quote Narrative Pod */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        "{alumni.successStory}"
                      </p>
                    </div>
                  </div>

                  {/* Editorial Card Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 relative z-10">
                    <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {alumni.year || 'Alumnus'}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck size={13} weight="fill" />
                      {inst.shortName} Verified Record
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── SECTION 2: ACADEMIC PROGRAMS & CURRICULA ─── */}
        <section id="programs" className="max-w-7xl mx-auto px-6 mb-20 border-t border-slate-200/60 dark:border-slate-800/60 pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                Degree Offerings
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                Academic Programs &amp; Degrees
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Official undergraduate, graduate, and doctoral degree paths offered at {inst.shortName}.
              </p>
            </div>
            <button
              onClick={() => handleOpenApply()}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Apply for any program</span>
              <ArrowRight size={12} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inst.programs?.map((prog) => (
              <div
                key={prog.id}
                className="rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {prog.degree}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {prog.duration}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display leading-snug">
                    {prog.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {prog.department}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {prog.description}
                  </p>

                  <div className="pt-2 text-xs space-y-1 text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between py-1">
                      <span>Tuition Fee:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{prog.feePerSemester}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Credit Hours:</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{prog.creditHours} Credits</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {prog.seats} Seats
                  </span>
                  <button
                    onClick={() => handleOpenApply(prog)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION 3: FACULTY & DEANS ─── */}
        {inst.facultyList && inst.facultyList.length > 0 && (
          <section id="faculty" className="max-w-7xl mx-auto px-6 mb-20 border-t border-slate-200/60 dark:border-slate-800/60 pt-16">
            <div className="mb-10">
              <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                Faculty Directory
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                Distinguished Deans &amp; Faculty
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Leading researchers, educators, and chairs heading departments at {inst.shortName}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {inst.facultyList.map((trainer) => (
                <div
                  key={trainer.id}
                  className="rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <img 
                      src={trainer.avatar} 
                      alt={trainer.name} 
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' }}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {trainer.name}
                      </h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        {trainer.position}
                      </p>
                      <p className="text-xs font-mono text-slate-500 mt-1">
                        {trainer.degrees}
                      </p>
                    </div>
                  </div>

                  {trainer.research && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                      <span className="text-slate-400 font-mono text-[10px] block uppercase font-semibold">Specialization</span>
                      <span className="text-slate-700 dark:text-slate-300">{trainer.research}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>{trainer.experience}</span>
                    <button 
                      onClick={() => handleOpenApply()} 
                      className="text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                    >
                      Consult Advisor →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── SECTION 4: CAMPUS FACILITIES & INFRASTRUCTURE ─── */}
        {inst.facilitiesList && inst.facilitiesList.length > 0 && (
          <section id="facilities" className="max-w-7xl mx-auto px-6 mb-20 border-t border-slate-200/60 dark:border-slate-800/60 pt-16">
            <div className="mb-10">
              <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                Campus Infrastructure
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                Laboratories &amp; Facilities
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                State-of-the-art research centers and living spaces driving learning at {inst.shortName}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inst.facilitiesList.map((fac) => (
                <div
                  key={fac.id}
                  className="rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  {fac.image && (
                    <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                      <img 
                        src={fac.image} 
                        alt={fac.title} 
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80' }}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                      {fac.tag && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-semibold">
                          {fac.tag}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-6 space-y-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {fac.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {fac.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── SECTION 5: ADMISSIONS PROCESS & FEE STRUCTURE ─── */}
        <section id="admissions" className="max-w-7xl mx-auto px-6 mb-20 border-t border-slate-200/60 dark:border-slate-800/60 pt-16">
          <div className="mb-10">
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-1">
              Admissions Guide
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
              Admission Steps &amp; Fee Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Standardized admission roadmap and financial schedules for Fall 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { step: '01', title: 'Submit Online Profile', desc: 'Complete registration form with verified academic transcripts.' },
              { step: '02', title: 'Aptitude & Entry Test', desc: 'Appear in institutional entrance exam or provide standardized SAT score.' },
              { step: '03', title: 'Merit Declaration', desc: 'Check published merit ranks and program allocation lists.' },
              { step: '04', title: 'Enrollment Deposit', desc: 'Submit initial dues and receive institutional student portal access.' }
            ].map(item => (
              <div key={item.step} className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">Step {item.step}</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Fee Table Card */}
          <div className="rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Semester Tuition &amp; Access Fees
                </h3>
                <p className="text-xs text-slate-500">Official fee schedule approved for academic year 2026.</p>
              </div>
              <button
                onClick={() => handleOpenApply()}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shrink-0"
              >
                Apply for Merit Aid
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Undergraduate</th>
                    <th className="py-2.5 px-3">Graduate</th>
                    <th className="py-2.5 px-3">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">Tuition (Course Work)</td>
                    <td className="py-3 px-3 font-mono font-bold">PKR 145,000 – 195,000</td>
                    <td className="py-3 px-3 font-mono font-bold">PKR 125,000 – 175,000</td>
                    <td className="py-3 px-3 text-slate-400">Per Semester</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">Laboratory Dues</td>
                    <td className="py-3 px-3 font-mono">PKR 18,000</td>
                    <td className="py-3 px-3 font-mono">PKR 22,000</td>
                    <td className="py-3 px-3 text-slate-400">Per Semester</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">Admission Registration</td>
                    <td className="py-3 px-3 font-mono">PKR 35,000</td>
                    <td className="py-3 px-3 font-mono">PKR 35,000</td>
                    <td className="py-3 px-3 text-slate-400">One-Time Only</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">Security Deposit</td>
                    <td className="py-3 px-3 font-mono">PKR 10,000</td>
                    <td className="py-3 px-3 font-mono">PKR 10,000</td>
                    <td className="py-3 px-3 text-slate-400">Refundable at Graduation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: AFFILIATED CAMPUSES ─── */}
        {inst.branches && inst.branches.length > 0 && (
          <section id="campuses" className="max-w-7xl mx-auto px-6 mb-20 border-t border-slate-200/60 dark:border-slate-800/60 pt-16">
            <div className="mb-8">
              <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                Campus Locations
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                Active Campuses &amp; Branches
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {inst.branches.map(branch => (
                <div 
                  key={branch.id} 
                  className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <MapPin size={15} />
                    <span>Active Campus</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{branch.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{branch.address}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── SECTION 7: CAMPUS ARCHITECTURE & RESEARCH SPACES ─── */}
        {inst.gallery && inst.gallery.length > 0 && (
          <section id="gallery" className="max-w-7xl mx-auto px-6 mb-20 border-t border-slate-200/60 dark:border-slate-800/60 pt-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                  Visual Tour // Campus Environment
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                  Campus Spaces &amp; Architecture
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Living, learning, and research facilities across the {inst.shortName} grounds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {inst.gallery.map((imgUrl, idx) => (
                <div key={idx} className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-800 shadow-sm group">
                  <img
                    src={imgUrl}
                    alt={`${inst.shortName} space ${idx + 1}`}
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80' }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-[11px] font-mono text-white font-semibold">
                      Campus Wing // 0{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── SECTION 8: OTHER MEMBER INSTITUTIONS ─── */}
        <section className="max-w-7xl mx-auto px-6 mb-20 border-t border-slate-200/60 dark:border-slate-800/60 pt-16">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                EduHub Network
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                Explore Other Universities
              </h2>
            </div>
            <button 
              onClick={() => navigate('/#institutes')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Leaderboard</span>
              <ArrowRight size={12} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {otherInstitutes.slice(0, 4).map(other => (
              <div
                key={other.id}
                onClick={() => navigate(`/institute/${other.id}`)}
                className="rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 cursor-pointer group shadow-sm hover:border-slate-400 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="relative h-28 w-full overflow-hidden">
                  <img 
                    src={other.image} 
                    alt={other.shortName} 
                    onError={(e) => { e.currentTarget.src = '/universities/nust.jpg' }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-mono font-bold">
                    #{other.rank < 10 ? '0' + other.rank : other.rank}
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <img 
                      src={other.logo} 
                      alt={other.shortName} 
                      onError={(e) => { e.currentTarget.src = '/brand/eduhub-logo.png' }}
                      className="w-7 h-7 rounded-lg p-0.5 bg-white shrink-0 border border-slate-200 object-contain" 
                    />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{other.shortName}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{other.sector}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* ─── Interactive Apply Modal ─── */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>

              {!applySuccess ? (
                <>
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      Official Admission Docket // Fall 2026
                    </div>
                    <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                      Apply to {inst.shortName}
                    </h2>
                    {selectedProgram && (
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Selected: <strong className="text-slate-900 dark:text-white">{selectedProgram.name}</strong>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Degree Program
                      </label>
                      <select
                        value={applyForm.program}
                        onChange={(e) => setApplyForm({ ...applyForm, program: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        {inst.programs?.map(p => (
                          <option key={p.id} value={p.name}>{p.name} ({p.degree})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={applyForm.name}
                          onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="email@example.com"
                          value={applyForm.email}
                          onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+92 300 1234567"
                        value={applyForm.phone}
                        onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Submit Application</span>
                        <ArrowRight size={14} weight="bold" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle size={36} weight="fill" className="text-emerald-500 mx-auto" />
                  <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                    Application Submitted
                  </h3>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                    <div className="text-slate-400 font-mono">Reference Docket: {applicationId}</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{applyForm.program}</div>
                  </div>
                  <button
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── EXACT SAME FOOTER AS LANDING PAGE ─── */}
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
              The all-in-one educational platform and service driving institutional excellence, seamless academic records, and thriving campus cultures.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16 text-sm">
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Product</h4>
              <ul className="space-y-3 text-white/80">
                <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/#institutes" className="hover:text-white transition-colors">Institutes</a></li>
                <li><a href="/#alumni" className="hover:text-white transition-colors">Alumni Network</a></li>
                <li><span onClick={handleOpenPartnerModal} className="hover:text-white cursor-pointer transition-colors">Register Campus</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Resources</h4>
              <ul className="space-y-3 text-white/80">
                <li><span className="hover:text-white cursor-pointer transition-colors">Documentation</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">API Reference</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Support Portal</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></li>
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

      {/* Global Get Started Partner Modal */}
      <GetStartedModal isOpen={partnerModalOpen} onClose={() => setPartnerModalOpen(false)} />
    </div>
  )
}
