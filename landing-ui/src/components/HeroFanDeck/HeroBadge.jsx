import React from 'react';
import { motion } from 'motion/react';

export default function HeroBadge({ 
  variant = 'blue', 
  handle = '@dr.usman', 
  subtext = 'AI Lab Director', 
  avatar = 'https://ui-avatars.com/api/?name=Dr+Usman&background=2563eb&color=fff',
  style = {},
  delay = 1.0,
  onClick
}) {
  const isBlue = variant === 'blue';
  
  return (
    <motion.div
      className={`hero-speech-badge ${isBlue ? 'badge-blue' : 'badge-green'}`}
      style={style}
      initial={{ scale: 0, opacity: 0, y: 15 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 18,
        delay: delay
      }}
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={`${handle} • ${subtext}`}
    >
      <img src={avatar} alt={handle} className="badge-avatar" />
      <span>{handle}</span>
    </motion.div>
  );
}
