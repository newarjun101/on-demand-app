import { useEffect, useState } from 'react';

export function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  return { page, pageSize, setPage };
}

export function useUrlPagination(
  searchParams: URLSearchParams,
  setSearchParams: (p: URLSearchParams) => void,
  defaultPageSize = 20,
) {
  const page = Number(searchParams.get('page') ?? 1) || 1;
  const pageSize = Number(searchParams.get('pageSize') ?? defaultPageSize) || defaultPageSize;
  function setPage(p: number) {
    const sp = new URLSearchParams(searchParams);
    if (p <= 1) sp.delete('page');
    else sp.set('page', String(p));
    setSearchParams(sp);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  return { page, pageSize, setPage };
}

export function useWindowWidth() {
  const [w, setW] = useState(typeof window === 'undefined' ? 1280 : window.innerWidth);
  useEffect(() => {
    function onResize() { setW(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}