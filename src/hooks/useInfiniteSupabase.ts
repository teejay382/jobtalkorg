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

  return useInfiniteQuery({
    queryKey: key,
    queryFn: async ({ pageParam = null }: QueryFunctionContext) => {
      const page = await fetchPage({ supabase, pageParam, pageSize });
      return page;
    },
    getNextPageParam: (lastPage: { data: T[]; nextCursor?: any }) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
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
