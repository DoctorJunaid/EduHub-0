import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ArrowUpRight, 
  ArrowSquareOut,
  SignIn,
  CaretDown,
  Buildings,
  Sun, 
  Moon, 
  List, 
  X,
  House,
  Sparkle,
  GraduationCap,
  Calendar,
  Robot
} from '@phosphor-icons/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getManagementLoginUrl, getManagementDashboardUrl } from '@/config/urls'

export default function Navbar({ isDark, setIsDark, onGetStarted }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [loginMenuOpen, setLoginMenuOpen] = useState(false)
  const lastScrollY = useRef(0)
  const loginMenuRef = useRef(null)

  // Intelligent Hide on Scroll Down, Show on Scroll Up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0
      const clampedScrollY = Math.max(0, currentScrollY)
      const diff = clampedScrollY - lastScrollY.current

      if (clampedScrollY <= 40) {
        setIsNavVisible(true)
      } else if (diff > 6 && !mobileDrawerOpen) {
        // Scrolling down -> hide navbar (only if drawer closed)
        setIsNavVisible(false)
        setLoginMenuOpen(false)
      } else if (diff < -6) {
        // Scrolling up -> show navbar
        setIsNavVisible(true)
      }

      lastScrollY.current = clampedScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mobileDrawerOpen])

  // Body scroll lock when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [mobileDrawerOpen])

  // Keyboard accessibility: Escape key closes drawers and menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false)
        setLoginMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close login dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (loginMenuRef.current && !loginMenuRef.current.contains(e.target)) {
        setLoginMenuOpen(false)
      }
    }
    if (loginMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [loginMenuOpen])

  const scrollToSection = (id) => {
    setMobileDrawerOpen(false)
    setLoginMenuOpen(false)
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const managementLoginUrl = getManagementLoginUrl()
  const managementDashboardUrl = getManagementDashboardUrl()

  const navLinks = [
    { label: 'Home', id: 'top', icon: House },
    { label: 'Institutes', id: 'institutes', icon: Buildings },
    { label: 'Features', id: 'features', icon: Sparkle },
    { label: 'Alumni', id: 'alumni', icon: GraduationCap },
    { label: 'Events', id: 'events', icon: Calendar },
    { label: 'AI Campus', id: 'ai-assistant', icon: Robot },
  ]

  return (
    <>
      <header 
        className={`fixed top-3 sm:top-4 left-0 right-0 z-40 flex justify-center px-3 sm:px-4 transition-all duration-300 pointer-events-none ${
          isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
        }`}
      >
        <nav 
          className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/85 dark:bg-[#111114]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_10px_30px_-5px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg max-w-4xl w-full"
          aria-label="Main Navigation"
        >
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group min-h-[44px]" 
            onClick={() => scrollToSection('top')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') scrollToSection('top') }}
            aria-label="EduHub Home"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-sm group-hover:scale-105 group-hover:border-emerald-500/50 transition-all">
              <img 
                src="/brand/eduhub-logo.png" 
                alt="EduHub Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                EduHub
              </span>
              <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hidden sm:block">
                Campus OS
              </span>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Links (Hidden on mobile < 768px) */}
          <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
            {navLinks.slice(0, 4).map((link) => (
              <button 
                key={link.id}
                type="button" 
                className="px-2.5 lg:px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                onClick={() => scrollToSection(link.id)}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle (Min 44x44px touch target on mobile) */}
            <button 
              type="button"
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95 touch-target"
              onClick={() => setIsDark(!isDark)} 
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun size={18} weight="bold" className="text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon size={18} weight="bold" className="text-emerald-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Split / Optioned Management Portal Login Button (Tablet & Desktop) */}
            <div className="relative hidden md:block" ref={loginMenuRef}>
              <div className="inline-flex items-center rounded-full border border-slate-200/90 dark:border-white/10 bg-slate-100/90 dark:bg-slate-800/80 shadow-sm transition-all hover:border-emerald-500/50">
                <a
                  href={managementLoginUrl}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-l-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors min-h-[36px]"
                  title="Login to EduHub Management Portal"
                >
                  <SignIn size={14} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                  <span>Login</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLoginMenuOpen(!loginMenuOpen)}
                  className="pr-2.5 pl-1 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors min-h-[36px] flex items-center"
                  aria-label="Login redirection options"
                  aria-haspopup="true"
                  aria-expanded={loginMenuOpen}
                >
                  <CaretDown size={11} weight="bold" className={`transition-transform duration-200 ${loginMenuOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                </button>
              </div>

              {/* Redirection Options Dropdown Menu */}
              <AnimatePresence>
                {loginMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-full mt-2 w-60 p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 flex flex-col gap-1 text-xs"
                  >
                    <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Management Portal
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <a
                      href={managementLoginUrl}
                      className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors"
                      onClick={() => setLoginMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        <SignIn size={15} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                        <span>Sign In (Same Tab)</span>
                      </span>
                    </a>

                    <a
                      href={managementLoginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors"
                      onClick={() => setLoginMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        <ArrowSquareOut size={15} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                        <span>Open in New Tab</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">↗</span>
                    </a>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                    <a
                      href={managementDashboardUrl}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      onClick={() => setLoginMenuOpen(false)}
                    >
                      <Buildings size={15} weight="bold" className="text-slate-400" />
                      <span>Direct to Dashboard</span>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Get Started Gradient CTA (Desktop & Tablet) */}
            <button 
              type="button" 
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 lg:px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-0.5 transition-all active:translate-y-0 min-h-[36px]"
              onClick={onGetStarted}
            >
              <span>Get Started</span>
              <ArrowUpRight size={13} weight="bold" />
            </button>

            {/* Hamburger Button for Mobile & Tablet viewports (< 768px) with 44px min touch target */}
            <button
              type="button"
              className="md:hidden w-11 h-11 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 transition-all touch-target border border-slate-200/50 dark:border-white/10"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open Navigation Drawer"
              aria-expanded={mobileDrawerOpen}
            >
              <List size={22} weight="bold" />
            </button>
          </div>
        </nav>
      </header>

      {/* ─── Modern Accessible Slide-out Navigation Drawer (< 768px) ─── */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
              onClick={() => setMobileDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-[min(100vw-2.5rem,360px)] h-full bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-2xl border-l border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col justify-between p-5 overflow-y-auto"
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-1 flex items-center justify-center">
                      <img src="/brand/eduhub-logo.png" alt="EduHub" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="font-display font-black text-lg tracking-tight text-slate-900 dark:text-white block leading-none">
                        EduHub
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        Navigation Menu
                      </span>
                    </div>
                  </div>

                  {/* Close Button - 44px touch target */}
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>

                {/* Section Navigation Links */}
                <div className="py-4 space-y-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-1">
                    Explore Sections
                  </p>
                  {navLinks.map((link) => {
                    const IconComponent = link.icon
                    return (
                      <button 
                        key={link.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-left min-h-[44px]"
                        onClick={() => scrollToSection(link.id)}
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <IconComponent size={16} weight="duotone" />
                        </div>
                        <span>{link.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Theme Selector Pill Row */}
                <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/[0.06] mb-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Interface Theme</span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDark(false)}
                      className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        !isDark 
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Sun size={15} weight="bold" className="text-amber-500" />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDark(true)}
                      className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isDark 
                          ? 'bg-slate-900 text-white shadow-sm border border-slate-700' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Moon size={15} weight="bold" className="text-emerald-400" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                  Portal &amp; Campus Access
                </p>

                {/* Primary Management Portal Login Link */}
                <a
                  href={managementLoginUrl}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-all shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <SignIn size={18} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                    <span>Portal Sign In</span>
                  </span>
                  <ArrowSquareOut size={16} className="text-slate-400" />
                </a>

                {/* Direct to Campus Dashboard */}
                <a
                  href={managementDashboardUrl}
                  className="w-full min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Buildings size={16} weight="duotone" className="text-slate-400" />
                    <span>Campus Management Console</span>
                  </span>
                  <span>↗</span>
                </a>

                {/* Get Started Full-Width CTA with 44px min touch target */}
                <button 
                  type="button"
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl text-center text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  onClick={() => { 
                    setMobileDrawerOpen(false); 
                    if (onGetStarted) onGetStarted(); 
                  }}
                >
                  <span>Register Institution</span>
                  <ArrowUpRight size={16} weight="bold" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
