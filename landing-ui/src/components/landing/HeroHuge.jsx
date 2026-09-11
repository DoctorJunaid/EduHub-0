import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function HeroHuge({ onGetStarted }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100svh] bg-black overflow-hidden flex flex-col cursor-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Education Background Video Layer (High Performance, Local MP4) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          key="/hero/studyhall.mp4?v=5"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/hero/studyhall-poster.jpg"
          src="/hero/studyhall.mp4?v=5"
          className="w-full h-full object-cover object-center scale-100 opacity-100"
        />

        {/* Localized subtle text scrim: strictly shields bottom-left typography without affecting 80% of video quality */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_bottom_left,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.25)_35%,transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>


      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-12 pb-16 pointer-events-none">
        <motion.h1 
          className="text-white text-7xl md:text-8xl lg:text-[11rem] font-black tracking-tighter leading-[0.85] drop-shadow-[0_6px_28px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          EduHub.
        </motion.h1>
        <motion.div
          className="mt-4 md:mt-6 max-w-4xl pointer-events-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-white text-xl md:text-3xl font-medium tracking-tight leading-snug drop-shadow-[0_3px_16px_rgba(0,0,0,0.95)]">
            Pure, verifiable data for students choosing their next institute. A centralized cloud operating system for academies, schools, colleges, and universities—<span className="text-white font-bold underline decoration-blue-500 underline-offset-4">with zero proprietary data lock-in.</span>
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <button 
              onClick={() => document.getElementById('rankings')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-sm tracking-wide uppercase hover:bg-slate-100 transition-all active:scale-95 shadow-2xl"
            >
              Explore Rankings & Fees
            </button>
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-black/60 backdrop-blur-md border border-white/40 text-white rounded-full font-bold text-sm tracking-wide uppercase hover:bg-black/80 transition-all active:scale-95 shadow-xl"
            >
              Institutional Solutions
            </button>
          </div>
        </motion.div>
      </div>

      {/* Custom Cursor */}
      <motion.div 
        className="fixed top-0 left-0 w-24 h-24 bg-white text-black rounded-full flex items-center justify-center font-bold text-[10px] pointer-events-none z-[100] text-center uppercase tracking-wider leading-tight shadow-xl"
        animate={{
          x: mousePos.x - 48,
          y: mousePos.y - 48,
          scale: isHovering ? 1 : 0,
          opacity: isHovering ? 1 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 15,
          mass: 0.1
        }}
      >
        Scroll<br/>down
      </motion.div>
    </div>
  );
}
