import React, { Suspense, memo, useMemo } from 'react';

type Props = {
  src: string;
  poster?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
};

// Attempt to lazy-load a heavier player implementation if present at runtime.
const HeavyPlayer = React.lazy(() => import('./HeavyVideoPlayer').catch(() => ({ default: () => null })));

const NativeFallback: React.FC<Props> = ({ src, poster, controls = true, autoPlay = false, muted = false, className, onPlay, onPause }) => {
  return (
    <video
      src={src}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      className={className}
      onPlay={onPlay}
      onPause={onPause}
      playsInline
    />
  );
};

const LazyVideoPlayer: React.FC<Props> = (props) => {
  // Memoize props-derived values to avoid unnecessary re-renders
  const memoProps = useMemo(() => ({ ...props }), [props.src, props.poster, props.controls, props.autoPlay, props.muted, props.className]);

  return (
    <Suspense fallback={<NativeFallback {...memoProps} />}>
      <HeavyPlayer {...memoProps} />
    </Suspense>
  );
};

export default memo(LazyVideoPlayer);
