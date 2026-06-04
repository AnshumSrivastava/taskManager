import { useState, useEffect, useCallback } from 'react';

export type Route =
  | { page: 'dashboard' }
  | { page: 'overview' }
  | { page: 'collection'; id: string }
  | { page: 'settings' };

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path === 'overview') return { page: 'overview' };
  if (path === 'settings') return { page: 'settings' };
  if (path.startsWith('collection/')) {
    const id = path.replace('collection/', '');
    if (id) return { page: 'collection', id };
  }
  return { page: 'dashboard' };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handler = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  return { route, navigate };
}
