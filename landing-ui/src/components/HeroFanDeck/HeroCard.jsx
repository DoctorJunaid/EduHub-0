import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Sparkle, Star } from '@phosphor-icons/react';

export default function HeroCard({
  card,
  index,
  totalCards = 7,
  isFanned = true,
  isIntroComplete = false,
  hoveredIndex,
  onHover,
  mobileLayout = false,
  onSelect
}) {
  const centerIndex = Math.floor(totalCards / 2);
  const diff = index - centerIndex;
  const isHovered = hoveredIndex === index;
  const hasAnyHover = hoveredIndex !== null;

  const baseRotation = diff * 4.6;
  const spreadFactor = mobileLayout ? 0 : (typeof window !== 'undefined' && window.innerWidth < 900 ? 50 : (typeof window !== 'undefined' && window.innerWidth < 1150 ? 60 : 70));
  const baseTranslateX = diff * spreadFactor;
  const baseTranslateY = Math.pow(Math.abs(diff), 1.8) * 4.2;
  const baseZIndex = 20 + (totalCards - Math.abs(diff)) * 4;

  let dynamicX = baseTranslateX;
  let dynamicY = baseTranslateY;
  let dynamicRotate = baseRotation;
  let dynamicScale = 1;
  let dynamicZIndex = baseZIndex;
  let dynamicOpacity = 1;

  if (isFanned) {
    if (isHovered && !mobileLayout) {
      dynamicRotate = 0;
      dynamicY = baseTranslateY - 32;
      dynamicScale = 1.18;
      dynamicZIndex = 120;
    } else if (hasAnyHover && !mobileLayout) {
      dynamicX += index < hoveredIndex ? -12 : 12;
      dynamicRotate += index < hoveredIndex ? -1.2 : 1.2;
      dynamicScale = 0.97;
      dynamicOpacity = 0.9;
    }
  } else {
    dynamicX = diff * 5;
    dynamicY = 120 + diff * 2;
    dynamicRotate = diff * 2;
    dynamicScale = 0.6;
  }

  return (
    <motion.div
      className="hero-card-anchor"
      style={{ zIndex: dynamicZIndex }}
      initial={mobileLayout ? { x: 0, y: 24, rotate: 0, scale: 1, opacity: 0 } : {
        x: diff * 40, y: 350, rotate: diff * 30, scale: 0.1, opacity: 0
      }}
      animate={{
        x: mobileLayout ? 0 : (isFanned ? dynamicX : 0),
        y: mobileLayout ? (isFanned ? 0 : 24) : (isFanned ? dynamicY : 80),
        rotate: mobileLayout ? 0 : (isFanned ? dynamicRotate : 0),
        scale: mobileLayout ? 1 : (isFanned ? dynamicScale : 0.85),
        opacity: mobileLayout ? (isFanned ? 1 : 0) : (isFanned ? dynamicOpacity : 1),
      }}
      transition={{
        type: mobileLayout ? 'tween' : 'spring',
        duration: mobileLayout ? 0.35 : undefined,
        stiffness: isHovered ? 260 : 130,
        damping: isHovered ? 22 : 17,
        mass: 0.85,
        delay: isFanned && !isIntroComplete ? (mobileLayout ? index * 0.06 : 0.35 + Math.abs(diff) * 0.05) : 0,
      }}
      onMouseEnter={() => !mobileLayout && onHover(index)}
      onMouseLeave={() => !mobileLayout && onHover(null)}
      onClick={() => onSelect(card)}
    >
      <div 
        className="hero-card"
        style={{
          '--card-accent': card.accent || '#10b981'
        }}
      >
        {/* Artwork Image */}
        <img 
          src={card.image} 
          alt={card.title} 
          className="hero-card-img" 
          loading="lazy"
        />

        {/* Dynamic Dark Gradient Overlay */}
        <div className="hero-card-overlay" />

        {/* Top Glass Highlight */}
        <div className="hero-card-sheen" />

        {/* Center Crown Badge if top featured */}
        {card.isCrown && (
          <div className="crown-card-badge">
            <Sparkle size={10} weight="fill" style={{ marginRight: 4 }} />
            Campus Service
          </div>
        )}

        {/* Card Content Overlay */}
        <div className="hero-card-content">
          <div className="hero-card-top">
            <span className="hero-card-tag">
              {card.category}
            </span>
            <div className="hero-card-icon" title="View details">
              <ArrowUpRight size={14} weight="bold" />
            </div>
          </div>

          <div className="hero-card-bottom">
            <span className="hero-card-subtitle">{card.subtitle}</span>
            <h4 className="hero-card-title">{card.title}</h4>
            <div className="hero-card-stat">
              <Star size={12} weight="fill" color="#f59e0b" />
              <span>{card.stat}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
