
import { useState } from 'react';
import VideoCard from './VideoCard';
import VideoFeedLoader from './VideoFeedLoader';
import { useVideoFeedData } from './useVideoFeedData';

const VideoFeed = () => {
  const { videos, loading, error, fetchVideos } = useVideoFeedData();

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
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory">
      {videos.map((video) => (
        <div key={video.id} className="h-screen w-full snap-start">
          <VideoCard
            video={video}
            isActive={true}
            onRefresh={fetchVideos}
          />
        </div>
      ))}
    </div>
  );
};

export default VideoFeed;
