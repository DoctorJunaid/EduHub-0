import React from 'react'
import { motion } from 'motion/react'
import { LockKey, ArrowRight, DeviceMobile, Desktop } from '@phosphor-icons/react'

export default function DeviceShowcase({ onGetStarted, navigate }) {
  return (
    <section id="features" className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-transparent border-t border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-14 items-center">

        {/* ─── Visual Side: Desktop PC in Background + Mobile Phone in Front Overlapping ─── */}
        <motion.div
          className="lg:col-span-7 relative w-full"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-[3rem] blur-3xl -z-10 pointer-events-none" />

          {/* Device Showcase Stage Container */}
          <div className="relative pb-8 sm:pb-12 pr-2 sm:pr-6 md:pr-8 max-w-full">

            {/* Desktop PC Browser Frame */}
            <div className="rounded-xl sm:rounded-3xl border border-slate-700/80 dark:border-slate-800 bg-slate-950 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 group">
              {/* Window Titlebar */}
              <div className="h-9 sm:h-11 bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 select-none">
                {/* Traffic Light Dots */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56] shadow-sm" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] shadow-sm" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] shadow-sm" />
                </div>

                {/* Browser Address Pill */}
                <div className="flex-1 max-w-[200px] sm:max-w-sm mx-auto flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] sm:text-[11px] font-mono text-slate-400 truncate">
                  <LockKey size={11} className="text-emerald-400 shrink-0" weight="fill" />
                  <span className="text-slate-300 font-medium">eduhub.pk</span>
                  <span className="text-slate-500 hidden sm:inline">/admin/nust/dashboard</span>
                </div>

                {/* Status Dot */}
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-emerald-400">
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

            {/* Mobile Phone Frame (Scaled responsibly so it never bleeds outside viewport) */}
            <div className="absolute -bottom-2 sm:-bottom-4 right-0 sm:right-1 md:right-0 w-[120px] sm:w-[170px] md:w-[210px] lg:w-[230px] rounded-[24px] sm:rounded-[36px] md:rounded-[42px] border-[3px] sm:border-[5px] md:border-[6px] border-slate-900 dark:border-slate-700 bg-black shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] overflow-hidden z-20 transition-transform duration-300 hover:scale-105 hover:-translate-y-1">

              {/* Dynamic Island Notch */}
              <div className="h-3.5 sm:h-5 md:h-6 bg-black w-full flex items-center justify-center pt-0.5 select-none">
                <div className="w-10 sm:w-14 md:w-16 h-2.5 sm:h-3 md:h-3.5 bg-slate-900 rounded-full flex items-center justify-between px-1 sm:px-1.5">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-950" />
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
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
              <div className="h-3 sm:h-4 md:h-5 bg-black w-full flex items-center justify-center">
                <div className="w-14 sm:w-20 md:w-24 h-0.5 sm:h-1 rounded-full bg-white/30" />
              </div>
            </div>

          </div>
        </motion.div>

        {/* ─── Client Explanation Side ─── */}
        <motion.div
          className="lg:col-span-5 flex flex-col justify-center space-y-5 sm:space-y-6"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <div>
            <p className="text-xs font-mono font-bold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase mb-2">
              Cross-Platform Unified Engine
            </p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-display leading-[1.15]">
              Command Your Entire Campus. <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
                Desktop &amp; Mobile Unified.
              </span>
            </h2>
          </div>

          <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Eliminate operational fragmentation across your institutions. University rectors and campus deans manage high-density operations from the desktop command center, while faculty and students interact through a seamless, native-grade mobile portal.
          </p>

          {/* Feature Badge Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Desktop size={18} weight="bold" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Admin Command PC</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Enrollment, fees &amp; audits</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <DeviceMobile size={18} weight="bold" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Student &amp; Faculty App</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Attendance, diaries &amp; grades</p>
              </div>
            </div>
          </div>

          {/* Action button with min 44px touch target */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (onGetStarted) {
                  onGetStarted()
                } else if (navigate) {
                  navigate('/institute')
                }
              }}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Explore Device Capabilities</span>
              <ArrowRight size={15} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
