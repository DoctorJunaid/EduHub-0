import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const WORDS = ['Students', 'Teachers', 'Institutes', 'Communities', 'Tomorrow']
const WORD_COLOR = '#6366f1' // indigo accent

// Reactive version using motion values properly
function AnimatedWord({ word, progress, index, total }) {
  const start = index / total
  const end = (index + 1) / total

  const opacity = useTransform(
    progress,
    [start - 0.02, start + 0.06, end - 0.06, end + 0.02],
    [0, 1, 1, 0]
  )
  const y = useTransform(
    progress,
    [start - 0.02, start + 0.06, end - 0.06, end + 0.02],
    [50, 0, 0, -50]
  )

  return (
    <motion.span
      style={{
        opacity,
        y,
        position: 'absolute',
        left: 0,
        top: 0,
        color: WORD_COLOR,
        display: 'inline-block',
      }}
    >
      {word}
    </motion.span>
  )
}

export default function MorphingTextSection() {
  const containerRef = useRef(null)

  // scrollYProgress goes 0→1 over the full height of the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Longest word for sizing the slot
  const longestWord = WORDS.reduce((a, b) => (b.length > a.length ? b : a), '')

  return (
    // Tall container so we have scroll room. 500vh gives good pacing.
    <div ref={containerRef} style={{ height: `${WORDS.length * 100}vh` }} className="relative">
      {/* Sticky panel */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden bg-[#fafbfc] dark:bg-[#0a0f1a] px-6">
        
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/8 blur-[120px]" />
        </div>

        {/* Small label */}
        <motion.p
          className="text-xs font-mono font-bold tracking-[0.3em] text-indigo-500 dark:text-indigo-400 uppercase mb-8 opacity-70"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 0.7, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Who We Empower
        </motion.p>

        {/* Main text block */}
        <div className="text-center max-w-5xl mx-auto">
          <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Transforming education
            <br />
            <span className="text-slate-400 dark:text-slate-500 font-medium">for&nbsp;</span>
            {/* Word slot — sized to longest word, all words render absolutely */}
            <span
              className="relative inline-block"
              style={{ minWidth: `${longestWord.length * 0.55}em` }}
            >
              {/* Invisible spacer to maintain layout height */}
              <span className="invisible" aria-hidden="true">
                {longestWord}
              </span>
              {WORDS.map((word, i) => (
                <AnimatedWord
                  key={word}
                  word={word}
                  progress={scrollYProgress}
                  index={i}
                  total={WORDS.length}
                />
              ))}
            </span>
          </p>

          {/* Supporting sub-copy */}
          <p className="mt-8 text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            EduHub is the unified academic operating system that connects every role in the institution — from enrollment to graduation.
          </p>
        </div>

        {/* Scroll progress pill */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <div className="h-12 w-[2px] bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="w-full bg-indigo-500 rounded-full"
              style={{ height: useTransform(scrollYProgress, [0, 1], ['0%', '100%']) }}
            />
          </div>
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400 dark:text-slate-600">
            Scroll
          </p>
        </div>
      </div>
    </div>
  )
}
