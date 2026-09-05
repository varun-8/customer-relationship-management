import React, { createContext, useContext, useState, useEffect } from 'react';

const TestingModeContext = createContext();

export const TestingModeProvider = ({ children }) => {
  const [isLowDesignMode, setIsLowDesignMode] = useState(() => {
    const saved = localStorage.getItem('vasantham_low_design_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    // Default to true as requested for testing app mode
    return true;
  });

  useEffect(() => {
    localStorage.setItem('vasantham_low_design_mode', isLowDesignMode ? 'true' : 'false');
    if (isLowDesignMode) {
      document.body.classList.add('low-design-mode');
      document.documentElement.classList.add('low-design-mode');
    } else {
      document.body.classList.remove('low-design-mode');
      document.documentElement.classList.remove('low-design-mode');
    }
  }, [isLowDesignMode]);

  const toggleLowDesignMode = () => {
    setIsLowDesignMode((prev) => !prev);
  };

  return (
    <TestingModeContext.Provider
      value={{
        isLowDesignMode,
        setIsLowDesignMode,
        toggleLowDesignMode,
      }}
    >
      {children}
    </TestingModeContext.Provider>
  );
};

export const useTestingMode = () => {
  const context = useContext(TestingModeContext);
  if (!context) {
    return {
      isLowDesignMode: true,
      setIsLowDesignMode: () => {},
      toggleLowDesignMode: () => {},
    };
  }
  return context;
};
