import React from 'react'

export default function BentoCard({ 
  children, 
  className = '', 
  isLarge = false 
}) {
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${
        isLarge ? 'md:col-span-2' : ''
      } ${className}`}
    >
      {/* Card Content */}
      <div className="relative h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  )
}
