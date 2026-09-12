import { useState, useCallback } from 'react';

export interface SavedLink {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  savedAt: string;
}

const STORAGE_KEY = 'url_shortener_links';

function load(): SavedLink[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function useLocalLinks() {
  const [links, setLinks] = useState<SavedLink[]>(load);

  const addLink = useCallback((link: Omit<SavedLink, 'savedAt'>) => {
    setLinks((prev) => {
      if (prev.some((l) => l.shortCode === link.shortCode)) return prev;
      const next = [{ ...link, savedAt: new Date().toISOString() }, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeLink = useCallback((shortCode: string) => {
    setLinks((prev) => {
      const next = prev.filter((l) => l.shortCode !== shortCode);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { links, addLink, removeLink };
}
