import { useState, useCallback, useRef } from 'react';
import { Notice, Pagination } from '@/types';
import { noticesAPI } from '@/services/api';

interface UseNoticesResult {
  notices: Notice[];
  isLoading: boolean;
  isRefreshing: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  error: string | null;
  hasMore: boolean;
}

// ─── Teacher: My Notices ──────────────────────────────────────────────────────
export const useTeacherNotices = (search?: string): UseNoticesResult => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPage = useRef(1);
  const isFetching = useRef(false);

  const fetchNotices = useCallback(
    async (page: number, isRefresh = false) => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        setError(null);
        const data = await noticesAPI.getMyNotices(page, 20, search);

        if (isRefresh || page === 1) {
          setNotices(data.notices);
        } else {
          setNotices((prev) => [...prev, ...data.notices]);
        }
        setPagination(data.pagination);
        currentPage.current = page;
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load notices');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetching.current = false;
      }
    },
    [search]
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotices(1, true);
  }, [fetchNotices]);

  const loadMore = useCallback(async () => {
    if (!pagination?.hasMore || isFetching.current) return;
    await fetchNotices(currentPage.current + 1);
  }, [pagination, fetchNotices]);

  // Initial load
  const initialized = useRef(false);
  if (!initialized.current) {
    initialized.current = true;
    fetchNotices(1);
  }

  return {
    notices,
    isLoading,
    isRefreshing,
    loadMore,
    refresh,
    error,
    hasMore: pagination?.hasMore ?? false,
  };
};

// ─── Student: Notice Feed ─────────────────────────────────────────────────────
export const useStudentFeed = (filter?: 'read' | 'unread'): UseNoticesResult => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPage = useRef(1);
  const isFetching = useRef(false);

  const fetchFeed = useCallback(
    async (page: number, isRefresh = false) => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        setError(null);
        const data = await noticesAPI.getFeed(page, 20, filter);

        if (isRefresh || page === 1) {
          setNotices(data.notices);
        } else {
          setNotices((prev) => [...prev, ...data.notices]);
        }
        setPagination(data.pagination);
        currentPage.current = page;
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load notices');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetching.current = false;
      }
    },
    [filter]
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchFeed(1, true);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (!pagination?.hasMore || isFetching.current) return;
    await fetchFeed(currentPage.current + 1);
  }, [pagination, fetchFeed]);

  const initialized = useRef(false);
  if (!initialized.current) {
    initialized.current = true;
    fetchFeed(1);
  }

  return {
    notices,
    isLoading,
    isRefreshing,
    loadMore,
    refresh,
    error,
    hasMore: pagination?.hasMore ?? false,
  };
};
