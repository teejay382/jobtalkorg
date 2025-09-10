# Performance Optimization Plan for Job Talk

## Information Gathered
- App feels slower after adding caching
- Need to focus on specific performance bottlenecks
- Video feed and comments need infinite scroll
- Heavy components need memoization
- Queries are re-fetching unnecessarily

## Plan

### 1. Implement Infinite Scroll
- [x] Install react-infinite-scroll-component
- [ ] Add infinite scroll to video feed (already has some, but enhance)
- [x] Add infinite scroll to comments section
- [x] Ensure smooth scrolling and loading states

### 2. Optimize Supabase Queries
- [ ] Fetch only 10 videos at a time (id, username, video_url only)
- [ ] Optimize comment queries to avoid N+1 problem
- [ ] Add console.log to confirm queries don't re-fetch unnecessarily
- [ ] Select specific fields instead of '*' in all queries

### 3. Lazy Load Video Players
- [ ] Ensure only visible video is mounted
- [ ] Implement proper lazy loading for video components
- [ ] Add video preloading for better UX

### 4. Memoize Heavy Components
- [ ] Add React.memo to VideoCard
- [ ] Add React.memo to CommentsModal (CommentSection)
- [ ] Add React.memo to ChatRoom
- [ ] Use useCallback/useMemo for all handlers and props

### 5. Add Loading Skeletons
- [ ] Create proper skeleton components for videos
- [ ] Add skeleton for profiles
- [ ] Implement shimmer effects for better perceived performance
- [ ] Replace basic LoadingSkeleton in App.tsx

### 6. Image/Video Compression
- [ ] Compress uploaded videos before saving to Supabase
- [ ] Compress images before upload
- [ ] Use existing imageCompression.ts utility

### 7. Prevent Unnecessary Re-renders
- [ ] Audit all components for unnecessary re-renders
- [ ] Optimize useAuth hook with proper memoization
- [ ] Optimize useChat hook
- [ ] Add performance monitoring with console.log

## Dependent Files to Edit
- src/components/feed/useVideoFeedData.tsx
- src/components/feed/CommentSection.tsx
- src/components/feed/OptimizedVideoCard.tsx
- src/components/chat/ChatRoom.tsx
- src/hooks/useAuth.ts
- src/hooks/useChat.ts
- src/App.tsx
- src/components/ui/skeleton.tsx
- src/utils/imageCompression.ts
- src/components/upload/VideoCompressor.tsx

## Followup Steps
- [ ] Test that queries don't re-fetch more than once per page load
- [ ] Verify infinite scroll works smoothly
- [ ] Confirm lazy loading reduces mounted components
- [ ] Monitor performance improvements
- [ ] Ensure no functionality regressions
