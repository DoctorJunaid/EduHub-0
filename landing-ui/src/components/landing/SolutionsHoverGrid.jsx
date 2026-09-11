import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const solutions = [
  {
    title: "Campus strategy & design.",
    description: "Living campuses shaped with taste and intelligence.",
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
  },
  {
    title: "Curriculum & content.",
    description: "Insight and creative that cut through the noise.",
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"
  },
  {
    title: "Products & platforms.",
    description: "From idea to adoption, fast.",
    img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
  },
  {
    title: "Composable commerce.",
    description: "Fee management built around your campus.",
    img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80"
  },
  {
    title: "Student experience.",
    description: "Interactions that meet every moment.",
    img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
  },
  {
    title: "AI activation.",
    description: "Transforming how educators work, today.",
    img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80"
  }
];

export default function SolutionsHoverGrid() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section ref={containerRef} className="relative w-full min-h-screen bg-[#fafbfc] pt-32 pb-40 px-6 cursor-default">
      <div className="max-w-7xl mx-auto mb-16">
        <h2 className="text-6xl md:text-[8rem] font-black tracking-tighter text-slate-900 leading-[0.8]">
          Solutions.
        </h2>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {solutions.map((sol, idx) => (
          <div 
            key={idx}
            className="group relative h-80 md:h-[400px] bg-white rounded-3xl p-10 flex flex-col justify-between transition-colors hover:bg-slate-50 border border-slate-100"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight max-w-sm relative z-20">
              {sol.title}
            </h3>
            <p className="text-lg md:text-xl font-medium text-slate-500 relative z-20">
              {sol.description}
            </p>
          </div>
        ))}
      </div>

      {/* Floating Image Cursor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50">
        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: mousePos.x - 150, 
                y: mousePos.y - 200 
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="absolute w-[300px] h-[400px] rounded-2xl overflow-hidden shadow-2xl"
            >
              <img 
                src={solutions[hoveredIndex].img} 
                alt="Hover Preview" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.src = '/hero/campus_platform.jpg';
                }}
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white text-slate-900 font-bold px-6 py-3 rounded-full text-sm">
                  Explore.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
