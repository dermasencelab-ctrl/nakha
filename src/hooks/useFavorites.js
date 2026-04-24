import { useCallback, useState } from 'react';

const STORAGE_KEY = 'nakha_favorites';

const readFromStorage = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState(readFromStorage);

  const toggle = useCallback((cookId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(cookId)) {
        next.delete(cookId);
      } else {
        next.add(cookId);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isFavorite = useCallback((cookId) => favorites.has(cookId), [favorites]);

  return { favorites, toggle, isFavorite };
};
