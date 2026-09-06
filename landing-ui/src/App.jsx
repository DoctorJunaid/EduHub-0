import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '@/views/LandingPage'
import PublicInstitutePage from '@/views/PublicInstitutePage'
import GetStartedModal from '@/components/GetStartedModal'
import ScrollToTop from '@/components/ScrollToTop'
import BackToTop from '@/components/BackToTop'

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('eduhub_theme')
      if (savedTheme) return savedTheme === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('eduhub_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('eduhub_theme', 'light')
    }
  }, [isDark])

  return (
    <Router>
      <ScrollToTop />
      <div className={isDark ? 'dark' : ''}>
        <Routes>
          <Route 
            path="/" 
            element={
              <LandingPage 
                onGetStarted={() => setIsGetStartedOpen(true)}
                isDark={isDark} 
                setIsDark={setIsDark} 
              />
            } 
          />
          <Route 
            path="/institute/:id" 
            element={
              <PublicInstitutePage 
                isDark={isDark} 
                setIsDark={setIsDark} 
                onGetStarted={() => setIsGetStartedOpen(true)} 
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Get Started Partner Modal */}
        <GetStartedModal 
          isOpen={isGetStartedOpen} 
          onClose={() => setIsGetStartedOpen(false)} 
        />

        {/* Global Floating Back To Top Button */}
        <BackToTop />
      </div>
    </Router>
  )
}
