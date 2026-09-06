import React, { useRef } from 'react'

export default function BentoCard({ 
  children, 
  className = '', 
  isLarge = false 
}) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.4)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-12px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] hover:border-emerald-500/40 flex flex-col justify-between ${
        isLarge ? 'md:col-span-2' : ''
      } ${className}`}
    >
      {/* Subtle, Butter-Smooth Ambient Cursor Spotlight */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        style={{
          background: 'radial-gradient(550px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(16, 185, 129, 0.08), transparent 65%)'
        }}
      />

      {/* Surface Light Sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/5 dark:from-white/5 dark:to-transparent opacity-60 z-10" />

      {/* Card Content */}
      <div className="relative z-20 h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  )
}
