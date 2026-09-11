import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function VideoMaskSection() {
  const containerRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  // Very subtle parallax on the video itself
  const videoY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <section
      ref={containerRef}
      className="relative h-[85vh] sm:h-screen overflow-hidden flex items-center justify-center bg-black"
    >
      {/* Fullscreen background video */}
      <motion.video
        style={{ y: videoY }}
        className="absolute inset-0 w-full h-full object-cover scale-110"
        src="https://www.w3schools.com/html/mov_bbb.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      {/* Dark overlay — lighter in center to let video breathe through the text */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-[1]" />

      {/* Noise texture overlay for cinematic grain */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <div className="relative z-[3] text-center px-6 max-w-6xl mx-auto">
        {/* Label */}
        <motion.p
          className="text-xs font-mono font-bold tracking-[0.35em] text-indigo-300 uppercase mb-8"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
        >
          The Bigger Picture
        </motion.p>

        {/* Giant headline — video shines through via mix-blend-mode */}
        <div className="relative">
          <motion.h2
            className="text-[12vw] sm:text-[10vw] md:text-[8.5vw] font-black leading-none tracking-tighter text-white"
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          >
            The Future
            <br />
            <span
              style={{
                // This is the key: the text itself becomes transparent; the video beneath
                // appears inside the letters via background-clip. A pure-CSS text mask.
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #a5b4fc 40%, #c4b5fd 70%, #f0abfc 100%)',
              }}
            >
              of Learning.
            </span>
          </motion.h2>
        </div>

        {/* Sub text */}
        <motion.p
          className="mt-8 text-lg sm:text-xl md:text-2xl text-white/70 font-medium max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          EduHub is not software. It&apos;s the infrastructure that modern Pakistani education was built to run on.
        </motion.p>

        {/* Stats row */}
        <motion.div
          className="mt-14 flex flex-wrap justify-center gap-x-12 gap-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {[
            { value: '7+', label: 'Top Institutions' },
            { value: '50K+', label: 'Active Students' },
            { value: '98.4%', label: 'Placement Rate' },
            { value: '24/7', label: 'Live Support' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-white">{s.value}</div>
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-widest font-mono mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient bleed */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0f1a] to-transparent z-[4]" />
    </section>
  )
}
