import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const STEPS = [
  {
    number: '01',
    title: 'Register Your Institution',
    description:
      'Your Institute Admin submits the campus profile. EduHub verifies credentials, sector, and accreditation data within 24 hours.',
    tag: 'Onboarding',
    color: '#6366f1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Invite Your Teams',
    description:
      'Add campuses, departments, faculty, and staff in bulk. Role-based access is auto-assigned — teachers, admins, and students each get a tailored workspace.',
    tag: 'Configuration',
    color: '#8b5cf6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Go Live — Day One',
    description:
      'Attendance tracking, biometric check-in, grade books, fee ledgers, and the student portal are all active from the moment you flip the switch.',
    tag: 'Launch',
    color: '#14b8a6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Grow with Insights',
    description:
      'Live analytics dashboards surface retention risks, attendance trends, and financial health. Scale from one campus to a national network without friction.',
    tag: 'Scale',
    color: '#f59e0b',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
]

export default function StackingCardsSection() {
  const containerRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  return (
    // Enough height so each card has 100vh of scroll to "breathe"
    <div
      ref={containerRef}
      className="relative bg-[#0a0f1a]"
      style={{ height: `${(STEPS.length + 1) * 100}vh` }}
    >
      {/* Section header — scrolls away normally */}
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header row at top */}
        <div className="pt-24 pb-10 px-6 max-w-7xl mx-auto w-full">
          <motion.p
            className="text-xs font-mono font-bold tracking-[0.3em] text-indigo-400 uppercase mb-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.p>
          <motion.h2
            className="text-4xl sm:text-5xl font-black text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            From zero to full campus,{' '}
            <span className="text-indigo-400">in four steps.</span>
          </motion.h2>
        </div>

        {/* Card stack area */}
        <div className="flex-1 flex items-center justify-center relative px-6">
          {STEPS.map((step, i) => (
            <StackCard
              key={step.number}
              step={step}
              index={i}
              total={STEPS.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StackCard({ step, index, total, scrollYProgress }) {
  // Each card: appears at its turn, stays on screen, earlier cards scale down and stay
  const sliceSize = 1 / (total + 1) // extra 1 for the end padding

  const entryStart = index * sliceSize
  const entryEnd = entryStart + sliceSize * 0.4

  // Y: card comes from 120% → 0%
  const y = useTransform(
    scrollYProgress,
    [entryStart, entryEnd],
    ['110%', '0%']
  )

  // Scale: once stacked, earlier cards scale down slightly so the top card feels closer
  const scale = useTransform(
    scrollYProgress,
    [holdStart, 1],
    [1, 1 - (total - index - 1) * 0.04]
  )

  // Earlier cards also dim slightly
  const opacity = useTransform(
    scrollYProgress,
    [entryStart * 0.5, entryStart, entryEnd],
    [0, 0.3, 1]
  )

  // Z-index via inline style
  const zIndex = index + 1

  return (
    <motion.div
      style={{ y, scale, opacity, zIndex, position: 'absolute' }}
      className="w-full max-w-2xl"
    >
      <div
        className="relative rounded-3xl p-8 sm:p-10 border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #141929 0%, #0f1423 100%)',
          borderColor: `${step.color}30`,
          boxShadow: `0 30px 80px -20px ${step.color}25, 0 0 0 1px ${step.color}15`,
        }}
      >
        {/* Background glow blob */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[60px] opacity-30 pointer-events-none"
          style={{ background: step.color }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start">
          {/* Step number */}
          <div
            className="text-6xl sm:text-7xl font-black font-mono leading-none opacity-10 select-none absolute -top-4 -left-2 sm:static sm:opacity-100"
            style={{ color: step.color }}
          >
            {step.number}
          </div>

          <div className="flex-1">
            {/* Tag + Icon row */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}25` }}
              >
                {step.icon}
              </div>
              <span
                className="text-xs font-mono font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                style={{ color: step.color, background: `${step.color}15`, border: `1px solid ${step.color}20` }}
              >
                {step.tag}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              {step.title}
            </h3>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
