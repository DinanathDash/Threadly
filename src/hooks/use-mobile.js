import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Use React.useMemo to avoid unnecessary recalculations
  const mediaQuery = React.useMemo(
    () => typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`) : null,
    []
  );

  // Initialize with proper value or false if SSR
  const [isMobile, setIsMobile] = React.useState(() => {
    return mediaQuery ? mediaQuery.matches : false;
  });

  React.useEffect(() => {
    if (!mediaQuery) return;
    
    // Handler function - wrapped in useCallback for stability
    const handleMediaQueryChange = (e) => {
      // Use requestAnimationFrame to batch state updates
      requestAnimationFrame(() => {
        setIsMobile(e.matches);
      });
    };
    
    // Use the media query event listener (more reliable than resize)
    mediaQuery.addEventListener("change", handleMediaQueryChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, [mediaQuery]);

  return !!isMobile;
}
