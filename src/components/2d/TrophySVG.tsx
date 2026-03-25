import React from 'react';
import { motion } from 'framer-motion';

interface TrophySVGProps {
  className?: string;
  isMonthlyHero?: boolean;
}

const TrophySVG: React.FC<TrophySVGProps> = ({ className, isMonthlyHero }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Gold glow */}
      {isMonthlyHero && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(201,162,39,0.3) 0%, transparent 60%)',
            filter: 'blur(20px)',
          }}
        />
      )}

      <motion.div
        className="relative"
        animate={{ y: [-6, 6, -6], rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-lg"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'trophyShimmer 2.5s infinite',
          }}
        />

        <svg viewBox="0 0 120 160" className="w-full h-full relative z-0">
          <defs>
            <linearGradient id="trophyGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e8c547" />
              <stop offset="50%" stopColor="#c9a227" />
              <stop offset="100%" stopColor="#a07c1a" />
            </linearGradient>
            <filter id="trophyGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="1 0.8 0 0 0  0.6 0.5 0 0 0  0 0 0 0 0  0 0 0 0.5 0" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter="url(#trophyGlow)">
            {/* Cup */}
            <path
              d="M30 20 Q28 60 38 80 Q45 90 50 95 L50 110 L70 110 L70 95 Q75 90 82 80 Q92 60 90 20 Z"
              fill="url(#trophyGold)"
            />
            {/* Left handle */}
            <path d="M30 30 Q10 30 10 55 Q10 75 30 75" fill="none" stroke="url(#trophyGold)" strokeWidth="5" strokeLinecap="round" />
            {/* Right handle */}
            <path d="M90 30 Q110 30 110 55 Q110 75 90 75" fill="none" stroke="url(#trophyGold)" strokeWidth="5" strokeLinecap="round" />
            {/* Stem */}
            <rect x="55" y="110" width="10" height="20" rx="2" fill="url(#trophyGold)" />
            {/* Base */}
            <rect x="35" y="130" width="50" height="10" rx="4" fill="url(#trophyGold)" />
            <rect x="40" y="140" width="40" height="8" rx="3" fill="url(#trophyGold)" />
            {/* Star */}
            <polygon
              points="60,35 63,45 73,45 65,51 68,62 60,55 52,62 55,51 47,45 57,45"
              fill="#a07c1a"
              opacity="0.6"
            />
          </g>
        </svg>
      </motion.div>

      {/* Confetti for Monthly Hero */}
      {isMonthlyHero && (
        <>
          {Array.from({ length: 20 }).map((_, i) => {
            const colors = ['#c9a227', '#e8c547', '#ffffff', '#ffaa00'];
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: `${4 + (i % 3) * 2}px`,
                  height: `${4 + (i % 3) * 2}px`,
                  background: colors[i % 4],
                  borderRadius: i % 2 === 0 ? '50%' : '2px',
                  left: '50%',
                  top: '30%',
                }}
                animate={{
                  x: [(i % 2 === 0 ? -1 : 1) * (20 + (i * 7) % 60)],
                  y: [0, 80 + (i * 13) % 60],
                  opacity: [1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2 + (i % 3),
                  repeat: Infinity,
                  delay: (i * 0.15) % 3,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </>
      )}

      <style>{`
        @keyframes trophyShimmer {
          0% { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(TrophySVG);
