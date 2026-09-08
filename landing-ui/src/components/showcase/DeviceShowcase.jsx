import React from 'react'
import { motion } from 'motion/react'
import { LockKey } from '@phosphor-icons/react'

export default function DeviceShowcase() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-transparent border-t border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">

        {/* ─── 50vw Visual Side: Desktop PC in Background + Mobile Phone in Front Overlapping ─── */}
        <motion.div
          className="lg:col-span-7 relative"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute -inset-6 bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-[3rem] blur-3xl -z-10 pointer-events-none" />

          {/* Device Showcase Stage Container */}
          <div className="relative pb-10 sm:pb-12 pr-4 sm:pr-8">

            {/* Desktop PC Browser Frame */}
            <div className="rounded-2xl sm:rounded-3xl border border-slate-700/80 dark:border-slate-800 bg-slate-950 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 group">
              {/* Window Titlebar */}
              <div className="h-10 sm:h-11 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between gap-4 select-none">
                {/* Traffic Light Dots */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm" />
                </div>

                {/* Browser Address Pill */}
                <div className="flex-1 max-w-xs sm:max-w-sm mx-auto flex items-center justify-center gap-2 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                  <LockKey size={11} className="text-emerald-400 shrink-0" weight="fill" />
                  <span className="text-slate-300 font-medium">eduhub.pk</span>
                  <span className="text-slate-500">/admin/nust/dashboard</span>
                </div>

                {/* Status Dot */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Active</span>
                </div>
              </div>

              {/* PC Desktop Screen View */}
              <div className="relative aspect-[16/9.6] w-full overflow-hidden bg-slate-950">
                <img
                  src="/showcase/desktop-dashboard.png"
                  alt="EduHub Desktop Dashboard Control Center"
                  className="w-full h-full object-cover object-top block"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Mobile Phone Frame (Covering lower right portion of desktop view) */}
            <div className="absolute -bottom-4 -right-1 sm:-right-4 md:-right-6 w-[170px] sm:w-[210px] md:w-[240px] rounded-[34px] sm:rounded-[42px] border-[5px] sm:border-[6px] border-slate-900 dark:border-slate-700 bg-black shadow-[0_25px_60px_-10px_rgba(0,0,0,0.85)] overflow-hidden z-20 transition-transform duration-300 hover:scale-105 hover:-translate-y-1">

              {/* Dynamic Island Notch */}
              <div className="h-5 sm:h-6 bg-black w-full flex items-center justify-center pt-1 select-none">
                <div className="w-14 sm:w-16 h-3 sm:h-3.5 bg-slate-900 rounded-full flex items-center justify-between px-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                </div>
              </div>

              {/* Mobile Screen Display */}
              <div className="relative aspect-[9/18.5] w-full overflow-hidden bg-slate-950">
                <img
                  src="/showcase/mobile-app.png"
                  alt="EduHub Mobile Role Switcher"
                  className="w-full h-full object-cover object-top block"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Home Indicator Bar */}
              <div className="h-4 sm:h-5 bg-black w-full flex items-center justify-center">
                <div className="w-20 sm:w-24 h-1 rounded-full bg-white/30" />
              </div>
            </div>

          </div>
        </motion.div>

        {/* ─── 50vw Client Explanation Side ─── */}
        <motion.div
          className="lg:col-span-5 flex flex-col justify-center space-y-6"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-display leading-[1.15]">
            Command Your Entire Campus. <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
              Desktop &amp; Mobile Unified.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Eliminate operational fragmentation across your institutions. University rectors and campus deans manage high-density operations from the desktop command center, while faculty and students interact through a seamless, native-grade mobile portal.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
