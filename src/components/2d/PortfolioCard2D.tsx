import React from 'react';
import { motion } from 'framer-motion';

const PortfolioCard2D: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        className="relative"
        initial={{ scaleX: 0.08, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 70, damping: 18, duration: 0.9 }}
      >
        {/* Main document card */}
        <div
          className="relative overflow-hidden"
          style={{
            width: 360,
            height: 240,
            background: 'linear-gradient(135deg, #f7f0e0, #ede3c8)',
            borderRadius: 12,
            boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {/* Left roller */}
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: 28,
              background: 'linear-gradient(180deg, #8B5E3C, #6B3A1F, #8B5E3C)',
              borderRadius: '14px 0 0 14px',
              boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.2), inset 2px 0 4px rgba(255,255,255,0.1)',
            }}
          />
          {/* Right roller */}
          <div
            className="absolute right-0 top-0 bottom-0"
            style={{
              width: 28,
              background: 'linear-gradient(180deg, #8B5E3C, #6B3A1F, #8B5E3C)',
              borderRadius: '0 14px 14px 0',
              boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.2), inset -2px 0 4px rgba(255,255,255,0.1)',
            }}
          />

          {/* Content area */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
            <motion.p
              className="font-display text-sm font-semibold tracking-[0.3em] mb-2"
              style={{ color: '#1a3c5e' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              VERIFIED PORTFOLIO
            </motion.p>
            <motion.div
              className="text-xs font-body mb-4"
              style={{ color: '#6b7280' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Aanya Patel • NLU Hyderabad
            </motion.div>

            {/* Wax seal */}
            <motion.div
              className="flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 1 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #e8c547, #c9a227, #a07c1a)',
                  boxShadow: '0 0 20px rgba(201,162,39,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                }}
              >
                <span className="font-display font-bold text-xl" style={{ color: '#1a0f00' }}>N</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(PortfolioCard2D);
