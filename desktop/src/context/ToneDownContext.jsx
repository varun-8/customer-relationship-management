import React, { createContext, useContext, useState, useEffect } from 'react';

const ToneDownContext = createContext(null);

export const ToneDownProvider = ({ children }) => {
  const [isToneDown, setIsToneDown] = useState(() => {
    try {
      const saved = localStorage.getItem('vasantham_tone_down_mode');
      // Default to true unless explicitly turned off
      if (saved === null || saved === undefined) return true;
      return saved === 'true';
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vasantham_tone_down_mode', isToneDown ? 'true' : 'false');
      if (isToneDown) {
        document.body.classList.add('tone-down-mode');
      } else {
        document.body.classList.remove('tone-down-mode');
      }
    } catch (e) {}
  }, [isToneDown]);

  const toggleToneDown = (value) => {
    setIsToneDown((prev) => (typeof value === 'boolean' ? value : !prev));
  };

  return (
    <ToneDownContext.Provider value={{ isToneDown, toggleToneDown }}>
      {children}
    </ToneDownContext.Provider>
  );
};

export const useToneDown = () => {
  const context = useContext(ToneDownContext);
  if (!context) {
    return { isToneDown: false, toggleToneDown: () => {} };
  }
  return context;
};
