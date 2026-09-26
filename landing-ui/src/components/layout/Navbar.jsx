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
  X
} from '@phosphor-icons/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getManagementLoginUrl, getManagementDashboardUrl } from '@/config/urls'

export default function Navbar({ isDark, setIsDark, onGetStarted }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
      } else if (diff > 6) {
        // Scrolling down -> hide navbar
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
  }, [])

  // Close login options menu on click outside
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
    setMobileMenuOpen(false)
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

  return (
    <>
      <header 
        className={`fixed top-4 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 pointer-events-none ${
          isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
        }`}
      >
        <nav 
          className="pointer-events-auto flex items-center justify-between gap-3 md:gap-6 px-4 md:px-6 py-2.5 rounded-full bg-white/85 dark:bg-[#111114]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_10px_30px_-5px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg max-w-4xl w-full"
          aria-label="Main Navigation"
        >
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none group" 
            onClick={() => scrollToSection('top')}
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-sm group-hover:scale-105 group-hover:border-emerald-500/50 transition-all">
              <img 
                src="/brand/eduhub-logo.png" 
                alt="EduHub Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="font-display font-black text-lg tracking-tight text-slate-900 dark:text-white">
              EduHub
            </span>
          </div>

          {/* Navigation Section Links */}
          <div className="hidden md:flex items-center gap-1">
            <button 
              type="button" 
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              onClick={() => scrollToSection('top')}
            >
              Home
            </button>
            <button 
              type="button" 
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              onClick={() => scrollToSection('institutes')}
            >
              Institutes
            </button>
            <button 
              type="button" 
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button 
              type="button" 
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              onClick={() => scrollToSection('alumni')}
            >
              Alumni
            </button>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-transform active:scale-95"
              onClick={() => setIsDark(!isDark)} 
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun size={17} weight="bold" className="text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon size={17} weight="bold" className="text-emerald-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Split / Optioned Management Portal Login Button */}
            <div className="relative hidden sm:block" ref={loginMenuRef}>
              <div className="inline-flex items-center rounded-full border border-slate-200/90 dark:border-white/10 bg-slate-100/90 dark:bg-slate-800/80 shadow-sm transition-all hover:border-emerald-500/50">
                <a
                  href={managementLoginUrl}
                  className="inline-flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 rounded-l-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title="Login to EduHub Management Portal"
                >
                  <SignIn size={14} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                  <span>Login</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLoginMenuOpen(!loginMenuOpen)}
                  className="pr-2.5 pl-1 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="Login redirection options"
                  title="Redirect options (Same tab or Next tab)"
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

                    {/* Redirection: Same Tab */}
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

                    {/* Redirection: Next / New Tab */}
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

                    {/* Direct to Campus Dashboard */}
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

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="md:hidden p-1.5 text-slate-600 dark:text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <List size={20} />}
            </button>

            {/* Get Started Gradient CTA */}
            <button 
              type="button" 
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-0.5 transition-all active:translate-y-0"
              onClick={onGetStarted}
            >
              <span>Get Started</span>
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-4 right-4 z-40 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-2xl md:hidden flex flex-col gap-2"
          >
            <button 
              className="text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => scrollToSection('top')}
            >
              Home
            </button>
            <button 
              className="text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => scrollToSection('institutes')}
            >
              Institutes
            </button>
            <button 
              className="text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button 
              className="text-left px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => scrollToSection('alumni')}
            >
              Alumni
            </button>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <a
                href={managementLoginUrl}
                className="w-full py-2.5 px-4 rounded-xl text-center text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <SignIn size={17} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                <span>Portal Login</span>
                <ArrowSquareOut size={15} className="opacity-70" />
              </a>

              <button 
                className="w-full py-2.5 rounded-xl text-center text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md"
                onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
              >
                Get Started Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

