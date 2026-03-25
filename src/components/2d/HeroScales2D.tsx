import React from 'react';
import { motion } from 'framer-motion';

const HeroScales2D: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Gold aura behind */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(201,162,39,0.18) 0%, rgba(201,162,39,0.06) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Floating gold particles */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + (i % 3) * 1.5}px`,
            height: `${2 + (i % 3) * 1.5}px`,
            background: `rgba(201,162,39,${0.3 + (i % 4) * 0.1})`,
            left: `${20 + (i * 37) % 60}%`,
            top: `${10 + (i * 53) % 80}%`,
          }}
          animate={{
            y: [0, -20 - (i % 5) * 8, 0],
            x: [0, (i % 2 === 0 ? 10 : -10), 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 6 + (i % 5) * 2,
            repeat: Infinity,
            delay: (i * 0.3) % 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* SVG Scales */}
      <motion.svg
        viewBox="0 0 500 520"
        className="relative z-10 w-full max-w-[400px] h-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8c547" />
            <stop offset="50%" stopColor="#c9a227" />
            <stop offset="100%" stopColor="#a07c1a" />
          </linearGradient>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0.8 0 0 0  0.6 0.5 0 0 0  0 0 0 0 0  0 0 0 0.6 0" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#goldGlow)">
          {/* Base - three stacked rects */}
          <rect x="195" y="460" width="110" height="16" rx="4" fill="url(#goldGrad)" />
          <rect x="205" y="448" width="90" height="14" rx="3" fill="url(#goldGrad)" />
          <rect x="215" y="438" width="70" height="12" rx="3" fill="url(#goldGrad)" />

          {/* Central pole */}
          <rect x="247" y="160" width="6" height="280" rx="3" fill="url(#goldGrad)" />

          {/* Top ornament */}
          <circle cx="250" cy="155" r="8" fill="url(#goldGrad)" />

          {/* Horizontal beam - animated tipping group */}
          <motion.g
            style={{ originX: '250px', originY: '170px' }}
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="90" y="168" width="320" height="5" rx="2.5" fill="url(#goldGrad)" />

            {/* Left chain */}
            <motion.g
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <circle key={`lc${i}`} cx="90" cy={190 + i * 14} r="3" fill="none" stroke="#c9a227" strokeWidth="1.5" />
              ))}
              {/* Left dish */}
              <circle cx="90" cy={310} r="40" fill="none" stroke="#c9a227" strokeWidth="2.5" />
              <ellipse cx="90" cy={312} rx="35" ry="7" fill="url(#goldGrad)" opacity="0.8" />
            </motion.g>

            {/* Right chain */}
            <motion.g
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <circle key={`rc${i}`} cx="410" cy={190 + i * 14} r="3" fill="none" stroke="#c9a227" strokeWidth="1.5" />
              ))}
              {/* Right dish */}
              <circle cx="410" cy={310} r="40" fill="none" stroke="#c9a227" strokeWidth="2.5" />
              <ellipse cx="410" cy={312} rx="35" ry="7" fill="url(#goldGrad)" opacity="0.8" />
            </motion.g>
          </motion.g>
        </g>
      </motion.svg>
    </div>
  );
};

export default React.memo(HeroScales2D);
