'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect when the browser tab is visible or hidden
 * This can be used to optimize performance by reducing updates when tab is not visible
 */
export function useTabVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Initial state
    setIsVisible(!document.hidden);

    // Update visibility state when it changes
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Listen for visibility change events
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Hook to throttle data fetching and rendering when tab is not visible
 */
export function useTabOptimizedFetch<T>(
  fetchFunction: () => Promise<T>,
  deps: React.DependencyList = [],
  options = { visibleInterval: 30000, hiddenInterval: 300000 } // 30s visible, 5min hidden
): [T | null, boolean, () => void] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const isVisible = useTabVisibility();

  // Manual refresh function
  const refetch = async () => {
    setLoading(true);
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    refetch();

    // Set up interval based on tab visibility
    const interval = setInterval(
      refetch,
      isVisible ? options.visibleInterval : options.hiddenInterval
    );

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, ...deps]);

  return [data, loading, refetch];
}

export default useTabVisibility; 