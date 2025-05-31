import { useState, useEffect } from 'react';

/**
 * Hook to check if debug mode is enabled via URL parameter
 * @returns boolean indicating if debug mode is enabled
 */
export function useDebugMode(): boolean {
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);

  useEffect(() => {
    // Check URL parameters for debug=true
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    setIsDebugMode(debugParam === 'true');

    // Add listener for URL changes
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      setIsDebugMode(params.get('debug') === 'true');
    };

    // Listen for history changes
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  return isDebugMode;
}
