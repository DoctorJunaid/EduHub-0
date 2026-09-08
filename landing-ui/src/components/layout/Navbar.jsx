import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  GraduationCap, 
  ArrowUpRight, 
  Sun, 
  Moon, 
  List, 
  X
} from '@phosphor-icons/react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar({ isDark, setIsDark, onGetStarted }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

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
      } else if (diff < -6) {
        // Scrolling up -> show navbar
        setIsNavVisible(true)
      }

      lastScrollY.current = clampedScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    setMobileMenuOpen(false)
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <header 
        className={`fixed top-4 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 pointer-events-none ${
          isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
        }`}
      >
        <nav 
          className="pointer-events-auto flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg max-w-4xl w-full"
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
