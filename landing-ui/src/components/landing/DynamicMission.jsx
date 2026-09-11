import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const words = [
  { text: 'students.', color: '#ec4899' }, // pink-500
  { text: 'teachers.', color: '#8b5cf6' }, // violet-500
  { text: 'institutes.', color: '#3b82f6' }, // blue-500
  { text: 'creators.', color: '#10b981' }, // emerald-500
  { text: 'the future.', color: '#f59e0b' }, // amber-500
];

export default function DynamicMission() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full min-h-screen bg-white dark:bg-slate-50 flex items-center justify-center py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <h2 className="text-5xl md:text-7xl lg:text-[7rem] font-black tracking-tighter text-slate-900 leading-[1.1] md:leading-[1.1]">
          We build education that matters to{' '}
          <span className="relative inline-block whitespace-nowrap">
            <AnimatePresence mode="wait">
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute left-0 top-0"
                style={{ color: words[index].color }}
              >
                {words[index].text}
              </motion.span>
            </AnimatePresence>
            {/* Invisible placeholder to maintain width */}
            <span className="opacity-0 pointer-events-none select-none">
              {words[4].text}
            </span>
          </span>
        </h2>

        <motion.div
          className="mt-24 md:mt-32 max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-2xl md:text-4xl text-slate-500 font-medium leading-snug tracking-tight">
            Anyone can build a portal. Creating experiences that resonate with campuses and modern learners is the hard part.
            It takes <span className="text-slate-900 font-bold">design, tech and human insight.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
