# Performance Optimization Plan for Job Talk

## Information Gathered
- **VideoFeed**: Already optimized with infinite scroll, virtualization, and profile caching
- **OptimizedVideoCard**: Well-optimized with React.memo, lazy loading, and optimistic updates
- **App.tsx**: Code splitting implemented for routes and some UI components
- **CommentSection**: Fetches all comments at once, has N+1 query issue
- **useAuth**: Multiple queries, no caching, uses setTimeout workaround
- **useChat**: Fetches all conversations/messages without pagination
- **LoadingSkeleton**: Basic implementation
- **Supabase Queries**: Some use select('*') instead of specific fields

## Plan

### 1. Optimize Supabase Queries
- [ ] Update useVideoFeedData to select specific fields instead of '*'
- [ ] Optimize CommentSection queries to avoid N+1 problem
- [ ] Update useAuth to select only needed profile fields
- [ ] Optimize useChat queries with pagination

### 2. Add Pagination and Infinite Scroll
- [ ] Implement pagination for CommentSection (load 10 comments initially, load more on scroll)
- [ ] Add pagination to useChat for conversations and messages
- [ ] Ensure consistent pagination across all data fetching

### 3. Memoize Components and Hooks
- [ ] Memoize CommentSection with React.memo
- [ ] Add useCallback to CommentSection event handlers
- [ ] Optimize useAuth with useMemo for computed values
- [ ] Memoize useChat functions

### 4. Improve Loading States
- [ ] Replace basic LoadingSkeleton with proper skeleton components
- [ ] Add skeleton loaders for video cards, comments, and chat messages
- [ ] Implement shimmer effects for better perceived performance

### 5. Lazy Loading Enhancements
- [ ] Lazy load CommentSection modal
- [ ] Lazy load video player components
- [ ] Add lazy loading for profile images and avatars

### 6. Image and Video Optimization
- [ ] Implement image compression for profile pictures and thumbnails
- [ ] Add responsive image loading with different sizes
- [ ] Optimize video compression and delivery

### 7. Caching Improvements
- [ ] Add React Query caching for profile data in useAuth
- [ ] Cache conversation data in useChat
- [ ] Implement service worker for static asset caching

### 8. Bundle Optimization
- [ ] Analyze bundle size and identify large dependencies
- [ ] Implement dynamic imports for heavy components
- [ ] Optimize vendor chunks

## Dependent Files to Edit
- src/components/feed/useVideoFeedData.tsx
- src/components/feed/CommentSection.tsx
- src/hooks/useAuth.ts
- src/hooks/useChat.ts
- src/App.tsx (LoadingSkeleton)
- src/components/ui/skeleton.tsx (enhance existing)
- src/integrations/supabase/client.ts (add query optimization helpers)

## Followup Steps
- [ ] Test performance improvements on desktop and mobile
- [ ] Monitor Core Web Vitals (LCP, FID, CLS)
- [ ] Analyze bundle size reduction
- [ ] Ensure no functionality regressions
- [ ] Add performance monitoring with error boundaries
