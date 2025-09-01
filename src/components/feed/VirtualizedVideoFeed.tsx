import React, { useState, useCallback, useRef, useEffect } from 'react';
import OptimizedVideoCard from './OptimizedVideoCard';
import VideoFeedLoader from './VideoFeedLoader';
import { useVideoFeedData } from './useVideoFeedData';

const VirtualizedVideoFeed = () => {
  const { videos, loading, error, fetchVideos, loadMore, hasMore } = useVideoFeedData();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [visibleVideos, setVisibleVideos] = useState(new Set([0]));
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingMore = useRef(false);

  // Intersection Observer for visibility tracking and infinite scroll
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const newVisibleVideos = new Set(visibleVideos);
        
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          
          if (entry.isIntersecting) {
            newVisibleVideos.add(index);
            // Update active video when 50% visible
            if (entry.intersectionRatio > 0.5) {
              setActiveVideoIndex(index);
            }
            
            // Load more when approaching the end
            if (index >= videos.length - 2 && hasMore && !loadingMore.current) {
              loadingMore.current = true;
              loadMore().finally(() => {
                loadingMore.current = false;
              });
            }
          } else {
            newVisibleVideos.delete(index);
          }
        });
        
        setVisibleVideos(newVisibleVideos);
      },
      { 
        threshold: [0.1, 0.5, 0.9],
        rootMargin: '50px 0px' // Preload videos slightly before they become visible
      }
    );

    // Observe all video containers
    const videoElements = containerRef.current.querySelectorAll('[data-index]');
    videoElements.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [videos.length, hasMore, loadMore, visibleVideos]);

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
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return <VideoFeedLoader onRefresh={fetchVideos} />;
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      style={{ scrollBehavior: 'smooth' }}
    >
      {videos.map((video, index) => (
        <div 
          key={video.id} 
          data-index={index}
          className="h-screen w-full snap-start relative"
        >
          <OptimizedVideoCard
            video={video}
            isActive={activeVideoIndex === index}
            isVisible={visibleVideos.has(index)}
            onRefresh={fetchVideos}
          />
          
          {/* Loading indicator for infinite scroll */}
          {index === videos.length - 1 && hasMore && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-black/50 rounded-full p-2 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* End of content indicator */}
      {!hasMore && videos.length > 0 && (
        <div className="h-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <p className="text-white/70 text-sm">You've reached the end!</p>
        </div>
      )}
    </div>
  );
};

export default VirtualizedVideoFeed;