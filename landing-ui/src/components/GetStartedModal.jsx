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
  Users,
  WarningCircle,
  SpinnerGap
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
import { getBackendApiUrl } from '@/config/urls'

const INITIAL_FORM = {
  instituteName: '',
  instituteType: 'University',
  city: 'Islamabad',
  contactName: '',
  email: '',
  phone: '',
  studentCount: '1000+'
}

export default function GetStartedModal({ isOpen, onClose }) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [referenceId, setReferenceId] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errorMessage) setErrorMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.instituteName.trim()) {
      setErrorMessage("Please enter the name of your institution.")
      return
    }
    if (!formData.contactName.trim()) {
      setErrorMessage("Please enter the authorized contact person's name.")
      return
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setErrorMessage("Please enter a valid official email address.")
      return
    }
    if (!formData.phone.trim()) {
      setErrorMessage("Please enter a valid phone number.")
      return
    }

    setIsSubmitting(true)
    try {
      const apiUrl = getBackendApiUrl()
      const response = await fetch(`${apiUrl}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.contactName.trim(),
          instituteName: formData.instituteName.trim(),
          instituteType: formData.instituteType,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          city: formData.city,
          studentCount: formData.studentCount,
          message: `Digital Onboarding Lead from Landing Page. City: ${formData.city} | Approximate Students: ${formData.studentCount}`,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.errors?.[0] || "Failed to submit registration. Please try again.")
      }

      setReferenceId(data.data?._id || data.data?.id || `INQ-${Date.now().toString().slice(-6)}`)
      setIsSubmitted(true)
    } catch (err) {
      console.error("Partner registration error:", err)
      setErrorMessage(err.message || "Network error. Please verify backend connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsSubmitted(false)
    setIsSubmitting(false)
    setErrorMessage(null)
    setFormData(INITIAL_FORM)
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

                  {errorMessage && (
                    <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                      <WarningCircle size={18} className="shrink-0 text-red-500" weight="fill" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

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
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
                          name="instituteType"
                          value={formData.instituteType}
                          onChange={handleChange}
                          className="w-full h-10 px-3 rounded-lg border border-input bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
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
                          disabled={isSubmitting}
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full h-10 px-3 rounded-lg border border-input bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
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
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
                          name="studentCount"
                          value={formData.studentCount}
                          onChange={handleChange}
                          className="w-full h-10 px-3 rounded-lg border border-input bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                        >
                          <option value="100 - 500">100 - 500 Students</option>
                          <option value="500 - 2,000">500 - 2,000 Students</option>
                          <option value="2,000 - 10,000">2,000 - 10,000 Students</option>
                          <option value="10,000+">10,000+ Students (Enterprise)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <Button type="button" variant="ghost" disabled={isSubmitting} onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="glow" disabled={isSubmitting} className="gap-2">
                        {isSubmitting ? (
                          <>
                            <SpinnerGap size={16} className="animate-spin" />
                            <span>Submitting Application...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Registration</span>
                            <ArrowRight size={16} weight="bold" />
                          </>
                        )}
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
                  {referenceId && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-semibold">
                      <span>Docket Ref:</span>
                      <span className="font-bold">{referenceId}</span>
                    </div>
                  )}
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
