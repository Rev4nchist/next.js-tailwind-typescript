import { useEffect, useState } from 'react';

/**
 * useIsMounted – returns true after the component is mounted (client-side), false on server.
 */
export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted;
} 