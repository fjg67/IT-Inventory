import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppDispatch } from '@/store';
import { selectSite } from '@/store/slices/siteSlice';

export const useActiveSite = () => {
  const dispatch = useAppDispatch();

  const handleSelectSite = useCallback(async (siteId: string | number) => {
    await dispatch(selectSite(siteId)).unwrap();
    await AsyncStorage.setItem('lastSite', String(siteId));
  }, [dispatch]);

  return { handleSelectSite };
};
