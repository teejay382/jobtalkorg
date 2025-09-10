import React from 'react';

type HeavyVideoPlayerProps = {
  src: string;
  poster?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
};

const HeavyVideoPlayer: React.FC<HeavyVideoPlayerProps> = ({
  src,
  poster,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  className,
}) => {
  return (
    <video
      src={src}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      className={className ?? 'w-full h-auto bg-black'}
    />
  );
};

export default HeavyVideoPlayer;
