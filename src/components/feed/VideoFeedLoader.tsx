
interface VideoFeedLoaderProps {
  onRefresh: () => void;
}

const VideoFeedLoader = ({ onRefresh }: VideoFeedLoaderProps) => {
  return (
    <div className="h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="text-center text-white">
        <h3 className="text-xl font-semibold mb-2">No Videos Available</h3>
        <p className="text-white/70 mb-4">Be the first to share your work!</p>
        <button
          onClick={onRefresh}
          className="bg-primary px-6 py-2 rounded-full text-white font-medium hover:bg-primary/80 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default VideoFeedLoader;
