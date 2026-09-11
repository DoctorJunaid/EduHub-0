import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Mock images for the explosion effect (could be UI screenshots, campus photos)
const images = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&q=80",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&q=80",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&q=80",
  "https://images.unsplash.com/photo-1513258496099-48166d28929e?w=400&q=80",
];

export default function ExplosionParallax() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Calculate distinct paths for each image so they fan out dynamically across the screen
  // without flying off into negative space or leaving dead white margins
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -40]);
  const x1 = useTransform(scrollYProgress, [0, 1], [0, -360]);
  const r1 = useTransform(scrollYProgress, [0, 1], [-6, -26]);

  const y2 = useTransform(scrollYProgress, [0, 1], [90, -50]);
  const x2 = useTransform(scrollYProgress, [0, 1], [25, 360]);
  const r2 = useTransform(scrollYProgress, [0, 1], [5, 22]);

  const y3 = useTransform(scrollYProgress, [0, 1], [50, 10]);
  const x3 = useTransform(scrollYProgress, [0, 1], [-20, -520]);
  const r3 = useTransform(scrollYProgress, [0, 1], [-4, -16]);

  const y4 = useTransform(scrollYProgress, [0, 1], [110, -30]);
  const x4 = useTransform(scrollYProgress, [0, 1], [-10, 480]);
  const r4 = useTransform(scrollYProgress, [0, 1], [8, 30]);

  const y5 = useTransform(scrollYProgress, [0, 1], [80, 20]);
  const x5 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const r5 = useTransform(scrollYProgress, [0, 1], [-2, -8]);

  const cardsOpacity = useTransform(scrollYProgress, [0, 0.15, 1], [0.6, 1, 1]);

  const transforms = [
    { x: x1, y: y1, rotate: r1 },
    { x: x2, y: y2, rotate: r2 },
    { x: x3, y: y3, rotate: r3 },
    { x: x4, y: y4, rotate: r4 },
    { x: x5, y: y5, rotate: r5 },
  ];

  return (
    <section ref={containerRef} className="relative w-full h-[120vh] bg-white overflow-hidden">
      
      {/* Sticky Fullscreen Container: keeps text and cards synchronized */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden pointer-events-none">
        
        {/* Pinned Top Header: sits safely above the card cluster */}
        <div className="pt-24 md:pt-28 text-center z-30 px-6 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">
            From fragmented admissions to <br className="hidden md:block"/> unified campus intelligence.
          </h2>
          <p className="text-lg md:text-xl text-slate-500 mt-4 max-w-2xl mx-auto font-medium">
            Verifiable rankings, transparent fee structures, and decentralized alumni networks in one living ecosystem.
          </p>
        </div>

        {/* Cards Explosion Playground: centered in the lower 65% of the viewport */}
        <motion.div 
          className="relative flex-1 w-full flex items-center justify-center"
          style={{ opacity: cardsOpacity }}
        >
          {images.map((src, i) => (
            <motion.div
              key={i}
              className="absolute w-44 h-60 md:w-56 md:h-76 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100"
              style={{
                x: transforms[i].x,
                y: transforms[i].y,
                rotate: transforms[i].rotate,
                zIndex: 10 - i,
              }}
            >
              <img 
                src={src} 
                alt={`Explosion ${i}`} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.src = '/universities/nust.jpg';
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom spacer to balance the viewport */}
        <div className="h-10 pointer-events-none" />
      </div>
    </section>
  );
}
