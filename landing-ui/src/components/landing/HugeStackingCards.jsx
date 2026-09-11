import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { institutes } from '@/data/mockData';

const RankCard = ({ institute, index, navigate }) => {
  const imgUrl = (institute.gallery && institute.gallery[0]) ? institute.gallery[0] : institute.image;
  const rankNum = index + 1;
  
  // Dynamic sizing based on rank to satisfy "1st biggest, lower ranks smaller"
  let colSpan = 'md:col-span-6';
  let height = 'h-[400px]';
  let titleSize = 'text-4xl';
  let hideMotto = true;
  
  if (rankNum === 1) {
    colSpan = 'md:col-span-12';
    height = 'h-[500px] md:h-[650px]';
    titleSize = 'text-6xl md:text-[6rem]';
    hideMotto = false;
  } else if (rankNum === 2) {
    colSpan = 'md:col-span-7';
    height = 'h-[450px] md:h-[500px]';
    titleSize = 'text-5xl md:text-7xl';
    hideMotto = false;
  } else if (rankNum === 3) {
    colSpan = 'md:col-span-5';
    height = 'h-[450px] md:h-[500px]';
    titleSize = 'text-4xl md:text-5xl';
    hideMotto = false;
  } else if (rankNum === 4 || rankNum === 5) {
    colSpan = 'md:col-span-6';
    height = 'h-[400px] md:h-[450px]';
    titleSize = 'text-4xl md:text-5xl';
    hideMotto = true;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ delay: index * 0.1, duration: 0.7, ease: "easeOut" }}
      onClick={() => navigate && navigate(`/institute/${institute.id}`)}
      className={`${colSpan} ${height} relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group cursor-pointer border border-slate-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500`}
    >
      {/* Vivid Background Image */}
      <div className="absolute inset-0 w-full h-full bg-slate-900">
        <img 
          src={imgUrl} 
          alt={institute.name}
          className="w-full h-full object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 ease-out"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80';
          }}
        />
      </div>
      
      {/* Dark overlay gradients strictly at top and bottom to keep center vivid */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

      {/* Top Header: Ranks */}
      <div className="absolute top-6 left-6 right-6 md:top-8 md:left-8 md:right-8 flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
            <span className="text-xl md:text-2xl font-black text-white">#{rankNum}</span>
          </div>
          <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white font-bold text-xs md:text-sm border border-white/20 uppercase tracking-widest shadow-lg hidden sm:block">
            {institute.nationalRank.split(' ')[0]}
          </span>
        </div>
        <div className="text-right bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
          <span className="block text-white/60 text-[10px] md:text-xs uppercase tracking-widest font-bold mb-0.5">QS Ranking</span>
          <span className="text-base md:text-xl font-black text-blue-300">{institute.globalRank}</span>
        </div>
      </div>

      {/* Content at Bottom */}
      <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 z-10 flex flex-col justify-end">
        
        <h2 className={`${titleSize} font-black text-white tracking-tighter mb-2 drop-shadow-2xl`}>
          {institute.shortName}
        </h2>
        
        {!hideMotto && (
          <p className="text-white/80 font-medium text-base md:text-lg max-w-xl leading-snug mb-6 line-clamp-2 drop-shadow-md">
            {institute.motto}
          </p>
        )}

        {/* Glassmorphism Stats Bar */}
        <div className={`grid grid-cols-2 ${rankNum === 1 ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-3 md:gap-4 p-4 md:p-5 bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl mt-4 md:mt-0`}>
          <div>
            <span className="block text-white/60 text-[9px] md:text-[11px] uppercase tracking-widest font-bold mb-1">Employability</span>
            <span className="text-white text-sm md:text-lg font-black tracking-tight">{institute.placementRate}</span>
          </div>
          <div>
            <span className="block text-white/60 text-[9px] md:text-[11px] uppercase tracking-widest font-bold mb-1">Enrollment</span>
            <span className="text-white text-sm md:text-lg font-black tracking-tight">{institute.studentEnrollment}</span>
          </div>
          <div className={`${rankNum !== 1 ? 'hidden md:block' : ''}`}>
            <span className="block text-white/60 text-[9px] md:text-[11px] uppercase tracking-widest font-bold mb-1">Faculty</span>
            <span className="text-white text-sm md:text-lg font-black tracking-tight">{institute.facultyCount}</span>
          </div>
          <div className={`${rankNum !== 1 ? 'hidden md:block' : ''}`}>
            <span className="block text-white/60 text-[9px] md:text-[11px] uppercase tracking-widest font-bold mb-1">Acceptance</span>
            <span className="text-white text-sm md:text-lg font-black tracking-tight">{institute.acceptanceRate}</span>
          </div>
        </div>
        
      </div>
    </motion.div>
  );
};

export default function HugeStackingCards() {
  const navigate = useNavigate();
  const topInstitutes = institutes.slice(0, 5);

  return (
    <section className="relative bg-[#fafbfc] pt-8 md:pt-12 pb-40">
      <div className="px-6 md:px-12 lg:px-20 mb-16 max-w-[1600px] mx-auto">
        <h3 className="text-sm md:text-xl font-bold tracking-widest uppercase text-slate-500 mb-4 ml-1 md:ml-2">
          HEC & QS Rankings // 2026 Official List
        </h3>
        <h2 className="text-5xl md:text-[7rem] lg:text-[8rem] font-black tracking-tighter text-slate-900 leading-[0.85] uppercase">
          Pakistan's<br/>
          <span style={{ color: '#3b82f6' }}>
            Top-Ranked
          </span><br/>
          Institutions.
        </h2>
      </div>
      
      {/* Bento Grid Layout for Rankings */}
      <div className="px-6 md:px-12 lg:px-20 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {topInstitutes.map((institute, i) => (
            <RankCard 
              key={institute.id} 
              index={i} 
              institute={institute} 
              navigate={navigate}
            />
          ))}
        </div>

        {/* View All Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-16 md:mt-24 flex justify-center"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/rankings')}
            className="group flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-full font-bold text-lg tracking-wide shadow-xl hover:shadow-2xl shadow-slate-900/20 hover:bg-blue-600 transition-colors duration-300"
          >
            View All Institutions &amp; Rankings
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
