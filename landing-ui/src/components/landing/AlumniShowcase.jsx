import React, { useRef, useState, useMemo } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowUpRight } from 'lucide-react';
import { top_alumni, institutes } from '@/data/mockData';

// -------------------------------------------------------------
// Interactive Parallax Card Component
// -------------------------------------------------------------
function AlumniCard({ alumnus, index, isHovered, onHover, onLeave, onClick, instituteName, instituteLogo }) {
  const cardRef = useRef(null);
  
  // Mouse position values for parallax
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth spring configuration
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);
  
  // Transforms for image and content
  const imgX = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);
  const imgY = useTransform(smoothY, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    onLeave();
  };

  const opacity = isHovered === null ? 1 : isHovered === index ? 1 : 0.4;
  const scale = isHovered === index ? 1.02 : 1;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ opacity, scale }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative bg-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between border border-slate-200/80 hover:border-slate-300 min-h-[460px] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all"
    >
      {/* Background Subtle Hover Tint */}
      <motion.div 
        className="absolute inset-0 bg-slate-50/70 opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{ opacity: isHovered === index ? 1 : 0 }}
      />

      {/* Top part: Identity info */}
      <div className="relative z-20 pointer-events-none">
        <div className="flex justify-between items-start mb-6">
          {/* Natural Full Color Portrait */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md bg-slate-100 border border-slate-100 flex-shrink-0">
            <motion.img 
              src={alumnus.picture} 
              alt={alumnus.name}
              style={{ x: imgX, y: imgY, scale: 1.1 }}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {/* Pill styled like #01 National Rank */}
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-sm">
              {alumnus.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {alumnus.year}
            </span>
          </div>
        </div>

        {/* Alumnus Name in Bold Display Type */}
        <motion.h3 
          style={{ x: useTransform(smoothX, [-0.5, 0.5], [-5, 5]) }}
          className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight mb-1"
        >
          {alumnus.name}
        </motion.h3>

        {/* Role & Company */}
        <motion.div 
          style={{ x: useTransform(smoothX, [-0.5, 0.5], [-3, 3]) }}
          className="flex flex-col gap-0.5 mb-5"
        >
          <p className="text-base sm:text-lg font-bold text-slate-700">
            {alumnus.role}
          </p>
          <p className="text-sm font-semibold text-slate-500">
            @ {alumnus.company}
          </p>
        </motion.div>

        {/* Alma Mater Tag with Logo */}
        {alumnus.degree && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200/80 max-w-full shadow-sm">
            {instituteLogo ? (
              <img src={instituteLogo} alt={instituteName} className="w-4 h-4 object-contain rounded-sm" />
            ) : (
              <GraduationCap size={15} className="text-slate-700 flex-shrink-0" />
            )}
            <span className="truncate">
              {instituteName} • {alumnus.degree}
            </span>
          </div>
        )}
      </div>

      {/* Bottom part: Success Story & Click prompt */}
      <motion.div 
        style={{ y: useTransform(smoothY, [-0.5, 0.5], [-5, 5]) }}
        className="relative z-20 mt-6 pt-5 border-t border-slate-200/80 pointer-events-none"
      >
        <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-2 mb-4">
          "{alumnus.successStory}"
        </p>
        <div className="flex items-center justify-between text-xs font-black text-slate-900">
          <span className="text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-wider">
            Explore Full Monograph
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-900 group-hover:translate-x-1 transition-transform">
            <span>View</span>
            <ArrowUpRight size={15} />
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// -------------------------------------------------------------
// Infinite Marquee Component
// -------------------------------------------------------------
function MarqueeText() {
  return (
    <div className="relative w-full overflow-hidden flex whitespace-nowrap mb-12 select-none pointer-events-none">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 28 }}
        className="flex"
      >
        <h2 className="text-[10rem] md:text-[14rem] font-black tracking-tighter text-slate-200/60 leading-[0.8] px-8">
          ALUMNI • LEADERS • ALUMNI • LEADERS •
        </h2>
        <h2 className="text-[10rem] md:text-[14rem] font-black tracking-tighter text-slate-200/60 leading-[0.8] px-8">
          ALUMNI • LEADERS • ALUMNI • LEADERS •
        </h2>
      </motion.div>
    </div>
  );
}

// -------------------------------------------------------------
// Main Showcase Component
// -------------------------------------------------------------
export default function AlumniShowcase() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Use top 6 alumni for landing page showcase
  const showcaseAlumni = top_alumni.slice(0, 6);

  // Map institute ID to shortName and logo
  const instituteMap = useMemo(() => {
    const map = {};
    institutes.forEach(inst => {
      map[inst.id] = inst;
    });
    return map;
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 80, damping: 20 }
    }
  };

  return (
    <section 
      id="alumni"
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#fafbfc] pt-32 pb-40 overflow-hidden"
    >
      {/* Background Marquee Text */}
      <MarqueeText />

      <div className="max-w-7xl mx-auto px-6 relative z-10 -mt-16 md:-mt-32">
        {/* Section Header */}
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold tracking-tight mb-3 shadow-sm">
              Global Alumni Network
            </span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9]">
              Alumni. Leaders.
            </h2>
          </div>
          <p className="max-w-md text-lg text-slate-600 font-medium leading-relaxed">
            Graduates steering artificial intelligence, aerospace, and sovereign finance across 40+ nations.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {showcaseAlumni.map((alumnus, idx) => {
            const inst = instituteMap[alumnus.instituteId];
            return (
              <motion.div key={alumnus.id} variants={itemVariants}>
                <AlumniCard 
                  alumnus={alumnus} 
                  index={idx}
                  isHovered={hoveredCard}
                  onHover={setHoveredCard}
                  onLeave={() => setHoveredCard(null)}
                  onClick={() => navigate(`/alumni/${alumnus.id}`)}
                  instituteName={inst?.shortName || 'University'}
                  instituteLogo={inst?.logo}
                />
              </motion.div>
            );
          })}
        </motion.div>
        
        {/* Animated Button */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
          className="mt-20 flex justify-center"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/alumni')}
            className="px-10 py-5 bg-slate-900 text-white rounded-full font-black tracking-wide shadow-2xl hover:bg-slate-800 transition-all inline-flex items-center gap-2 text-sm uppercase"
          >
            <span>Explore All {top_alumni.length} Fellows</span>
            <ArrowUpRight size={18} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}