
interface VideoFeedIndicatorsProps {
  videoCount: number;
  currentVideo: number;
  onVideoSelect: (index: number) => void;
}

const VideoFeedIndicators = ({ videoCount, currentVideo, onVideoSelect }: VideoFeedIndicatorsProps) => {
  if (videoCount <= 1) return null;

  return (
    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-20">
      {Array.from({ length: videoCount }).map((_, index) => (
        <button
          key={index}
          className={`w-1 h-6 rounded-full transition-all duration-300 ${
            index === currentVideo ? 'bg-white w-1.5' : 'bg-white/40 hover:bg-white/60'
          }`}
          onClick={() => onVideoSelect(index)}
        />
      ))}
    </div>
  );
};

export default VideoFeedIndicators;
