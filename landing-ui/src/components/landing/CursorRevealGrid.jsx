import React, { useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const FEATURES = [
  {
    id: 'attendance',
    title: 'Biometric Attendance',
    description: 'Real-time fingerprint & face-ID check-in. Instant parent SMS alerts on absence.',
    tag: 'Smart Campus',
    color: '#6366f1',
    size: 'large', // spans 2 columns
    emoji: '🖐️',
    stat: '99.7%',
    statLabel: 'Accuracy Rate',
  },
  {
    id: 'grades',
    title: 'Live Grade Book',
    description: 'Rubric-based grading with GPA auto-calculation. Exportable transcripts in one click.',
    tag: 'Academic',
    color: '#8b5cf6',
    size: 'normal',
    emoji: '📊',
    stat: '2s',
    statLabel: 'Average Load Time',
  },
  {
    id: 'fees',
    title: 'Fee Management',
    description: 'Automated fee challan generation, overdue alerts, and multi-campus payment reconciliation.',
    tag: 'Finance',
    color: '#f59e0b',
    size: 'normal',
    emoji: '💳',
    stat: '₀',
    statLabel: 'Missed Payments',
  },
  {
    id: 'analytics',
    title: 'Institutional Analytics',
    description: 'Live dashboards tracking retention, enrollment funnel, faculty load, and semester-over-semester trends.',
    tag: 'Intelligence',
    color: '#14b8a6',
    size: 'large',
    emoji: '📈',
    stat: '360°',
    statLabel: 'Campus View',
  },
  {
    id: 'portal',
    title: 'Student Portal',
    description: 'Course catalog, timetable, assignment submissions, and results — all in one place.',
    tag: 'Self-Service',
    color: '#ec4899',
    size: 'normal',
    emoji: '🎓',
    stat: '50K+',
    statLabel: 'Active Students',
  },
  {
    id: 'comms',
    title: 'Campus Communications',
    description: 'Broadcast announcements, circular management, and parent-teacher messaging through one channel.',
    tag: 'Collaboration',
    color: '#10b981',
    size: 'normal',
    emoji: '📢',
    stat: '< 1s',
    statLabel: 'Message Delivery',
  },
]

function FeatureCard({ feature }) {
  const cardRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  // Cursor position relative to card
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth spring for tilt effect
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 30 })

  // Glow follows cursor
  const glowX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%'])
  const glowY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%'])

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }, [mouseX, mouseY])

  const isLarge = feature.size === 'large'

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative rounded-3xl overflow-hidden cursor-pointer select-none ${
        isLarge ? 'md:col-span-2' : ''
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Card surface */}
      <div
        className="relative h-full p-7 sm:p-8 border transition-all duration-500"
        style={{
          background: isHovered
            ? `linear-gradient(135deg, ${feature.color}12 0%, #141929 100%)`
            : 'linear-gradient(135deg, #141929 0%, #0f1423 100%)',
          borderColor: isHovered ? `${feature.color}40` : `${feature.color}15`,
          boxShadow: isHovered
            ? `0 20px 60px -15px ${feature.color}30, 0 0 0 1px ${feature.color}25`
            : `0 4px 20px -5px rgba(0,0,0,0.4), 0 0 0 1px ${feature.color}10`,
        }}
      >
        {/* Cursor-following gradient glow */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-3xl opacity-30"
            style={{
              background: `radial-gradient(circle at ${glowX.get()} ${glowY.get()}, ${feature.color}60, transparent 60%)`,
            }}
          />
        )}

        {/* Content */}
        <div className={`relative z-10 flex ${isLarge ? 'flex-row items-center gap-10' : 'flex-col gap-6'}`}>
          {/* Left / top */}
          <div className={isLarge ? 'flex-1' : ''}>
            {/* Tag row */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="text-3xl"
                style={{ filter: `drop-shadow(0 0 8px ${feature.color}80)` }}
              >
                {feature.emoji}
              </span>
              <span
                className="text-[10px] font-mono font-black tracking-[0.25em] uppercase px-3 py-1 rounded-full"
                style={{ color: feature.color, background: `${feature.color}15`, border: `1px solid ${feature.color}20` }}
              >
                {feature.tag}
              </span>
            </div>

            <h3
              className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3 transition-colors duration-300"
              style={{ color: isHovered ? 'white' : '#e2e8f0' }}
            >
              {feature.title}
            </h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              {feature.description}
            </p>
          </div>

          {/* Stat block */}
          <div
            className={`${isLarge ? 'text-right shrink-0' : 'mt-2'} transition-all duration-300`}
          >
            <div
              className="text-4xl sm:text-5xl font-black font-mono"
              style={{ color: feature.color }}
            >
              {feature.stat}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-mono mt-1">
              {feature.statLabel}
            </div>
          </div>
        </div>

        {/* Bottom highlight line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-3xl"
          style={{ background: feature.color }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  )
}

export default function CursorRevealGrid() {
  return (
    <section className="py-28 px-6 bg-[#0a0f1a]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <motion.p
            className="text-xs font-mono font-bold tracking-[0.3em] text-indigo-400 uppercase mb-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Platform Features
          </motion.p>
          <motion.h2
            className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Every tool your campus{' '}
            <span className="text-indigo-400">has ever needed.</span>
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-slate-400 leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Hover each module to feel it come alive.
          </motion.p>
        </div>

        {/* Bento grid — 3 columns on desktop, 2 on tablet, 1 on mobile */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
          style={{ perspective: '1200px' }}
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
