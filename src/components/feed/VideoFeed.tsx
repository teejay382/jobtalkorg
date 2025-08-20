
import { useState } from 'react';
import VideoCard from './VideoCard';
import VideoFeedLoader from './VideoFeedLoader';
import VideoFeedIndicators from './VideoFeedIndicators';
import { useVideoFeedData } from './useVideoFeedData';

const VideoFeed = () => {
  const { videos, loading, error, fetchVideos } = useVideoFeedData();
  const [currentVideo, setCurrentVideo] = useState(0);

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentVideo < videos.length - 1) {
      setCurrentVideo(currentVideo + 1);
    } else if (direction === 'up' && currentVideo > 0) {
      setCurrentVideo(currentVideo - 1);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      handleScroll('down');
    } else {
      handleScroll('up');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touchStartY = e.touches[0].clientY;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touchEndY = moveEvent.touches[0].clientY;
      const diff = touchStartY - touchEndY;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          handleScroll('down');
        } else {
          handleScroll('up');
        }

        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return <VideoFeedLoader onRefresh={fetchVideos} />;
  }

  return (
    <div
      className="h-screen w-full overflow-hidden relative bg-black"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
    >
      <div
        className="flex flex-col transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateY(-${currentVideo * 100}vh)` }}
      >
        {videos.map((video, index) => (
          <div key={video.id} className="w-full h-screen flex-shrink-0">
            <VideoCard
              video={video}
              isActive={index === currentVideo}
              onRefresh={fetchVideos}
            />
          </div>
        ))}
      </div>

      <VideoFeedIndicators
        videoCount={videos.length}
        currentVideo={currentVideo}
        onVideoSelect={setCurrentVideo}
      />
    </div>
  );
};

export default VideoFeed;
