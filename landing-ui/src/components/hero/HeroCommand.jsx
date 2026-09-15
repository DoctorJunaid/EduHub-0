import React from 'react'
import { motion } from 'motion/react'
import { ArrowRight, LockKey } from '@phosphor-icons/react'

export default function HeroCommand({ onGetStarted }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="top"
      className="relative w-full min-h-screen flex items-center overflow-hidden"
    >
      {/* Subtle ambient glow — top-left origin, contained */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 15% 35%, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ══════════════════════════════════════
              LEFT — Copy & CTAs
          ══════════════════════════════════════ */}
          <motion.div
            className="flex flex-col items-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Overline label */}
            <p className="text-[11px] font-mono font-semibold tracking-[0.22em] uppercase text-emerald-600 dark:text-emerald-400 mb-5 select-none">
              Educational Technology Platform — Pakistan
            </p>

            {/* Headline */}
            <h1 className="text-[2.6rem] sm:text-5xl xl:text-[3.4rem] font-extrabold leading-[1.07] tracking-tight text-slate-900 dark:text-white font-display mb-6">
              One platform for every institution.{' '}
              <span className="text-emerald-500">
                From coaching centers to chartered universities.
              </span>
            </h1>

            {/* Primary description — maps to spec §1 two-sided market problem */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed mb-5 max-w-[520px]">
              EduHub resolves the two core failures in Pakistani education: students lack verified,
              unbiased data to choose institutions — and institutions are trapped between paper workflows
              and cost-prohibitive ERPs that demand total data surrender.
            </p>

            {/* Secondary — the decoupled integration advantage, spec §3.2 */}
            <p className="text-sm text-slate-500 dark:text-zinc-500 leading-relaxed mb-10 max-w-[500px]">
              Institutions connect at their own pace. List publicly with no integration. Route
              admission leads via webhook into your existing ERP. Or deploy EduHub as your complete
              cloud SaaS. No vendor lock-in. No forced database migration.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-12">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-colors duration-150 shadow-sm cursor-pointer"
              >
                Register Your Institution
                <ArrowRight size={16} weight="bold" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('institutes')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 transition-colors duration-150 cursor-pointer"
              >
                Browse Institutions
              </button>
            </div>

            {/* Social proof — numbers only, no icons */}
            <div className="flex flex-wrap items-start gap-x-8 gap-y-4 pt-7 border-t border-slate-200/70 dark:border-zinc-800/80 w-full max-w-[520px]">
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">50+</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 font-medium">Institutions on EduHub</p>
              </div>
              <div className="w-px bg-slate-200 dark:bg-zinc-800 self-stretch hidden sm:block" />
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">120,000+</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 font-medium">Active Students</p>
              </div>
              <div className="w-px bg-slate-200 dark:bg-zinc-800 self-stretch hidden sm:block" />
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">HEC · PEC · QS</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 font-medium">Verified Ranking Data</p>
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════
              RIGHT — Device Showcase
          ══════════════════════════════════════ */}
          <motion.div
            className="relative hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            {/* Soft background glow — behind device frames only */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 72% 60% at 62% 50%, rgba(16,185,129,0.1) 0%, transparent 70%)',
                filter: 'blur(28px)',
              }}
            />

            {/* Device stage */}
            <div className="relative w-full max-w-[560px] pb-12 pr-12">

              {/* Desktop Browser Frame */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-900 shadow-[0_24px_72px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)]">

                {/* macOS Titlebar */}
                <div className="h-11 bg-zinc-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                    <LockKey size={11} weight="fill" className="text-emerald-500 shrink-0" />
                    <span className="text-slate-800 dark:text-zinc-200 font-medium">eduhub.pk</span>
                    <span className="text-slate-400 dark:text-zinc-600">/admin/nust/dashboard</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online</span>
                  </div>
                </div>

                {/* Desktop screenshot */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                  <img
                    src="/showcase/desktop-dashboard.png"
                    alt="EduHub admin dashboard"
                    className="w-full h-full object-cover object-top block"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Mobile Phone — overlapping lower-right */}
              <motion.div
                className="absolute bottom-0 right-0 w-[130px] sm:w-[148px] rounded-[26px] border-[4px] border-zinc-900 dark:border-zinc-700 bg-black shadow-[0_24px_56px_-8px_rgba(0,0,0,0.6)] dark:shadow-[0_28px_64px_-8px_rgba(0,0,0,0.9)] overflow-hidden z-10"
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              >
                {/* Dynamic island */}
                <div className="h-5 bg-black w-full flex items-center justify-center">
                  <div className="w-12 h-2.5 bg-zinc-900 rounded-full" />
                </div>

                <div className="relative aspect-[9/18] w-full overflow-hidden bg-zinc-950">
                  <img
                    src="/showcase/mobile-app.png"
                    alt="EduHub student mobile portal"
                    className="w-full h-full object-cover object-top block"
                    loading="eager"
                  />
                </div>

                {/* Home indicator */}
                <div className="h-4 bg-black flex items-center justify-center">
                  <div className="w-16 h-1 rounded-full bg-white/30" />
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
