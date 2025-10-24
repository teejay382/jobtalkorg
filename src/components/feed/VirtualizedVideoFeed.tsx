import React, { useState, useCallback, useRef, useEffect } from 'react';
import OptimizedVideoCard from './OptimizedVideoCard';
import VideoFeedLoader from './VideoFeedLoader';
import { useVideoFeedData } from './useVideoFeedData';
import { useIsMobile } from '@/hooks/use-mobile';

const VirtualizedVideoFeed = () => {
  const { videos, loading, error, fetchVideos, loadMore, hasMore } = useVideoFeedData();
  const isMobile = useIsMobile();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [visibleVideos, setVisibleVideos] = useState(new Set([0]));
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingMore = useRef(false);

  // Intersection Observer for visibility tracking and infinite scroll
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          
          if (entry.isIntersecting) {
            setVisibleVideos(prev => new Set(prev).add(index));
            
            // Update active video when 50% visible
            if (entry.intersectionRatio > 0.5) {
              setActiveVideoIndex(index);
            }
            
            // Load more when approaching the end (debounced)
            if (index >= videos.length - 2 && hasMore && !loadingMore.current) {
              loadingMore.current = true;
              loadMore().finally(() => {
                loadingMore.current = false;
              });
            }
          } else {
            setVisibleVideos(prev => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            });
          }
        });
      },
      { 
        threshold: [0.1, 0.5, 0.9],
        rootMargin: '50px 0px', // Preload videos slightly before they become visible
        root: null // Use viewport as root
      }
    );

    // Observe all video containers
    const videoElements = containerRef.current.querySelectorAll('[data-index]');
    videoElements.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [videos.length, hasMore, loadMore]);

  // Keyboard navigation for accessibility and desktop users
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && activeVideoIndex > 0) {
        const prevElement = document.querySelector(`[data-index="${activeVideoIndex - 1}"]`);
        prevElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (e.key === 'ArrowDown' && activeVideoIndex < videos.length - 1) {
        const nextElement = document.querySelector(`[data-index="${activeVideoIndex + 1}"]`);
        nextElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeVideoIndex, videos.length]);

  if (loading && videos.length === 0) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-primary/10"></div>
        </div>
      </div>
    );
  }

  // Show empty state when no videos exist (not an error, just empty)
  if (!loading && videos.length === 0 && !error) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">No Videos Yet</h2>
          <p className="text-muted-foreground mb-6">
            Be the first to share your skills! Upload a video to get started.
          </p>
          <a href="/upload" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            Upload Your First Video
          </a>
        </div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return <VideoFeedLoader onRefresh={fetchVideos} />;
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ 
        scrollBehavior: 'smooth',
        height: '100vh',
        width: '100vw',
        position: 'relative',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* TikTok-style vertical feed - one video at a time */}
      <div className="flex flex-col">
        {videos.map((video, index) => (
          <div 
            key={video.id} 
            data-index={index}
            className="h-screen w-full snap-start snap-always flex items-center justify-center"
          >
            {/* Container with 9:16 aspect ratio */}
            <div className="relative w-full h-full max-w-[100vh*9/16] mx-auto">
              <OptimizedVideoCard
                video={video}
                isActive={activeVideoIndex === index}
                isVisible={visibleVideos.has(index)}
                onRefresh={fetchVideos}
                isMobile={true}
              />
            </div>
            
            {/* Loading indicator for infinite scroll */}
            {index === videos.length - 1 && hasMore && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30">
                <div className="glass-card rounded-full p-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/30 border-t-primary"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* End of content indicator */}
      {!hasMore && videos.length > 0 && (
        <div className="h-screen flex items-center justify-center snap-start">
          <div className="glass-card px-6 py-3 rounded-full">
            <p className="text-white text-sm font-medium">You've reached the end! 🎉</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedVideoFeed;