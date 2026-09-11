import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Buildings, 
  ArrowRight, 
  Phone, 
  Envelope, 
  User, 
  Check
} from '@phosphor-icons/react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog'

export default function GetStartedModal({ isOpen, onClose }) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    instituteName: '',
    contactName: '',
    email: '',
    phone: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  const handleClose = () => {
    setIsSubmitted(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-xl sm:max-w-2xl w-full p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl [&>button]:right-6 [&>button]:top-6 [&>button]:p-3 [&>button]:rounded-full [&>button]:bg-slate-100 dark:[&>button]:bg-slate-800 hover:[&>button]:bg-slate-200 dark:hover:[&>button]:bg-slate-700 [&>button]:text-slate-700 dark:[&>button]:text-slate-200 [&>button]:transition-colors">
        <div className="p-7 sm:p-10 md:p-12">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Monochromatic Pill Tag */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="px-4 py-2 rounded-full bg-slate-900 text-white font-mono text-xs sm:text-sm font-bold tracking-tight shadow-sm">
                    PARTNER ONBOARDING
                  </span>
                </div>

                {/* Clean Big Headline */}
                <DialogHeader className="text-left mb-8">
                  <DialogTitle className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.92]">
                    Get Started<span style={{ color: '#3b82f6' }}>.</span>
                  </DialogTitle>
                  <DialogDescription className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-2.5">
                    Connect your institution with Pakistan's verified academic network.
                  </DialogDescription>
                </DialogHeader>

                {/* Simple 4-Field Form with Bigger Text and Inputs */}
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                  {/* Institution Name */}
                  <div className="space-y-2">
                    <label className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Buildings size={18} className="text-slate-400" />
                      Institution Name
                    </label>
                    <input
                      required
                      type="text"
                      name="instituteName"
                      placeholder="e.g. National University of Sciences & Technology"
                      value={formData.instituteName}
                      onChange={handleChange}
                      className="w-full h-14 sm:h-15 px-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 text-base sm:text-lg font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-900 dark:focus:border-slate-100 transition-all shadow-sm"
                    />
                  </div>

                  {/* Representative Name */}
                  <div className="space-y-2">
                    <label className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <User size={18} className="text-slate-400" />
                      Your Name
                    </label>
                    <input
                      required
                      type="text"
                      name="contactName"
                      placeholder="e.g. Dr. Tariq Mahmood"
                      value={formData.contactName}
                      onChange={handleChange}
                      className="w-full h-14 sm:h-15 px-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 text-base sm:text-lg font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-900 dark:focus:border-slate-100 transition-all shadow-sm"
                    />
                  </div>

                  {/* Email & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-2">
                      <label className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Envelope size={18} className="text-slate-400" />
                        Official Email
                      </label>
                      <input
                        required
                        type="email"
                        name="email"
                        placeholder="registrar@nust.edu.pk"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full h-14 sm:h-15 px-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 text-base sm:text-lg font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-900 dark:focus:border-slate-100 transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Phone size={18} className="text-slate-400" />
                        Contact Phone
                      </label>
                      <input
                        required
                        type="tel"
                        name="phone"
                        placeholder="+92 300 1234567"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full h-14 sm:h-15 px-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 text-base sm:text-lg font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-900 dark:focus:border-slate-100 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 sm:pt-6 flex items-center justify-end gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-3.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-base font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-base sm:text-lg hover:bg-black dark:hover:bg-slate-100 transition-all active:scale-95 shadow-xl flex items-center gap-2.5 group cursor-pointer"
                    >
                      <span>Submit Request</span>
                      <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1.5 transition-transform" />
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* Success State */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="py-8 text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mx-auto shadow-xl">
                  <Check size={36} weight="bold" />
                </div>

                <div>
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                    Request Received<span style={{ color: '#10b981' }}>.</span>
                  </h3>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-3 leading-relaxed font-medium">
                    Thank you, <strong className="text-slate-900 dark:text-white">{formData.contactName || 'Representative'}</strong>. Our team will review <strong className="text-slate-900 dark:text-white">{formData.instituteName}</strong> and contact you at <strong className="text-slate-900 dark:text-white">{formData.email}</strong> within 24 hours.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-9 py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base hover:bg-black dark:hover:bg-slate-100 transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
