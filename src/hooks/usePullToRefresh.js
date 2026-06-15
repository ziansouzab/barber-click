import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function usePullToRefresh(refetch) {
  const [refreshing, setRefreshing] = useState(false);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchRef.current();
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetchRef.current();
    }, [])
  );

  return { refreshing, onRefresh };
}
