import { useState, createContext, useContext } from 'react';
import LoadingScreen from '@/components/LoadingScreen';

// Create a default context value that doesn't throw errors
const defaultContextValue = {
  showLoading: () => console.warn("GlobalLoadingProvider not found when calling showLoading"),
  hideLoading: () => console.warn("GlobalLoadingProvider not found when calling hideLoading"),
};

const GlobalLoadingContext = createContext(defaultContextValue);

export const useGlobalLoading = () => {
  return useContext(GlobalLoadingContext);
};

export const GlobalLoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const showLoading = (message = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <GlobalLoadingContext.Provider value={{ showLoading, hideLoading }}>
      {isLoading && <LoadingScreen message={loadingMessage} />}
      {children}
    </GlobalLoadingContext.Provider>
  );
};
