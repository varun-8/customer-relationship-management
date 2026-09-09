import React, { createContext, useContext, useEffect } from 'react';

const ToneDownContext = createContext({ isToneDown: false, toggleToneDown: () => {} });

export const ToneDownProvider = ({ children }) => {
  useEffect(() => {
    try {
      localStorage.removeItem('vasantham_tone_down_mode');
      document.body.classList.remove('tone-down-mode');
    } catch (e) {}
  }, []);

  return (
    <ToneDownContext.Provider value={{ isToneDown: false, toggleToneDown: () => {} }}>
      {children}
    </ToneDownContext.Provider>
  );
};

export const useToneDown = () => {
  return { isToneDown: false, toggleToneDown: () => {} };
};

