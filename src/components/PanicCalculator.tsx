import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PanicCalculator = ({ onExit }: { onExit: () => void }) => {
  const [display, setDisplay] = useState('0');
  const [sequence, setSequence] = useState('');

  const handleKey = (key: string) => {
    if (key === 'C') {
      setDisplay('0');
      setSequence('');
      return;
    }
    if (key === '=') {
      const check = sequence + '=';
      if (check.endsWith('1234=')) {
        onExit();
        return;
      }
      try {
        // eslint-disable-next-line no-eval
        const result = Function('"use strict";return (' + display + ')')();
        setDisplay(String(result));
      } catch {
        setDisplay('Error');
      }
      setSequence('');
      return;
    }

    setSequence(prev => prev + key);
    setDisplay(prev => prev === '0' || prev === 'Error' ? key : prev + key);
  };

  const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', 'C', '0', '=', '+'];

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#f5f5f5' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-80 rounded-2xl overflow-hidden shadow-lg" style={{ background: '#ffffff' }}>
        <div className="p-6 text-right" style={{ background: '#f9fafb', minHeight: '80px' }}>
          <p className="text-3xl font-mono" style={{ color: '#111827' }}>{display}</p>
        </div>
        <div className="grid grid-cols-4 gap-px p-3">
          {keys.map(key => (
            <button
              key={key}
              onClick={() => handleKey(key === '×' ? '*' : key === '÷' ? '/' : key)}
              className="h-14 rounded-xl text-lg font-body font-medium nyaya-transition hover:opacity-80 active:scale-95"
              style={{
                background: ['÷', '×', '-', '+', '='].includes(key) ? '#1a3c5e' : key === 'C' ? '#ef4444' : '#f3f4f6',
                color: ['÷', '×', '-', '+', '='].includes(key) || key === 'C' ? '#ffffff' : '#111827',
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PanicCalculator;
