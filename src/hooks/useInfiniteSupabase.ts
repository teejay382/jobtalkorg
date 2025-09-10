import { useInfiniteQuery, QueryFunctionContext } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

export type FetchPageFn<T> = ({
  supabase,
  pageParam,
  pageSize,
}: {
  supabase: SupabaseClient;
  pageParam: any;
  pageSize: number;
}) => Promise<{ data: T[]; nextCursor?: any }>;

export function useInfiniteSupabase<T>(opts: {
  key: string | readonly unknown[];
  supabase: SupabaseClient;
  fetchPage: FetchPageFn<T>;
  pageSize?: number;
}) {
  const { key, supabase, fetchPage, pageSize = 20 } = opts;

  const queryKey = (Array.isArray(key) ? key : [key]) as readonly unknown[];

  return useInfiniteQuery<{ data: T[]; nextCursor?: any }, Error, { data: T[]; nextCursor?: any }, readonly unknown[]>({
    queryKey: queryKey,
    queryFn: async ({ pageParam = null }: QueryFunctionContext) => {
      const page = await fetchPage({ supabase, pageParam, pageSize });
      return page;
    },
    getNextPageParam: (lastPage: { data: T[]; nextCursor?: any }) => lastPage.nextCursor ?? undefined,
    initialPageParam: null,
    // cacheTime is not allowed by current react-query types; use staleTime if you need control over freshness
    staleTime: 0,
  });
}

/*
Usage example:

const fetchVideosPage = async ({ supabase, pageParam, pageSize }) => {
  // use cursor-based or created_at-based pagination; select only required fields
  const query = supabase
    .from('videos')
    .select('id,title,thumbnail_url,created_at')
    .order('created_at', { ascending: false })
    .limit(pageSize + 1);

  if (pageParam) query.gt('created_at', pageParam);

  const { data, error } = await query;
  // compute nextCursor based on last item
  const nextCursor = data && data.length === pageSize + 1 ? data[data.length - 1].created_at : undefined;
  const slice = data ? data.slice(0, pageSize) : [];
  return { data: slice, nextCursor };
};

const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteSupabase({
  key: ['videos','feed'],
  supabase,
  fetchPage: fetchVideosPage,
  pageSize: 15,
});
*/
