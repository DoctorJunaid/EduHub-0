import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DOT_COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function FooterHuge() {
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % DOT_COLORS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full bg-[#0a0a0a] text-white pt-32 pb-16 px-6">
      {/* Massive Editorial Header: Pure and bold */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 border-b border-white/10 pb-24">
        <div>
          <h2 className="text-[6rem] md:text-[12rem] font-black tracking-tighter leading-[0.8] mb-4">
            EduHub<span className="transition-colors duration-500" style={{ color: DOT_COLORS[dotIndex] }}>.</span>
          </h2>
        </div>
      </div>
      
      {/* Clean, spacious layout matching previous structure */}
      <div className="max-w-7xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        <div className="flex flex-col space-y-3 font-bold text-lg md:text-2xl">
          <Link to="/" className="hover:text-slate-300 transition-colors">Home.</Link>
          <Link to="/rankings" className="hover:text-slate-300 transition-colors">Rankings.</Link>
          <Link to="/institutes" className="hover:text-slate-300 transition-colors">Institutions.</Link>
          <Link to="/alumni" className="hover:text-slate-300 transition-colors">Alumni.</Link>
          <a href="/#solutions" className="hover:text-slate-300 transition-colors">Solutions.</a>
        </div>
        
        <div className="flex flex-col space-y-2 text-sm text-white/60">
          <Link to="/institutes" className="hover:text-white transition-colors">Campuses.</Link>
          <Link to="/rankings" className="hover:text-white transition-colors">HEC Rankings.</Link>
          <Link to="/alumni" className="hover:text-white transition-colors">Fellows.</Link>
          <a href="#" className="hover:text-white transition-colors">Contact us.</a>
          <a href="#" className="hover:text-white transition-colors">Privacy policy.</a>
        </div>
        
        <div className="col-span-2 lg:col-span-3 flex flex-col">
          <h4 className="font-bold text-xl md:text-2xl mb-4">Get EduHub in your inbox.</h4>
          <div className="flex items-center border-b-2 border-white pb-2 max-w-md w-full">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/50 text-xl"
            />
            <button className="text-white hover:text-blue-400 transition-colors" title="Subscribe">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="text-white/40 text-xs mt-3">
            Pure academic data. No spam. <a href="#" className="underline">See privacy policy.</a>
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-24 flex justify-between text-xs text-white/40">
        <p>Copyright © 2026 EduHub. All rights reserved.</p>
        <p>HEC Chartered Standard.</p>
      </div>
    </footer>
  );
}
