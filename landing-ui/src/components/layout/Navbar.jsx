import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';

export default function Navbar({ onGetStarted }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  // Intelligent Hide on Scroll Down, Show on Scroll Up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const clampedScrollY = Math.max(0, currentScrollY);
      const diff = clampedScrollY - lastScrollY.current;

      if (clampedScrollY <= 40) {
        setIsNavVisible(true);
      } else if (diff > 6) {
        setIsNavVisible(false);
      } else if (diff < -6) {
        setIsNavVisible(true);
      }

      lastScrollY.current = clampedScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (item) => {
    setMobileMenuOpen(false);
    const id = item.toLowerCase();

    if (id === 'home') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
      return;
    }

    if (id === 'alumni') {
      if (location.pathname === '/alumni') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/alumni');
      }
      return;
    }

    if (id === 'rankings') {
      if (location.pathname === '/rankings') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/rankings');
      }
      return;
    }

    if (id === 'institutes') {
      if (location.pathname === '/institutes') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/institutes');
      }
      return;
    }

    // For other sections on landing page (Solutions)
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <header 
        className={`fixed top-4 left-0 right-0 z-50 flex justify-center px-4 md:px-6 transition-transform duration-500 pointer-events-none ${
          isNavVisible ? 'translate-y-0' : '-translate-y-32'
        }`}
      >
        <nav 
          className="pointer-events-auto flex items-center justify-between gap-4 md:gap-8 px-5 py-3 md:py-3.5 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-w-5xl w-full transition-all duration-300"
          aria-label="Main Navigation"
        >
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer select-none group" 
            onClick={handleLogoClick}
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-black text-lg leading-none">E</span>
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900">
              EduHub.
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {['Home', 'Alumni', 'Rankings', 'Institutes'].map((item) => {
              const isAlumniActive = item === 'Alumni' && (location.pathname === '/alumni' || location.pathname.startsWith('/alumni/'));
              const isHomeActive = item === 'Home' && location.pathname === '/';
              const isRankingsActive = item === 'Rankings' && location.pathname === '/rankings';
              const isInstitutesActive = item === 'Institutes' && (location.pathname === '/institutes' || location.pathname.startsWith('/institute/'));
              const isActive = isAlumniActive || isHomeActive || isRankingsActive || isInstitutesActive;

              return (
                <button 
                  key={item}
                  type="button" 
                  className={`px-4 py-2 rounded-full text-sm font-bold tracking-tight transition-all ${
                    isActive
                      ? 'text-white bg-slate-900 shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  onClick={() => handleNavClick(item)}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2">
            {/* Get Started Clean CTA */}
            <button 
              type="button" 
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/10 transition-all active:scale-95"
              onClick={onGetStarted}
            >
              <span>Get Started</span>
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="md:hidden p-2 text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-24 left-4 right-4 z-40 p-5 rounded-[2rem] bg-white/90 backdrop-blur-3xl border border-white/50 shadow-2xl md:hidden flex flex-col gap-2"
          >
            {['Home', 'Alumni', 'Rankings', 'Institutes'].map((item) => {
              const isAlumniActive = item === 'Alumni' && (location.pathname === '/alumni' || location.pathname.startsWith('/alumni/'));
              const isHomeActive = item === 'Home' && location.pathname === '/';
              const isRankingsActive = item === 'Rankings' && location.pathname === '/rankings';
              const isInstitutesActive = item === 'Institutes' && (location.pathname === '/institutes' || location.pathname.startsWith('/institute/'));
              const isActive = isAlumniActive || isHomeActive || isRankingsActive || isInstitutesActive;

              return (
                <button 
                  key={item}
                  className={`text-left px-5 py-3.5 text-xl font-bold tracking-tight rounded-2xl transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-900 hover:bg-slate-100'
                  }`}
                  onClick={() => handleNavClick(item)}
                >
                  {item}
                </button>
              );
            })}
            <div className="pt-4 border-t border-slate-100 mt-2">
              <button 
                className="w-full py-4 rounded-2xl text-center text-lg font-bold text-white bg-slate-900 shadow-lg active:scale-95 transition-transform"
                onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
