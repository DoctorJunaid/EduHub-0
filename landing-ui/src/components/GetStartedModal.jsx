import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  CheckCircle, 
  GraduationCap, 
  Buildings, 
  ArrowRight, 
  Phone, 
  Envelope, 
  User, 
  MapPin, 
  Users 
} from '@phosphor-icons/react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function GetStartedModal({ isOpen, onClose }) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    instituteName: '',
    instituteType: 'University',
    city: 'Islamabad',
    contactName: '',
    email: '',
    phone: '',
    studentCount: '1000+'
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
      <DialogContent className="max-w-xl p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl">
        <div className="relative">
          {/* Top Emerald Accent Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <DialogHeader className="text-left mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                        <GraduationCap size={20} weight="bold" />
                      </div>
                      <Badge variant="emerald" className="text-xs">Partner Registration</Badge>
                    </div>
                    <DialogTitle className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-white">
                      Let's empower your campus.
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                      Join Pakistan's leading academic network. Tell us about your institution to begin your digital onboarding.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Institution Name */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Buildings size={14} weight="duotone" className="text-emerald-600" />
                          Institution Name
                        </label>
                        <Input
                          required
                          name="instituteName"
                          placeholder="e.g. National University of Sciences & Tech"
                          value={formData.instituteName}
                          onChange={handleChange}
                          className="bg-slate-50 dark:bg-slate-800/50"
                        />
                      </div>

                      {/* Institution Type */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Institution Type
                        </label>
                        <select
                          name="instituteType"
                          value={formData.instituteType}
                          onChange={handleChange}
                          className="w-full h-10 px-3 rounded-lg border border-input bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="University">University</option>
                          <option value="College">College</option>
                          <option value="School">School</option>
                          <option value="Academy">Academy / Institute</option>
                        </select>
                      </div>

                      {/* City */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <MapPin size={14} weight="duotone" className="text-emerald-600" />
                          Primary City
                        </label>
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full h-10 px-3 rounded-lg border border-input bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="Islamabad">Islamabad</option>
                          <option value="Lahore">Lahore</option>
                          <option value="Karachi">Karachi</option>
                          <option value="Rawalpindi">Rawalpindi</option>
                          <option value="Peshawar">Peshawar</option>
                          <option value="Quetta">Quetta</option>
                          <option value="Multan">Multan</option>
                          <option value="Faisalabad">Faisalabad</option>
                        </select>
                      </div>

                      {/* Contact Person Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <User size={14} weight="duotone" className="text-emerald-600" />
                          Authorized Representative
                        </label>
                        <Input
                          required
                          name="contactName"
                          placeholder="Dr. / Prof. / Mr. Name"
                          value={formData.contactName}
                          onChange={handleChange}
                          className="bg-slate-50 dark:bg-slate-800/50"
                        />
                      </div>

                      {/* Official Email */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Envelope size={14} weight="duotone" className="text-emerald-600" />
                          Institutional Email
                        </label>
                        <Input
                          required
                          type="email"
                          name="email"
                          placeholder="registrar@institution.edu.pk"
                          value={formData.email}
                          onChange={handleChange}
                          className="bg-slate-50 dark:bg-slate-800/50"
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Phone size={14} weight="duotone" className="text-emerald-600" />
                          Contact Phone
                        </label>
                        <Input
                          required
                          type="tel"
                          name="phone"
                          placeholder="+92 300 1234567"
                          value={formData.phone}
                          onChange={handleChange}
                          className="bg-slate-50 dark:bg-slate-800/50"
                        />
                      </div>

                      {/* Approximate Students */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Users size={14} weight="duotone" className="text-emerald-600" />
                          Student Body Size
                        </label>
                        <select
                          name="studentCount"
                          value={formData.studentCount}
                          onChange={handleChange}
                          className="w-full h-10 px-3 rounded-lg border border-input bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="100 - 500">100 - 500 Students</option>
                          <option value="500 - 2,000">500 - 2,000 Students</option>
                          <option value="2,000 - 10,000">2,000 - 10,000 Students</option>
                          <option value="10,000+">10,000+ Students (Enterprise)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <Button type="button" variant="ghost" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="glow" className="gap-2">
                        <span>Submit Registration</span>
                        <ArrowRight size={16} weight="bold" />
                      </Button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="py-8 text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle size={38} weight="fill" />
                  </div>
                  <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                    Application Received!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-slate-800 dark:text-slate-200">{formData.contactName || 'Representative'}</strong>. 
                    Our institutional partnership team will review <strong className="text-slate-800 dark:text-slate-200">{formData.instituteName || 'your institution'}</strong> and connect with you at <strong className="text-emerald-600">{formData.email}</strong> within 24 business hours.
                  </p>
                  <div className="pt-4">
                    <Button variant="default" onClick={handleClose} className="px-8">
                      Done
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
