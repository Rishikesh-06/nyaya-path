import React from 'react';
import { motion } from 'framer-motion';

interface PodiumCSSProps {
  className?: string;
  top3?: { name: string; initials: string; score: number }[];
}

const defaults = [
  { name: 'Sunita Devi', initials: 'SD', score: 3400 },
  { name: 'Arjun Mehta', initials: 'AM', score: 2100 },
  { name: 'Priya Sharma', initials: 'PS', score: 847 },
];

const PodiumCSS: React.FC<PodiumCSSProps> = ({ className, top3 = defaults }) => {
  const podiums = [
    { rank: 2, data: top3[1], height: 90, width: 120, gradient: 'linear-gradient(180deg, #e8e8e8, #a8a8a8)', shadow: '0 0 20px rgba(180,180,180,0.3)', avatarBg: 'rgba(180,180,180,0.2)', avatarBorder: 'rgba(180,180,180,0.4)', delay: 0 },
    { rank: 1, data: top3[0], height: 120, width: 140, gradient: 'linear-gradient(180deg, #e8c547, #c9a227, #a07c1a)', shadow: '0 0 30px rgba(201,162,39,0.4), 0 0 60px rgba(201,162,39,0.15)', avatarBg: 'rgba(201,162,39,0.15)', avatarBorder: 'rgba(201,162,39,0.5)', delay: 0.3 },
    { rank: 3, data: top3[2], height: 72, width: 120, gradient: 'linear-gradient(180deg, #CD7F32, #8B4513)', shadow: '0 0 20px rgba(205,127,50,0.3)', avatarBg: 'rgba(205,127,50,0.15)', avatarBorder: 'rgba(205,127,50,0.4)', delay: 0.15 },
  ];

  return (
    <div className={`flex items-end justify-center gap-3 ${className}`}>
      {podiums.map((p) => (
        <div key={p.rank} className="flex flex-col items-center">
          {/* Avatar */}
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
            style={{ background: p.avatarBg, border: `2px solid ${p.avatarBorder}` }}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: p.delay + 0.4 }}
          >
            <span className="font-body font-bold text-sm text-foreground">{p.data?.initials}</span>
          </motion.div>
          <p className="text-xs font-body text-muted-foreground mb-2 text-center max-w-[100px] truncate">{p.data?.name}</p>

          {/* Podium */}
          <motion.div
            className="rounded-t-xl flex items-end justify-center pb-3 relative overflow-hidden"
            style={{
              width: p.width,
              background: p.gradient,
              boxShadow: p.shadow,
            }}
            initial={{ height: 0 }}
            animate={{ height: p.height }}
            transition={{
              type: 'spring',
              stiffness: 120,
              damping: 14,
              mass: 0.8,
              delay: p.delay,
            }}
          >
            <span
              className="font-display font-bold text-foreground absolute top-2"
              style={{ fontSize: '48px', opacity: 0.1 }}
            >
              {p.rank}
            </span>
            <span className="font-mono font-bold text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {p.data?.score} pts
            </span>
          </motion.div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(PodiumCSS);
